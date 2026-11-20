/**
 * ToolBar - composition of tools for a specific canvas type.
 */
export default class ToolBar {
  constructor(tools = []) {
    this.tools = tools;
  }

  addTool(tool) {
    this.tools.push(tool);
  }

  getTools() {
    return this.tools;
  }

  getTool(name) {
    return this.tools.find(t => t.name === name);
  }
}
