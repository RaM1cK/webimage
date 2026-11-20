import { useEffect } from 'react';
import { clampCropToImage } from './rasterUtils';

export function useRasterKeyboard({
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
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const { code } = e;

      if (code === 'KeyZ' && !e.shiftKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); undo(); return; }
      if ((code === 'KeyZ' && e.shiftKey && !e.ctrlKey && !e.metaKey) || (code === 'KeyY' && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); redo(); return; }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (code === 'KeyC') { setActiveTool('crop'); return; }
        if (code === 'KeyR') { setActiveTool('rotate'); return; }
        if (code === 'KeyS') { setActiveTool('resize'); return; }
        if (code === 'KeyB') { setActiveTool('brightness'); return; }
        if (code === 'KeyH') { if (imageInfo) applyTool('flipH', { mode: 'h' }); return; }
        if (code === 'KeyV') { if (imageInfo) applyTool('flipV', { mode: 'v' }); return; }
      }

      if (activeTool === 'crop' && imageInfo) {
        const step = e.shiftKey ? 10 : 1;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(code)) {
          e.preventDefault();
          setCrop((current) => {
            let x = current.x;
            let y = current.y;
            if (code === 'ArrowLeft') x -= step;
            if (code === 'ArrowRight') x += step;
            if (code === 'ArrowUp') y -= step;
            if (code === 'ArrowDown') y += step;
            return clampCropToImage({ ...current, x, y }, imageInfo);
          });
          return;
        }
        if (code === 'Enter' || code === 'NumpadEnter') { e.preventDefault(); applyTool('crop', crop); return; }
      }

      if (activeTool === 'rotate') {
        if (code === 'ArrowLeft' || code === 'ArrowDown') { e.preventDefault(); setAngle((a) => +(Number(a) - (e.shiftKey ? 10 : 1)).toFixed(2)); return; }
        if (code === 'ArrowRight' || code === 'ArrowUp') { e.preventDefault(); setAngle((a) => +(Number(a) + (e.shiftKey ? 10 : 1)).toFixed(2)); return; }
        if (code === 'Enter' || code === 'NumpadEnter') {
          e.preventDefault();
          applyTool('rotate', {
            angle: Number(angle),
            center: (centerX !== '' && centerY !== '') ? { x: Number(centerX), y: Number(centerY) } : undefined,
          });
          return;
        }
      }

      if (activeTool === 'brightness') {
        if (code === 'ArrowLeft') { e.preventDefault(); setBrightness((v) => +(Number(v) - (e.shiftKey ? 10 : 1)).toFixed(2)); return; }
        if (code === 'ArrowRight') { e.preventDefault(); setBrightness((v) => +(Number(v) + (e.shiftKey ? 10 : 1)).toFixed(2)); return; }
        if (code === 'ArrowDown') { e.preventDefault(); setContrast((v) => +(Math.max(0, Number(v) - (e.shiftKey ? 0.2 : 0.05))).toFixed(2)); return; }
        if (code === 'ArrowUp') { e.preventDefault(); setContrast((v) => +(Math.min(3, Number(v) + (e.shiftKey ? 0.2 : 0.05))).toFixed(2)); return; }
        if (code === 'Enter' || code === 'NumpadEnter') { e.preventDefault(); applyTool('brightness', { brightness: Number(brightness), contrast: Number(contrast) }); }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTool, crop, angle, centerX, centerY, brightness, contrast, imageInfo, setActiveTool, setCrop, setAngle, setBrightness, setContrast, undo, redo, applyTool]);
}
