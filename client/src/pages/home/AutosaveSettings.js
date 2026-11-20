import React from 'react';

export default function AutosaveSettings({
  enabled,
  interval,
  onEnabledChange,
  onIntervalChange,
  onSave,
}) {
  return (
    <div className="card p-2 d-flex flex-row align-items-center gap-2" style={{ minWidth: 360 }}>
      <label className="d-flex align-items-center gap-1 m-0">
        <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} />
        Автосохранение
      </label>
      <input
        type="number"
        className="form-control"
        style={{ width: 90 }}
        value={interval}
        onChange={(e) => onIntervalChange(e.target.value)}
        min={5}
        max={3600}
      />
      <span className="muted" style={{ fontSize: 12 }}>сек</span>
      <button className="btn btn-primary" onClick={onSave}>Сохранить</button>
    </div>
  );
}
