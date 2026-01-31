import { T, COLS, ROWS } from '../config';
import { buildGrid } from './grid';
import type { EditorState } from './types';

export function renderEditor(ctx: CanvasRenderingContext2D, state: EditorState): void {
  const { camera } = state;

  ctx.save();
  ctx.setTransform(camera.zoom, 0, 0, camera.zoom, -camera.x * camera.zoom, -camera.y * camera.zoom);

  // Background
  ctx.fillStyle = '#3a3a5c';
  ctx.fillRect(0, 0, COLS * T, ROWS * T);

  // Grid
  const grid = buildGrid(state);
  renderTiles(ctx, grid);
  renderGridLines(ctx);
  renderRoomOverlays(ctx, state);
  renderCorridorOverlays(ctx, state);
  renderDoors(ctx, state);
  renderContainers(ctx, state);
  renderTVs(ctx, state);
  renderBabies(ctx, state);
  renderKeys(ctx, state);
  renderToolPickups(ctx, state);
  renderLoots(ctx, state);
  renderSelection(ctx, state);

  ctx.restore();
}

function renderTiles(ctx: CanvasRenderingContext2D, grid: number[][]): void {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * T, py = y * T;
      const v = grid[y][x];
      if (v === 1) {
        ctx.fillStyle = '#3a3a5c'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#4e4e70'; ctx.fillRect(px, py, T, 1); ctx.fillRect(px, py, 1, T);
        ctx.fillStyle = '#28283e'; ctx.fillRect(px, py + T - 1, T, 1); ctx.fillRect(px + T - 1, py, 1, T);
      } else if (v === 2) {
        ctx.fillStyle = '#2a1f14'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#3d2e1c'; ctx.fillRect(px + 1, py + 1, T - 2, T - 2);
        ctx.fillStyle = '#4a3828'; ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
      } else {
        ctx.fillStyle = '#1e1e2e'; ctx.fillRect(px, py, T, T);
      }
    }
  }
}

function renderGridLines(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * T, 0); ctx.lineTo(x * T, ROWS * T); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * T); ctx.lineTo(COLS * T, y * T); ctx.stroke();
  }
}

function renderRoomOverlays(ctx: CanvasRenderingContext2D, state: EditorState): void {
  ctx.setLineDash([4, 4]);
  for (let i = 0; i < state.rooms.length; i++) {
    const r = state.rooms[i];
    const sel = state.selection?.kind === 'room' && state.selection.index === i;
    ctx.strokeStyle = sel ? '#4a9eff' : 'rgba(74,222,128,0.3)';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(r.x * T, r.y * T, r.w * T, r.h * T);
    // Room name label
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(r.name || r.id, (r.x + r.w / 2) * T, r.y * T - 12);
  }
  ctx.setLineDash([]);
}

function renderCorridorOverlays(ctx: CanvasRenderingContext2D, state: EditorState): void {
  ctx.setLineDash([2, 3]);
  for (let i = 0; i < state.corridors.length; i++) {
    const c = state.corridors[i];
    const sel = state.selection?.kind === 'corridor' && state.selection.index === i;
    ctx.strokeStyle = sel ? '#4a9eff' : 'rgba(251,191,36,0.25)';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(c.x * T, c.y * T, c.w * T, c.h * T);
  }
  ctx.setLineDash([]);
}

function renderDoors(ctx: CanvasRenderingContext2D, state: EditorState): void {
  for (let i = 0; i < state.doors.length; i++) {
    const d = state.doors[i];
    const px = d.tx * T, py = d.ty * T;
    const sel = state.selection?.kind === 'door' && state.selection.index === i;
    if (d.initial === 'locked') {
      ctx.fillStyle = sel ? '#6366f1' : '#4a4a6a';
    } else {
      ctx.fillStyle = sel ? '#d97706' : '#8B4513';
    }
    ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
    ctx.strokeStyle = sel ? '#4a9eff' : '#654321';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(px + 2, py + 2, T - 4, T - 4);
    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = d.initial === 'locked' ? (d.requiredKey || 'X') : 'D';
    ctx.fillText(label, px + T / 2, py + T / 2);
  }
}

