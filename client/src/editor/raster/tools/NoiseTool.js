import cv from '@techstark/opencv-js';
import ToolStrategy from '../../core/ToolStrategy';
import { ensureRgba, safeDelete } from './opencvUtils';

function applySaltAndPepper(mat, amount) {
  const data = mat.data;
  const channels = mat.channels();
  for (let i = 0; i < data.length; i += channels) {
    const rnd = Math.random();
    if (rnd < amount / 2) {
      data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
    } else if (rnd < amount) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
    }
  }
}

export default class NoiseTool extends ToolStrategy {
  constructor() {
    super('noise', 'noise', 'Шум');
  }

  process(ctx, params = {}) {
    const src = ensureRgba(ctx.canvas.getMat());
    if (!src) return;

    const type = params.type || 'gaussian';
    const dst = src.clone();

    try {
      if (type === 'gaussian') {
        const noise = new cv.Mat(src.rows, src.cols, src.type());
        const mean = Number(params.mean ?? 0);
        const stddev = Number(params.stddev ?? 20);
        cv.randn(noise, mean, stddev);
        cv.add(dst, noise, dst);
        safeDelete(noise);
      } else {
        applySaltAndPepper(dst, Number(params.amount ?? 0.02));
      }
      ctx.canvas.setMat(dst);
    } finally {
      safeDelete(src);
    }
  }
}
