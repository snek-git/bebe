import {
  T, BABY_RADIUS, PLAYER_RADIUS, LOOT_TIME, PEEKABOO_MAX, CHEESE_SPEED,
  TV_DURATION, TV_RANGE, DISTRACTION_DURATION, DISTRACTION_RANGE,
  VIEW_W, VIEW_H, LOOT_TYPES, TOOL_TYPES,
} from '../config';
import { dist } from '../utils';
import { canBabySee } from '../update/babies';
import { drawToolShape, drawLootShape } from './shapes';
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
      ctx.fillText(lt.name, px, py - 18);
      if (!game.player.looting && dist(game.player, l) < T * 0.9) {
        ctx.fillStyle = 'rgba(255,255,200,0.7)';
        ctx.fillText('[E] Grab', px, py - 28);
      }
    }
  }
}

export function renderCheeses(ctx: CanvasRenderingContext2D, game: Game): void {
  for (const c of game.cheeses) {
    if ((c.stuckBaby && c.landed) || !onScreen(c.x, c.y, 20, game)) continue;
    if (c.isPacifier) {
      drawToolShape(ctx, sx(c.x, game), sy(c.y, game), 'pacifier', 7, game.time);
    } else {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(sx(c.x, game), sy(c.y, game) - 5);
      ctx.lineTo(sx(c.x, game) + 5, sy(c.y, game) + 4);
      ctx.lineTo(sx(c.x, game) - 5, sy(c.y, game) + 4);
      ctx.closePath(); ctx.fill();
    }
  }
}

export function renderBabies(ctx: CanvasRenderingContext2D, game: Game): void {
  const time = game.time;
  for (const b of game.babies) {
    if (!onScreen(b.x, b.y, 40, game)) continue;
    const stunned = b.stunTimer > 0;
    const bx = sx(b.x, game), by = sy(b.y, game);

    if (b.crawler) {
      ctx.fillStyle = stunned ? '#e879a0' : (b.chasing ? '#f472b6' : '#ec4899');
      ctx.beginPath(); ctx.ellipse(bx, by, BABY_RADIUS + 2, BABY_RADIUS - 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 1.5; ctx.stroke();
      if (!stunned) {
        const hDist = BABY_RADIUS + 4;
        ctx.fillStyle = '#fbbcce'; ctx.beginPath();
        ctx.arc(bx + Math.cos(b.facing - 0.6) * hDist, by + Math.sin(b.facing - 0.6) * hDist, 3, 0, Math.PI * 2);
        ctx.arc(bx + Math.cos(b.facing + 0.6) * hDist, by + Math.sin(b.facing + 0.6) * hDist, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = stunned ? '#f97316' : '#fb923c';
      ctx.beginPath(); ctx.arc(bx, by, BABY_RADIUS, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fdba74'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    const eo = 4;
    const e1x = bx + Math.cos(b.facing - 0.4) * eo, e1y = by + Math.sin(b.facing - 0.4) * eo;
    const e2x = bx + Math.cos(b.facing + 0.4) * eo, e2y = by + Math.sin(b.facing + 0.4) * eo;

    if (stunned) {
      ctx.strokeStyle = b.crawler ? '#831843' : '#7c2d12'; ctx.lineWidth = 1.5;
      for (const [ex, ey] of [[e1x, e1y], [e2x, e2y]]) {
        ctx.beginPath(); ctx.moveTo(ex - 2, ey - 2); ctx.lineTo(ex + 2, ey + 2);
        ctx.moveTo(ex + 2, ey - 2); ctx.lineTo(ex - 2, ey + 2); ctx.stroke();
      }
      const coh = game.cheeses.find(c => c.stuckBaby === b && c.landed);
      if (coh) {
        const cx = bx + Math.cos(b.facing) * (BABY_RADIUS + 2);
        const cy = by + Math.sin(b.facing) * (BABY_RADIUS + 2);
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
        ctx.fillText('*', bx + Math.cos(a) * 16, by + Math.sin(a) * 16 - 4);
      }
    } else {
      if (b.distracted) {
        ctx.fillStyle = '#f472b6'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('\u2665', e1x, e1y); ctx.fillText('\u2665', e2x, e2y);
      } else {
        ctx.fillStyle = '#1e1e2e'; ctx.beginPath();
        ctx.arc(e1x, e1y, 2.5, 0, Math.PI * 2); ctx.arc(e2x, e2y, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.arc(e1x + Math.cos(b.facing), e1y + Math.sin(b.facing), 1, 0, Math.PI * 2);
        ctx.arc(e2x + Math.cos(b.facing), e2y + Math.sin(b.facing), 1, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (!stunned && !b.distracted && canBabySee(game, b) && !game.player.hiding) {
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('!', bx, by - BABY_RADIUS - 6);
    }
    if (b.crawler && b.chasing && !stunned) {
      ctx.fillStyle = '#f472b6'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('?!', bx, by - BABY_RADIUS - 6);
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
    ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2); ctx.fill();
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
}
