import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import {
  applyObjectTransform,
  buildGeometryFromStored,
  clampNum,
  disposeMeshResources,
  isTransformTool,
  transformModeForTool,
} from './threeUtils';

export function useThreeRenderer({
  containerRef,
  canvasObj,
  activeTool,
  selectedId,
  onSelect,
  onSyncModel,
  onCommitTransform,
  onSync,
}) {
  const mountRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    orbit: null,
    transform: null,
    grid: null,
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    meshes: new Map(),
    animId: null,
    lastSceneKey: null,
  });
  const draggingRef = useRef(false);

  const rebuildScene = useCallback((sceneData, { forceRebuild = false } = {}) => {
    const tm = mountRef.current;
    if (!tm.scene) return;

    const data = sceneData || canvasObj.toJSON();
    const dataKey = JSON.stringify(data);

    if (forceRebuild || tm.lastSceneKey !== dataKey) {
      for (const [, mesh] of tm.meshes) {
        tm.scene.remove(mesh);
        disposeMeshResources(mesh);
      }
      tm.meshes.clear();

      (data.objects || []).forEach((obj) => {
        const geometry = buildGeometryFromStored(obj);
        const color = Array.isArray(obj.color)
          ? new THREE.Color((obj.color[0] || 170) / 255, (obj.color[1] || 170) / 255, (obj.color[2] || 170) / 255)
          : new THREE.Color('#8c8c8c');
        const material = new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.75 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.userData.sceneObjectId = obj.id;
        mesh.userData.sceneType = obj.type;
        applyObjectTransform(mesh, obj);
        tm.scene.add(mesh);
        tm.meshes.set(obj.id, mesh);
      });

      if (tm.grid) {
        tm.scene.remove(tm.grid);
        tm.grid.geometry?.dispose?.();
        tm.grid.material?.dispose?.();
      }
      const sx = Math.max(2, clampNum(data.size?.[0], 10));
      const sz = Math.max(2, clampNum(data.size?.[2], 10));
      const gridSize = Math.max(sx, sz);
      tm.grid = new THREE.GridHelper(gridSize, Math.max(2, Math.round(gridSize)), 0x444444, 0x2f2f2f);
      tm.scene.add(tm.grid);
      tm.lastSceneKey = dataKey;
    }

    const selectedMesh = selectedId ? tm.meshes.get(selectedId) : null;
    if (tm.transform) {
      if (selectedMesh && isTransformTool(activeTool)) {
        tm.transform.attach(selectedMesh);
        tm.transform.setMode(transformModeForTool(activeTool));
        tm.transform.visible = true;
      } else {
        tm.transform.detach();
        tm.transform.visible = false;
      }
    }
  }, [canvasObj, activeTool, selectedId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 800, container.clientHeight || 500);
    renderer.setClearColor(0x181818, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181818);

    const camera = new THREE.PerspectiveCamera(55, (container.clientWidth || 800) / (container.clientHeight || 500), 0.1, 2000);
    camera.position.set(8, 7, 8);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x303030, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(8, 12, 6);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.target.set(0, 0.5, 0);

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setMode('translate');

    transform.addEventListener('dragging-changed', (e) => {
      orbit.enabled = !e.value;
      draggingRef.current = !!e.value;
      if (!e.value && transform.object) {
        onSyncModel?.(transform.object);
        onCommitTransform?.();
        onSync?.();
      }
    });

    transform.addEventListener('objectChange', () => {
      if (!transform.object) return;
      onSyncModel?.(transform.object);
      if (!draggingRef.current) {
        onCommitTransform?.({ coalesce: true });
        onSync?.();
      }
    });

    if (typeof transform.getHelper === 'function') scene.add(transform.getHelper());
    else scene.add(transform);

    mountRef.current = { ...mountRef.current, renderer, scene, camera, orbit, transform };

    const resize = () => {
      const w = Math.max(320, container.clientWidth || 320);
      const h = Math.max(240, container.clientHeight || 240);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(resize);
      ro.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    const onPointerDown = (event) => {
      if (draggingRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mountRef.current.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      mountRef.current.raycaster.setFromCamera(mountRef.current.pointer, camera);
      const hits = mountRef.current.raycaster.intersectObjects(Array.from(mountRef.current.meshes.values()), false);
      if (hits.length) onSelect?.(hits[0].object?.userData?.sceneObjectId || null);
      else if (event.target === renderer.domElement) onSelect?.(null);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const animate = () => {
      mountRef.current.animId = requestAnimationFrame(animate);
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current.animId) cancelAnimationFrame(mountRef.current.animId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      orbit.dispose();
      if (typeof transform.getHelper === 'function') {
        try { scene.remove(transform.getHelper()); } catch (e) {}
      }
      transform.dispose();
      for (const [, mesh] of mountRef.current.meshes) {
        scene.remove(mesh);
        disposeMeshResources(mesh);
      }
      mountRef.current.meshes.clear();
      if (mountRef.current.grid) {
        scene.remove(mountRef.current.grid);
        mountRef.current.grid.geometry?.dispose?.();
        mountRef.current.grid.material?.dispose?.();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      mountRef.current = { ...mountRef.current, renderer: null, scene: null, camera: null, orbit: null, transform: null, grid: null, lastSceneKey: null };
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { rebuildScene };
}
