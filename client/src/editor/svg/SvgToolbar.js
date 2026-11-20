import React from 'react';
import { ToolIcon } from '../../components/Icons';

export default function SvgToolbar({ tools, activeTool, onSelectTool, onUndo, onRedo, onSave }) {
  return (
    <div className="toolbar">
      {tools.map((tool) => (
        <button
          key={tool.name}
          className={`tool-btn ${activeTool === tool.name ? 'active' : ''}`}
          onClick={() => onSelectTool(tool.name)}
          type="button"
          title={tool.tooltip}
        >
          <ToolIcon type={tool.icon} />
        </button>
      ))}
      <button className="tool-btn" onClick={onUndo} type="button" title="Отмена (Z)">
        <ToolIcon type="undo" />
      </button>
      <button className="tool-btn" onClick={onRedo} type="button" title="Повтор (Y / Shift+Z)">
        <ToolIcon type="redo" />
      </button>
      <button className="tool-btn" onClick={onSave} type="button" title="Сохранить">
        <ToolIcon type="save" />
      </button>
    </div>
  );
}
