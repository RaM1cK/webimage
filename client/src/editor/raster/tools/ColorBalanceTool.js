import cv from '@techstark/opencv-js';
import ToolStrategy from '../../core/ToolStrategy';
import { ensureRgba, safeDelete } from './opencvUtils';

export default class ColorBalanceTool extends ToolStrategy {
  constructor() {
    super('color', 'brightness', 'Цвет');
  }

  process(ctx, params = {}) {
    const src = ensureRgba(ctx.canvas.getMat());
    if (!src) return;

    const rScale = Number(params.r ?? 1);
    const gScale = Number(params.g ?? 1);
    const bScale = Number(params.b ?? 1);

    const channels = new cv.MatVector();
    cv.split(src, channels);

    const r = channels.get(0);
    const g = channels.get(1);
    const b = channels.get(2);
    const a = channels.get(3);
    const rOut = new cv.Mat();
    const gOut = new cv.Mat();
    const bOut = new cv.Mat();
    const dst = new cv.Mat();

    try {
      r.convertTo(rOut, -1, rScale, 0);
      g.convertTo(gOut, -1, gScale, 0);
      b.convertTo(bOut, -1, bScale, 0);
      channels.set(0, rOut);
      channels.set(1, gOut);
      channels.set(2, bOut);
      cv.merge(channels, dst);
      ctx.canvas.setMat(dst);
    } finally {
      safeDelete(r, g, b, a, rOut, gOut, bOut, src);
      try { channels.delete(); } catch (e) { console.warn('Failed to delete cv.MatVector:', e); }
    }
  }
}
