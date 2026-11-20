import React from 'react';

export default function CreateWorkModal({
  title,
  workType,
  onTitleChange,
  onTypeChange,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="card p-3 mb-3" style={{ maxWidth: 420 }}>
      <h5>Новая работа</h5>
      <form onSubmit={onSubmit}>
        <div className="mb-2">
          <label>Название</label>
          <input className="form-control" value={title} onChange={(e) => onTitleChange(e.target.value)} />
        </div>
        <div className="mb-3">
          <label>Тип</label>
          <select className="form-select" value={workType} onChange={(e) => onTypeChange(e.target.value)}>
            <option value="raster">Растровое изображение</option>
            <option value="svg">SVG / Векторная графика</option>
            <option value="3d">3D графика</option>
          </select>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit">Создать</button>
          <button className="btn" type="button" onClick={onCancel}>Отмена</button>
        </div>
      </form>
    </div>
  );
}
