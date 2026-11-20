import RasterCanvasFactory from '../../editor/raster/RasterCanvasFactory';
import RasterEditor from '../../editor/raster/RasterEditor';
import SvgCanvasFactory from '../../editor/svg/SvgCanvasFactory';
import SvgEditor from '../../editor/svg/SvgEditor';
import ThreeDCanvasFactory from '../../editor/threed/ThreeDCanvasFactory';
import ThreeDEditor from '../../editor/threed/ThreeDEditor';

const EDITOR_REGISTRY = {
  raster: { factory: RasterCanvasFactory, Component: RasterEditor },
  svg: { factory: SvgCanvasFactory, Component: SvgEditor },
  '3d': { factory: ThreeDCanvasFactory, Component: ThreeDEditor },
};

export function getEditorConfig(workType) {
  return EDITOR_REGISTRY[workType] || EDITOR_REGISTRY.raster;
}
