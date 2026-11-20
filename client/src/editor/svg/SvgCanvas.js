import BaseCanvas from '../core/BaseCanvas';

let idCounter = 1;

export function nextId() {
  return `el_${Date.now()}_${idCounter++}`;
}

function createDefaultLayer() {
  return { id: 'layer_1', name: 'Layer 1', visible: true, locked: false };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toKebabCase(name) {
  return name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function attrsToString(attrs) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${toKebabCase(key)}="${escapeXml(value)}"`)
    .join(' ');
}

function transformToSvgString(transform = {}) {
  const parts = [];
  if (transform.x || transform.y) parts.push(`translate(${transform.x || 0} ${transform.y || 0})`);
  if (transform.rotate) parts.push(`rotate(${transform.rotate})`);
  if ((transform.scaleX ?? 1) !== 1 || (transform.scaleY ?? 1) !== 1) {
    parts.push(`scale(${transform.scaleX ?? 1} ${transform.scaleY ?? 1})`);
  }
  if (transform.skewX) parts.push(`skewX(${transform.skewX})`);
  if (transform.skewY) parts.push(`skewY(${transform.skewY})`);
  return parts.join(' ');
}

export default class SvgCanvas extends BaseCanvas {
  constructor() {
    super('svg');
    this.newDocument(800, 600);
  }

  newDocument(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.elements = [];
    this.layers = [createDefaultLayer()];
    this.selectedId = null;
  }

  addElement(element) {
    const created = {
      id: element.id || nextId(),
      type: element.type,
      attrs: { fill: 'none', stroke: '#d4d4d4', strokeWidth: 2, ...(element.attrs || {}) },
      transform: {
        x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, skewX: 0, skewY: 0,
        ...(element.transform || {}),
      },
      layer: element.layer || this.layers[0]?.id || 'layer_1',
      visible: element.visible !== false,
      locked: !!element.locked,
      name: element.name || element.type,
      text: element.text || '',
    };

    this.elements.push(created);
    return created;
  }

  updateElement(id, patch) {
    const element = this.elements.find((e) => e.id === id);
    if (!element) return null;

    if (patch.attrs) element.attrs = { ...element.attrs, ...patch.attrs };
    if (patch.transform) element.transform = { ...element.transform, ...patch.transform };
    if (patch.text != null) element.text = patch.text;

    Object.entries(patch).forEach(([key, value]) => {
      if (!['attrs', 'transform', 'text'].includes(key)) {
        element[key] = value;
      }
    });

    return element;
  }

  removeElement(id) {
    this.elements = this.elements.filter((element) => element.id !== id);
    if (this.selectedId === id) this.selectedId = null;
  }

  getSelected() {
    return this.elements.find((element) => element.id === this.selectedId) || null;
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      elements: this.elements,
      layers: this.layers,
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.width = data.width || 800;
    this.height = data.height || 600;
    this.elements = Array.isArray(data.elements) ? data.elements : [];
    this.layers = Array.isArray(data.layers) && data.layers.length ? data.layers : [createDefaultLayer()];
    this.selectedId = null;
  }

  renderElementToSvg(element) {
    if (element.visible === false) return '';

    const baseAttrs = { ...element.attrs };
    const transform = transformToSvgString(element.transform || {});
    if (transform) baseAttrs.transform = transform;

    switch (element.type) {
      case 'rect': {
        const { x, y, width, height, rx, ry, ...rest } = baseAttrs;
        return `<rect x="${element.attrs.x || 0}" y="${element.attrs.y || 0}" width="${element.attrs.width || 0}" height="${element.attrs.height || 0}" rx="${element.attrs.rx || 0}" ry="${element.attrs.ry || 0}" ${attrsToString(rest)} />`;
      }
      case 'ellipse': {
        const { cx, cy, rx, ry, ...rest } = baseAttrs;
        return `<ellipse cx="${element.attrs.cx || 0}" cy="${element.attrs.cy || 0}" rx="${element.attrs.rx || 0}" ry="${element.attrs.ry || 0}" ${attrsToString(rest)} />`;
      }
      case 'line': {
        const { x1, y1, x2, y2, ...rest } = baseAttrs;
        return `<line x1="${element.attrs.x1 || 0}" y1="${element.attrs.y1 || 0}" x2="${element.attrs.x2 || 0}" y2="${element.attrs.y2 || 0}" ${attrsToString(rest)} />`;
      }
      case 'polyline': {
        const { points, ...rest } = baseAttrs;
        return `<polyline points="${escapeXml(element.attrs.points || '')}" ${attrsToString(rest)} />`;
      }
      case 'polygon':
      case 'star': {
        const { points, ...rest } = baseAttrs;
        return `<polygon points="${escapeXml(element.attrs.points || '')}" ${attrsToString(rest)} />`;
      }
      case 'text': {
        const { x, y, fontSize, fontFamily, ...rest } = baseAttrs;
        return `<text x="${element.attrs.x || 0}" y="${element.attrs.y || 0}" font-size="${element.attrs.fontSize || 16}" font-family="${escapeXml(element.attrs.fontFamily || 'Arial')}" ${attrsToString(rest)}>${escapeXml(element.text || '')}</text>`;
      }
      case 'image': {
        const { href, x, y, width, height, ...rest } = baseAttrs;
        return `<image href="${escapeXml(element.attrs.href || '')}" x="${element.attrs.x || 0}" y="${element.attrs.y || 0}" width="${element.attrs.width || 0}" height="${element.attrs.height || 0}" ${attrsToString(rest)} />`;
      }
      case 'path': {
        const { d, ...rest } = baseAttrs;
        return `<path d="${escapeXml(element.attrs.d || '')}" ${attrsToString(rest)} />`;
      }
      default:
        return '';
    }
  }

  toSVGString() {
    const layerOrder = this.layers.map((layer) => layer.id);
    const orderedElements = [...this.elements].sort(
      (a, b) => layerOrder.indexOf(a.layer) - layerOrder.indexOf(b.layer)
    );

    const body = orderedElements.map((element) => this.renderElementToSvg(element)).filter(Boolean).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">\n${body}\n</svg>`;
  }
}
