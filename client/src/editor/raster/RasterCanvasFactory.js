import AbstractCanvasFactory from '../core/AbstractCanvasFactory';
import ToolBar from '../core/ToolBar';
import RasterCanvas from './RasterCanvas';
import { createRasterTools } from './rasterTools';

export default class RasterCanvasFactory extends AbstractCanvasFactory {
  getCanvas() {
    return new RasterCanvas();
  }

  getToolBar() {
    return new ToolBar(createRasterTools());
  }
}
