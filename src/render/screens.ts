import { T, VIEW_W, VIEW_H, TOTAL_LOOT } from '../config';
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

export function renderTitle(ctx: CanvasRenderingContext2D): void {
  for (let y = 0; y < 18; y++) {
    for (let x = 0; x < 25; x++) {
      if ((x + y) % 3 === 0) {
        ctx.fillStyle = 'rgba(58,58,92,0.3)';
        ctx.fillRect(x * T, y * T, T, T);
      }
    }
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 48px monospace';
  ctx.fillText('BEBE HEIST', VIEW_W / 2, 100);
  ctx.fillStyle = '#fb923c'; ctx.font = '14px monospace';
  ctx.fillText('Steal the Golden Bebe. Don\'t get caught.', VIEW_W / 2, 130);
  ctx.fillStyle = '#fb923c'; ctx.font = '36px monospace';
  ctx.fillText('(o_o)', VIEW_W / 2, 190);

  ctx.fillStyle = '#e5e7eb'; ctx.font = '10px monospace';
  const lines = [
    'Infiltrate the baby bank. Find 3 keycards. Reach the vault.',
    'Babies have no object permanence -- hide your face and they forget you.', '',
    'WASD - Move    SHIFT - Sprint (noisy!)    HOLD SPACE - Peekaboo',
    'CLICK - Throw cheese    E - Interact (loot/search/doors)',
    'Q - Use tool    HOLD Q - Tool wheel', '',
    'PINK stawlers charge at you while you hide. Cheese or run!',
    'RED toddler hunts you down. Only items can stop it!', '',
    'DOORS: E to open quietly. Sprint into them to SLAM (stuns nearby babies).',
    'CONTAINERS: E to search. Find cheese, gear, or... poop.',
    'KEYS: A (restricted zone) | B+C (vault). All 3 open the final door.',
  ];
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 230 + i * 16));

  ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 16px monospace';
  ctx.fillText('PRESS SPACE TO START', VIEW_W / 2, VIEW_H - 20);
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
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 10);
  ctx.stroke();

  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 44px monospace';
  ctx.fillText('BUSTED!', VIEW_W / 2, cardY + 58);
  ctx.fillStyle = '#fca5a5'; ctx.font = '14px monospace';
  ctx.fillText('The baby saw your face and started crying.', VIEW_W / 2, cardY + 98);
  ctx.fillStyle = '#e5e7eb'; ctx.font = '12px monospace';
  ctx.fillText('Keys: ' + game.player.keys.length + '/3 | Golden Bebe: ' + (game.player.loot > 0 ? 'YES' : 'NO'), VIEW_W / 2, cardY + 124);

  if (game.gameOverTimer > RETRY_APPEAR_TIME) {
    const btn = retryButtonRect();
    const pressT = 1 - Math.max(0, Math.min(1, game.retryPressTimer / RETRY_PRESS_DURATION));
    const press = Math.sin(pressT * Math.PI);
    const pressY = press * 4;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    roundRect(ctx, btn.x, btn.y + 5, btn.w, btn.h, 8);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    roundRect(ctx, btn.x, btn.y + pressY, btn.w, btn.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    roundRect(ctx, btn.x, btn.y + pressY, btn.w, btn.h, 8);
    ctx.stroke();

    ctx.fillStyle = '#fdba74'; ctx.font = 'bold 14px monospace';
    ctx.fillText('RETRY HEIST', VIEW_W / 2, btn.y + pressY + 24);
    ctx.fillStyle = '#cbd5f5'; ctx.font = '11px monospace';
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
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 48px monospace';
  ctx.fillText('ESCAPED!', VIEW_W / 2, VIEW_H / 2 - 40);
  ctx.fillStyle = '#86efac'; ctx.font = '14px monospace';
  ctx.fillText('You stole the Golden Bebe and got away clean.', VIEW_W / 2, VIEW_H / 2 + 10);
  ctx.fillStyle = '#fbbf24'; ctx.font = '12px monospace';
  ctx.fillText('Cheese remaining: ' + game.player.cheese + ' | Tools: ' + game.player.tools.length, VIEW_W / 2, VIEW_H / 2 + 50);
  ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
  ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 14px monospace';
  ctx.fillText('PRESS R TO PLAY AGAIN', VIEW_W / 2, VIEW_H / 2 + 90);
  ctx.globalAlpha = 1;
}
