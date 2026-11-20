import React, { useCallback, useEffect, useRef, useState } from 'react';
import History from '../core/History';
import RasterCanvasView from './RasterCanvasView';
import RasterPropertiesPanel from './RasterPropertiesPanel';
import RasterToolbar from './RasterToolbar';
import RasterTopBar from './RasterTopBar';
import { useRasterKeyboard } from './useRasterKeyboard';
import { clampCropToImage, downloadBlob, getImagePointFromClient } from './rasterUtils';

export default function RasterEditor({ factory, work, onSave, onAutosaveData }) {
  const canvasRef = useRef(null);
  const [canvasObj] = useState(() => factory.getCanvas());
  const [toolBar] = useState(() => factory.getToolBar());
  const [activeTool, setActiveTool] = useState(null);
  const [status, setStatus] = useState('');
  const historyRef = useRef(new History(10));

  const [resizeW, setResizeW] = useState('');
  const [resizeH, setResizeH] = useState('');
  const [resizeScale, setResizeScale] = useState('1');
  const [interp, setInterp] = useState('auto');
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [cropDrag, setCropDrag] = useState(null);
  const [angle, setAngle] = useState(0);
  const [centerX, setCenterX] = useState('');
  const [centerY, setCenterY] = useState('');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [balance, setBalance] = useState({ r: 1, g: 1, b: 1 });
  const [noiseType, setNoiseType] = useState('gaussian');
  const [noiseAmount, setNoiseAmount] = useState(0.02);
  const [noiseStddev, setNoiseStddev] = useState(20);
  const [blurType, setBlurType] = useState('gaussian');
  const [blurK, setBlurK] = useState(5);
  const [exportFmt, setExportFmt] = useState('png');
  const [jpegQ, setJpegQ] = useState(92);

  const render = useCallback(() => {
    if (canvasRef.current) canvasObj.renderTo(canvasRef.current);
  }, [canvasObj]);

  const getImageInfo = useCallback(() => {
    const src = canvasObj.getMat();
    if (!src) return null;
    return { width: src.cols, height: src.rows, channels: src.channels() };
  }, [canvasObj]);

  const syncImageState = useCallback((info) => {
    if (!info) return;
    setResizeW(String(info.width));
    setResizeH(String(info.height));
    setCrop({ x: 0, y: 0, width: info.width, height: info.height });
  }, []);

  const pushHistory = useCallback(() => {
    if (!canvasObj.getMat()) return;
    historyRef.current.push(canvasObj.toDataURL());
  }, [canvasObj]);

  useEffect(() => {
    const source = work?.content || work?.fileUrl;
    if (!source) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        canvasObj.loadFromImageElement(img);
        const info = getImageInfo();
        syncImageState(info);
        render();
        historyRef.current.reset(canvasObj.toDataURL());
        setStatus(info ? `${info.width}×${info.height}` : '');
      } catch (e) {
        console.error('Failed to load raster from source:', e);
        setStatus('Ошибка загрузки');
      }
    };
    img.onerror = (e) => {
      console.warn('Could not auto-load raster from URL', e);
      setStatus('Не удалось загрузить изображение');
    };
    img.src = source;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onAutosaveData) return;
    onAutosaveData(async () => {
      if (!canvasObj.getMat()) return null;
      return canvasObj.toBlob('png');
    });
  }, [onAutosaveData, canvasObj]);

  const loadSnapshot = useCallback((dataUrl, statusText) => {
    const img = new Image();
    img.onload = () => {
      try {
        canvasObj.loadFromImageElement(img);
        render();
        syncImageState(getImageInfo());
        if (statusText) setStatus(statusText);
      } catch (e) {
        console.error('Failed to restore raster snapshot:', e);
      }
    };
    img.src = dataUrl;
  }, [canvasObj, render, syncImageState, getImageInfo]);

  const undo = useCallback(() => {
    const prev = historyRef.current.undo();
    if (!prev) return;
    loadSnapshot(prev, 'Отмена');
  }, [loadSnapshot]);

  const redo = useCallback(() => {
    const next = historyRef.current.redo();
    if (!next) return;
    loadSnapshot(next, 'Повтор');
  }, [loadSnapshot]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await canvasObj.loadFromFile(file);
      render();
      syncImageState(getImageInfo());
      historyRef.current.reset(canvasObj.toDataURL());
      setStatus(file.name);
    } catch (err) {
      console.error(err);
      alert('Не удалось загрузить изображение. Убедитесь, что OpenCV готов.');
    }
  };

  const applyTool = useCallback((name, params) => {
    const tool = toolBar.getTools().find((t) => t.name === name);
    if (!tool) return;
    try {
      tool.process({ canvas: canvasObj }, params);
      const info = getImageInfo();
      if (info) {
        setResizeW(String(info.width));
        setResizeH(String(info.height));
      }
      render();
      setStatus(info ? `${info.width}×${info.height}` : '');
      pushHistory();
    } catch (err) {
      console.error(err);
      alert('Ошибка: ' + err.message);
    }
  }, [toolBar, canvasObj, pushHistory, getImageInfo, render]);

  const onToolClick = (tool) => {
    setActiveTool(tool.name);
    if (tool.name === 'flipH' && canvasObj.getMat()) applyTool('flipH', { mode: 'h' });
    if (tool.name === 'flipV' && canvasObj.getMat()) applyTool('flipV', { mode: 'v' });
  };

  const doExport = async () => {
    if (!canvasObj.getMat()) return;
    const blob = await canvasObj.toBlob(exportFmt, jpegQ / 100);
    const ext = exportFmt === 'jpeg' ? 'jpg' : exportFmt;
    downloadBlob(blob, `image.${ext}`);
  };

  const saveToServer = async () => {
    if (!onSave || !canvasObj.getMat()) return;
    try {
      const blob = await canvasObj.toBlob('png');
      await onSave(blob, 'image/png');
      setStatus('Сохранено');
    } catch (e) {
      console.error('Raster save failed:', e);
      alert(e.message);
    }
  };

  const onCanvasMouseDown = (e) => {
    if (activeTool !== 'crop' || !canvasObj.getMat()) return;
    const point = getImagePointFromClient(canvasRef.current, e.clientX, e.clientY);
    if (!point) return;
    setCropDrag({ startX: point.x, startY: point.y, curX: point.x, curY: point.y });
  };

  const onCanvasMouseMove = (e) => {
    if (!cropDrag) return;
    const point = getImagePointFromClient(canvasRef.current, e.clientX, e.clientY);
    if (!point) return;
    setCropDrag((drag) => (drag ? { ...drag, curX: point.x, curY: point.y } : drag));
  };

  const onCanvasMouseUp = () => {
    if (!cropDrag) return;
    const raw = {
      x: Math.round(Math.min(cropDrag.startX, cropDrag.curX)),
      y: Math.round(Math.min(cropDrag.startY, cropDrag.curY)),
      width: Math.max(1, Math.round(Math.abs(cropDrag.curX - cropDrag.startX))),
      height: Math.max(1, Math.round(Math.abs(cropDrag.curY - cropDrag.startY))),
    };
    setCrop(clampCropToImage(raw, getImageInfo()));
    setCropDrag(null);
  };

  const imageInfo = getImageInfo();

  useRasterKeyboard({
    activeTool,
    crop,
    angle,
    centerX,
    centerY,
    brightness,
    contrast,
    imageInfo,
    setActiveTool,
    setCrop,
    setAngle,
    setBrightness,
    setContrast,
    undo,
    redo,
    applyTool,
  });

  const selection = cropDrag
    ? {
        x: Math.min(cropDrag.startX, cropDrag.curX),
        y: Math.min(cropDrag.startY, cropDrag.curY),
        w: Math.abs(cropDrag.curX - cropDrag.startX),
        h: Math.abs(cropDrag.curY - cropDrag.startY),
      }
    : (activeTool === 'crop' && imageInfo
      ? { x: crop.x, y: crop.y, w: crop.width, h: crop.height }
      : null);

  return (
    <div className="editor-layout">
      <RasterToolbar
        tools={toolBar.getTools()}
        activeTool={activeTool}
        onToolClick={onToolClick}
        onUndo={undo}
        onRedo={redo}
        onSave={saveToServer}
      />

      <div className="editor-center">
        <RasterTopBar
          exportFmt={exportFmt}
          setExportFmt={setExportFmt}
          jpegQ={jpegQ}
          setJpegQ={setJpegQ}
          onFile={onFile}
          onExport={doExport}
          hasImage={!!imageInfo}
        />

        <RasterCanvasView
          canvasRef={canvasRef}
          activeTool={activeTool}
          selection={selection}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
        />

        <div className="statusbar">{status || (imageInfo ? `${imageInfo.width}×${imageInfo.height}` : '')}</div>
      </div>

      <div className="properties-panel">
        <RasterPropertiesPanel
          activeTool={activeTool}
          imageInfo={imageInfo}
          state={{
            resizeW, resizeH, resizeScale, interp,
            crop, angle, centerX, centerY,
            brightness, contrast, balance,
            noiseType, noiseAmount, noiseStddev,
            blurType, blurK,
          }}
          actions={{
            setResizeW, setResizeH, setResizeScale, setInterp,
            setCrop, setAngle, setCenterX, setCenterY,
            setBrightness, setContrast, setBalance,
            setNoiseType, setNoiseAmount, setNoiseStddev,
            setBlurType, setBlurK,
            applyTool,
          }}
        />
        {imageInfo && <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>{imageInfo.width}×{imageInfo.height}, ch: {imageInfo.channels}</div>}
      </div>
    </div>
  );
}
