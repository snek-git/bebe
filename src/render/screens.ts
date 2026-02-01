import { T, VIEW_W, VIEW_H, TOTAL_LOOT } from '../config';
import { SK, sketchyRoundRect, crayonText, crayonCircle, sketchyLine } from './sketchy';
import { getPlayerIdle, getPlayerWalkFrame, getPlayerHide } from '../sprites';
import type { Game } from '../types';

type Rect = { x: number; y: number; w: number; h: number };

export const RETRY_APPEAR_TIME = 0.8;
export const RETRY_PRESS_DURATION = 0.14;
export const RETRY_FADE_DURATION = 0.25;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function retryButtonRect(): Rect {
  const cardW = 340 * 1.13;
  const cardH = 210 * 1.13;
  const cardX = VIEW_W / 2 - cardW / 2;
  const cardY = VIEW_H / 2 - cardH / 2;
  const w = 180;
  const h = 36;
  return { x: VIEW_W / 2 - w / 2, y: cardY + cardH - 52, w, h };
}

// ─── Seeded floating doodle data for title background ───
const _tdS = (n: number): number => { const v = Math.sin(n) * 43758.5453; return v - Math.floor(v); };
const _titleDoodles = Array.from({ length: 16 }, (_, i) => ({
  x0: _tdS(i * 127.1 + 3.7) * VIEW_W,
  y0: _tdS(i * 269.5 + 18.3) * VIEW_H,
  sp: 10 + _tdS(i * 53.3 + 7.1) * 20,
  dx: (_tdS(i * 31.7 + 91.2) - 0.5) * 30,
  sz: 6 + _tdS(i * 97.3 + 41.7) * 12,
  kind: i % 5,
  r0: _tdS(i * 173.9 + 61.3) * Math.PI * 2,
  rs: (_tdS(i * 211.3 + 33.7) - 0.5) * 1.5,
}));

