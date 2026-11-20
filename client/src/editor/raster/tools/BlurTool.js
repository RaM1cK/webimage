import cv from '@techstark/opencv-js';
import ToolStrategy from '../../core/ToolStrategy';

export default class BlurTool extends ToolStrategy {
  constructor() {
    super('blur', 'blur', 'Размытие');
  }

  process(ctx, params = {}) {
    const src = ctx.canvas.getMat();
    if (!src) return;

    const type = params.type || 'gaussian';
    let ksize = parseInt(params.ksize || 5, 10);
    if (ksize % 2 === 0) ksize += 1;
    if (ksize < 1) ksize = 1;

    const dst = new cv.Mat();
    if (type === 'mean') {
      cv.blur(src, dst, new cv.Size(ksize, ksize), new cv.Point(-1, -1), cv.BORDER_DEFAULT);
    } else if (type === 'median') {
      cv.medianBlur(src, dst, ksize);
    } else {
      cv.GaussianBlur(src, dst, new cv.Size(ksize, ksize), 0, 0, cv.BORDER_DEFAULT);
    }

    ctx.canvas.setMat(dst);
  }
}
