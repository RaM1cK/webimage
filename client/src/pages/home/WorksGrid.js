import React from 'react';

function formatUpdatedAt(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function WorksGrid({ works, loading, onOpen, onDelete }) {
  if (loading) return <div>Loading...</div>;
  if (!works.length) return <div className="muted">Пока нет работ</div>;

  return (
    <div className="row g-3">
      {works.map((work) => (
        <div className="col-12 col-md-6 col-lg-4" key={work.id}>
          <div className="work-card h-100">
            <div onClick={() => onOpen(work.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(work.id)}>
              <div style={{ fontWeight: 600 }}>{work.title}</div>
              <div className="muted" style={{ fontSize: 13 }}>Тип: {work.workType}</div>
              <div className="muted" style={{ fontSize: 12 }}>Обновлено: {formatUpdatedAt(work.updatedAt)}</div>
            </div>
            <div className="mt-2 d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => onOpen(work.id)}>Открыть</button>
              <button className="btn btn-sm" onClick={() => onDelete(work.id)}>Удалить</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
