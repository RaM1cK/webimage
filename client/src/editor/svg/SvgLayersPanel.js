import React from 'react';

export default function SvgLayersPanel({ layers, collapsed, onToggleCollapsed, onAddLayer, onToggleLayerFlag }) {
  return (
    <div className={`layers-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div className="panel-title m-0" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          Слои
        </div>
        <div className="d-flex gap-1">
          {!collapsed && (
            <button className="btn btn-sm" onClick={onAddLayer} title="Добавить слой">+</button>
          )}
          <button className="btn btn-sm" onClick={onToggleCollapsed}>{collapsed ? '▸' : '▾'}</button>
        </div>
      </div>

      {!collapsed && layers.map((layer) => (
        <div key={layer.id} className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 13 }}>
          <input type="checkbox" checked={!!layer.visible} onChange={() => onToggleLayerFlag(layer.id, 'visible')} title="Видимость" />
          <input type="checkbox" checked={!!layer.locked} onChange={() => onToggleLayerFlag(layer.id, 'locked')} title="Блокировка" />
          <span style={{ flex: 1 }}>{layer.name}</span>
        </div>
      ))}
    </div>
  );
}
