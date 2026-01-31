import {
  T, BABY_RADIUS, PLAYER_RADIUS, LOOT_TIME, SEARCH_TIME, STAMINA_MAX,
  TV_DURATION, TV_RANGE, DISTRACTION_DURATION, DISTRACTION_RANGE,
  VIEW_W, VIEW_H, LOOT_TYPES, TOOL_TYPES,
} from '../config';
import { dist } from '../utils';
import { canBabySee } from '../update/babies';
import { drawToolShape, drawLootShape, drawCheeseShape } from './shapes';
import { babySpritesReady, getBabyFrame, stawlerSpritesReady, getStawlerFrame, toddlerSpritesReady, getToddlerFrame } from '../sprites';
import { sketchyRect, crayonCircle, crayonText, crayonGrain } from './sketchy';
import type { Game } from '../types';

function onScreen(x: number, y: number, m: number, game: Game): boolean {
  return x > game.camera.x - m && x < game.camera.x + VIEW_W + m &&
    y > game.camera.y - m && y < game.camera.y + VIEW_H + m;
}

function sx(x: number, game: Game): number { return x - game.camera.x; }
function sy(y: number, game: Game): number { return y - game.camera.y; }

/** Draw a wobbly crayon triangle with deterministic jitter. */
function crayonTriangle(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number, x3: number, y3: number,
  opts: { fill?: string; stroke?: string; lineWidth?: number },
): void {
  // Deterministic seed from vertex positions
  const seed = Math.round(x1 * 73 + y1 * 137 + x2 * 31 + y2 * 53) & 0x7fffffff;
  const sr = (s: number) => {
    const v = Math.sin(s * 127.1 + seed * 0.0173) * 43758.5453;
    return (v - Math.floor(v)) - 0.5;
  };
  const j = 1.0;

  if (opts.fill) {
    ctx.fillStyle = opts.fill;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.closePath(); ctx.fill();
  }

  if (opts.stroke) {
    ctx.save();
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = opts.lineWidth ?? 3;
    ctx.globalAlpha = 0.75;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1 + sr(1) * j, y1 + sr(2) * j);
    ctx.lineTo(x2 + sr(3) * j, y2 + sr(4) * j);
    ctx.lineTo(x3 + sr(5) * j, y3 + sr(6) * j);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

export function renderTVs(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const tv of game.tvs) {
    if (!onScreen(tv.x, tv.y, 50, game)) continue;
    const px = sx(tv.x, game), py = sy(tv.y, game);

    // TV body
    sketchyRect(ctx, px - 10, py - 8, 20, 16, {
      fill: '#1a1a2e', stroke: '#374151', lineWidth: 2.5, jitterAmt: 0.5,
    });

    if (tv.active) {
      const pulse = Math.sin(time * 8) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(74,222,128,${pulse * 0.8})`;
      ctx.fillRect(px - 8, py - 6, 16, 12);
      const colors = ['#ef4444', '#fbbf24', '#4ade80', '#60a5fa'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(px - 8 + i * 4, py - 6, 4, 12);
      }
      // Grain overlay on active screen
      crayonGrain(ctx, px - 8, py - 6, 16, 12, 0.05);
      ctx.globalAlpha = 0.4 + Math.sin(time * 3) * 0.2;
      ctx.fillStyle = '#fff'; ctx.font = '6px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('COCO', px, py);
      ctx.globalAlpha = 1;
      // Range circle (keep as-is — gameplay indicator)
      ctx.beginPath(); ctx.arc(px, py, TV_RANGE, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(74,222,128,${Math.sin(time * 4) * 0.05 + 0.08})`;
      ctx.lineWidth = 1; ctx.stroke();
      // Timer arc (keep as-is)
      const pct = tv.timer / TV_DURATION;
      ctx.beginPath(); ctx.arc(px, py, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.strokeStyle = 'rgba(74,222,128,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.fillStyle = '#111'; ctx.fillRect(px - 8, py - 6, 16, 12);
    }
    // TV stand
    sketchyRect(ctx, px - 2, py + 8, 4, 3, {
      fill: '#374151', lineWidth: 1, jitterAmt: 0.3, grain: false,
    });
  }
}

export function renderCheesePickups(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const cp of game.cheesePickups) {
    if (cp.collected || !onScreen(cp.x, cp.y, 40, game)) continue;
    const bob = Math.sin(time * 2 + cp.x) * 1.5;
    const px = sx(cp.x, game), py = sy(cp.y + bob, game);
    // Glow
    crayonCircle(ctx, px, py, 12, { fill: 'rgba(253,224,71,0.15)', jitterAmt: 0.5 });
    // Shadow
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath(); ctx.ellipse(px, py + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Cheese triangle
    drawCheeseShape(ctx, px, py, 10);
    if (dist(game.player, cp) < T * 1.2) {
      crayonText(ctx, '+1 CHEESE', px, py - 16, {
        fill: 'rgba(253,224,71,0.8)', font: '9px monospace', align: 'center', baseline: 'alphabetic',
      });
    }
  }
}

export function renderToolPickups(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const tp of game.toolPickups) {
    if (tp.collected || !onScreen(tp.x, tp.y, 40, game)) continue;
    const bob = Math.sin(time * 2.5 + tp.x + tp.y) * 1.5;
    const px = sx(tp.x, game), py = sy(tp.y + bob, game);
    // Glow
    crayonCircle(ctx, px, py, 13, { fill: 'rgba(168,85,247,0.15)', jitterAmt: 0.5 });
    drawToolShape(ctx, px, py, tp.type, 10, time);
    if (dist(game.player, tp) < T * 1.2) {
      const tt = TOOL_TYPES[tp.type];
      crayonText(ctx, tt.name, px, py - 16, {
        fill: 'rgba(168,85,247,0.9)', font: '9px monospace', align: 'center', baseline: 'alphabetic',
      });
      crayonText(ctx, tt.desc, px, py - 26, {
        fill: 'rgba(200,180,255,0.6)', font: '9px monospace', align: 'center', baseline: 'alphabetic',
      });
    }
  }
}

