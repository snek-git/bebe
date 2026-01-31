import { T } from '../../config';
import { pushUndo } from '../state';
import type { EditorState, ToolHandler, Selection, DragState } from '../types';

function hitTest(state: EditorState, tx: number, ty: number): Selection | null {
  // Point entities first (higher priority)
  for (let i = 0; i < state.doors.length; i++) {
    if (state.doors[i].tx === tx && state.doors[i].ty === ty) return { kind: 'door', index: i };
  }
  for (let i = 0; i < state.containers.length; i++) {
    if (state.containers[i].tx === tx && state.containers[i].ty === ty) return { kind: 'container', index: i };
  }
  for (let i = 0; i < state.tvs.length; i++) {
    if (state.tvs[i].tx === tx && state.tvs[i].ty === ty) return { kind: 'tv', index: i };
  }

  // Room-relative entities
  for (let i = 0; i < state.babies.length; i++) {
    const b = state.babies[i];
    const r = state.rooms.find(rm => rm.id === b.room);
    if (!r) continue;
    const bx = Math.round(r.x + r.w / 2 + b.dx);
    const by = Math.round(r.y + r.h / 2 + b.dy);
    if (bx === tx && by === ty) return { kind: 'baby', index: i };
  }
  for (let i = 0; i < state.keys.length; i++) {
    const k = state.keys[i];
    const r = state.rooms.find(rm => rm.id === k.room);
    if (!r) continue;
    if (Math.round(r.x + r.w / 2 + k.dx) === tx && Math.round(r.y + r.h / 2 + k.dy) === ty)
      return { kind: 'key', index: i };
  }
  for (let i = 0; i < state.tools.length; i++) {
    const t = state.tools[i];
    const r = state.rooms.find(rm => rm.id === t.room);
    if (!r) continue;
    if (Math.round(r.x + r.w / 2 + t.dx) === tx && Math.round(r.y + r.h / 2 + t.dy) === ty)
      return { kind: 'tool_pickup', index: i };
  }
  for (let i = 0; i < state.loots.length; i++) {
    const l = state.loots[i];
    const r = state.rooms.find(rm => rm.id === l.room);
    if (!r) continue;
    if (Math.round(r.x + r.w / 2 + l.dx) === tx && Math.round(r.y + r.h / 2 + l.dy) === ty)
      return { kind: 'loot', index: i };
  }

  // Rooms
  for (let i = 0; i < state.rooms.length; i++) {
    const r = state.rooms[i];
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) {
      for (let fi = 0; fi < r.furn.length; fi++) {
        const f = r.furn[fi];
        if (tx >= r.x + f.fx && tx < r.x + f.fx + f.fw &&
            ty >= r.y + f.fy && ty < r.y + f.fy + f.fh) {
          return { kind: 'furniture', index: i, furnIndex: fi };
        }
      }
      return { kind: 'room', index: i };
    }
  }

  // Corridors
  for (let i = 0; i < state.corridors.length; i++) {
    const c = state.corridors[i];
    if (tx >= c.x && tx < c.x + c.w && ty >= c.y && ty < c.y + c.h) {
      return { kind: 'corridor', index: i };
    }
  }

  return null;
}

// Detect if click is on the edge of a rect, returns the edge or null
function detectEdge(tx: number, ty: number, rx: number, ry: number, rw: number, rh: number): 'n' | 's' | 'e' | 'w' | null {
  const onN = ty === ry;
  const onS = ty === ry + rh - 1;
  const onW = tx === rx;
  const onE = tx === rx + rw - 1;

  // Corners: prefer vertical edges (more intuitive for width changes)
  if (onN && !onE && !onW) return 'n';
  if (onS && !onE && !onW) return 's';
  if (onW) return 'w';
  if (onE) return 'e';
  return null;
}

let undoPushed = false;

