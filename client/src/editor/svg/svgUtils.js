export const SHAPE_TOOLS = new Set(['rect', 'ellipse', 'line', 'polyline', 'polygon', 'star', 'text']);

export const TOOL_SHORTCUTS = {
  KeyV: 'select',
  KeyR: 'rect',
  KeyE: 'ellipse',
  KeyL: 'line',
  KeyP: 'polygon',
  KeyO: 'polyline',
  KeyS: 'star',
  KeyT: 'text',
};

export function starPoints(cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  const points = [];

  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerR;
    let y = cy + Math.sin(rot) * outerR;
    points.push(`${x},${y}`);
    rot += step;

    x = cx + Math.cos(rot) * innerR;
    y = cy + Math.sin(rot) * innerR;
    points.push(`${x},${y}`);
    rot += step;
  }

  return points.join(' ');
}

export function getSvgPoint(svg, clientX, clientY) {
  if (!svg) return { x: 0, y: 0 };
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const transformed = point.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}

export function transformToString(transform = {}) {
  const parts = [];
  if (transform.x || transform.y) parts.push(`translate(${transform.x || 0} ${transform.y || 0})`);
  if (transform.rotate) parts.push(`rotate(${transform.rotate})`);
  if ((transform.scaleX ?? 1) !== 1 || (transform.scaleY ?? 1) !== 1) {
    parts.push(`scale(${transform.scaleX ?? 1} ${transform.scaleY ?? 1})`);
  }
  if (transform.skewX) parts.push(`skewX(${transform.skewX})`);
  if (transform.skewY) parts.push(`skewY(${transform.skewY})`);
  return parts.join(' ') || undefined;
}

export function createShapeElement(canvasObj, tool, x, y) {
  const layer = canvasObj.layers[0]?.id || 'layer_1';
  const common = {
    stroke: '#d4d4d4',
    strokeWidth: 2,
    fill: tool === 'line' || tool === 'polyline' ? 'none' : 'rgba(90,90,90,0.25)',
  };

  switch (tool) {
    case 'rect':
      return canvasObj.addElement({ type: 'rect', layer, attrs: { ...common, x, y, width: 1, height: 1, rx: 0, ry: 0 } });
    case 'ellipse':
      return canvasObj.addElement({ type: 'ellipse', layer, attrs: { ...common, cx: x, cy: y, rx: 1, ry: 1 } });
    case 'line':
      return canvasObj.addElement({ type: 'line', layer, attrs: { ...common, fill: 'none', x1: x, y1: y, x2: x, y2: y } });
    case 'polyline':
      return canvasObj.addElement({ type: 'polyline', layer, attrs: { ...common, points: `${x},${y}` } });
    case 'polygon':
      return canvasObj.addElement({ type: 'polygon', layer, attrs: { ...common, points: `${x},${y}` } });
    case 'star':
      return canvasObj.addElement({ type: 'star', layer, attrs: { ...common, points: starPoints(x, y, 5, 1, 0.5), cx: x, cy: y } });
    case 'text': {
      const text = prompt('Текст', 'Text') || 'Text';
      return canvasObj.addElement({
        type: 'text',
        layer,
        attrs: { ...common, fill: '#d4d4d4', stroke: 'none', x, y, fontSize: 24, fontFamily: 'Arial' },
        text,
      });
    }
    default:
      return null;
  }
}

export function updateShapeDuringDraw(canvasObj, elementId, tool, startPoint, currentPoint) {
  const dx = currentPoint.x - startPoint.x;
  const dy = currentPoint.y - startPoint.y;

  if (tool === 'rect') {
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    canvasObj.updateElement(elementId, { attrs: { x, y, width: Math.abs(dx), height: Math.abs(dy) } });
    return;
  }

  if (tool === 'ellipse') {
    canvasObj.updateElement(elementId, {
      attrs: {
        cx: (startPoint.x + currentPoint.x) / 2,
        cy: (startPoint.y + currentPoint.y) / 2,
        rx: Math.abs(dx) / 2,
        ry: Math.abs(dy) / 2,
      },
    });
    return;
  }

  if (tool === 'line') {
    canvasObj.updateElement(elementId, { attrs: { x2: currentPoint.x, y2: currentPoint.y } });
    return;
  }

  if (tool === 'star') {
    const radius = Math.max(5, Math.sqrt(dx * dx + dy * dy));
    canvasObj.updateElement(elementId, {
      attrs: { points: starPoints(startPoint.x, startPoint.y, 5, radius, radius / 2), cx: startPoint.x, cy: startPoint.y },
    });
    return;
  }

  if (tool === 'polyline' || tool === 'polygon') {
    const points = `${startPoint.x},${startPoint.y} ${startPoint.x + dx},${startPoint.y} ${currentPoint.x},${currentPoint.y} ${startPoint.x},${startPoint.y + dy}`;
    canvasObj.updateElement(elementId, { attrs: { points } });
  }
}

export function normalizeImportedAttrName(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