export function renderTitle(ctx: CanvasRenderingContext2D): void {
  const t = Date.now() / 1000;
  const cx = VIEW_W / 2;

  // ── Animated breathing tile background ──
  for (let ty = 0; ty < 18; ty++) {
    for (let tx = 0; tx < 25; tx++) {
      if ((tx + ty) % 3 === 0) {
        const wave = Math.sin(t * 0.8 + tx * 0.3 + ty * 0.4) * 0.1;
        ctx.fillStyle = `rgba(20,57,94,${0.18 + wave})`;
        ctx.fillRect(tx * T, ty * T, T, T);
      }
    }
  }

  // ── Floating doodles (baby faces, cheese, stars, hearts, keys) ──
  for (const d of _titleDoodles) {
    const y = ((d.y0 - t * d.sp) % (VIEW_H + 40) + VIEW_H + 40) % (VIEW_H + 40) - 20;
    const x = d.x0 + Math.sin(t * 0.5 + d.r0) * d.dx;
    const rot = d.r0 + t * d.rs;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.1;
    switch (d.kind) {
      case 0: // Baby face
        ctx.fillStyle = '#fb923c';
        ctx.beginPath(); ctx.arc(0, 0, d.sz * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath();
        ctx.arc(-d.sz * 0.15, -d.sz * 0.1, 1.2, 0, Math.PI * 2);
        ctx.arc(d.sz * 0.15, -d.sz * 0.1, 1.2, 0, Math.PI * 2); ctx.fill();
        break;
      case 1: // Cheese wedge
        ctx.fillStyle = '#fde047';
        ctx.beginPath(); ctx.moveTo(0, -d.sz * 0.4);
        ctx.lineTo(d.sz * 0.4, d.sz * 0.3); ctx.lineTo(-d.sz * 0.4, d.sz * 0.3);
        ctx.closePath(); ctx.fill();
        break;
      case 2: // Star
        ctx.fillStyle = '#f0ea9e'; ctx.font = `${d.sz}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('\u2605', 0, 0);
        break;
      case 3: // Heart
        ctx.fillStyle = '#ec4899'; ctx.font = `${d.sz}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('\u2665', 0, 0);
        break;
      case 4: // Key
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(-d.sz * 0.15, 0, d.sz * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(0, -d.sz * 0.08, d.sz * 0.4, d.sz * 0.16);
        break;
    }
    ctx.restore();
  }

  // ── Radial vignette ──
  const grad = ctx.createRadialGradient(cx, VIEW_H * 0.35, 80, cx, VIEW_H * 0.35, VIEW_W * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // ── Wave title: per-letter bounce with squash & stretch ──
  const title = 'BEBE HEIST';
  const titleY = 90;
  ctx.font = 'bold 54px monospace'; ctx.textAlign = 'center';
  const charW = ctx.measureText('M').width;
  const startX = cx - (title.length * charW) / 2 + charW / 2;

  // Drop shadow pass
  for (let i = 0; i < title.length; i++) {
    if (title[i] === ' ') continue;
    const lx = startX + i * charW;
    const wave = Math.sin(t * 3 + i * 0.6) * 8;
    const rot = Math.sin(t * 2.5 + i * 0.8) * 0.03;
    ctx.save();
    ctx.translate(lx + 3, titleY + wave + 3);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000'; ctx.font = 'bold 54px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(title[i], 0, 0);
    ctx.restore();
  }

  // Main letter pass
  for (let i = 0; i < title.length; i++) {
    if (title[i] === ' ') continue;
    const lx = startX + i * charW;
    const wave = Math.sin(t * 3 + i * 0.6) * 8;
    const rot = Math.sin(t * 2.5 + i * 0.8) * 0.03;
    const sq = 1 + Math.sin(t * 4 + i * 1.1) * 0.04;
    ctx.save();
    ctx.translate(lx, titleY + wave);
    ctx.rotate(rot);
    ctx.scale(1 / sq, sq);
    crayonText(ctx, title[i], 0, 0, {
      fill: SK.highlight, font: 'bold 54px monospace', jitterAmt: 0.8,
    });
    ctx.restore();
  }

  // ── Subtitle with gentle pulse ──
  ctx.globalAlpha = Math.sin(t * 1.5) * 0.12 + 0.88;
  crayonText(ctx, 'Steal the Golden Bebe. Don\'t get caught.', cx, 133, {
    fill: SK.accent, font: '16px monospace', jitterAmt: 0.3,
  });
  ctx.globalAlpha = 1;

  // ── Mascot: actual player sprite with walk/hide animation ──
  const mascotY = 178;
  const bob = Math.sin(t * 2) * 2;
  const peekWave = Math.sin(t * 1.5);
  const isHiding = peekWave < -0.2;
  const my = mascotY + bob;
  const spriteSize = 40;
  const facing = Math.sin(t * 0.7) * 0.4 - Math.PI / 2;

  let mascotImg: HTMLImageElement | null = null;
  if (isHiding) {
    mascotImg = getPlayerHide();
  } else {
    const frameIdx = Math.floor(t / 0.15) % 4;
    mascotImg = getPlayerWalkFrame(frameIdx);
  }

  if (mascotImg) {
    ctx.save();
    ctx.translate(cx, my);
    ctx.rotate(facing);
    if (isHiding) ctx.globalAlpha = 0.6;
    ctx.drawImage(mascotImg, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ── Two-column instruction card ──
  const cardW = 680, cardH = 200;
  const cardX = cx - cardW / 2;
  const cardY = 215;

  sketchyRoundRect(ctx, cardX, cardY, cardW, cardH, 8, {
    fill: 'rgba(14,14,26,0.75)',
    stroke: SK.cardStroke,
    jitterAmt: 0.6,
  });

  // Left column: Controls
  crayonText(ctx, 'CONTROLS', (cardX + cx) / 2, cardY + 24, {
    fill: SK.highlight, font: 'bold 12px monospace', jitterAmt: 0.3,
  });
  ctx.textAlign = 'left'; ctx.font = '11px monospace'; ctx.fillStyle = SK.primary;
  const lcx = cardX + 25;
  const ctrlLines = [
    'WASD          Move',
    'SHIFT         Sprint (noisy!)',
    'HOLD SPACE    Peekaboo (hide face)',
    'CLICK         Throw cheese',
    'E             Interact / Search / Doors',
    'Q / HOLD Q    Use tool / Tool wheel',
  ];
  ctrlLines.forEach((l, i) => ctx.fillText(l, lcx, cardY + 46 + i * 17));

  // Divider
  sketchyLine(ctx, cx, cardY + 14, cx, cardY + cardH - 14, {
    stroke: SK.cardStroke, lineWidth: 2, jitterAmt: 0.5,
  });

  // Right column: Intel (enemy lines colored by type)
  crayonText(ctx, 'INTEL', (cx + cardX + cardW) / 2, cardY + 24, {
    fill: SK.highlight, font: 'bold 12px monospace', jitterAmt: 0.3,
  });
  const rcx = cx + 20;
  const intelLines: { text: string; color: string }[] = [
    { text: 'ORANGE crawlers patrol set paths', color: '#fb923c' },
    { text: 'PINK stawlers charge while you hide', color: '#ec4899' },
    { text: 'RED boss baby hunts you down', color: '#dc2626' },
    { text: '', color: '' },
    { text: 'Find 3 keycards to open the vault', color: SK.primary },
    { text: 'Sprint into doors to SLAM (stun!)', color: SK.primary },
    { text: 'Search containers for gear & items', color: SK.primary },
  ];
  ctx.textAlign = 'left'; ctx.font = '11px monospace';
  intelLines.forEach((l, i) => {
    if (!l.text) return;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, rcx, cardY + 46 + i * 17);
  });

  // Motto at card bottom
  ctx.globalAlpha = 0.6;
  crayonText(ctx, 'Babies have no object permanence \u2014 hide your face and they forget you.', cx, cardY + cardH - 14, {
    fill: SK.dim, font: '10px monospace', jitterAmt: 0.2,
  });
  ctx.globalAlpha = 1;

  // ── Controls help ──
  ctx.textAlign = 'center'; ctx.fillStyle = SK.dim; ctx.font = '10px monospace';
  ctx.fillText('R: Restart at any time', cx, VIEW_H - 8);

  // ── PRESS SPACE TO START with bounce, glow & sparkles ──
  const promptY = VIEW_H - 42;
  const bounce = Math.sin(t * 4) * 4;
  const pScale = 1 + Math.sin(t * 4) * 0.04;

  ctx.save();
  ctx.translate(cx, promptY + bounce);
  ctx.scale(pScale, pScale);
  ctx.shadowColor = 'rgba(240,234,158,0.5)';
  ctx.shadowBlur = 8 + Math.sin(t * 3) * 4;
  crayonText(ctx, 'PRESS SPACE TO START', 0, 0, {
    fill: SK.highlight, font: 'bold 20px monospace', jitterAmt: 0.4,
  });
  ctx.shadowBlur = 0;
  ctx.restore();

  // Orbiting sparkles
  for (let i = 0; i < 6; i++) {
    const sa = t * 2 + i * (Math.PI * 2 / 6);
    const sr = 130 + Math.sin(t * 3 + i * 1.5) * 15;
    const spx = cx + Math.cos(sa) * sr;
    const spy = promptY + bounce + Math.sin(sa) * 10;
    ctx.globalAlpha = (Math.sin(t * 5 + i * 2.1) + 1) / 2 * 0.4;
    ctx.fillStyle = SK.highlight; ctx.font = '8px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u2726', spx, spy);
  }
  ctx.globalAlpha = 1;
}

export function renderGameOver(ctx: CanvasRenderingContext2D, game: Game): void {
  if (game.gameOverTimer < 0.3) return;

  ctx.fillStyle = `rgba(0,0,0,${Math.min(0.6, (game.gameOverTimer - 0.3) * 2)})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const cardW = 340 * 1.13;
  const cardH = 210 * 1.13;
  const cardX = VIEW_W / 2 - cardW / 2;
  const cardY = VIEW_H / 2 - cardH / 2;

  sketchyRoundRect(ctx, cardX, cardY, cardW, cardH, 10, {
    fill: SK.cardFill,
    stroke: SK.cardStroke,
    jitterAmt: 0.8,
  });

  crayonText(ctx, 'BUSTED!', VIEW_W / 2, cardY + 58, {
    fill: SK.warning, font: 'bold 48px monospace', jitterAmt: 0.8,
  });
  crayonText(ctx, 'The baby saw your face and started crying.', VIEW_W / 2, cardY + 100, {
    fill: SK.primary, font: '15px monospace', jitterAmt: 0.3,
  });
  ctx.fillStyle = SK.primary; ctx.font = '13px monospace';
  ctx.fillText('Keys: ' + game.player.keys.length + '/3 | Golden Bebe: ' + (game.player.loot > 0 ? 'YES' : 'NO'), VIEW_W / 2, cardY + 128);

  if (game.gameOverTimer > RETRY_APPEAR_TIME) {
    const btn = retryButtonRect();
    const pressT = 1 - Math.max(0, Math.min(1, game.retryPressTimer / RETRY_PRESS_DURATION));
    const press = Math.sin(pressT * Math.PI);
    const pressY = press * 4;

    // Button shadow
    sketchyRoundRect(ctx, btn.x, btn.y + 5, btn.w, btn.h, 8, {
      fill: 'rgba(20,57,94,0.9)',
    });

    // Button face
    sketchyRoundRect(ctx, btn.x, btn.y + pressY, btn.w, btn.h, 8, {
      fill: SK.cardFill,
      stroke: SK.accent,
      jitterAmt: 0.6,
    });

    crayonText(ctx, 'RETRY HEIST', VIEW_W / 2, btn.y + pressY + 24, {
      fill: SK.highlight, font: 'bold 16px monospace', jitterAmt: 0.3,
    });
    ctx.fillStyle = SK.dim; ctx.font = '12px monospace';
    ctx.fillText('Press R or click', VIEW_W / 2, btn.y - 10);
  }

  if (game.retryFadeTimer > 0) {
    const fade = 1 - Math.max(0, Math.min(1, game.retryFadeTimer / RETRY_FADE_DURATION));
    ctx.fillStyle = `rgba(0,0,0,${fade * 0.85})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

export function renderWinScreen(ctx: CanvasRenderingContext2D, game: Game): void {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const cardW = 400;
  const cardH = 180;
  const cardX = VIEW_W / 2 - cardW / 2;
  const cardY = VIEW_H / 2 - cardH / 2;

  sketchyRoundRect(ctx, cardX, cardY, cardW, cardH, 10, {
    fill: SK.cardFill,
    stroke: SK.cardStroke,
    jitterAmt: 0.8,
  });

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  crayonText(ctx, 'ESCAPED!', VIEW_W / 2, cardY + 58, {
    fill: SK.highlight, font: 'bold 52px monospace', jitterAmt: 0.8,
  });
  crayonText(ctx, 'You stole the Golden Bebe and got away clean.', VIEW_W / 2, cardY + 92, {
    fill: SK.primary, font: '15px monospace', jitterAmt: 0.3,
  });
  ctx.fillStyle = SK.accent; ctx.font = '13px monospace';
  ctx.fillText('Cheese remaining: ' + game.player.cheese + ' | Tools: ' + game.player.tools.length, VIEW_W / 2, cardY + 120);
  ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
  crayonText(ctx, 'PRESS R TO PLAY AGAIN', VIEW_W / 2, cardY + 156, {
    fill: SK.highlight, font: 'bold 16px monospace', jitterAmt: 0.4,
  });
  ctx.globalAlpha = 1;
}

export function renderPauseScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const cardW = 280;
  const cardH = 120;
  const cardX = VIEW_W / 2 - cardW / 2;
  const cardY = VIEW_H / 2 - cardH / 2;

  sketchyRoundRect(ctx, cardX, cardY, cardW, cardH, 10, {
    fill: SK.cardFill,
    stroke: SK.cardStroke,
    jitterAmt: 0.8,
  });

  crayonText(ctx, 'PAUSED', VIEW_W / 2, cardY + 55, {
    fill: SK.highlight, font: 'bold 40px monospace', jitterAmt: 0.6,
  });
  crayonText(ctx, 'Press ESC to resume', VIEW_W / 2, cardY + 90, {
    fill: SK.dim, font: '14px monospace', jitterAmt: 0.3, passes: 2,
  });
}