export const selectTool: ToolHandler = {
  onMouseDown(state, tx, ty, button) {
    if (button !== 0) return;
    undoPushed = false;

    const hit = hitTest(state, tx, ty);

    // If clicking on an already-selected room/corridor, check for edge resize
    if (hit && state.selection && hit.kind === state.selection.kind && hit.index === state.selection.index) {
      if (hit.kind === 'room') {
        const r = state.rooms[hit.index];
        const edge = detectEdge(tx, ty, r.x, r.y, r.w, r.h);
        if (edge) {
          state.dragState = {
            type: 'resize',
            entityKind: 'room',
            index: hit.index,
            edge,
            startVal: edge === 'n' ? r.y : edge === 's' ? r.y + r.h : edge === 'w' ? r.x : r.x + r.w,
          };
          return;
        }
      } else if (hit.kind === 'corridor') {
        const c = state.corridors[hit.index];
        const edge = detectEdge(tx, ty, c.x, c.y, c.w, c.h);
        if (edge) {
          state.dragState = {
            type: 'resize',
            entityKind: 'corridor',
            index: hit.index,
            edge,
            startVal: edge === 'n' ? c.y : edge === 's' ? c.y + c.h : edge === 'w' ? c.x : c.x + c.w,
          };
          return;
        }
      }
    }

    state.selection = hit;
    if (hit) {
      state.dragState = {
        type: 'move',
        entityKind: hit.kind,
        index: hit.index,
        offsetTx: tx,
        offsetTy: ty,
      };
    }
  },

  onMouseMove(state, tx, ty) {
    // Resize drag
    if (state.dragState?.type === 'resize') {
      const d = state.dragState;
      if (!undoPushed) { pushUndo(state); undoPushed = true; }

      if (d.entityKind === 'room' && state.rooms[d.index]) {
        const r = state.rooms[d.index];
        applyResize(r, d.edge as 'n' | 's' | 'e' | 'w', tx, ty);
      } else if (d.entityKind === 'corridor' && state.corridors[d.index]) {
        const c = state.corridors[d.index];
        applyResize(c, d.edge as 'n' | 's' | 'e' | 'w', tx, ty);
      }
      return;
    }

    // Move drag
    if (state.dragState?.type === 'move') {
      const d = state.dragState;
      const ddx = tx - d.offsetTx;
      const ddy = ty - d.offsetTy;
      if (ddx === 0 && ddy === 0) return;
      if (!undoPushed) { pushUndo(state); undoPushed = true; }

      if (d.entityKind === 'room' && state.rooms[d.index]) {
        state.rooms[d.index].x += ddx;
        state.rooms[d.index].y += ddy;
      } else if (d.entityKind === 'corridor' && state.corridors[d.index]) {
        state.corridors[d.index].x += ddx;
        state.corridors[d.index].y += ddy;
      } else if (d.entityKind === 'door' && state.doors[d.index]) {
        state.doors[d.index].tx += ddx;
        state.doors[d.index].ty += ddy;
      } else if (d.entityKind === 'container' && state.containers[d.index]) {
        state.containers[d.index].tx += ddx;
        state.containers[d.index].ty += ddy;
      } else if (d.entityKind === 'tv' && state.tvs[d.index]) {
        state.tvs[d.index].tx += ddx;
        state.tvs[d.index].ty += ddy;
      } else if (d.entityKind === 'baby' && state.babies[d.index]) {
        state.babies[d.index].dx += ddx;
        state.babies[d.index].dy += ddy;
      } else if (d.entityKind === 'key' && state.keys[d.index]) {
        state.keys[d.index].dx += ddx;
        state.keys[d.index].dy += ddy;
      } else if (d.entityKind === 'tool_pickup' && state.tools[d.index]) {
        state.tools[d.index].dx += ddx;
        state.tools[d.index].dy += ddy;
      } else if (d.entityKind === 'loot' && state.loots[d.index]) {
        state.loots[d.index].dx += ddx;
        state.loots[d.index].dy += ddy;
      } else if (d.entityKind === 'furniture') {
        const r = state.rooms[d.index];
        if (r && r.furn[state.selection?.furnIndex ?? -1]) {
          const f = r.furn[state.selection!.furnIndex!];
          f.fx += ddx;
          f.fy += ddy;
        }
      }

      d.offsetTx = tx;
      d.offsetTy = ty;
    }
  },

  onMouseUp(state) {
    state.dragState = null;
    undoPushed = false;
  },

  onKeyDown(state, key) {
    if (key === 'Delete' || key === 'Backspace') {
      if (!state.selection) return;
      pushUndo(state);
      const { kind, index, furnIndex } = state.selection;
      if (kind === 'room') state.rooms.splice(index, 1);
      else if (kind === 'corridor') state.corridors.splice(index, 1);
      else if (kind === 'furniture' && state.rooms[index]) state.rooms[index].furn.splice(furnIndex!, 1);
      else if (kind === 'door') state.doors.splice(index, 1);
      else if (kind === 'container') state.containers.splice(index, 1);
      else if (kind === 'tv') state.tvs.splice(index, 1);
      else if (kind === 'baby') state.babies.splice(index, 1);
      else if (kind === 'key') state.keys.splice(index, 1);
      else if (kind === 'tool_pickup') state.tools.splice(index, 1);
      else if (kind === 'loot') state.loots.splice(index, 1);
      state.selection = null;
    }
  },

  renderOverlay(ctx, state, tileSize) {
    // Show resize handles on selected room/corridor edges
    if (!state.selection) return;
    const { kind, index } = state.selection;
    let rx = 0, ry = 0, rw = 0, rh = 0;

    if (kind === 'room' && state.rooms[index]) {
      const r = state.rooms[index];
      rx = r.x; ry = r.y; rw = r.w; rh = r.h;
    } else if (kind === 'corridor' && state.corridors[index]) {
      const c = state.corridors[index];
      rx = c.x; ry = c.y; rw = c.w; rh = c.h;
    } else return;

    // Draw small handle squares on midpoints of each edge
    ctx.fillStyle = '#4a9eff';
    const sz = 6;
    const midX = (rx + rw / 2) * tileSize;
    const midY = (ry + rh / 2) * tileSize;
    // North
    ctx.fillRect(midX - sz / 2, ry * tileSize - sz / 2, sz, sz);
    // South
    ctx.fillRect(midX - sz / 2, (ry + rh) * tileSize - sz / 2, sz, sz);
    // West
    ctx.fillRect(rx * tileSize - sz / 2, midY - sz / 2, sz, sz);
    // East
    ctx.fillRect((rx + rw) * tileSize - sz / 2, midY - sz / 2, sz, sz);
  },
};

function applyResize(rect: { x: number; y: number; w: number; h: number }, edge: 'n' | 's' | 'e' | 'w', tx: number, ty: number): void {
  switch (edge) {
    case 'n': {
      const newY = ty;
      const bottom = rect.y + rect.h;
      if (newY < bottom) {
        rect.y = newY;
        rect.h = bottom - newY;
      }
      break;
    }
    case 's': {
      const newH = ty - rect.y + 1;
      if (newH >= 1) rect.h = newH;
      break;
    }
    case 'w': {
      const newX = tx;
      const right = rect.x + rect.w;
      if (newX < right) {
        rect.x = newX;
        rect.w = right - newX;
      }
      break;
    }
    case 'e': {
      const newW = tx - rect.x + 1;
      if (newW >= 1) rect.w = newW;
      break;
    }
  }
}
