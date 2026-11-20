import React from 'react';

function PropRow({ label, children }) {
  return (
    <div className="prop-row">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function SvgPropertiesPanel({
  selected,
  onAttrChange,
  onTransformChange,
  onTextChange,
  onFlipH,
  onFlipV,
  onDelete,
}) {
  if (!selected) {
    return (
      <div className="properties-panel">
        <div className="muted" style={{ fontSize: 13 }}>—</div>
      </div>
    );
  }

  const attrs = selected.attrs || {};
  const transform = selected.transform || {};

  return (
    <div className="properties-panel">
      <div className="panel-title" style={{ textTransform: 'none' }}>{selected.type}</div>

      <PropRow label="Fill">
        <input className="form-control" value={attrs.fill || ''} onChange={(e) => onAttrChange('fill', e.target.value)} />
      </PropRow>
      <PropRow label="Stroke">
        <input className="form-control" value={attrs.stroke || ''} onChange={(e) => onAttrChange('stroke', e.target.value)} />
      </PropRow>
      <PropRow label="SW">
        <input className="form-control" type="number" value={attrs.strokeWidth ?? 1} onChange={(e) => onAttrChange('strokeWidth', Number(e.target.value))} />
      </PropRow>
      <div className="prop-row mb-2">
        <label>Dash</label>
        <input className="form-control" value={attrs.strokeDasharray || ''} onChange={(e) => onAttrChange('strokeDasharray', e.target.value)} />
      </div>

      {selected.type === 'rect' && (
        <div className="prop-row mb-2">
          <label>RX</label>
          <input
            className="form-control"
            type="number"
            value={attrs.rx || 0}
            onChange={(e) => {
              const value = Number(e.target.value);
              onAttrChange('rx', value);
              onAttrChange('ry', value);
            }}
          />
        </div>
      )}

      {selected.type === 'text' && (
        <>
          <label>Текст</label>
          <input className="form-control mb-1" value={selected.text || ''} onChange={(e) => onTextChange(e.target.value)} />
          <PropRow label="Size">
            <input className="form-control" type="number" value={attrs.fontSize || 16} onChange={(e) => onAttrChange('fontSize', Number(e.target.value))} />
          </PropRow>
          <div className="prop-row mb-2">
            <label>Font</label>
            <input className="form-control" value={attrs.fontFamily || 'Arial'} onChange={(e) => onAttrChange('fontFamily', e.target.value)} />
          </div>
        </>
      )}

      <div className="panel-title">Трансформ</div>
      <PropRow label="X">
        <input className="form-control" type="number" value={transform.x || 0} onChange={(e) => onTransformChange('x', e.target.value)} />
      </PropRow>
      <PropRow label="Y">
        <input className="form-control" type="number" value={transform.y || 0} onChange={(e) => onTransformChange('y', e.target.value)} />
      </PropRow>
      <PropRow label="SX">
        <input className="form-control" type="number" step="0.1" value={transform.scaleX ?? 1} onChange={(e) => onTransformChange('scaleX', e.target.value)} />
      </PropRow>
      <PropRow label="SY">
        <input className="form-control" type="number" step="0.1" value={transform.scaleY ?? 1} onChange={(e) => onTransformChange('scaleY', e.target.value)} />
      </PropRow>
      <PropRow label="R">
        <input className="form-control" type="number" value={transform.rotate || 0} onChange={(e) => onTransformChange('rotate', e.target.value)} />
      </PropRow>
      <PropRow label="KX">
        <input className="form-control" type="number" value={transform.skewX || 0} onChange={(e) => onTransformChange('skewX', e.target.value)} />
      </PropRow>
      <div className="prop-row mb-2">
        <label>KY</label>
        <input className="form-control" type="number" value={transform.skewY || 0} onChange={(e) => onTransformChange('skewY', e.target.value)} />
      </div>

      <div className="d-flex gap-1 mb-2">
        <button className="btn btn-sm w-100" onClick={onFlipH} title="Отразить по горизонтали">↔</button>
        <button className="btn btn-sm w-100" onClick={onFlipV} title="Отразить по вертикали">↕</button>
      </div>
      <button className="btn btn-sm w-100" style={{ background: 'var(--danger)' }} onClick={onDelete} title="Удалить (Del)">Удалить</button>
    </div>
  );
}
