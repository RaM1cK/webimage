import AbstractCanvasFactory from '../core/AbstractCanvasFactory';
import ToolBar from '../core/ToolBar';
import ToolStrategy from '../core/ToolStrategy';
import SvgCanvas from './SvgCanvas';

class SimpleTool extends ToolStrategy {
  process(ctx, params) { if (ctx && ctx.onTool) ctx.onTool(this.name, params); }
}

export default class SvgCanvasFactory extends AbstractCanvasFactory {
  getCanvas() { return new SvgCanvas(); }
  getToolBar() {
    return new ToolBar([
      new SimpleTool('select', 'select', 'Выбор (V)'),
      new SimpleTool('rect', 'rect', 'Прямоугольник (R)'),
      new SimpleTool('ellipse', 'ellipse', 'Эллипс (E)'),
      new SimpleTool('line', 'line', 'Линия (L)'),
      new SimpleTool('polyline', 'polyline', 'Ломаная (O)'),
      new SimpleTool('polygon', 'polygon', 'Многоугольник (P)'),
      new SimpleTool('star', 'star', 'Звезда (S)'),
      new SimpleTool('text', 'text', 'Текст (T)'),
    ]);
  }
}
