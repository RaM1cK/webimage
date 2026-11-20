import cv from '@techstark/opencv-js';
import ToolStrategy from '../../core/ToolStrategy';

export default class CropTool extends ToolStrategy {
  constructor() {
    super('crop', 'crop', 'Обрезка (C)');
  }

  process(ctx, params = {}) {
    const src = ctx.canvas.getMat();
    if (!src) return;

    let { x = 0, y = 0, width = src.cols, height = src.rows } = params;
    x = Math.max(0, Math.min(x, src.cols - 1));
    y = Math.max(0, Math.min(y, src.rows - 1));
    width = Math.max(1, Math.min(width, src.cols - x));
    height = Math.max(1, Math.min(height, src.rows - y));

    const roi = src.roi(new cv.Rect(x, y, width, height));
    const dst = roi.clone();
    ctx.canvas.setMat(dst);
  }
}
