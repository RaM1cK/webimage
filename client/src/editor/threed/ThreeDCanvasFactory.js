import AbstractCanvasFactory from '../core/AbstractCanvasFactory';
import ToolBar from '../core/ToolBar';
import ToolStrategy from '../core/ToolStrategy';
import ThreeDCanvas from './ThreeDCanvas';

class SimpleTool extends ToolStrategy {
  process(ctx, params) { if (ctx && ctx.onTool) ctx.onTool(this.name, params); }
}

export default class ThreeDCanvasFactory extends AbstractCanvasFactory {
  getCanvas() { return new ThreeDCanvas(); }
  getToolBar() {
    return new ToolBar([
      new SimpleTool('select', 'select', 'Выбор (V)'),
      new SimpleTool('move', 'move', 'Перемещение (G/W, стрелки+мышь)'),
      new SimpleTool('rotate', 'rotate', 'Поворот (R/E, стрелки+мышь)'),
      new SimpleTool('scale', 'scale', 'Масштаб (S, стрелки+мышь)'),
      new SimpleTool('cube', 'cube', 'Куб'),
      new SimpleTool('sphere', 'sphere', 'Сфера'),
      new SimpleTool('cylinder', 'cylinder', 'Цилиндр'),
      new SimpleTool('cone', 'cone', 'Конус'),
      new SimpleTool('torus', 'torus', 'Тор'),
    ]);
  }
}
