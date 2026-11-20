import { useEffect } from 'react';
import { TOOL_SHORTCUTS } from './svgUtils';

export function useSvgKeyboard({
  selectedId,
  setActiveTool,
  undo,
  redo,
  deleteSelected,
  nudgeSelected,
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const { code } = e;

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const tool = TOOL_SHORTCUTS[code];
        if (tool) {
          e.preventDefault();
          setActiveTool(tool);
          return;
        }
      }

      if (code === 'KeyZ' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        undo();
        return;
      }

      if ((code === 'KeyZ' && e.shiftKey && !e.ctrlKey && !e.metaKey) || (code === 'KeyY' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        redo();
        return;
      }

      if ((code === 'Delete' || code === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (!selectedId) return;

      const step = e.shiftKey ? 10 : 1;
      if (code === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-step, 0); return; }
      if (code === 'ArrowRight') { e.preventDefault(); nudgeSelected(step, 0); return; }
      if (code === 'ArrowUp') { e.preventDefault(); nudgeSelected(0, -step); return; }
      if (code === 'ArrowDown') { e.preventDefault(); nudgeSelected(0, step); return; }
      if (code === 'BracketLeft') { e.preventDefault(); nudgeSelected(0, 0, -(e.shiftKey ? 15 : 5)); return; }
      if (code === 'BracketRight') { e.preventDefault(); nudgeSelected(0, 0, e.shiftKey ? 15 : 5); return; }
      if (code === 'Minus') { e.preventDefault(); nudgeSelected(0, 0, 0, e.shiftKey ? 0.8 : 0.95); return; }
      if (code === 'Equal') { e.preventDefault(); nudgeSelected(0, 0, 0, e.shiftKey ? 1.25 : 1.05); }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, setActiveTool, undo, redo, deleteSelected, nudgeSelected]);
}
