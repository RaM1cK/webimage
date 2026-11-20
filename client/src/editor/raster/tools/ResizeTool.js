import cv from '@techstark/opencv-js';
import ToolStrategy from '../../core/ToolStrategy';

function resolveInterpolation(src, newW, newH, interpolation) {
  if (interpolation === 'nearest') return cv.INTER_NEAREST;
  if (interpolation === 'bilinear') return cv.INTER_LINEAR;
  if (interpolation === 'bicubic') return cv.INTER_CUBIC;

  if (interpolation === 'auto') {
    const factor = (newW * newH) / (src.cols * src.rows);
    if (factor < 1) return cv.INTER_AREA;
    if (factor > 2) return cv.INTER_CUBIC;
    return cv.INTER_LINEAR;
  }

  return cv.INTER_LINEAR;
}

export default class ResizeTool extends ToolStrategy {
  constructor() {
    super('resize', 'resize', 'Размер (S)');
  }

  process(ctx, params = {}) {
    const src = ctx.canvas.getMat();
    if (!src) return;

    let newW = params.width;
    let newH = params.height;
    if (params.scale) {
      newW = Math.max(1, Math.round(src.cols * params.scale));
      newH = Math.max(1, Math.round(src.rows * params.scale));
    }
    if (!newW || !newH) return;

    const interp = resolveInterpolation(src, newW, newH, params.interpolation);
    const dst = new cv.Mat();
    cv.resize(src, dst, new cv.Size(newW, newH), 0, 0, interp);
    ctx.canvas.setMat(dst);
  }
}
