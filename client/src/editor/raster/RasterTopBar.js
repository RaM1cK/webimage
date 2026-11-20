import React from 'react';

export default function RasterTopBar({ exportFmt, setExportFmt, jpegQ, setJpegQ, onFile, onExport, hasImage }) {
  return (
    <div
      style={{
        padding: '4px 8px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        background: 'var(--bg-panel)',
        flexWrap: 'wrap',
      }}
    >
      <label className="btn btn-sm" style={{ margin: 0 }} title="Открыть изображение">
        Открыть
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
      </label>

      <select className="form-select" style={{ width: 90 }} value={exportFmt} onChange={(e) => setExportFmt(e.target.value)} title="Формат экспорта">
        <option value="png">PNG</option>
        <option value="jpeg">JPEG</option>
        <option value="tiff">TIFF</option>
      </select>

      {exportFmt === 'jpeg' && (
        <input
          className="form-control"
          style={{ width: 70 }}
          type="number"
          min="1"
          max="100"
          value={jpegQ}
          onChange={(e) => setJpegQ(e.target.value)}
          title="Качество JPEG"
        />
      )}

      <button className="btn btn-sm" onClick={onExport} disabled={!hasImage} title="Экспорт">Экспорт</button>
    </div>
  );
}
