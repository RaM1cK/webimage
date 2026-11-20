import cv from '@techstark/opencv-js';
import ToolStrategy from '../../core/ToolStrategy';

export default class BrightnessContrastTool extends ToolStrategy {
  constructor() {
    super('brightness', 'brightness', 'Яркость/контраст (B)');
  }

  process(ctx, params = {}) {
    const src = ctx.canvas.getMat();
    if (!src) return;

    const alpha = params.contrast != null ? Number(params.contrast) : 1.0;
    const beta = params.brightness != null ? Number(params.brightness) : 0;
    const dst = new cv.Mat();
    src.convertTo(dst, -1, alpha, beta);
    ctx.canvas.setMat(dst);
  }
}