export function renderDistractions(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const d of game.distractions) {
    if (!onScreen(d.x, d.y, 50, game)) continue;
    const px = sx(d.x, game), py = sy(d.y, game);
    const pulse = Math.sin(time * 6) * 0.2 + 0.5;
    // Range circle — crayon style at low alpha
    crayonCircle(ctx, px, py, DISTRACTION_RANGE, {
      stroke: `rgba(168,85,247,${pulse * 0.08})`, lineWidth: 1.5, jitterAmt: 1.0,
    });
    crayonCircle(ctx, px, py, 18, { fill: `rgba(168,85,247,${pulse * 0.3})`, jitterAmt: 0.5 });
    drawToolShape(ctx, px, py, d.type, 10, time);
    // Timer arc (keep as-is)
    const pct = d.timer / DISTRACTION_DURATION;
    ctx.beginPath(); ctx.arc(px, py, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = 'rgba(168,85,247,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    // Floating "~" marks — crayon text
    for (let i = 0; i < 3; i++) {
      const a = time * 3 + i * 2.094, r = 20 + Math.sin(time * 4 + i) * 5;
      crayonText(ctx, '~', px + Math.cos(a) * r, py + Math.sin(a) * r, {
        fill: `rgba(196,181,253,${pulse})`, font: '8px sans-serif', align: 'center',
      });
    }
  }
}

export function renderLootItems(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const l of game.loots) {
    if (l.collected || !onScreen(l.x, l.y, 40, game)) continue;
    const bob = Math.sin(time * 3 + l.x + l.y) * 1.5;
    const lt = LOOT_TYPES[l.type];
    const px = sx(l.x, game), py = sy(l.y + bob, game);
    // Glow
    crayonCircle(ctx, px, py, 16, { fill: lt.glow, jitterAmt: 0.6 });
    drawLootShape(ctx, px, py, l.type, 10);
    if (game.state === 'playing' && dist(game.player, l) < T * 1.2) {
      crayonText(ctx, 'GOLDEN BEBE', px, py - 18, {
        fill: 'rgba(255,255,255,0.9)', font: '9px monospace', align: 'center', baseline: 'alphabetic',
      });
      if (!game.player.looting && dist(game.player, l) < T * 0.9) {
        crayonText(ctx, '[E] Grab', px, py - 28, {
          fill: 'rgba(255,255,200,0.7)', font: '9px monospace', align: 'center', baseline: 'alphabetic',
        });
      }
    }
  }
}

