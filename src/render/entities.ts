import {
  T, PLAYER_RADIUS, LOOT_TIME, SEARCH_TIME, STAMINA_MAX,
  TV_DURATION, TV_RANGE, DISTRACTION_DURATION, DISTRACTION_RANGE,
  VIEW_W, VIEW_H, LOOT_TYPES, TOOL_TYPES,
} from '../config';
import { dist } from '../utils';
import { canBabySee } from '../update/babies';
import { drawToolShape, drawLootShape, drawCheeseShape } from './shapes';
import { getPlayerWalkFrame, getPlayerIdle, getPlayerHide } from '../sprites';
import { sketchyRect, crayonCircle, crayonText, crayonGrain } from './sketchy';
import type { Game } from '../types';

function offScreen(x: number, y: number, m: number, game: Game): boolean {
  return x < game.camera.x - m || x > game.camera.x + VIEW_W + m ||
    y < game.camera.y - m || y > game.camera.y + VIEW_H + m;
}

export function renderTVs(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const tv of game.tvs) {
    if (offScreen(tv.x, tv.y, 50, game)) continue;
    const px = tv.x, py = tv.y;

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
    if (cp.collected || offScreen(cp.x, cp.y, 40, game)) continue;
    const bob = Math.sin(time * 2 + cp.x) * 1.5;
    const px = cp.x, py = cp.y + bob;
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
    if (tp.collected || offScreen(tp.x, tp.y, 40, game)) continue;
    const bob = Math.sin(time * 2.5 + tp.x + tp.y) * 1.5;
    const px = tp.x, py = tp.y + bob;
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
    if (offScreen(d.x, d.y, 50, game)) continue;
    const px = d.x, py = d.y;
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
    if (l.collected || offScreen(l.x, l.y, 40, game)) continue;
    const bob = Math.sin(time * 3 + l.x + l.y) * 1.5;
    const lt = LOOT_TYPES[l.type];
    const px = l.x, py = l.y + bob;
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
    if (offScreen(c.x, c.y, 40, game)) continue;
    const px = c.x, py = c.y;

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
    if (k.collected || offScreen(k.x, k.y, 40, game)) continue;
    const bob = Math.sin(time * 3 + k.x) * 2;
    const px = k.x, py = k.y + bob;

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
    if (g.collected || offScreen(g.x, g.y, 40, game)) continue;
    const bob = Math.sin(time * 2 + g.x + g.y) * 1.5;
    const px = g.x, py = g.y + bob;

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
    if ((c.stuckBaby && c.landed) || offScreen(c.x, c.y, 20, game)) continue;
    const cpx = c.x, cpy = c.y;
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

const OVERLAY_SPRITE_SIZE = T * 2;

export function renderBabyOverlays(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;

  for (const b of game.babies) {
    if (offScreen(b.x, b.y, OVERLAY_SPRITE_SIZE, game)) continue;
    const stunned = b.stunTimer > 0;
    let bx = b.x, by = b.y;

    // Boss shake/sway (duplicated from renderBabies for correct overlay positioning)
    if (b.type === 'boss' && !stunned) {
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

    const indY = OVERLAY_SPRITE_SIZE / 2 + 4;

    // Stun — bebestunned sprite handles the visual, just skip to next state
    if (stunned) {
      // no overlay needed, bebestunned sprite already shows cheese/stars
    } else if (b.distracted) {
      // Heart indicator
      crayonText(ctx, '\u2665', bx, by - indY, {
        fill: '#f472b6', font: '10px sans-serif', align: 'center', baseline: 'bottom',
      });
    }

    // Alert indicators
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
    if (b.type === 'boss' && !stunned) {
      crayonText(ctx, '!!', bx, by - indY, {
        fill: '#ef4444', font: 'bold 14px monospace', align: 'center', baseline: 'alphabetic',
      });
    }
  }
}

export function renderPlayer(ctx: CanvasRenderingContext2D, game: Game): void {
  const p = game.player;
  const time = game.time;
  const moving = !!(p.vx || p.vy);
  const bob = Math.sin(time * 8) * (moving ? 1.5 : 0);
  const px = p.x, py = p.y + bob;
  const SPRITE_SZ = T * 2;

  if (p.hiding) {
    const stPct = p.stamina / STAMINA_MAX;
    const flicker = stPct < 0.3 ? (Math.sin(time * 12) * 0.15 + 0.45) : 0.6;
    ctx.globalAlpha = flicker;

    const hideImg = getPlayerHide();
    if (hideImg) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.facing - Math.PI / 2);
      ctx.drawImage(hideImg, -SPRITE_SZ / 2, -SPRITE_SZ / 2, SPRITE_SZ, SPRITE_SZ);
      ctx.restore();
    } else {
      // Fallback circle
      crayonCircle(ctx, px, py, PLAYER_RADIUS, { fill: '#22c55e', stroke: '#22c55e', lineWidth: 2.5, jitterAmt: 0.5 });
    }

    // Hiding ring
    const ringSize = stPct < 0.3 ? (PLAYER_RADIUS + 3 + Math.sin(time * 8) * 3) : (PLAYER_RADIUS + 6 + Math.sin(time * 4) * 2);
    crayonCircle(ctx, px, py, ringSize, {
      stroke: stPct < 0.3 ? 'rgba(239,68,68,0.4)' : 'rgba(74,222,128,0.3)',
      lineWidth: 1.5, jitterAmt: 0.4,
    });
    ctx.globalAlpha = 1;
  } else {
    let img: HTMLImageElement | null;
    if (moving) {
      const frameIdx = Math.floor(time / 0.15) % 4;
      img = getPlayerWalkFrame(frameIdx);
    } else {
      img = getPlayerIdle();
    }

    if (img) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.facing - Math.PI / 2);
      ctx.drawImage(img, -SPRITE_SZ / 2, -SPRITE_SZ / 2, SPRITE_SZ, SPRITE_SZ);
      ctx.restore();
    } else {
      // Fallback green circle
      crayonCircle(ctx, px, py, PLAYER_RADIUS, { fill: '#4ade80', stroke: '#22c55e', lineWidth: 3, jitterAmt: 0.5 });
    }
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
