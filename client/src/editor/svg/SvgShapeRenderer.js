import React from 'react';
import { transformToString } from './svgUtils';

export function renderSvgElement(element, activeTool) {
  const common = {
    ...element.attrs,
    transform: transformToString(element.transform || {}),
    'data-id': element.id,
    style: { cursor: activeTool === 'select' ? 'move' : 'default' },
  };

  switch (element.type) {
    case 'rect':
      return (
        <rect
          key={element.id}
          {...common}
          x={element.attrs.x}
          y={element.attrs.y}
          width={element.attrs.width}
          height={element.attrs.height}
          rx={element.attrs.rx || 0}
          ry={element.attrs.ry || 0}
        />
      );
    case 'ellipse':
      return <ellipse key={element.id} {...common} cx={element.attrs.cx} cy={element.attrs.cy} rx={element.attrs.rx} ry={element.attrs.ry} />;
    case 'line':
      return <line key={element.id} {...common} x1={element.attrs.x1} y1={element.attrs.y1} x2={element.attrs.x2} y2={element.attrs.y2} />;
    case 'polyline':
      return <polyline key={element.id} {...common} points={element.attrs.points} />;
    case 'polygon':
    case 'star':
      return <polygon key={element.id} {...common} points={element.attrs.points} />;
    case 'path':
      return <path key={element.id} {...common} d={element.attrs.d} />;
    case 'image':
      return <image key={element.id} {...common} href={element.attrs.href} x={element.attrs.x} y={element.attrs.y} width={element.attrs.width} height={element.attrs.height} />;
    case 'text':
      return (
        <text key={element.id} {...common} x={element.attrs.x} y={element.attrs.y} fontSize={element.attrs.fontSize || 16} fontFamily={element.attrs.fontFamily || 'Arial'}>
          {element.text}
        </text>
      );
    default:
      return null;
  }
}
