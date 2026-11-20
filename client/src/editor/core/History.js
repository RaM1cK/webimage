export default class History {
  constructor(limit = 10) {
    this.limit = limit;
    this.stack = [];
    this.redoStack = [];
    this.lastPushAt = 0;
  }

  reset(initialState = null) {
    this.stack = initialState != null ? [initialState] : [];
    this.redoStack = [];
    this.lastPushAt = 0;
  }

  push(state, { coalesceMs = 0 } = {}) {
    if (state == null) return;
    const last = this.stack[this.stack.length - 1];
    const now = Date.now();
    if (last === state) {
      this.redoStack = [];
      return;
    }
    if (coalesceMs > 0 && this.stack.length && (now - this.lastPushAt) < coalesceMs) {
      this.stack[this.stack.length - 1] = state;
    } else {
      this.stack.push(state);
      if (this.stack.length > this.limit) this.stack.shift();
    }
    this.lastPushAt = now;
    this.redoStack = [];
  }

  canUndo() {
    return this.stack.length > 1;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return null;
    const current = this.stack.pop();
    this.redoStack.push(current);
    return this.stack[this.stack.length - 1];
  }

  redo() {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop();
    this.stack.push(next);
    return next;
  }
}

