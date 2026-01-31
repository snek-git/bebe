import { pushUndo } from '../state';
import type { EditorState, ToolHandler } from '../types';

let painting = false;
let erasing = false;
let undoPushed = false;

function hasWallAt(state: EditorState, tx: number, ty: number): boolean {
  return state.walls.some(w => w.tx === tx && w.ty === ty);
}

function addWall(state: EditorState, tx: number, ty: number): void {
  if (!hasWallAt(state, tx, ty)) {
    state.walls.push({ tx, ty });
  }
}

function removeWall(state: EditorState, tx: number, ty: number): void {
  state.walls = state.walls.filter(w => !(w.tx === tx && w.ty === ty));
}

export const wallTool: ToolHandler = {
  onMouseDown(state, tx, ty, button) {
    undoPushed = false;
    if (button === 0) {
      painting = true;
      erasing = false;
      if (!undoPushed) { pushUndo(state); undoPushed = true; }
      addWall(state, tx, ty);
    } else if (button === 2) {
      erasing = true;
      painting = false;
      if (!undoPushed) { pushUndo(state); undoPushed = true; }
      removeWall(state, tx, ty);
    }
  },

  onMouseMove(state, tx, ty) {
    if (painting) addWall(state, tx, ty);
    if (erasing) removeWall(state, tx, ty);
  },

  onMouseUp() {
    painting = false;
    erasing = false;
    undoPushed = false;
  },

  renderOverlay() {},
};
