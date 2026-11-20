import BaseCanvas from '../core/BaseCanvas';

function createDefaultScene(size = [10, 10, 10]) {
  return {
    size,
    objects: [],
    camera: { position: [8, 8, 8], target: [0, 0, 0] },
  };
}

function cloneScene(scene) {
  return JSON.parse(JSON.stringify(scene));
}

function createObjectId(type) {
  return `${type || 'obj'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default class ThreeDCanvas extends BaseCanvas {
  constructor() {
    super('3d');
    this.scene = createDefaultScene();
  }

  newScene(size = [10, 10, 10]) {
    this.scene = createDefaultScene(size);
  }

  addObject(obj = {}) {
    const sceneObject = {
      id: obj.id || createObjectId(obj.type),
      type: obj.type || 'mesh',
      name: obj.name || obj.type || 'object',
      position: obj.position || [0, 0, 0],
      scale: obj.scale || [1, 1, 1],
      rotation: obj.rotation || [0, 0, 0], // degrees
      color: obj.color || [170, 170, 170, 255],
      params: obj.params || {},
      vertices: obj.vertices || null,
      faces: obj.faces || null,
    };

    this.scene.objects.push(sceneObject);
    return sceneObject;
  }

  updateObject(id, patch) {
    const target = this.scene.objects.find((object) => object.id === id);
    if (!target) return null;
    Object.assign(target, patch);
    return target;
  }

  removeObject(id) {
    this.scene.objects = this.scene.objects.filter((object) => object.id !== id);
  }

  toJSON() {
    return cloneScene(this.scene);
  }

  fromJSON(data) {
    if (!data) return;
    this.scene = cloneScene(data);
  }
}
