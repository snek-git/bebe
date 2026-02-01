import { T, ROWS, TOTAL_LOOT, ROOM_DEFS, VIEW_W, VIEW_H } from '../config';
import { roomDef } from '../map';
import { dist } from '../utils';
import { sketchyRect, crayonCircle, crayonText, sketchyLine, SK } from './sketchy';
import type { Game } from '../types';

function offScreen(x: number, y: number, m: number, game: Game): boolean {
  return x < game.camera.x - m || x > game.camera.x + VIEW_W + m ||
         y < game.camera.y - m || y > game.camera.y + VIEW_H + m;
}

export function renderDoors(ctx: CanvasRenderingContext2D, game: Game): void {
  for (const d of game.doors) {
    if (offScreen(d.x, d.y, T, game)) continue;
    const px = d.x - T / 2;
    const py = d.y - T / 2;

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

    // Prompt when player is close
    if (game.state === 'playing' && dist(game.player, d) < T * 1.2) {
      let label: string | null = null;
      if (d.state === 'closed') label = '[E] Open';
      else if (d.state === 'open') label = '[E] Close';
      else if (d.state === 'locked') {
        const hasKey = d.requiredKey && game.player.keys.includes(d.requiredKey);
        label = hasKey ? '[E] Unlock' : 'Locked';
      }
      if (label) {
        crayonText(ctx, label, d.x, d.y - T / 2 - 6, {
          fill: 'rgba(255,255,200,1)', font: 'bold 11px monospace', align: 'center', baseline: 'alphabetic',
        });
      }
    }
  }
}

export function renderRoomLabels(ctx: CanvasRenderingContext2D, game: Game): void {
  for (const r of ROOM_DEFS) {
    const cx = (r.x + r.w / 2) * T;
    const cy = (r.y + r.h - 0.5) * T;
    if (!offScreen(cx, cy, 100, game)) {
      ctx.save();
      ctx.globalAlpha = 0.07;
      crayonText(ctx, r.name, cx, cy, {
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
  if (offScreen(ex + T / 2, ey + T / 2, T, game)) return;

  const allLoot = game.player.loot >= TOTAL_LOOT;
  const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;

  const fillColor = allLoot ? `rgba(74,222,128,${pulse * 0.3})` : 'rgba(107,114,128,0.2)';
  const strokeColor = allLoot ? `rgba(74,222,128,${pulse})` : '#6b7280';

  sketchyRect(ctx, ex + 2, ey + 2, T - 4, T - 4, {
    fill: fillColor, stroke: strokeColor, lineWidth: 3, jitterAmt: 0.6, grain: false,
  });

  crayonText(ctx, 'EXIT', ex + T / 2, ey + T / 2, {
    fill: allLoot ? '#4ade80' : '#6b7280', font: 'bold 8px monospace', align: 'center', baseline: 'middle',
  });
}
