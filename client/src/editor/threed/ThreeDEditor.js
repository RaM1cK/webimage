import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '../../api/client';
import History from '../core/History';
import ThreePropertiesPanel from './ThreePropertiesPanel';
import ThreeToolbar from './ThreeToolbar';
import { useThreeRenderer } from './useThreeRenderer';
import {
  PRIMITIVE_TOOLS,
  geometryFromType,
  geometryToMeshData,
  isTransformTool,
  nudgeObject,
} from './threeUtils';

export default function ThreeDEditor({ factory, work, onSave, onAutosaveData }) {
  const [canvasObj] = useState(() => factory.getCanvas());
  const [toolBar] = useState(() => factory.getToolBar());
  const [activeTool, setActiveTool] = useState('move');
  const [scene, setScene] = useState(canvasObj.toJSON());
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('');

  const historyRef = useRef(new History(10));
  const viewContainerRef = useRef(null);

  const sync = useCallback(() => setScene(canvasObj.toJSON()), [canvasObj]);
  const snapshot = useCallback(() => JSON.stringify(canvasObj.toJSON()), [canvasObj]);
  const pushHistory = useCallback((opts = {}) => {
    historyRef.current.push(snapshot(), { coalesceMs: opts.coalesce ? 500 : 0 });
  }, [snapshot]);

  const syncModelFromThreeMesh = useCallback((mesh) => {
    const id = mesh?.userData?.sceneObjectId;
    if (!id) return;
    canvasObj.updateObject(id, {
      position: [mesh.position.x, mesh.position.y, mesh.position.z],
      scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      rotation: [
        THREE.MathUtils.radToDeg(mesh.rotation.x),
        THREE.MathUtils.radToDeg(mesh.rotation.y),
        THREE.MathUtils.radToDeg(mesh.rotation.z),
      ],
    });
  }, [canvasObj]);

  const { rebuildScene } = useThreeRenderer({
    containerRef: viewContainerRef,
    canvasObj,
    activeTool,
    selectedId,
    onSelect: setSelectedId,
    onSyncModel: syncModelFromThreeMesh,
    onCommitTransform: (opts) => pushHistory(opts),
    onSync: sync,
  });

  useEffect(() => {
    if (work?.content) {
      try {
        const data = JSON.parse(work.content);
        if (data?.objects) canvasObj.fromJSON(data);
      } catch (e) {
        console.error('Failed to parse 3D work content:', e);
      }
    }
    const initial = canvasObj.toJSON();
    setScene(initial);
    historyRef.current.reset(snapshot());
    rebuildScene(initial, { forceRebuild: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (onAutosaveData) {
      onAutosaveData(async () => new Blob([snapshot()], { type: 'application/json' }));
    }
  }, [onAutosaveData, snapshot]);

  useEffect(() => {
    rebuildScene(scene);
  }, [scene, activeTool, selectedId, rebuildScene]);

  const undo = useCallback(() => {
    const prev = historyRef.current.undo();
    if (!prev) return;
    try {
      canvasObj.fromJSON(JSON.parse(prev));
      setScene(canvasObj.toJSON());
      setSelectedId(null);
      setStatus('Отмена');
    } catch (e) {
      console.error('3D undo failed:', e);
    }
  }, [canvasObj]);

  const redo = useCallback(() => {
    const next = historyRef.current.redo();
    if (!next) return;
    try {
      canvasObj.fromJSON(JSON.parse(next));
      setScene(canvasObj.toJSON());
      setSelectedId(null);
      setStatus('Повтор');
    } catch (e) {
      console.error('3D redo failed:', e);
    }
  }, [canvasObj]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    canvasObj.removeObject(selectedId);
    setSelectedId(null);
    sync();
    pushHistory();
    setStatus('Удалено');
  }, [selectedId, canvasObj, pushHistory, sync]);

  const addPrimitive = useCallback((type) => {
    const geometry = geometryFromType(type);
    if (!geometry) return;
    const { vertices, faces } = geometryToMeshData(geometry);
    geometry.dispose();
    const obj = canvasObj.addObject({ type, name: type, vertices, faces, position: [0, 0, 0], scale: [1, 1, 1], rotation: [0, 0, 0] });
    setSelectedId(obj.id);
    sync();
    pushHistory();
  }, [canvasObj, pushHistory, sync]);

  const onToolClick = useCallback((name) => {
    if (PRIMITIVE_TOOLS.has(name)) { addPrimitive(name); return; }
    if (name === 'select' || isTransformTool(name)) setActiveTool(name);
  }, [addPrimitive]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      const { code } = e;

      if (code === 'KeyZ' && !e.shiftKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); undo(); return; }
      if ((code === 'KeyZ' && e.shiftKey && !e.ctrlKey && !e.metaKey) || (code === 'KeyY' && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); redo(); return; }
      if ((code === 'Delete' || code === 'Backspace') && selectedId) { e.preventDefault(); deleteSelected(); return; }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (code === 'KeyV') { e.preventDefault(); setActiveTool('select'); return; }
        if (code === 'KeyG' || code === 'KeyW') { e.preventDefault(); setActiveTool('move'); return; }
        if (code === 'KeyR' || code === 'KeyE') { e.preventDefault(); setActiveTool('rotate'); return; }
        if (code === 'KeyS') { e.preventDefault(); setActiveTool('scale'); return; }
      }

      const nudgeKeyMap = {
        ArrowLeft: 'arrowleft',
        ArrowRight: 'arrowright',
        ArrowUp: 'arrowup',
        ArrowDown: 'arrowdown',
        PageUp: 'pageup',
        PageDown: 'pagedown',
      };
      const nudgeKey = nudgeKeyMap[code];
      if (nudgeKey && selectedId && isTransformTool(activeTool)) {
        const obj = (canvasObj.scene?.objects || []).find(o => o.id === selectedId);
        const patch = obj ? nudgeObject(obj, activeTool, nudgeKey, e.shiftKey) : null;
        if (patch) {
          e.preventDefault();
          canvasObj.updateObject(selectedId, patch);
          pushHistory({ coalesce: true });
          sync();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, deleteSelected, selectedId, activeTool, canvasObj, pushHistory, sync]);

  const selected = scene.objects.find(o => o.id === selectedId);

  const updateSelected = useCallback((patch, coalesce = true) => {
    if (!selectedId) return;
    canvasObj.updateObject(selectedId, patch);
    pushHistory({ coalesce });
    sync();
  }, [selectedId, canvasObj, pushHistory, sync]);

  const saveServer = async () => {
    if (!onSave) return;
    try {
      await onSave(new Blob([JSON.stringify(canvasObj.toJSON(), null, 2)], { type: 'application/json' }), 'application/json');
      setStatus('Сохранено');
    } catch (e) {
      console.error('3D save failed:', e);
      alert(e.message || 'Ошибка сохранения');
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(canvasObj.toJSON(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${work?.title || 'scene'}.3d.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportGlb = async () => {
    try {
      const data = await api.post('/3d/export', { scene: canvasObj.toJSON(), format: 'glb' });
      if (!data?.dataBase64) throw new Error('Пустой ответ экспорта');
      const bin = atob(data.dataBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: data.contentType || 'model/gltf-binary' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = data.filename || `${work?.title || 'scene'}.glb`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error('GLB export failed:', e);
      alert(e.message || 'Ошибка экспорта GLB');
    }
  };

  return (
    <div className="editor-layout">
      <ThreeToolbar
        tools={toolBar.getTools()}
        activeTool={activeTool}
        onToolClick={onToolClick}
        onUndo={undo}
        onRedo={redo}
        onSave={saveServer}
      />

      <div className="editor-center">
        <div className="canvas-wrap" style={{ padding: 8 }}>
          <div
            ref={viewContainerRef}
            style={{ flex: 1, minWidth: 0, minHeight: 0, width: '100%', height: '100%', position: 'relative', border: '1px solid var(--border)', background: '#181818', overflow: 'hidden' }}
          />
        </div>
        <div className="statusbar">{status}{status ? ' | ' : ''}Объектов: {scene.objects.length}</div>
      </div>

      <ThreePropertiesPanel
        scene={scene}
        selectedId={selectedId}
        selected={selected}
        onSelect={setSelectedId}
        onUpdate={updateSelected}
        onDelete={deleteSelected}
        onExportJson={exportJson}
        onExportGlb={exportGlb}
      />
    </div>
  );
}
