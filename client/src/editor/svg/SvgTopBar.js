import React from 'react';

export default function SvgTopBar({ docSize, fileInputRef, onNew, onImport, onExport, onImportClick }) {
  return (
    <div
      style={{
        padding: '4px 8px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        background: 'var(--bg-panel)',
      }}
    >
      <button className="btn btn-sm" onClick={onNew} title="Новый">Новый</button>
      <button className="btn btn-sm" onClick={onImportClick} title="Импорт SVG">Импорт</button>
      <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" style={{ display: 'none' }} onChange={onImport} />
      <button className="btn btn-sm" onClick={onExport} title="Экспорт SVG">SVG</button>
      <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>
        {docSize.width}×{docSize.height}
      </span>
    </div>
  );
}
