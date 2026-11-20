import cv from '@techstark/opencv-js';

export function ensureRgba(src) {
  if (!src) return src;
  if (src.channels() === 4) return src.clone();

  const dst = new cv.Mat();
  if (src.channels() === 1) {
    cv.cvtColor(src, dst, cv.COLOR_GRAY2RGBA);
  } else {
    cv.cvtColor(src, dst, cv.COLOR_RGB2RGBA);
  }
  return dst;
}

export function safeDelete(...mats) {
  mats.forEach((mat) => {
    if (!mat || typeof mat.delete !== 'function') return;
    try {
      mat.delete();
    } catch (e) {
      console.warn('Failed to delete OpenCV object:', e);
    }
  });
}
