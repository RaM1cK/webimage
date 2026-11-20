import cv from '@techstark/opencv-js';
import ToolStrategy from '../../core/ToolStrategy';

export default class RotateTool extends ToolStrategy {
  constructor() {
    super('rotate', 'rotate', 'Поворот (R)');
  }

  process(ctx, params = {}) {
    const src = ctx.canvas.getMat();
    if (!src) return;

    const angle = Number(params.angle || 0);
    const center = params.center || { x: src.cols / 2, y: src.rows / 2 };
    const matrix = cv.getRotationMatrix2D(new cv.Point(center.x, center.y), angle, 1);
    const dst = new cv.Mat();

    try {
      cv.warpAffine(src, dst, matrix, new cv.Size(src.cols, src.rows), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
      ctx.canvas.setMat(dst);
    } finally {
      try { matrix.delete(); } catch (e) { console.warn('Failed to delete rotation matrix:', e); }
    }
  }
}
