/**
 * Abstract factory for creating canvas and toolbar for a specific editor type.
 * Required methods: getCanvas(), getToolBar()
 */
export default class AbstractCanvasFactory {
  getCanvas() {
    throw new Error('getCanvas() must be implemented');
  }

  getToolBar() {
    throw new Error('getToolBar() must be implemented');
  }
}
