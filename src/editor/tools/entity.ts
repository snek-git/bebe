import { pushUndo } from '../state';
import type { EditorState, ToolHandler, ToolMode } from '../types';

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

export function makeEntityTool(kind: string): ToolHandler {
  return {
    onMouseDown(state, tx, ty, button) {
      if (button !== 0) return;
      pushUndo(state);

      const room = findRoomAt(state, tx, ty);

      switch (kind) {
        case 'door':
          state.doors.push({ tx, ty, orientation: 'v', initial: 'closed' });
          state.selection = { kind: 'door', index: state.doors.length - 1 };
          break;
        case 'container':
          state.containers.push({ tx, ty, room: room || 'unknown' });
          state.selection = { kind: 'container', index: state.containers.length - 1 };
          break;
        case 'tv':
          state.tvs.push({ tx, ty, room: room || 'unknown' });
          state.selection = { kind: 'tv', index: state.tvs.length - 1 };
          break;
        case 'key': {
          const rel = tileToRoomRelative(state, room, tx, ty);
          state.keys.push({ room: room || 'unknown', dx: rel.dx, dy: rel.dy, type: 'keyA' });
          state.selection = { kind: 'key', index: state.keys.length - 1 };
          break;
        }
        case 'tool_pickup': {
          const rel = tileToRoomRelative(state, room, tx, ty);
          state.tools.push({ room: room || 'unknown', dx: rel.dx, dy: rel.dy, type: 'ipad' });
          state.selection = { kind: 'tool_pickup', index: state.tools.length - 1 };
          break;
        }
        case 'loot': {
          const rel = tileToRoomRelative(state, room, tx, ty);
          state.loots.push({ room: room || 'unknown', dx: rel.dx, dy: rel.dy, type: 'diamond' });
          state.selection = { kind: 'loot', index: state.loots.length - 1 };
          break;
        }
      }
    },

    onMouseMove() {},
    onMouseUp() {},
    renderOverlay() {},
  };
}
