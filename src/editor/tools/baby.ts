import { T } from '../../config';
import { pushUndo } from '../state';
import type { EditorState, ToolHandler } from '../types';

function findRoomAt(state: EditorState, tx: number, ty: number): string {
  for (const r of state.rooms) {
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return r.id;
  }
  return '';
}

function tileToRoomRelative(state: EditorState, room: string, tx: number, ty: number): { dx: number; dy: number } {
  const r = state.rooms.find(rm => rm.id === room);
  if (!r) return { dx: 0, dy: 0 };
  return {
    dx: tx - (r.x + r.w / 2),
    dy: ty - (r.y + r.h / 2),
  };
}

export const babyTool: ToolHandler = {
  onMouseDown(state, tx, ty, button) {
    if (button !== 0) return;

    // If in waypoint mode, add waypoint to selected baby
    if (state.babyWaypointMode && state.selection?.kind === 'baby') {
      const b = state.babies[state.selection.index];
      if (b) {
        pushUndo(state);
        const rel = tileToRoomRelative(state, b.room, tx, ty);
        b.waypoints.push({ dx: rel.dx, dy: rel.dy });
      }
      return;
    }

    // Place new baby
    const room = findRoomAt(state, tx, ty);
    if (!room) return;

    pushUndo(state);
    const rel = tileToRoomRelative(state, room, tx, ty);
    state.babies.push({
      room,
      dx: rel.dx,
      dy: rel.dy,
      type: 'crawler',
      speed: 45,
      facing: 0,
      pauseTime: 2.0,
      waypoints: [],
    });
    state.selection = { kind: 'baby', index: state.babies.length - 1 };
    state.babyWaypointMode = true;
  },

  onMouseMove() {},
  onMouseUp() {},

  onKeyDown(state, key) {
    if (key === 'Enter' || key === 'Escape') {
      state.babyWaypointMode = false;
    }
  },

  renderOverlay(ctx, state, tileSize) {
    if (!state.babyWaypointMode || state.selection?.kind !== 'baby') return;
    const b = state.babies[state.selection.index];
    if (!b) return;
    const r = state.rooms.find(rm => rm.id === b.room);
    if (!r) return;

    // Draw line from last waypoint (or spawn) to cursor
    const lastWp = b.waypoints.length > 0
      ? b.waypoints[b.waypoints.length - 1]
      : { dx: b.dx, dy: b.dy };

    const fromX = (r.x + r.w / 2 + lastWp.dx) * tileSize;
    const fromY = (r.y + r.h / 2 + lastWp.dy) * tileSize;
    const toX = state.cursorTx * tileSize + tileSize / 2;
    const toY = state.cursorTy * tileSize + tileSize / 2;

    ctx.strokeStyle = 'rgba(74,158,255,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};
