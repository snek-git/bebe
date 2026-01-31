import {
  VIEW_W, VIEW_H, T, COLS, ROWS, TOTAL_LOOT, PEEKABOO_MAX,
  TOOL_TYPES,
} from '../config';
import { mouseScreen } from '../input';
import { drawToolShape } from './shapes';
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

  // === HOTBAR (bottom center) ===
  renderHotbar(ctx, game);

  // Key cards (top-left)
  if (p.keys.length > 0) {
    let keyX = 12;
    ctx.font = 'bold 9px monospace'; ctx.textBaseline = 'alphabetic';
    const colors: Record<string, string> = { keyA: '#ef4444', keyB: '#3b82f6', keyC: '#22c55e' };
    for (const k of p.keys) {
      ctx.fillStyle = colors[k] || '#facc15';
      ctx.fillRect(keyX, 22, 20, 10);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(k.replace('key', ''), keyX + 10, 31);
      keyX += 24;
    }
  }

  // Gear icons (top-left, below keys)
  if (p.gear.length > 0) {
    ctx.textAlign = 'left'; ctx.font = '9px monospace';
    let gx = 12;
    for (const g of p.gear) {
      if (g === 'sneakers') {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('SNEAK', gx, 46);
      } else {
        ctx.fillStyle = '#a855f7';
        ctx.fillText('SHADE', gx, 46);
      }
      gx += 50;
    }
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
    const stPct2 = p.peekStamina / PEEKABOO_MAX;
    let r = 74, g = 222, b = 128;
    if (p.peekExhausted) {
      r = 239; g = 68; b = 68;
    } else if (stPct2 < 0.3) {
      const k = Math.min(1, (0.3 - stPct2) / 0.3);
      r = Math.round(74 + (239 - 74) * k);
      g = Math.round(222 + (68 - 222) * k);
      b = Math.round(128 + (68 - 128) * k);
    }
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.font = `bold ${size}px monospace`;
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
    ctx.shadowBlur = 4 + wave * 4;
    ctx.textAlign = 'center';
    ctx.fillText('peekaboo', pbx + pbw / 2, pby - 3);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.textAlign = 'right';
  } else if (p.looting) {
    ctx.fillStyle = '#fbbf24'; ctx.fillText('LOOTING...', VIEW_W - 12, 22);
  } else if (p.searching) {
    ctx.fillStyle = '#a78bfa'; ctx.fillText('SEARCHING...', VIEW_W - 12, 22);
  } else if (p.sprinting) {
    ctx.fillStyle = '#86efac'; ctx.fillText('SPRINT', VIEW_W - 12, 22);
  }

  // Controls help
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '9px monospace';
  ctx.fillText('WASD: Move | SPACE: Peekaboo | CLICK: Cheese | E: Loot | Q: Use Tool', VIEW_W / 2, VIEW_H - 8);

  // Prize collected message (above hotbar)
  if (p.loot >= TOTAL_LOOT) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ade80'; ctx.font = 'bold 11px monospace';
    ctx.globalAlpha = Math.sin(time * 4) * 0.3 + 0.7;
    ctx.fillText('GOLDEN BEBE ACQUIRED! HEAD TO THE EXIT!', VIEW_W / 2, VIEW_H - 62);
    ctx.globalAlpha = 1;
  }

  // Crosshair
  if (game.state === 'playing' && !p.hiding && !p.looting && !p.searching) {
    renderCrosshair(ctx, game);
  }

  // Minimap
  renderMinimap(ctx, game);
}

const SLOT_SIZE = 34;
const SLOT_GAP = 3;

function renderHotbar(ctx: CanvasRenderingContext2D, game: Game): void {
  const p = game.player;
  const hasTools = p.tools.length > 0;
  const slotCount = 1 + (hasTools ? 1 : 0);
  const barW = slotCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + (hasTools ? 8 : 0);
  const barX = VIEW_W / 2 - barW / 2;
  const barY = VIEW_H - SLOT_SIZE - 14;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(barX - 4, barY - 4, barW + 8, SLOT_SIZE + 8);

  // Cheese slot
  const csx = barX;
  ctx.fillStyle = 'rgba(30,30,46,0.8)';
  ctx.fillRect(csx, barY, SLOT_SIZE, SLOT_SIZE);
  ctx.strokeStyle = p.cheese > 0 ? '#fbbf24' : '#374151';
  ctx.lineWidth = 1;
  ctx.strokeRect(csx + 0.5, barY + 0.5, SLOT_SIZE - 1, SLOT_SIZE - 1);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (p.cheese > 0) {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(csx + SLOT_SIZE / 2, barY + SLOT_SIZE / 2 - 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace';
    ctx.fillText('' + p.cheese, csx + SLOT_SIZE / 2, barY + SLOT_SIZE - 5);
  } else {
    ctx.fillStyle = '#4b5563'; ctx.font = '8px monospace';
    ctx.fillText('--', csx + SLOT_SIZE / 2, barY + SLOT_SIZE / 2);
  }
  if (game.cheeseCooldown > 0) {
    const cdPct = game.cheeseCooldown / 3.0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(csx, barY, SLOT_SIZE, SLOT_SIZE * cdPct);
  }

  // Tool slot
  if (hasTools) {
    const toolX = barX + SLOT_SIZE + SLOT_GAP + 5;
    ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toolX - 5, barY + 2);
    ctx.lineTo(toolX - 5, barY + SLOT_SIZE - 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(30,30,46,0.8)';
    ctx.fillRect(toolX, barY, SLOT_SIZE, SLOT_SIZE);
    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 1;
    ctx.strokeRect(toolX + 0.5, barY + 0.5, SLOT_SIZE - 1, SLOT_SIZE - 1);

    const tt = TOOL_TYPES[p.tools[0]];
    ctx.fillStyle = '#c084fc'; ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tt.name.slice(0, 5).toUpperCase(), toolX + SLOT_SIZE / 2, barY + SLOT_SIZE / 2);
    ctx.fillStyle = '#c084fc'; ctx.font = '7px monospace'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Q', toolX + 5, barY - 2);
    if (p.tools.length > 1) {
      ctx.fillStyle = '#9ca3af'; ctx.font = '7px monospace'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('+' + (p.tools.length - 1), toolX + SLOT_SIZE - 6, barY + SLOT_SIZE - 3);
    }
  }
}

