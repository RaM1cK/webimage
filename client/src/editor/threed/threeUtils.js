import * as THREE from 'three';

export const TRANSFORM_TOOLS = new Set(['move', 'rotate', 'scale']);
export const PRIMITIVE_TOOLS = new Set(['cube', 'sphere', 'cylinder', 'cone', 'torus']);

export function clampNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function isTransformTool(tool) {
  return TRANSFORM_TOOLS.has(tool);
}

export function transformModeForTool(tool) {
  if (tool === 'rotate') return 'rotate';
  if (tool === 'scale') return 'scale';
  return 'translate';
}

export function geometryFromType(type) {
  switch (type) {
    case 'cube':
    case 'box':
      return new THREE.BoxGeometry(1, 1, 1);
    case 'sphere':
      return new THREE.SphereGeometry(0.5, 24, 16);
    case 'cylinder':
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
    case 'cone':
      return new THREE.ConeGeometry(0.5, 1, 24);
    case 'torus':
      return new THREE.TorusGeometry(0.6, 0.2, 16, 32);
    default:
      return null;
  }
}

export function geometryToMeshData(geometry) {
  const geom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const pos = geom.getAttribute('position');
  const vertices = [];
  const faces = [];

  for (let i = 0; i < pos.count; i++) {
    vertices.push([pos.getX(i), pos.getY(i), pos.getZ(i)]);
  }
  for (let i = 0; i < pos.count; i += 3) {
    faces.push([i, i + 1, i + 2]);
  }

  if (geom !== geometry) geom.dispose();
  return { vertices, faces };
}

export function buildGeometryFromStored(obj) {
  if (Array.isArray(obj?.vertices) && obj.vertices.length && Array.isArray(obj.faces) && obj.faces.length) {
    try {
      const geom = new THREE.BufferGeometry();
      const triPositions = [];
      const verts = obj.vertices;

      for (const face of obj.faces) {
        if (!face || face.length < 3) continue;
        for (let i = 1; i < face.length - 1; i++) {
          const idxs = [face[0], face[i], face[i + 1]];
          for (const vi of idxs) {
            const v = verts[vi];
            if (!v) {
              triPositions.push(0, 0, 0);
            } else {
              triPositions.push(clampNum(v[0]), clampNum(v[1]), clampNum(v[2]));
            }
          }
        }
      }

      if (triPositions.length >= 9) {
        geom.setAttribute('position', new THREE.Float32BufferAttribute(triPositions, 3));
        geom.computeVertexNormals();
        geom.computeBoundingSphere();
        return geom;
      }
      geom.dispose();
    } catch (e) {
      // fallback to primitive geometry
    }
  }

  return geometryFromType(obj?.type) || new THREE.BoxGeometry(1, 1, 1);
}

export function applyObjectTransform(mesh, obj) {
  const p = obj.position || [0, 0, 0];
  const s = obj.scale || [1, 1, 1];
  const r = obj.rotation || [0, 0, 0];

  mesh.position.set(clampNum(p[0]), clampNum(p[1]), clampNum(p[2]));
  mesh.scale.set(clampNum(s[0], 1), clampNum(s[1], 1), clampNum(s[2], 1));
  mesh.rotation.set(
    THREE.MathUtils.degToRad(clampNum(r[0])),
    THREE.MathUtils.degToRad(clampNum(r[1])),
    THREE.MathUtils.degToRad(clampNum(r[2]))
  );
}

export function disposeMeshResources(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose?.();
  if (Array.isArray(mesh.material)) mesh.material.forEach(m => m?.dispose?.());
  else mesh.material?.dispose?.();
}

export function vec3OrDefault(arr, fallback) {
  return [
    clampNum(Array.isArray(arr) ? arr[0] : undefined, fallback[0]),
    clampNum(Array.isArray(arr) ? arr[1] : undefined, fallback[1]),
    clampNum(Array.isArray(arr) ? arr[2] : undefined, fallback[2]),
  ];
}

export function nudgeObject(obj, tool, key, shift) {
  const position = vec3OrDefault(obj.position, [0, 0, 0]);
  const rotation = vec3OrDefault(obj.rotation, [0, 0, 0]);
  const scale = vec3OrDefault(obj.scale, [1, 1, 1]);

  const moveStep = shift ? 1.0 : 0.1;
  const rotStep = shift ? 15 : 5;
  const scaleStep = shift ? 0.5 : 0.1;

  if (tool === 'move') {
    if (key === 'arrowleft') position[0] -= moveStep;
    else if (key === 'arrowright') position[0] += moveStep;
    else if (key === 'arrowup') position[2] -= moveStep;
    else if (key === 'arrowdown') position[2] += moveStep;
    else if (key === 'pageup') position[1] += moveStep;
    else if (key === 'pagedown') position[1] -= moveStep;
    else return null;
    return { position };
  }

  if (tool === 'rotate') {
    if (key === 'arrowleft') rotation[1] -= rotStep;
    else if (key === 'arrowright') rotation[1] += rotStep;
    else if (key === 'arrowup') rotation[0] -= rotStep;
    else if (key === 'arrowdown') rotation[0] += rotStep;
    else if (key === 'pageup') rotation[2] += rotStep;
    else if (key === 'pagedown') rotation[2] -= rotStep;
    else return null;
    return { rotation };
  }

  if (tool === 'scale') {
    if (key === 'arrowleft') scale[0] = Math.max(0.05, scale[0] - scaleStep);
    else if (key === 'arrowright') scale[0] += scaleStep;
    else if (key === 'arrowup') scale[2] = Math.max(0.05, scale[2] - scaleStep);
    else if (key === 'arrowdown') scale[2] += scaleStep;
    else if (key === 'pageup') scale[1] += scaleStep;
    else if (key === 'pagedown') scale[1] = Math.max(0.05, scale[1] - scaleStep);
    else return null;
    return { scale };
  }

  return null;
}