function renderContainers(ctx: CanvasRenderingContext2D, state: EditorState): void {
  for (let i = 0; i < state.containers.length; i++) {
    const c = state.containers[i];
    const px = c.tx * T, py = c.ty * T;
    const sel = state.selection?.kind === 'container' && state.selection.index === i;
    ctx.fillStyle = sel ? '#a78bfa' : '#7c3aed';
    ctx.fillRect(px + 4, py + 4, T - 8, T - 8);
    ctx.fillStyle = '#fff';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.fixed ? 'F' : 'C', px + T / 2, py + T / 2);
  }
}

function renderTVs(ctx: CanvasRenderingContext2D, state: EditorState): void {
  for (let i = 0; i < state.tvs.length; i++) {
    const tv = state.tvs[i];
    const px = tv.tx * T, py = tv.ty * T;
    const sel = state.selection?.kind === 'tv' && state.selection.index === i;
    ctx.fillStyle = sel ? '#60a5fa' : '#3b82f6';
    ctx.fillRect(px + 3, py + 6, T - 6, T - 12);
    ctx.fillStyle = '#bfdbfe';
    ctx.fillRect(px + 5, py + 8, T - 10, T - 16);
  }
}

// Room-relative position to absolute pixel
function roomAbsPixel(state: EditorState, room: string, dx: number, dy: number): { px: number; py: number } {
  const r = state.rooms.find(rm => rm.id === room);
  if (!r) return { px: 0, py: 0 };
  return {
    px: (r.x + r.w / 2 + dx) * T,
    py: (r.y + r.h / 2 + dy) * T,
  };
}