export function renderContainers(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const c of game.containers) {
    if (!onScreen(c.x, c.y, 40, game)) continue;
    const px = sx(c.x, game), py = sy(c.y, game);

    if (c.searched) {
      // Already searched: dim crayon rect
      sketchyRect(ctx, px - 10, py - 8, 20, 16, {
        fill: '#2a2a3a', stroke: '#3a3a4a', lineWidth: 2, jitterAmt: 0.5,
      });
    } else {
      // Unsearched: warm brown crayon rect with grain
      const glow = Math.sin(time * 2 + c.x) * 0.1 + 0.3;
      sketchyRect(ctx, px - 10, py - 8, 20, 16, {
        fill: '#3d2e1c', stroke: `rgba(251,191,36,${glow})`, lineWidth: 2.5, jitterAmt: 0.6,
      });
      // Latch
      sketchyRect(ctx, px - 2, py - 8, 4, 3, {
        fill: '#DAA520', lineWidth: 1, jitterAmt: 0.3, grain: false,
      });

      if (dist(game.player, c) < T * 1.2) {
        crayonText(ctx, '[E] Search', px, py - 14, {
          fill: 'rgba(251,191,36,0.8)', font: '9px monospace', align: 'center', baseline: 'alphabetic',
        });
      }
    }
  }
}

export function renderKeyPickups(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const k of game.keyPickups) {
    if (k.collected || !onScreen(k.x, k.y, 40, game)) continue;
    const bob = Math.sin(time * 3 + k.x) * 2;
    const px = sx(k.x, game), py = sy(k.y + bob, game);

    // Glow
    crayonCircle(ctx, px, py, 14, { fill: 'rgba(250,204,21,0.2)', jitterAmt: 0.5 });

    // Key card shape — crayon style
    const colors: Record<string, string> = { keyA: '#ef4444', keyB: '#3b82f6', keyC: '#22c55e' };
    sketchyRect(ctx, px - 8, py - 5, 16, 10, {
      fill: colors[k.type] || '#facc15', stroke: '#fff', lineWidth: 2, jitterAmt: 0.5,
    });
    crayonText(ctx, k.type.replace('key', ''), px, py, {
      fill: '#fff', font: 'bold 7px monospace', align: 'center', baseline: 'middle',
    });

    if (dist(game.player, k) < T * 1.2) {
      crayonText(ctx, 'KEY ' + k.type.replace('key', ''), px, py - 16, {
        fill: 'rgba(250,204,21,0.9)', font: '9px monospace', align: 'center', baseline: 'alphabetic',
      });
    }
  }
}

export function renderGearPickups(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const g of game.gearPickups) {
    if (g.collected || !onScreen(g.x, g.y, 40, game)) continue;
    const bob = Math.sin(time * 2 + g.x + g.y) * 1.5;
    const px = sx(g.x, game), py = sy(g.y + bob, game);

    // Glow
    crayonCircle(ctx, px, py, 12, { fill: 'rgba(74,222,128,0.15)', jitterAmt: 0.5 });

    if (g.type === 'sneakers') {
      // Sneakers — crayon rect
      sketchyRect(ctx, px - 5, py - 3, 10, 6, {
        fill: '#4ade80', stroke: '#22c55e', lineWidth: 1.5, jitterAmt: 0.4, grain: false,
      });
      sketchyRect(ctx, px - 4, py, 3, 2, {
        fill: '#fff', lineWidth: 0.5, jitterAmt: 0.2, grain: false,
      });
    } else {
      // Sunglasses — crayon circles + line
      crayonCircle(ctx, px - 4, py, 5, { fill: '#1e1e2e', stroke: '#a855f7', lineWidth: 1.5, jitterAmt: 0.3 });
      crayonCircle(ctx, px + 4, py, 5, { fill: '#1e1e2e', stroke: '#a855f7', lineWidth: 1.5, jitterAmt: 0.3 });
      ctx.save();
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px - 4, py - 3); ctx.lineTo(px + 4, py - 3); ctx.stroke();
      ctx.restore();
    }
  }
}

export function renderCheeses(ctx: CanvasRenderingContext2D, game: Game): void {
  for (const c of game.cheeses) {
    if ((c.stuckBaby && c.landed) || !onScreen(c.x, c.y, 20, game)) continue;
    const cpx = sx(c.x, game), cpy = sy(c.y, game);
    if (c.isPacifier) {
      drawToolShape(ctx, cpx, cpy, 'pacifier', 7, game.time);
    } else {
      drawCheeseShape(ctx, cpx, cpy, 7);
    }
    // Pickup hint for missed cheese on the ground
    if (c.landed && !c.stuckBaby && dist(game.player, c) < T * 1.2) {
      crayonText(ctx, c.isPacifier ? 'grab pacifier' : 'grab cheese', cpx, cpy - 14, {
        fill: 'rgba(253,224,71,0.8)', font: '9px monospace', align: 'center', baseline: 'alphabetic',
      });
    }
  }
}

const SPRITE_SIZE = T * 2;
const FRAME_DURATION = 0.15;

