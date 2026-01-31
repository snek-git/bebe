import { T, COLS, ROWS, TOTAL_LOOT, ROOM_DEFS, VIEW_W, VIEW_H } from '../config';
import { roomDef } from '../map';
import { sketchyRect, crayonGrain, crayonCircle, crayonText, sketchyLine, SK } from './sketchy';
import type { Game } from '../types';

function onScreen(x: number, y: number, m: number, game: Game): boolean {
  return x > game.camera.x - m && x < game.camera.x + VIEW_W + m &&
         y > game.camera.y - m && y < game.camera.y + VIEW_H + m;
}

function sx(x: number, game: Game): number { return x - game.camera.x; }
function sy(y: number, game: Game): number { return y - game.camera.y; }

/** Check if a wall tile is on the edge (adjacent to a non-wall tile). */
function isEdgeWall(grid: number[][], x: number, y: number): boolean {
  const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dx, dy] of offsets) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
    if (grid[ny][nx] !== 1) return true;
  }
  return false;
}

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
        // Wall tile
        ctx.fillStyle = '#2a3a5c';
        ctx.fillRect(px, py, T, T);
        crayonGrain(ctx, px, py, T, T, 0.06);
        // Only stroke edge walls for performance
        if (isEdgeWall(game.grid, x, y)) {
          sketchyRect(ctx, px, py, T, T, {
            stroke: SK.cardStroke, lineWidth: 3, jitterAmt: 0.6, grain: false,
          });
        }
      } else if (v === 2) {
        // Furniture tile
        sketchyRect(ctx, px, py, T, T, {
          fill: '#3d2e1c', stroke: 'rgba(90,65,40,0.5)', lineWidth: 2, jitterAmt: 0.5,
        });
      } else {
        // Floor tile — warm tone with faint paper texture, no grid lines
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(px, py, T, T);
        crayonGrain(ctx, px, py, T, T, 0.03);
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
      // Open door: thin crayon line for the door edge
      if (d.orientation === 'v') {
        sketchyLine(ctx, px, py, px, py + T, { stroke: '#6b7280', lineWidth: 2, jitterAmt: 0.4 });
      } else {
        sketchyLine(ctx, px, py, px + T, py, { stroke: '#6b7280', lineWidth: 2, jitterAmt: 0.4 });
      }
    } else if (d.state === 'closed') {
      // Closed door: solid brown/wood with thick crayon outline
      sketchyRect(ctx, px, py, T, T, {
        fill: '#8B4513', stroke: '#654321', lineWidth: 4, jitterAmt: 0.8,
      });
      // Door handle
      crayonCircle(ctx, px + T * 0.75, py + T / 2, 2.5, {
        fill: '#DAA520', stroke: '#b8860b', lineWidth: 1.5, jitterAmt: 0.3,
      });
      // Slam flash (keep as-is)
      if (d.slamTimer > 0) {
        ctx.fillStyle = `rgba(255,200,0,${d.slamTimer})`;
        ctx.fillRect(px - 4, py - 4, T + 8, T + 8);
      }
    } else {
      // Locked door: dark metal with crayon style
      sketchyRect(ctx, px, py, T, T, {
        fill: '#4a4a6a', stroke: '#6b6b8a', lineWidth: 4, jitterAmt: 0.8,
      });
      // Lock symbol
      crayonText(ctx, 'X', px + T / 2, py + T / 2, {
        fill: '#ef4444', font: 'bold 10px monospace', align: 'center', baseline: 'middle',
      });
      // Required key label
      if (d.requiredKey) {
        crayonText(ctx, d.requiredKey.replace('key', ''), px + T / 2, py + T - 4, {
          fill: 'rgba(255,255,255,0.5)', font: '7px monospace', align: 'center', baseline: 'middle',
        });
      }
    }
  }
}

export function renderRoomLabels(ctx: CanvasRenderingContext2D, game: Game): void {
  for (const r of ROOM_DEFS) {
    const cx = (r.x + r.w / 2) * T;
    const cy = (r.y + r.h - 0.5) * T;
    if (onScreen(cx, cy, 100, game)) {
      ctx.save();
      ctx.globalAlpha = 0.07;
      crayonText(ctx, r.name, sx(cx, game), sy(cy, game), {
        fill: '#ffffff', font: '8px monospace', align: 'center', baseline: 'middle', passes: 2, jitterAmt: 0.2,
      });
      ctx.restore();
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

  const fillColor = allLoot ? `rgba(74,222,128,${pulse * 0.3})` : 'rgba(107,114,128,0.2)';
  const strokeColor = allLoot ? `rgba(74,222,128,${pulse})` : '#6b7280';

  sketchyRect(ctx, sx(ex, game) + 2, sy(ey, game) + 2, T - 4, T - 4, {
    fill: fillColor, stroke: strokeColor, lineWidth: 3, jitterAmt: 0.6, grain: false,
  });

  crayonText(ctx, 'EXIT', sx(ex, game) + T / 2, sy(ey, game) + T / 2, {
    fill: allLoot ? '#4ade80' : '#6b7280', font: 'bold 8px monospace', align: 'center', baseline: 'middle',
  });
}
