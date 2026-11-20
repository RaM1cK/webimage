import BlurTool from './BlurTool';
import BrightnessContrastTool from './BrightnessContrastTool';
import ColorBalanceTool from './ColorBalanceTool';
import CropTool from './CropTool';
import FlipTool from './FlipTool';
import NoiseTool from './NoiseTool';
import ResizeTool from './ResizeTool';
import RotateTool from './RotateTool';

export {
  BlurTool,
  BrightnessContrastTool,
  ColorBalanceTool,
  CropTool,
  FlipTool,
  NoiseTool,
  ResizeTool,
  RotateTool,
};

export function createRasterTools() {
  return [
    new ResizeTool(),
    new CropTool(),
    new FlipTool('h'),
    new FlipTool('v'),
    new RotateTool(),
    new BrightnessContrastTool(),
    new ColorBalanceTool(),
    new NoiseTool(),
    new BlurTool(),
  ];
}
