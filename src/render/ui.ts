import {
  VIEW_W, VIEW_H, T, COLS, ROWS, TOTAL_LOOT, PEEKABOO_MAX,
  TOOL_TYPES,
} from '../config';
import type { Game } from '../types';

export function renderUI(ctx: CanvasRenderingContext2D, game: Game): void {
  const p = game.player;
  const time = game.time;

  // Detection bar
  const bw = 160, bh = 12, bx = VIEW_W / 2 - bw / 2, by = 10;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = '#374151'; ctx.fillRect(bx, by, bw, bh);
  if (game.detection > 0) {
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#fbbf24'); grad.addColorStop(1, '#ef4444');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * game.detection / 100, bh);
  }
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = game.detection > 50 ? '#ef4444' : '#e5e7eb';
  ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(game.detection > 50 ? 'DETECTED!' : 'DETECTION', VIEW_W / 2, by + bh + 12);

  // Cheese + loot counters
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fde047'; ctx.font = 'bold 12px monospace';
  ctx.fillText('CHEESE: ' + p.cheese, 12, 22);
  if (game.cheeseCooldown > 0) {
    ctx.fillStyle = '#9ca3af'; ctx.font = '9px monospace';
    ctx.fillText('(' + game.cheeseCooldown.toFixed(1) + 's)', 115, 22);
  }
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px monospace';
  ctx.fillText('LOOT: ' + p.loot + '/' + TOTAL_LOOT, 12, 38);

  // Tool slot
  if (p.tools.length > 0) {
    const tt = TOOL_TYPES[p.tools[0]];
    ctx.fillStyle = '#c084fc'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
    ctx.fillText('[Q] ' + tt.name + (p.tools.length > 1 ? ' (+' + (p.tools.length - 1) + ')' : ''), 12, 54);
  }

  // Peekaboo stamina bar
  const pbw = 80, pbh = 8, pbx = VIEW_W - pbw - 12, pby = 30;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(pbx - 1, pby - 1, pbw + 2, pbh + 2);
  ctx.fillStyle = '#1e1e2e'; ctx.fillRect(pbx, pby, pbw, pbh);
  const stPct = p.peekStamina / PEEKABOO_MAX;
  ctx.fillStyle = p.peekExhausted ? '#ef4444' : (stPct < 0.3 ? '#f97316' : '#4ade80');
  ctx.fillRect(pbx, pby, pbw * stPct, pbh);
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1; ctx.strokeRect(pbx, pby, pbw, pbh);
  const showPulse = p.hiding && game.peekabooPulseTimer > 0;
  if (!showPulse) {
    ctx.textAlign = 'center'; ctx.font = 'bold 9px monospace';
    ctx.fillStyle = p.peekExhausted ? '#ef4444' : '#9ca3af';
    ctx.fillText('peekaboo', pbx + pbw / 2, pby - 3);
    ctx.textAlign = 'right';
  }

  // Status text
  ctx.textAlign = 'right'; ctx.font = '10px monospace';
  if (showPulse) {
    const t = Math.max(0, Math.min(1, game.peekabooPulseTimer / 2.0));
    const wave = (Math.sin(time * 10) + 1) / 2;
    const size = 9 + Math.round(wave * 2);
    ctx.globalAlpha = (0.35 + 0.65 * wave) * t;
    ctx.fillStyle = '#4ade80';
    ctx.font = `bold ${size}px monospace`;
    ctx.shadowColor = 'rgba(74, 222, 128, 0.5)';
    ctx.shadowBlur = 4 + wave * 4;
    ctx.textAlign = 'center';
    ctx.fillText('peekaboo', pbx + pbw / 2, pby - 3);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.textAlign = 'right';
  } else if (p.looting) {
    ctx.fillStyle = '#fbbf24'; ctx.fillText('LOOTING...', VIEW_W - 12, 22);
  }

  // Controls help
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px monospace';
  ctx.fillText('WASD: Move | SPACE: Peekaboo | CLICK: Cheese | E: Loot | Q: Use Tool', VIEW_W / 2, VIEW_H - 8);

  // All loot collected message
  if (p.loot >= TOTAL_LOOT) {
    ctx.fillStyle = '#4ade80'; ctx.font = 'bold 11px monospace';
    ctx.globalAlpha = Math.sin(time * 4) * 0.3 + 0.7;
    ctx.fillText('ALL LOOT COLLECTED! HEAD TO THE EXIT!', VIEW_W / 2, VIEW_H - 24);
    ctx.globalAlpha = 1;
  }

  // Minimap
  renderMinimap(ctx, game);
}

function renderMinimap(ctx: CanvasRenderingContext2D, game: Game): void {
  const mmS = 3, mmW = COLS * mmS, mmH = ROWS * mmS;
  const mmX = VIEW_W - mmW - 8, mmY = VIEW_H - mmH - 20;

  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(mmX - 1, mmY - 1, mmW + 2, mmH + 2);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const v = game.grid[y][x];
      ctx.fillStyle = v === 1 ? '#3a3a5c' : (v === 2 ? '#2a1f14' : '#1e1e2e');
      ctx.fillRect(mmX + x * mmS, mmY + y * mmS, mmS, mmS);
    }
  }

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(mmX + (game.player.x / T) * mmS - 1, mmY + (game.player.y / T) * mmS - 1, 3, 3);

  for (const b of game.babies) {
    ctx.fillStyle = b.stunTimer > 0 ? '#fde047' : (b.crawler ? '#ec4899' : '#fb923c');
    ctx.fillRect(mmX + (b.x / T) * mmS - 1, mmY + (b.y / T) * mmS - 1, 2, 2);
  }

  for (const tv of game.tvs) {
    if (tv.active) {
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(mmX + (tv.x / T) * mmS - 1, mmY + (tv.y / T) * mmS - 1, 2, 2);
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  ctx.strokeRect(
    mmX + (game.camera.x / T) * mmS,
    mmY + (game.camera.y / T) * mmS,
    (VIEW_W / T) * mmS,
    (VIEW_H / T) * mmS
  );
}

export function renderDetectionOverlay(ctx: CanvasRenderingContext2D, game: Game): void {
  if (game.detection > 20) {
    ctx.fillStyle = `rgba(239,68,68,${((game.detection - 20) / 80) * 0.25})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
