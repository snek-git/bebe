import { T, VIEW_W, VIEW_H, TOTAL_LOOT } from '../config';
import { SK, sketchyRoundRect, crayonText } from './sketchy';
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
        ctx.fillStyle = 'rgba(20,57,94,0.25)';
        ctx.fillRect(x * T, y * T, T, T);
      }
    }
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  crayonText(ctx, 'BEBE HEIST', VIEW_W / 2, 100, {
    fill: SK.highlight, font: 'bold 48px monospace', jitterAmt: 1.5,
  });
  crayonText(ctx, 'Steal the Golden Bebe. Don\'t get caught.', VIEW_W / 2, 130, {
    fill: SK.accent, font: '14px monospace',
  });
  crayonText(ctx, '(o_o)', VIEW_W / 2, 190, {
    fill: SK.accent, font: '36px monospace', jitterAmt: 1.2,
  });

  ctx.fillStyle = SK.primary; ctx.font = '10px monospace';
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
  crayonText(ctx, 'PRESS SPACE TO START', VIEW_W / 2, VIEW_H - 20, {
    fill: SK.highlight, font: 'bold 16px monospace',
  });
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
    lineWidth: 2,
  });

  crayonText(ctx, 'BUSTED!', VIEW_W / 2, cardY + 58, {
    fill: SK.warning, font: 'bold 44px monospace', jitterAmt: 1.5,
  });
  crayonText(ctx, 'The baby saw your face and started crying.', VIEW_W / 2, cardY + 98, {
    fill: SK.primary, font: '14px monospace',
  });
  ctx.fillStyle = SK.primary; ctx.font = '12px monospace';
  ctx.fillText('Keys: ' + game.player.keys.length + '/3 | Golden Bebe: ' + (game.player.loot > 0 ? 'YES' : 'NO'), VIEW_W / 2, cardY + 124);

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
      lineWidth: 2,
    });

    crayonText(ctx, 'RETRY HEIST', VIEW_W / 2, btn.y + pressY + 24, {
      fill: SK.highlight, font: 'bold 14px monospace',
    });
    ctx.fillStyle = SK.dim; ctx.font = '11px monospace';
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
    lineWidth: 2,
  });

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  crayonText(ctx, 'ESCAPED!', VIEW_W / 2, cardY + 58, {
    fill: SK.highlight, font: 'bold 48px monospace', jitterAmt: 1.5,
  });
  crayonText(ctx, 'You stole the Golden Bebe and got away clean.', VIEW_W / 2, cardY + 90, {
    fill: SK.primary, font: '14px monospace',
  });
  ctx.fillStyle = SK.accent; ctx.font = '12px monospace';
  ctx.fillText('Cheese remaining: ' + game.player.cheese + ' | Tools: ' + game.player.tools.length, VIEW_W / 2, cardY + 118);
  ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
  crayonText(ctx, 'PRESS R TO PLAY AGAIN', VIEW_W / 2, cardY + 154, {
    fill: SK.highlight, font: 'bold 14px monospace',
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
    lineWidth: 2,
  });

  crayonText(ctx, 'PAUSED', VIEW_W / 2, cardY + 55, {
    fill: SK.highlight, font: 'bold 36px monospace', jitterAmt: 1.2,
  });
  crayonText(ctx, 'Press ESC to resume', VIEW_W / 2, cardY + 90, {
    fill: SK.dim, font: '12px monospace', jitterAmt: 0.5, passes: 2,
  });
}
