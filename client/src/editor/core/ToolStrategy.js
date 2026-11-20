/**
 * Base strategy for editor tools.
 * Required method: process(smth) - performs an action on canvas or object.
 */
export default class ToolStrategy {
  constructor(name, icon, tooltip) {
    this.name = name;
    this.icon = icon;
    this.tooltip = tooltip;
  }

  // eslint-disable-next-line no-unused-vars
  process(context, params) {
    throw new Error('process(context, params) must be implemented');
  }
}
