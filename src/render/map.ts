import { T, COLS, ROWS, TOTAL_LOOT, ROOM_DEFS, VIEW_W, VIEW_H } from '../config';
import { roomDef } from '../map';
import type { Game } from '../types';

function onScreen(x: number, y: number, m: number, game: Game): boolean {
  return x > game.camera.x - m && x < game.camera.x + VIEW_W + m &&
         y > game.camera.y - m && y < game.camera.y + VIEW_H + m;
}

function sx(x: number, game: Game): number { return x - game.camera.x; }
function sy(y: number, game: Game): number { return y - game.camera.y; }

export function renderMap(ctx: CanvasRenderingContext2D, game: Game): void {
  const cam = game.camera;
  const x1 = Math.max(0, Math.floor(cam.x / T));
  const y1 = Math.max(0, Math.floor(cam.y / T));
  const x2 = Math.min(COLS - 1, Math.ceil((cam.x + VIEW_W) / T));
  const y2 = Math.min(ROWS - 1, Math.ceil((cam.y + VIEW_H) / T));

  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const px = x * T - cam.x;
      const py = y * T - cam.y;
      const v = game.grid[y][x];

      if (v === 1) {
        ctx.fillStyle = '#3a3a5c'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#4e4e70'; ctx.fillRect(px, py, T, 2); ctx.fillRect(px, py, 2, T);
        ctx.fillStyle = '#28283e'; ctx.fillRect(px, py + T - 2, T, 2); ctx.fillRect(px + T - 2, py, 2, T);
      } else if (v === 2) {
        ctx.fillStyle = '#2a1f14'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#3d2e1c'; ctx.fillRect(px + 1, py + 1, T - 2, T - 2);
        ctx.fillStyle = '#4a3828'; ctx.fillRect(px + 3, py + 3, T - 6, T - 6);
      } else {
        ctx.fillStyle = '#1e1e2e'; ctx.fillRect(px, py, T, T);
        ctx.strokeStyle = '#262640'; ctx.lineWidth = 0.5; ctx.strokeRect(px, py, T, T);
      }
    }
  }
}

export function renderDoors(ctx: CanvasRenderingContext2D, game: Game): void {
  for (const d of game.doors) {
    if (!onScreen(d.x, d.y, T, game)) continue;
    const px = sx(d.x, game) - T / 2;
    const py = sy(d.y, game) - T / 2;

    if (d.state === 'open') {
      // Open door: thin outline, walkable appearance
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      if (d.orientation === 'v') {
        ctx.strokeRect(px, py, 4, T);
      } else {
        ctx.strokeRect(px, py, T, 4);
      }
    } else if (d.state === 'closed') {
      // Closed door: solid brown/wood
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
      // Door handle
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(px + T * 0.75, py + T / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      // Slam flash
      if (d.slamTimer > 0) {
        ctx.fillStyle = `rgba(255,200,0,${d.slamTimer})`;
        ctx.fillRect(px - 4, py - 4, T + 8, T + 8);
      }
    } else {
      // Locked door: dark metal with lock icon
      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#6b6b8a';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
      // Lock symbol
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('X', px + T / 2, py + T / 2);
      // Required key label
      if (d.requiredKey) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '7px monospace';
        ctx.fillText(d.requiredKey.replace('key', ''), px + T / 2, py + T - 4);
      }
    }
  }
}

export function renderRoomLabels(ctx: CanvasRenderingContext2D, game: Game): void {
  ctx.font = '8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (const r of ROOM_DEFS) {
    const cx = (r.x + r.w / 2) * T;
    const cy = (r.y + r.h - 0.5) * T;
    if (onScreen(cx, cy, 100, game)) {
      ctx.fillText(r.name, sx(cx, game), sy(cy, game));
    }
  }
}

export function renderExit(ctx: CanvasRenderingContext2D, game: Game): void {
  const er = roomDef('foyer')!;
  const ex = (er.x + Math.floor(er.w / 2)) * T;
  const ey = (ROWS - 1) * T;
  if (!onScreen(ex + T / 2, ey + T / 2, T, game)) return;

  const allLoot = game.player.loot >= TOTAL_LOOT;
  const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;

  ctx.fillStyle = allLoot ? `rgba(74,222,128,${pulse * 0.3})` : 'rgba(107,114,128,0.2)';
  ctx.fillRect(sx(ex, game), sy(ey, game), T, T);
  ctx.strokeStyle = allLoot ? `rgba(74,222,128,${pulse})` : '#6b7280';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx(ex, game) + 2, sy(ey, game) + 2, T - 4, T - 4);
  ctx.fillStyle = allLoot ? '#4ade80' : '#6b7280';
  ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', sx(ex, game) + T / 2, sy(ey, game) + T / 2);
}
