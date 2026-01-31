import { pushUndo } from '../state';
import type { EditorState, ToolHandler } from '../types';

function findRoomAt(state: EditorState, tx: number, ty: number): number {
  for (let i = 0; i < state.rooms.length; i++) {
    const r = state.rooms[i];
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return i;
  }
  return -1;
}

export const furnitureTool: ToolHandler = {
  onMouseDown(state, tx, ty, button) {
    if (button !== 0) return;
    if (findRoomAt(state, tx, ty) === -1) return;
    state.dragState = { type: 'create_rect', startTx: tx, startTy: ty, currentTx: tx, currentTy: ty };
  },

  onMouseMove(state, tx, ty) {
    if (state.dragState?.type === 'create_rect') {
      state.dragState.currentTx = tx;
      state.dragState.currentTy = ty;
    }
  },

  onMouseUp(state) {
    if (state.dragState?.type !== 'create_rect') return;
    const d = state.dragState;
    const x = Math.min(d.startTx, d.currentTx);
    const y = Math.min(d.startTy, d.currentTy);
    const w = Math.abs(d.currentTx - d.startTx) + 1;
    const h = Math.abs(d.currentTy - d.startTy) + 1;

    const ri = findRoomAt(state, x, y);
    if (ri !== -1) {
      const r = state.rooms[ri];
      pushUndo(state);
      r.furn.push({
        fx: x - r.x,
        fy: y - r.y,
        fw: w,
        fh: h,
      });
      state.selection = { kind: 'furniture', index: ri, furnIndex: r.furn.length - 1 };
    }
    state.dragState = null;
  },

  renderOverlay() {},
};
