import { T, VIEW_W, VIEW_H, TOTAL_LOOT } from '../config';
import type { Game } from '../types';

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
  ctx.fillText('BEBE HEIST', VIEW_W / 2, 120);
  ctx.fillStyle = '#fb923c'; ctx.font = '16px monospace';
  ctx.fillText('A Peekaboo Stealth Game', VIEW_W / 2, 155);
  ctx.fillStyle = '#fb923c'; ctx.font = '36px monospace';
  ctx.fillText('(o_o)', VIEW_W / 2, 220);

  ctx.fillStyle = '#e5e7eb'; ctx.font = '11px monospace';
  const lines = [
    'Rob the bank. Don\'t let the babies see your face.',
    'They have no object permanence.', '',
    'WASD - Move       HOLD SPACE - Peekaboo (limited breath!)',
    'CLICK - Throw cheese    E - Grab loot    Q - Use tool', '',
    'Hide your face: they forget you exist. But watch your breath!',
    'PINK crawlers approach you while you hide. Cheese or run!', '',
    'TOOLS: iPad (drop as distraction) | Remote (turn on TV for cocomelon)',
    '       Pacifier (throw at baby, calms them longer)',
  ];
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 270 + i * 18));

  ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 16px monospace';
  ctx.fillText('PRESS SPACE TO START', VIEW_W / 2, VIEW_H - 30);
  ctx.globalAlpha = 1;
}

export function renderGameOver(ctx: CanvasRenderingContext2D, game: Game): void {
  if (game.gameOverTimer < 0.3) return;

  ctx.fillStyle = `rgba(0,0,0,${Math.min(0.6, (game.gameOverTimer - 0.3) * 2)})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 48px monospace';
  ctx.fillText('BUSTED!', VIEW_W / 2, VIEW_H / 2 - 40);
  ctx.fillStyle = '#fca5a5'; ctx.font = '14px monospace';
  ctx.fillText('The baby saw your face and started crying.', VIEW_W / 2, VIEW_H / 2 + 10);
  ctx.fillStyle = '#e5e7eb'; ctx.font = '12px monospace';
  ctx.fillText('Loot grabbed: ' + game.player.loot + '/' + TOTAL_LOOT, VIEW_W / 2, VIEW_H / 2 + 50);

  if (game.gameOverTimer > 1.5) {
    ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 14px monospace';
    ctx.fillText('PRESS R TO RETRY', VIEW_W / 2, VIEW_H / 2 + 90);
    ctx.globalAlpha = 1;
  }
}

export function renderWinScreen(ctx: CanvasRenderingContext2D, game: Game): void {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 48px monospace';
  ctx.fillText('ESCAPED!', VIEW_W / 2, VIEW_H / 2 - 40);
  ctx.fillStyle = '#86efac'; ctx.font = '14px monospace';
  ctx.fillText('You robbed the baby bank and got away clean.', VIEW_W / 2, VIEW_H / 2 + 10);
  ctx.fillStyle = '#fbbf24'; ctx.font = '12px monospace';
  ctx.fillText('Cheese remaining: ' + game.player.cheese, VIEW_W / 2, VIEW_H / 2 + 50);
  ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
  ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 14px monospace';
  ctx.fillText('PRESS R TO PLAY AGAIN', VIEW_W / 2, VIEW_H / 2 + 90);
  ctx.globalAlpha = 1;
}
