import {
  T, BABY_RADIUS, PLAYER_RADIUS, LOOT_TIME, SEARCH_TIME, PEEKABOO_MAX, CHEESE_SPEED,
  TV_DURATION, TV_RANGE, DISTRACTION_DURATION, DISTRACTION_RANGE,
  VIEW_W, VIEW_H, LOOT_TYPES, TOOL_TYPES,
} from '../config';
import { dist } from '../utils';
import { canBabySee } from '../update/babies';
import { drawToolShape, drawLootShape } from './shapes';
import { babySpritesReady, getBabyFrame } from '../sprites';
import type { Game } from '../types';

function onScreen(x: number, y: number, m: number, game: Game): boolean {
  return x > game.camera.x - m && x < game.camera.x + VIEW_W + m &&
         y > game.camera.y - m && y < game.camera.y + VIEW_H + m;
}

function sx(x: number, game: Game): number { return x - game.camera.x; }
function sy(y: number, game: Game): number { return y - game.camera.y; }

export function renderTVs(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const tv of game.tvs) {
    if (!onScreen(tv.x, tv.y, 50, game)) continue;
    const px = sx(tv.x, game), py = sy(tv.y, game);

    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(px - 10, py - 8, 20, 16);
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 1.5; ctx.strokeRect(px - 10, py - 8, 20, 16);

    if (tv.active) {
      const pulse = Math.sin(time * 8) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(74,222,128,${pulse * 0.8})`;
      ctx.fillRect(px - 8, py - 6, 16, 12);
      const colors = ['#ef4444', '#fbbf24', '#4ade80', '#60a5fa'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(px - 8 + i * 4, py - 6, 4, 12);
      }
      ctx.globalAlpha = 0.4 + Math.sin(time * 3) * 0.2;
      ctx.fillStyle = '#fff'; ctx.font = '6px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('COCO', px, py);
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(px, py, TV_RANGE, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(74,222,128,${Math.sin(time * 4) * 0.05 + 0.08})`;
      ctx.lineWidth = 1; ctx.stroke();
      const pct = tv.timer / TV_DURATION;
      ctx.beginPath(); ctx.arc(px, py, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.strokeStyle = 'rgba(74,222,128,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.fillStyle = '#111'; ctx.fillRect(px - 8, py - 6, 16, 12);
    }
    ctx.fillStyle = '#374151'; ctx.fillRect(px - 2, py + 8, 4, 3);
  }
}

export function renderCheesePickups(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const cp of game.cheesePickups) {
    if (cp.collected || !onScreen(cp.x, cp.y, 40, game)) continue;
    const bob = Math.sin(time * 2 + cp.x) * 1.5;
    const px = sx(cp.x, game), py = sy(cp.y + bob, game);
    ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(253,224,71,0.15)'; ctx.fill();
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath(); ctx.ellipse(px, py + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.moveTo(px, py - 6); ctx.lineTo(px + 6, py + 2); ctx.lineTo(px - 6, py + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath(); ctx.arc(px - 1, py - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    if (dist(game.player, cp) < T * 1.2) {
      ctx.fillStyle = 'rgba(253,224,71,0.8)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('+1 CHEESE', px, py - 16);
    }
  }
}

export function renderToolPickups(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const tp of game.toolPickups) {
    if (tp.collected || !onScreen(tp.x, tp.y, 40, game)) continue;
    const bob = Math.sin(time * 2.5 + tp.x + tp.y) * 1.5;
    const px = sx(tp.x, game), py = sy(tp.y + bob, game);
    ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168,85,247,0.15)'; ctx.fill();
    drawToolShape(ctx, px, py, tp.type, 10, time);
    if (dist(game.player, tp) < T * 1.2) {
      const tt = TOOL_TYPES[tp.type];
      ctx.fillStyle = 'rgba(168,85,247,0.9)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(tt.name, px, py - 16);
      ctx.fillStyle = 'rgba(200,180,255,0.6)';
      ctx.fillText(tt.desc, px, py - 26);
    }
  }
}

