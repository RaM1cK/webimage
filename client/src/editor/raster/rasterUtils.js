export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function getImagePointFromClient(canvas, clientX, clientY) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);

  return {
    x: Math.max(0, Math.min(canvas.width, x)),
    y: Math.max(0, Math.min(canvas.height, y)),
  };
}

export function clampCropToImage(crop, imageInfo) {
  if (!imageInfo) return crop;
  const x = Math.max(0, Math.min(crop.x, Math.max(0, imageInfo.width - 1)));
  const y = Math.max(0, Math.min(crop.y, Math.max(0, imageInfo.height - 1)));
  const width = Math.max(1, Math.min(crop.width, imageInfo.width - x));
  const height = Math.max(1, Math.min(crop.height, imageInfo.height - y));
  return { x, y, width, height };
}