function renderCrosshair(ctx: CanvasRenderingContext2D, game: Game): void {
  const m = mouseScreen();
  const cx = m.x, cy = m.y;
  const size = 10;
  const gap = 3;

  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;

  // Horizontal lines
  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy);
  ctx.lineTo(cx + size, cy);
  // Vertical lines
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx, cy - gap);
  ctx.moveTo(cx, cy + gap);
  ctx.lineTo(cx, cy + size);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fill();
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

  // Doors on minimap
  for (const d of game.doors) {
    if (d.state === 'open') {
      ctx.fillStyle = '#4ade80';
    } else if (d.state === 'closed') {
      ctx.fillStyle = '#8B4513';
    } else {
      ctx.fillStyle = '#ef4444';
    }
    ctx.fillRect(mmX + d.tx * mmS, mmY + d.ty * mmS, mmS, mmS);
  }

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(mmX + (game.player.x / T) * mmS - 1, mmY + (game.player.y / T) * mmS - 1, 3, 3);

  for (const b of game.babies) {
    ctx.fillStyle = b.stunTimer > 0 ? '#fde047' : (b.type === 'toddler' ? '#dc2626' : (b.type === 'stawler' ? '#ec4899' : '#fb923c'));
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

export function renderToolWheel(ctx: CanvasRenderingContext2D, game: Game): void {
  const tools = game.player.tools;
  if (!game.wheelOpen || tools.length < 2) return;

  const cx = VIEW_W / 2, cy = VIEW_H / 2;
  const radius = 80;
  const n = tools.length;
  const sectorSize = (Math.PI * 2) / n;

  // Calculate hover from mouse position
  const mouse = mouseScreen();
  const mdx = mouse.x - cx, mdy = mouse.y - cy;
  const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
  if (mDist > 20) {
    const mouseAngle = Math.atan2(mdy, mdx);
    const adjusted = ((mouseAngle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    game.wheelHover = Math.floor(adjusted / sectorSize) % n;
  } else {
    game.wheelHover = 0;
  }

  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Center ring
  ctx.beginPath(); ctx.arc(cx, cy, radius + 30, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(14,14,26,0.7)'; ctx.fill();
  ctx.strokeStyle = 'rgba(192,132,252,0.3)'; ctx.lineWidth = 2; ctx.stroke();

  // Sector lines
  ctx.strokeStyle = 'rgba(192,132,252,0.15)'; ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const ang = i * sectorSize - Math.PI / 2 - sectorSize / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * (radius + 30), cy + Math.sin(ang) * (radius + 30));
    ctx.stroke();
  }

  // Items
  for (let i = 0; i < n; i++) {
    const ang = i * sectorSize - Math.PI / 2;
    const ix = cx + Math.cos(ang) * radius;
    const iy = cy + Math.sin(ang) * radius;
    const hovered = i === game.wheelHover;
    const tt = TOOL_TYPES[tools[i]];

    // Item circle background
    const bgRadius = hovered ? 26 : 22;
    ctx.beginPath(); ctx.arc(ix, iy, bgRadius, 0, Math.PI * 2);
    ctx.fillStyle = hovered ? 'rgba(192,132,252,0.35)' : 'rgba(30,30,46,0.8)';
    ctx.fill();
    ctx.strokeStyle = hovered ? '#c084fc' : 'rgba(107,114,128,0.5)';
    ctx.lineWidth = hovered ? 2.5 : 1;
    ctx.stroke();

    // Tool icon
    drawToolShape(ctx, ix, iy, tools[i], hovered ? 14 : 11, game.time);

    // Tool name
    ctx.fillStyle = hovered ? '#e9d5ff' : '#9ca3af';
    ctx.font = hovered ? 'bold 10px monospace' : '9px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(tt.name, ix, iy + bgRadius + 12);

    // Active indicator (first item = current)
    if (i === 0) {
      ctx.fillStyle = 'rgba(192,132,252,0.6)'; ctx.font = '7px monospace';
      ctx.fillText('active', ix, iy - bgRadius - 4);
    }
  }

  // Center text
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SELECT', cx, cy);
}

export function renderDetectionOverlay(ctx: CanvasRenderingContext2D, game: Game): void {
  if (game.detection > 20) {
    ctx.fillStyle = `rgba(239,68,68,${((game.detection - 20) / 80) * 0.25})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