export function renderBabies(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  const useSprites = babySpritesReady();

  for (const b of game.babies) {
    if (!onScreen(b.x, b.y, SPRITE_SIZE, game)) continue;
    const stunned = b.stunTimer > 0;
    let bx = sx(b.x, game), by = sy(b.y, game);

    // Toddler shake
    if (b.type === 'toddler' && !stunned) {
      if (b.chasing) {
        bx += Math.sin(time * 45 + b.y * 7) * 3.0;
        by += Math.cos(time * 51 + b.x * 7) * 3.0;
      } else {
        const sway = Math.sin(time * 6) * 4.5;
        const perp = b.facing + Math.PI / 2;
        bx += Math.cos(perp) * sway;
        by += Math.sin(perp) * sway;
      }
    }

    // Body
    const useStawlerSprites = b.type === 'stawler' && stawlerSpritesReady();
    const useToddlerSprites = b.type === 'toddler' && toddlerSpritesReady();
    if (useSprites || useStawlerSprites || useToddlerSprites) {
      const moving = b.pauseTimer <= 0 && !stunned;
      let frameIndex: number;
      if (moving) {
        frameIndex = Math.floor(time / FRAME_DURATION) % 4;
      } else {
        const facingLeft = Math.cos(b.facing) < 0;
        const tick = Math.floor(time / 0.4) % 2;
        frameIndex = facingLeft
          ? (tick === 0 ? 3 : 2)
          : (tick === 0 ? 1 : 0);
      }
      const img = useToddlerSprites ? getToddlerFrame(frameIndex)
        : useStawlerSprites ? getStawlerFrame(frameIndex)
        : getBabyFrame(frameIndex);
      const half = SPRITE_SIZE / 2;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(b.facing + Math.PI / 2);
      if (stunned) ctx.globalAlpha = 0.5;

      ctx.drawImage(img, -half, -half, SPRITE_SIZE, SPRITE_SIZE);
      ctx.restore();
    } else {
      // Fallback procedural rendering — crayon style
      const colors: Record<string, string> = { crawler: '#fb923c', stawler: '#ec4899', toddler: '#dc2626' };
      const strokeColors: Record<string, string> = { crawler: '#fdba74', stawler: '#f9a8d4', toddler: '#f87171' };
      const bodyColor = stunned ? '#888' : (colors[b.type] || '#fb923c');
      const outlineColor = stunned ? '#aaa' : (strokeColors[b.type] || '#fdba74');
      crayonCircle(ctx, bx, by, BABY_RADIUS, {
        fill: bodyColor, stroke: outlineColor, lineWidth: 3, jitterAmt: 0.6,
      });
    }

    // Stun effects
    const indY = SPRITE_SIZE / 2 + 4;
    if (stunned) {
      const coh = game.cheeses.find(c => c.stuckBaby === b && c.landed);
      if (coh) {
        const cx = bx + Math.cos(b.facing) * (SPRITE_SIZE / 2);
        const cy = by + Math.sin(b.facing) * (SPRITE_SIZE / 2);
        if (coh.isPacifier) drawToolShape(ctx, cx, cy, 'pacifier', 6, time);
        else {
          crayonTriangle(ctx, cx, cy - 4, cx + 4, cy + 3, cx - 4, cy + 3, {
            fill: '#fde047', stroke: '#ca8a04', lineWidth: 1.5,
          });
        }
      }
      // Stun stars — crayon text
      for (let i = 0; i < 3; i++) {
        const a = time * 5 + i * 2.094;
        crayonText(ctx, '*', bx + Math.cos(a) * (indY + 6), by + Math.sin(a) * (indY + 6) - 4, {
          fill: '#fde047', font: '8px sans-serif', align: 'center',
        });
      }
    } else if (b.distracted) {
      // Heart indicator — crayon text
      crayonText(ctx, '\u2665', bx, by - indY, {
        fill: '#f472b6', font: '10px sans-serif', align: 'center', baseline: 'bottom',
      });
    }

    // Alert indicators — crayon text
    if (!stunned && !b.distracted && canBabySee(game, b) && !game.player.hiding) {
      crayonText(ctx, '!', bx, by - indY, {
        fill: '#ef4444', font: 'bold 14px monospace', align: 'center', baseline: 'alphabetic',
      });
    }
    if (b.type === 'stawler' && b.chasing && !stunned) {
      crayonText(ctx, '?!', bx, by - indY, {
        fill: '#f472b6', font: 'bold 12px monospace', align: 'center', baseline: 'alphabetic',
      });
    }
    if (b.type === 'toddler' && b.chasing && !stunned) {
      crayonText(ctx, '!!', bx, by - indY, {
        fill: '#ef4444', font: 'bold 14px monospace', align: 'center', baseline: 'alphabetic',
      });
    }
  }
}