function renderBabies(ctx: CanvasRenderingContext2D, state: EditorState): void {
  for (let i = 0; i < state.babies.length; i++) {
    const b = state.babies[i];
    const { px, py } = roomAbsPixel(state, b.room, b.dx, b.dy);
    const sel = state.selection?.kind === 'baby' && state.selection.index === i;

    // Waypoint lines
    if (b.waypoints.length > 0) {
      ctx.strokeStyle = sel ? 'rgba(74,158,255,0.5)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const first = roomAbsPixel(state, b.room, b.waypoints[0].dx, b.waypoints[0].dy);
      ctx.moveTo(first.px, first.py);
      for (let j = 1; j < b.waypoints.length; j++) {
        const wp = roomAbsPixel(state, b.room, b.waypoints[j].dx, b.waypoints[j].dy);
        ctx.lineTo(wp.px, wp.py);
      }
      // Loop back to first
      ctx.lineTo(first.px, first.py);
      ctx.stroke();

      // Waypoint dots
      for (const wp of b.waypoints) {
        const wpp = roomAbsPixel(state, b.room, wp.dx, wp.dy);
        ctx.fillStyle = sel ? '#4a9eff' : 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(wpp.px, wpp.py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Baby circle
    const colors: Record<string, string> = { crawler: '#f59e0b', stawler: '#ec4899', boss: '#ef4444' };
    ctx.fillStyle = sel ? '#4a9eff' : (colors[b.type] || '#f59e0b');
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.type[0].toUpperCase(), px, py);
  }
}

function renderKeys(ctx: CanvasRenderingContext2D, state: EditorState): void {
  const keyColors: Record<string, string> = { keyA: '#ef4444', keyB: '#3b82f6', keyC: '#22c55e' };
  for (let i = 0; i < state.keys.length; i++) {
    const k = state.keys[i];
    const { px, py } = roomAbsPixel(state, k.room, k.dx, k.dy);
    const sel = state.selection?.kind === 'key' && state.selection.index === i;
    ctx.fillStyle = sel ? '#4a9eff' : (keyColors[k.type] || '#facc15');
    ctx.fillRect(px - 6, py - 4, 12, 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(k.type.replace('key', ''), px, py);
  }
}

function renderToolPickups(ctx: CanvasRenderingContext2D, state: EditorState): void {
  const toolColors: Record<string, string> = { ipad: '#a1a1aa', remote: '#71717a', pacifier: '#f59e0b' };
  for (let i = 0; i < state.tools.length; i++) {
    const t = state.tools[i];
    const { px, py } = roomAbsPixel(state, t.room, t.dx, t.dy);
    const sel = state.selection?.kind === 'tool_pickup' && state.selection.index === i;
    ctx.fillStyle = sel ? '#4a9eff' : (toolColors[t.type] || '#9ca3af');
    ctx.beginPath();
    ctx.moveTo(px, py - 7);
    ctx.lineTo(px + 7, py + 4);
    ctx.lineTo(px - 7, py + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.type[0].toUpperCase(), px, py);
  }
}

function renderLoots(ctx: CanvasRenderingContext2D, state: EditorState): void {
  for (let i = 0; i < state.loots.length; i++) {
    const l = state.loots[i];
    const { px, py } = roomAbsPixel(state, l.room, l.dx, l.dy);
    const sel = state.selection?.kind === 'loot' && state.selection.index === i;
    ctx.fillStyle = sel ? '#4a9eff' : '#60a5fa';
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(px, py - 8);
    ctx.lineTo(px + 6, py);
    ctx.lineTo(px, py + 8);
    ctx.lineTo(px - 6, py);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', px, py);
  }
}

function renderSelection(ctx: CanvasRenderingContext2D, state: EditorState): void {
  if (!state.selection) return;
  const { kind, index } = state.selection;

  // For rooms and corridors, draw a thicker highlight
  if (kind === 'room' && state.rooms[index]) {
    const r = state.rooms[index];
    ctx.strokeStyle = 'rgba(74,158,255,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(r.x * T - 1, r.y * T - 1, r.w * T + 2, r.h * T + 2);
  } else if (kind === 'corridor' && state.corridors[index]) {
    const c = state.corridors[index];
    ctx.strokeStyle = 'rgba(74,158,255,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x * T - 1, c.y * T - 1, c.w * T + 2, c.h * T + 2);
  }
}

export function renderCursorHighlight(ctx: CanvasRenderingContext2D, state: EditorState): void {
  const { camera, cursorTx, cursorTy } = state;
  ctx.save();
  ctx.setTransform(camera.zoom, 0, 0, camera.zoom, -camera.x * camera.zoom, -camera.y * camera.zoom);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cursorTx * T, cursorTy * T, T, T);
  ctx.restore();
}

export function renderDragPreview(ctx: CanvasRenderingContext2D, state: EditorState): void {
  if (!state.dragState || state.dragState.type !== 'create_rect') return;
  const d = state.dragState;
  const x1 = Math.min(d.startTx, d.currentTx);
  const y1 = Math.min(d.startTy, d.currentTy);
  const x2 = Math.max(d.startTx, d.currentTx) + 1;
  const y2 = Math.max(d.startTy, d.currentTy) + 1;

  ctx.save();
  const { camera } = state;
  ctx.setTransform(camera.zoom, 0, 0, camera.zoom, -camera.x * camera.zoom, -camera.y * camera.zoom);
  ctx.fillStyle = 'rgba(74,158,255,0.15)';
  ctx.fillRect(x1 * T, y1 * T, (x2 - x1) * T, (y2 - y1) * T);
  ctx.strokeStyle = '#4a9eff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x1 * T, y1 * T, (x2 - x1) * T, (y2 - y1) * T);
  // Size label
  ctx.fillStyle = '#4a9eff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${x2 - x1}x${y2 - y1}`, ((x1 + x2) / 2) * T, y1 * T - 4);
  ctx.restore();
}
