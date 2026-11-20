import React from 'react';

function getOverlayStyle(canvas, selection) {
  if (!canvas || !selection) return null;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const sx = rect.width / canvas.width;
  const sy = rect.height / canvas.height;

  return {
    position: 'absolute',
    left: `${selection.x * sx}px`,
    top: `${selection.y * sy}px`,
    width: `${selection.w * sx}px`,
    height: `${selection.h * sy}px`,
    border: '1px dashed #fff',
    background: 'rgba(255,255,255,0.08)',
    pointerEvents: 'none',
    boxSizing: 'border-box',
  };
}

export default function RasterCanvasView({
  canvasRef,
  activeTool,
  selection,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) {
  const overlayStyle = getOverlayStyle(canvasRef.current, selection);

  return (
    <div className="canvas-wrap">
      <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            background: '#222',
            cursor: activeTool === 'crop' ? 'crosshair' : 'default',
            display: 'block',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
        {overlayStyle && <div style={overlayStyle} />}
      </div>
    </div>
  );
}
