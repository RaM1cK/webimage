import React from 'react';

function getValue(arr, index, fallback) {
  return (Array.isArray(arr) ? arr[index] : undefined) ?? fallback;
}

function NumberRow({ label, value, step, onChange }) {
  return (
    <div className="prop-row">
      <label>{label}</label>
      <input className="form-control" type="number" step={step} value={value} onChange={onChange} />
    </div>
  );
}

export default function ThreePropertiesPanel({ scene, selectedId, selected, onSelect, onUpdate, onDelete, onExportJson, onExportGlb }) {
  const pos = selected?.position;
  const scale = selected?.scale;
  const rot = selected?.rotation;

  return (
    <div className="properties-panel">
      <div className="d-flex gap-1 mb-2">
        <button className="btn btn-sm w-100" onClick={onExportJson} title="Экспорт JSON">JSON</button>
        <button className="btn btn-sm w-100" onClick={onExportGlb} title="Экспорт GLB">GLB</button>
      </div>

      <div className="panel-title">Объект</div>
      <select className="form-select mb-2" value={selectedId || ''} onChange={(e) => onSelect(e.target.value || null)}>
        <option value="">—</option>
        {scene.objects.map((obj) => (
          <option key={obj.id} value={obj.id}>{obj.name}</option>
        ))}
      </select>

      {selected && (
        <>
          <NumberRow label="X" step="0.1" value={getValue(pos, 0, 0)} onChange={(e) => onUpdate({ position: [Number(e.target.value), getValue(pos, 1, 0), getValue(pos, 2, 0)] })} />
          <NumberRow label="Y" step="0.1" value={getValue(pos, 1, 0)} onChange={(e) => onUpdate({ position: [getValue(pos, 0, 0), Number(e.target.value), getValue(pos, 2, 0)] })} />
          <div className="mb-2"><NumberRow label="Z" step="0.1" value={getValue(pos, 2, 0)} onChange={(e) => onUpdate({ position: [getValue(pos, 0, 0), getValue(pos, 1, 0), Number(e.target.value)] })} /></div>

          <NumberRow label="SX" step="0.1" value={getValue(scale, 0, 1)} onChange={(e) => onUpdate({ scale: [Number(e.target.value), getValue(scale, 1, 1), getValue(scale, 2, 1)] })} />
          <NumberRow label="SY" step="0.1" value={getValue(scale, 1, 1)} onChange={(e) => onUpdate({ scale: [getValue(scale, 0, 1), Number(e.target.value), getValue(scale, 2, 1)] })} />
          <div className="mb-2"><NumberRow label="SZ" step="0.1" value={getValue(scale, 2, 1)} onChange={(e) => onUpdate({ scale: [getValue(scale, 0, 1), getValue(scale, 1, 1), Number(e.target.value)] })} /></div>

          <NumberRow label="RX" step="1" value={getValue(rot, 0, 0)} onChange={(e) => onUpdate({ rotation: [Number(e.target.value), getValue(rot, 1, 0), getValue(rot, 2, 0)] })} />
          <NumberRow label="RY" step="1" value={getValue(rot, 1, 0)} onChange={(e) => onUpdate({ rotation: [getValue(rot, 0, 0), Number(e.target.value), getValue(rot, 2, 0)] })} />
          <div className="mb-2"><NumberRow label="RZ" step="1" value={getValue(rot, 2, 0)} onChange={(e) => onUpdate({ rotation: [getValue(rot, 0, 0), getValue(rot, 1, 0), Number(e.target.value)] })} /></div>

          <button className="btn btn-sm w-100" style={{ background: 'var(--danger)' }} onClick={onDelete} title="Удалить (Del)">Удалить</button>
        </>
      )}
    </div>
  );
}
