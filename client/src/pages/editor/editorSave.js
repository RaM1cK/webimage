import { api } from '../../api/client';

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export async function saveWorkBlob({ work, blob, isAutosave = false }) {
  if (!work || !blob) return null;

  if (work.workType === 'raster') {
    const form = new FormData();
    const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/tiff' ? 'tiff' : 'png';
    form.append('file', blob, `${work.title || 'image'}.${ext}`);
    await api.put(`/works/${work.id}`, form);
    return;
  }

  const content = await blob.text();
  const contentType = blob.type || (work.workType === 'svg' ? 'image/svg+xml' : 'application/json');
  const endpoint = isAutosave ? `/works/${work.id}/autosave` : `/works/${work.id}`;
  const method = isAutosave ? 'post' : 'put';
  await api[method](endpoint, { content, contentType, title: work.title });
}

export async function saveEditorBlobFromButton({ work, blob, type }) {
  if (!work || !blob) return;

  if (work.workType === 'raster') {
    const form = new FormData();
    const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/tiff' ? 'tiff' : 'png';
    form.append('file', blob, `${work.title || 'image'}.${ext}`);
    await api.put(`/works/${work.id}`, form);
    return;
  }

  const content = await blob.text();
  await api.put(`/works/${work.id}`, { content, contentType: type });
}
