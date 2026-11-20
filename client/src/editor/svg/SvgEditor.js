import React, { useCallback, useEffect, useRef, useState } from 'react';
import History from '../core/History';
import SvgLayersPanel from './SvgLayersPanel';
import SvgPropertiesPanel from './SvgPropertiesPanel';
import { renderSvgElement } from './SvgShapeRenderer';
import SvgToolbar from './SvgToolbar';
import SvgTopBar from './SvgTopBar';
import { useSvgKeyboard } from './useSvgKeyboard';
import {
  SHAPE_TOOLS,
  createShapeElement,
  getSvgPoint,
  normalizeImportedAttrName,
  updateShapeDuringDraw,
} from './svgUtils';

export default function SvgEditor({ factory, work, onSave, onAutosaveData }) {
  const [canvasObj] = useState(() => factory.getCanvas());
  const [toolBar] = useState(() => factory.getToolBar());
  const [activeTool, setActiveTool] = useState('select');
  const [elements, setElements] = useState([]);
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('');
  const [docSize, setDocSize] = useState({ width: 800, height: 600 });
  const [drawing, setDrawing] = useState(null);
  const [showLayers, setShowLayers] = useState(false);

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const historyRef = useRef(new History(10));

  const sync = useCallback(() => {
    setElements([...canvasObj.elements]);
    setLayers([...canvasObj.layers]);
    setSelectedId(canvasObj.selectedId);
  }, [canvasObj]);

  const snapshot = useCallback(() => JSON.stringify(canvasObj.toJSON()), [canvasObj]);

  const pushHistory = useCallback((opts = {}) => {
    historyRef.current.push(snapshot(), { coalesceMs: opts.coalesce ? 400 : 0 });
  }, [snapshot]);

  const restoreSnapshot = useCallback((snap) => {
    canvasObj.fromJSON(JSON.parse(snap));
    setDocSize({ width: canvasObj.width, height: canvasObj.height });
    sync();
  }, [canvasObj, sync]);

  useEffect(() => {
    if (work?.content) {
      try {
        canvasObj.fromJSON(JSON.parse(work.content));
      } catch (e) {
        // Legacy/raw SVG content fallback: keep default document
        if (!(typeof work.content === 'string' && work.content.includes('<svg'))) {
          console.error('Failed to parse SVG work content:', e);
        }
      }
    }
    setDocSize({ width: canvasObj.width, height: canvasObj.height });
    sync();
    historyRef.current.reset(snapshot());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onAutosaveData) return;
    onAutosaveData(async () => new Blob([snapshot()], { type: 'application/json' }));
  }, [onAutosaveData, snapshot]);

  const selected = elements.find((el) => el.id === selectedId) || null;

  const undo = useCallback(() => {
    const prev = historyRef.current.undo();
    if (!prev) return;
    restoreSnapshot(prev);
    setStatus('Отмена');
  }, [restoreSnapshot]);

  const redo = useCallback(() => {
    const next = historyRef.current.redo();
    if (!next) return;
    restoreSnapshot(next);
    setStatus('Повтор');
  }, [restoreSnapshot]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    canvasObj.removeElement(selectedId);
    sync();
    pushHistory();
  }, [selectedId, canvasObj, pushHistory, sync]);

  const nudgeSelected = useCallback((dx, dy, rotate = 0, scaleMul = 1) => {
    if (!selectedId) return false;
    const element = canvasObj.elements.find((el) => el.id === selectedId);
    if (!element) return false;

    const t = element.transform || {};
    const patch = { transform: {} };
    if (dx || dy) {
      patch.transform.x = (t.x || 0) + dx;
      patch.transform.y = (t.y || 0) + dy;
    }
    if (rotate) patch.transform.rotate = (t.rotate || 0) + rotate;
    if (scaleMul !== 1) {
      patch.transform.scaleX = (t.scaleX ?? 1) * scaleMul;
      patch.transform.scaleY = (t.scaleY ?? 1) * scaleMul;
    }

    canvasObj.updateElement(selectedId, patch);
    sync();
    pushHistory({ coalesce: true });
    return true;
  }, [selectedId, canvasObj, pushHistory, sync]);

  useSvgKeyboard({ selectedId, setActiveTool, undo, redo, deleteSelected, nudgeSelected });

  const onMouseDown = (e) => {
    if (e.target.closest('.no-draw')) return;
    const point = getSvgPoint(svgRef.current, e.clientX, e.clientY);

    if (activeTool === 'select') {
      const id = e.target.getAttribute('data-id');
      if (id) {
        canvasObj.selectedId = id;
        const element = canvasObj.elements.find((el) => el.id === id);
        setDrawing({
          type: 'move',
          startX: point.x,
          startY: point.y,
          id,
          origX: element?.transform?.x || 0,
          origY: element?.transform?.y || 0,
          moved: false,
        });
        sync();
      } else {
        canvasObj.selectedId = null;
        sync();
      }
      return;
    }

    if (SHAPE_TOOLS.has(activeTool)) {
      const element = createShapeElement(canvasObj, activeTool, point.x, point.y);
      if (element) {
        canvasObj.selectedId = element.id;
        setDrawing({ type: 'draw', tool: activeTool, startX: point.x, startY: point.y, id: element.id });
        sync();
      }
    }
  };

  const onMouseMove = (e) => {
    if (!drawing) return;
    const point = getSvgPoint(svgRef.current, e.clientX, e.clientY);

    if (drawing.type === 'move') {
      const dx = point.x - drawing.startX;
      const dy = point.y - drawing.startY;
      if (!drawing.moved && (dx || dy)) {
        setDrawing((d) => (d ? { ...d, moved: true } : d));
      }
      canvasObj.updateElement(drawing.id, { transform: { x: drawing.origX + dx, y: drawing.origY + dy } });
      sync();
      return;
    }

    if (drawing.type === 'draw') {
      updateShapeDuringDraw(canvasObj, drawing.id, drawing.tool, { x: drawing.startX, y: drawing.startY }, point);
      sync();
    }
  };

  const onMouseUp = () => {
    if (drawing?.type === 'draw' || drawing?.moved) {
      pushHistory();
    }
    setDrawing(null);
  };

  const updateSelectedAttr = (key, value) => {
    if (!selected) return;
    canvasObj.updateElement(selected.id, { attrs: { [key]: value } });
    sync();
    pushHistory();
  };

  const updateSelectedTransform = (key, value) => {
    if (!selected) return;
    canvasObj.updateElement(selected.id, { transform: { [key]: Number(value) || 0 } });
    sync();
    pushHistory();
  };

  const addLayer = () => {
    const id = `layer_${Date.now()}`;
    canvasObj.layers.push({ id, name: `Layer ${canvasObj.layers.length + 1}`, visible: true, locked: false });
    sync();
    pushHistory();
  };

  const toggleLayerFlag = (id, key) => {
    const layer = canvasObj.layers.find((l) => l.id === id);
    if (!layer) return;
    layer[key] = !layer[key];
    sync();
    pushHistory();
  };

  const newCanvas = () => {
    const width = parseInt(prompt('Ширина', String(docSize.width)) || '800', 10);
    const height = parseInt(prompt('Высота', String(docSize.height)) || '600', 10);
    canvasObj.newDocument(width, height);
    setDocSize({ width, height });
    sync();
    pushHistory();
  };

  const exportSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${work?.title || 'drawing'}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const saveServer = async () => {
    if (!onSave) return;
    try {
      await onSave(new Blob([snapshot()], { type: 'application/json' }), 'application/json');
      setStatus('Сохранено');
    } catch (e) {
      console.error('SVG save failed:', e);
      alert(e.message);
    }
  };

  const importSvg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(String(reader.result), 'image/svg+xml');
        const svg = doc.querySelector('svg');
        const width = parseInt(svg?.getAttribute('width') || '800', 10);
        const height = parseInt(svg?.getAttribute('height') || '600', 10);

        canvasObj.newDocument(width, height);
        setDocSize({ width, height });

        const nodes = doc.querySelectorAll('rect,ellipse,line,polyline,polygon,path,text,image,circle');
        nodes.forEach((node) => {
          const tag = node.tagName.toLowerCase();
          const attrs = {};
          Array.from(node.attributes).forEach((attr) => {
            attrs[normalizeImportedAttrName(attr.name)] = attr.value;
          });

          if (tag === 'text') {
            canvasObj.addElement({ type: 'text', attrs, text: node.textContent || '' });
          } else {
            canvasObj.addElement({ type: tag, attrs });
          }
        });
        sync();
        pushHistory();
      } catch (err) {
        console.error('SVG import failed:', err);
        alert('Ошибка импорта SVG');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const visibleElements = [...elements]
    .sort((a, b) => layers.findIndex((l) => l.id === a.layer) - layers.findIndex((l) => l.id === b.layer))
    .filter((element) => {
      const layer = layers.find((l) => l.id === element.layer);
      return !layer || layer.visible !== false;
    });

  return (
    <div className="editor-layout">
      <SvgToolbar
        tools={toolBar.getTools()}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onUndo={undo}
        onRedo={redo}
        onSave={saveServer}
      />

      <div className="editor-center">
        <SvgTopBar
          docSize={docSize}
          fileInputRef={fileInputRef}
          onNew={newCanvas}
          onImport={importSvg}
          onExport={exportSvg}
          onImportClick={() => fileInputRef.current?.click()}
        />

        <div className="canvas-wrap" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${docSize.width} ${docSize.height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', background: '#202020', border: '1px solid var(--border)', display: 'block' }}
            onMouseDown={onMouseDown}
          >
            {visibleElements.map((element) => renderSvgElement(element, activeTool))}
          </svg>
        </div>

        <SvgLayersPanel
          layers={layers}
          collapsed={!showLayers}
          onToggleCollapsed={() => setShowLayers((v) => !v)}
          onAddLayer={addLayer}
          onToggleLayerFlag={toggleLayerFlag}
        />

        <div className="statusbar">
          {status}{status ? ' | ' : ''}{activeTool}{selectedId ? ' | выделено' : ''}
        </div>
      </div>

      <SvgPropertiesPanel
        selected={selected}
        onAttrChange={updateSelectedAttr}
        onTransformChange={updateSelectedTransform}
        onTextChange={(text) => {
          if (!selected) return;
          canvasObj.updateElement(selected.id, { text });
          sync();
          pushHistory();
        }}
        onFlipH={() => {
          if (!selected) return;
          canvasObj.updateElement(selected.id, { transform: { scaleX: -(selected.transform?.scaleX ?? 1) } });
          sync();
          pushHistory();
        }}
        onFlipV={() => {
          if (!selected) return;
          canvasObj.updateElement(selected.id, { transform: { scaleY: -(selected.transform?.scaleY ?? 1) } });
          sync();
          pushHistory();
        }}
        onDelete={deleteSelected}
      />
    </div>
  );
}
