import cv from '@techstark/opencv-js';
import ToolStrategy from '../../core/ToolStrategy';

function toFlipCode(mode) {
  if (mode === 'v' || mode === 'vertical') return 0;
  if (mode === 'b' || mode === 'both') return -1;
  return 1; // horizontal
}

export default class FlipTool extends ToolStrategy {
  constructor(mode = 'h') {
    super(
      mode === 'h' ? 'flipH' : mode === 'v' ? 'flipV' : 'flipB',
      mode === 'h' ? 'flipH' : 'flipV',
      mode === 'h' ? 'Отразить H (H)' : mode === 'v' ? 'Отразить V (V)' : 'Отразить HV'
    );
    this.mode = mode;
  }

  process(ctx, params = {}) {
    const src = ctx.canvas.getMat();
    if (!src) return;

    const mode = params.mode || this.mode;
    const dst = new cv.Mat();
    cv.flip(src, dst, toFlipCode(mode));
    ctx.canvas.setMat(dst);
  }
}