export function renderDistractions(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const d of game.distractions) {
    if (!onScreen(d.x, d.y, 50, game)) continue;
    const px = sx(d.x, game), py = sy(d.y, game);
    const pulse = Math.sin(time * 6) * 0.2 + 0.5;
    ctx.beginPath(); ctx.arc(px, py, DISTRACTION_RANGE, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(168,85,247,${pulse * 0.08})`; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(168,85,247,${pulse * 0.3})`; ctx.fill();
    drawToolShape(ctx, px, py, d.type, 10, time);
    const pct = d.timer / DISTRACTION_DURATION;
    ctx.beginPath(); ctx.arc(px, py, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = 'rgba(168,85,247,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const a = time * 3 + i * 2.094, r = 20 + Math.sin(time * 4 + i) * 5;
      ctx.fillStyle = `rgba(196,181,253,${pulse})`; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('~', px + Math.cos(a) * r, py + Math.sin(a) * r);
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
    ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.fillStyle = lt.glow; ctx.fill();
    drawLootShape(ctx, px, py, l.type, 10);
    if (game.state === 'playing' && dist(game.player, l) < T * 1.2) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('GOLDEN BEBE', px, py - 18);
      if (!game.player.looting && dist(game.player, l) < T * 0.9) {
        ctx.fillStyle = 'rgba(255,255,200,0.7)';
        ctx.fillText('[E] Grab', px, py - 28);
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
      // Already searched: dim, open appearance
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(px - 10, py - 8, 20, 16);
      ctx.strokeStyle = '#3a3a4a';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 10, py - 8, 20, 16);
    } else {
      // Unsearched: glowing, inviting
      const glow = Math.sin(time * 2 + c.x) * 0.1 + 0.3;
      ctx.fillStyle = '#3d2e1c';
      ctx.fillRect(px - 10, py - 8, 20, 16);
      ctx.strokeStyle = `rgba(251,191,36,${glow})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 10, py - 8, 20, 16);
      // Latch
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(px - 2, py - 8, 4, 3);

      if (dist(game.player, c) < T * 1.2) {
        ctx.fillStyle = 'rgba(251,191,36,0.8)';
        ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('[E] Search', px, py - 14);
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
    ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250,204,21,0.2)'; ctx.fill();

    // Key card shape
    const colors: Record<string, string> = { keyA: '#ef4444', keyB: '#3b82f6', keyC: '#22c55e' };
    ctx.fillStyle = colors[k.type] || '#facc15';
    ctx.fillRect(px - 8, py - 5, 16, 10);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 8, py - 5, 16, 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(k.type.replace('key', ''), px, py);

    if (dist(game.player, k) < T * 1.2) {
      ctx.fillStyle = 'rgba(250,204,21,0.9)';
      ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('KEY ' + k.type.replace('key', ''), px, py - 16);
    }
  }
}

export function renderGearPickups(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const g of game.gearPickups) {
    if (g.collected || !onScreen(g.x, g.y, 40, game)) continue;
    const bob = Math.sin(time * 2 + g.x + g.y) * 1.5;
    const px = sx(g.x, game), py = sy(g.y + bob, game);

    ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(74,222,128,0.15)'; ctx.fill();

    if (g.type === 'sneakers') {
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(px - 5, py - 3, 10, 6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(px - 4, py, 3, 2);
    } else {
      ctx.fillStyle = '#1e1e2e';
      ctx.beginPath(); ctx.ellipse(px - 4, py, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px + 4, py, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px - 4, py - 3); ctx.lineTo(px + 4, py - 3); ctx.stroke();
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
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(cpx, cpy - 5);
      ctx.lineTo(cpx + 5, cpy + 4);
      ctx.lineTo(cpx - 5, cpy + 4);
      ctx.closePath(); ctx.fill();
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
    if (useSprites) {
      const moving = b.pauseTimer <= 0 && !stunned;
      let frameIndex: number;
      if (moving) {
        frameIndex = Math.floor(time / FRAME_DURATION) % 4;
      } else {
        // Idle: alternate between a lean frame and neutral based on facing
        const facingLeft = Math.cos(b.facing) < 0;
        const tick = Math.floor(time / 0.4) % 2;
        // frames: 0=right-step, 1=neutral, 2=left-step, 3=neutral
        frameIndex = facingLeft
          ? (tick === 0 ? 3 : 2)   // neutral <-> left-step
          : (tick === 0 ? 1 : 0);  // neutral <-> right-step
      }
      const img = getBabyFrame(frameIndex);
      const half = SPRITE_SIZE / 2;

      ctx.save();
      ctx.translate(bx, by);
      // Rotate sprite to match facing direction. Sprites face "up" so offset by pi/2.
      ctx.rotate(b.facing + Math.PI / 2);
      if (stunned) ctx.globalAlpha = 0.5;

      // Tint per type
      if (b.type === 'toddler' && !stunned) {
        ctx.filter = b.chasing ? 'hue-rotate(-40deg) saturate(1.8)' : 'hue-rotate(-30deg) saturate(1.4)';
      } else if (b.type === 'stawler' && !stunned) {
        ctx.filter = 'hue-rotate(280deg) saturate(1.3)';
      }

      ctx.drawImage(img, -half, -half, SPRITE_SIZE, SPRITE_SIZE);
      ctx.filter = 'none';
      ctx.restore();
    } else {
      // Fallback procedural rendering
      const colors: Record<string, string> = { crawler: '#fb923c', stawler: '#ec4899', toddler: '#dc2626' };
      ctx.fillStyle = stunned ? '#888' : (colors[b.type] || '#fb923c');
      ctx.beginPath(); ctx.arc(bx, by, BABY_RADIUS, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fdba74'; ctx.lineWidth = 1.5; ctx.stroke();
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
          ctx.fillStyle = '#fde047'; ctx.beginPath();
          ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + 4, cy + 3); ctx.lineTo(cx - 4, cy + 3);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.fillStyle = '#fde047'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const a = time * 5 + i * 2.094;
        ctx.fillText('*', bx + Math.cos(a) * (indY + 6), by + Math.sin(a) * (indY + 6) - 4);
      }
    } else if (b.distracted) {
      ctx.fillStyle = '#f472b6'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('\u2665', bx, by - indY);
    }

    // Alert indicators
    if (!stunned && !b.distracted && canBabySee(game, b) && !game.player.hiding) {
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('!', bx, by - indY);
    }
    if (b.type === 'stawler' && b.chasing && !stunned) {
      ctx.fillStyle = '#f472b6'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('?!', bx, by - indY);
    }
    if (b.type === 'toddler' && b.chasing && !stunned) {
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('!!', bx, by - indY);
    }
  }
}

export function renderPlayer(ctx: CanvasRenderingContext2D, game: Game): void {
  const p = game.player;
  const time = game.time;
  const bob = Math.sin(time * 8) * ((p.vx || p.vy) ? 1.5 : 0);
  const px = sx(p.x, game), py = sy(p.y, game) + bob;

  if (p.hiding) {
    const stPct = p.peekStamina / PEEKABOO_MAX;
    const flicker = stPct < 0.3 ? (Math.sin(time * 12) * 0.15 + 0.45) : 0.6;
    ctx.globalAlpha = flicker;
    ctx.fillStyle = stPct < 0.3 ? '#a3e635' : '#22c55e';
    ctx.beginPath(); ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(px, py, PLAYER_RADIUS * 0.5, -0.8, 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, PLAYER_RADIUS * 0.5, Math.PI - 0.8, Math.PI + 0.8); ctx.stroke();
    const ringSize = stPct < 0.3 ? (PLAYER_RADIUS + 3 + Math.sin(time * 8) * 3) : (PLAYER_RADIUS + 6 + Math.sin(time * 4) * 2);
    ctx.strokeStyle = stPct < 0.3 ? 'rgba(239,68,68,0.4)' : 'rgba(74,222,128,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(px, py, ringSize, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = p.sprinting ? '#86efac' : '#4ade80';
    ctx.beginPath(); ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; ctx.stroke();
    const eo = 4;
    const e1x = px + Math.cos(p.facing - 0.4) * eo, e1y = py + Math.sin(p.facing - 0.4) * eo;
    const e2x = px + Math.cos(p.facing + 0.4) * eo, e2y = py + Math.sin(p.facing + 0.4) * eo;
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.arc(e1x, e1y, 2.5, 0, Math.PI * 2); ctx.arc(e2x, e2y, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1e2e'; ctx.beginPath();
    ctx.arc(e1x + Math.cos(p.facing) * 0.8, e1y + Math.sin(p.facing) * 0.8, 1.2, 0, Math.PI * 2);
    ctx.arc(e2x + Math.cos(p.facing) * 0.8, e2y + Math.sin(p.facing) * 0.8, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  if (p.looting) {
    const pct = 1 - p.lootTimer / LOOT_TIME;
    const bw = 30, bh = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(px - bw / 2, py - PLAYER_RADIUS - 14, bw, bh);
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(px - bw / 2, py - PLAYER_RADIUS - 14, bw * pct, bh);
  }

  if (p.searching) {
    const pct = 1 - p.searchTimer / SEARCH_TIME;
    const bw = 30, bh = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(px - bw / 2, py - PLAYER_RADIUS - 14, bw, bh);
    ctx.fillStyle = '#a78bfa'; ctx.fillRect(px - bw / 2, py - PLAYER_RADIUS - 14, bw * pct, bh);
  }
}
