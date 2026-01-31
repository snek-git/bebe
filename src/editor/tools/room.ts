import { pushUndo } from '../state';
import type { EditorState, ToolHandler } from '../types';

let roomCounter = 0;

export const roomTool: ToolHandler = {
  onMouseDown(state, tx, ty, button) {
    if (button !== 0) return;
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

    if (w >= 2 && h >= 2) {
      pushUndo(state);
      roomCounter++;
      const id = `room_${roomCounter}`;
      state.rooms.push({
        id,
        name: id.toUpperCase(),
        x, y, w, h,
        furn: [],
      });
      state.selection = { kind: 'room', index: state.rooms.length - 1 };
    }
    state.dragState = null;
  },

  renderOverlay() {},
};