export function renderPlayer(ctx: CanvasRenderingContext2D, game: Game): void {
  const p = game.player;
  const time = game.time;
  const bob = Math.sin(time * 8) * ((p.vx || p.vy) ? 1.5 : 0);
  const px = sx(p.x, game), py = sy(p.y, game) + bob;

  if (p.hiding) {
    const stPct = p.stamina / STAMINA_MAX;
    const flicker = stPct < 0.3 ? (Math.sin(time * 12) * 0.15 + 0.45) : 0.6;
    ctx.globalAlpha = flicker;
    const bodyColor = stPct < 0.3 ? '#a3e635' : '#22c55e';
    crayonCircle(ctx, px, py, PLAYER_RADIUS, {
      fill: bodyColor, stroke: bodyColor, lineWidth: 2.5, jitterAmt: 0.5,
    });
    // Peekaboo eyes
    ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(px, py, PLAYER_RADIUS * 0.5, -0.8, 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, PLAYER_RADIUS * 0.5, Math.PI - 0.8, Math.PI + 0.8); ctx.stroke();
    // Hiding ring
    const ringSize = stPct < 0.3 ? (PLAYER_RADIUS + 3 + Math.sin(time * 8) * 3) : (PLAYER_RADIUS + 6 + Math.sin(time * 4) * 2);
    crayonCircle(ctx, px, py, ringSize, {
      stroke: stPct < 0.3 ? 'rgba(239,68,68,0.4)' : 'rgba(74,222,128,0.3)',
      lineWidth: 1.5, jitterAmt: 0.4,
    });
    ctx.globalAlpha = 1;
  } else {
    const bodyColor = p.sprinting ? '#86efac' : '#4ade80';
    crayonCircle(ctx, px, py, PLAYER_RADIUS, {
      fill: bodyColor, stroke: '#22c55e', lineWidth: 3, jitterAmt: 0.5,
    });
    // Eyes — keep small, use crayonCircle for whites
    const eo = 4;
    const e1x = px + Math.cos(p.facing - 0.4) * eo, e1y = py + Math.sin(p.facing - 0.4) * eo;
    const e2x = px + Math.cos(p.facing + 0.4) * eo, e2y = py + Math.sin(p.facing + 0.4) * eo;
    crayonCircle(ctx, e1x, e1y, 2.5, { fill: '#fff', jitterAmt: 0.2 });
    crayonCircle(ctx, e2x, e2y, 2.5, { fill: '#fff', jitterAmt: 0.2 });
    // Pupils
    ctx.fillStyle = '#1e1e2e'; ctx.beginPath();
    ctx.arc(e1x + Math.cos(p.facing) * 0.8, e1y + Math.sin(p.facing) * 0.8, 1.2, 0, Math.PI * 2);
    ctx.arc(e2x + Math.cos(p.facing) * 0.8, e2y + Math.sin(p.facing) * 0.8, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  // Progress bars — crayon style (matches UI peekaboo bar pattern)
  if (p.looting) {
    const pct = 1 - p.lootTimer / LOOT_TIME;
    const bw = 34, bh = 6, bx = px - bw / 2, by = py - PLAYER_RADIUS - 16;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = 'rgba(20,57,94,0.85)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(bx, by, bw * pct, bh);
    sketchyRect(ctx, bx, by, bw, bh, { stroke: 'rgba(251,191,36,0.5)', lineWidth: 2, jitterAmt: 0.4, grain: false });
    crayonText(ctx, 'grab', px, by - 3, {
      fill: 'rgba(251,191,36,0.8)', font: 'bold 7px monospace', align: 'center', baseline: 'alphabetic', jitterAmt: 0.2,
    });
  }

  if (p.searching) {
    const pct = 1 - p.searchTimer / SEARCH_TIME;
    const bw = 34, bh = 6, bx = px - bw / 2, by = py - PLAYER_RADIUS - 16;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = 'rgba(20,57,94,0.85)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#a78bfa'; ctx.fillRect(bx, by, bw * pct, bh);
    sketchyRect(ctx, bx, by, bw, bh, { stroke: 'rgba(167,139,250,0.5)', lineWidth: 2, jitterAmt: 0.4, grain: false });
    crayonText(ctx, 'search', px, by - 3, {
      fill: 'rgba(167,139,250,0.8)', font: 'bold 7px monospace', align: 'center', baseline: 'alphabetic', jitterAmt: 0.2,
    });
  }
}
