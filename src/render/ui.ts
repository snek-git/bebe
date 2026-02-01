import {
  VIEW_W, VIEW_H, T, COLS, ROWS, TOTAL_LOOT, STAMINA_MAX,
  TOOL_TYPES,
} from '../config';
import { mouseScreen } from '../input';
import { drawToolShape, drawCheeseShape } from './shapes';
import { SK, sketchyRect, sketchyLine, crayonCircle, crayonText } from './sketchy';
import type { Game } from '../types';

export function renderUI(ctx: CanvasRenderingContext2D, game: Game): void {
  const p = game.player;
  const time = game.time;

  // Crying baby detection indicator
  const det = game.detection;
  const babyIndex = Math.min(5, Math.floor(det / 20));
  const fillFraction = (det % 20) / 20;

  const faceSize = 26, faceGap = 6;
  const totalW = 5 * faceSize + 4 * faceGap;
  const startX = VIEW_W / 2 - totalW / 2;
  const baseY = 20;

  for (let i = 0; i < 5; i++) {
    const fx = startX + i * (faceSize + faceGap) + faceSize / 2;

    // Bounce offset from fill animation
    const anim = game.milkFillAnim[i];
    const bounceT = anim / 0.3;
    const yOff = bounceT > 0 ? -10 * Math.sin(bounceT * Math.PI) * bounceT : 0;
    const fy = baseY + yOff;

    let fill = 0;
    if (i < babyIndex) fill = 1;
    else if (i === babyIndex) fill = fillFraction;

    drawCryingBaby(ctx, fx, fy, faceSize / 2, fill, bounceT > 0, time);
  }

  // === HOTBAR (bottom center) ===
  renderHotbar(ctx, game);

  // Key cards (top-left)
  if (p.keys.length > 0) {
    let keyX = 12;
    ctx.font = 'bold 11px monospace'; ctx.textBaseline = 'alphabetic';
    const colors: Record<string, string> = { keyA: '#ef4444', keyB: '#3b82f6', keyC: '#22c55e' };
    for (const k of p.keys) {
      ctx.fillStyle = colors[k] || '#facc15';
      ctx.fillRect(keyX, 22, 24, 13);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(k.replace('key', ''), keyX + 12, 33);
      keyX += 28;
    }
  }

  // Gear icons (top-left, below keys)
  if (p.gear.length > 0) {
    ctx.textAlign = 'left'; ctx.font = 'bold 11px monospace';
    let gx = 12;
    for (const g of p.gear) {
      if (g === 'sneakers') {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('SNEAK', gx, 50);
      } else {
        ctx.fillStyle = '#a855f7';
        ctx.fillText('SHADE', gx, 50);
      }
      gx += 56;
    }
  }

  // === BOTTOM-LEFT STATUS PANEL (stamina bar + state label) ===
  const pbw = 96, pbh = 10;
  const pbx = 12, pby = VIEW_H - 34;

  // Determine current state label & color
  let stateLabel: string;
  let stateColor: string;
  const showPulse = p.hiding && game.peekabooPulseTimer > 0;

  if (p.staminaExhausted) {
    stateLabel = 'exhausted';
    stateColor = '#ef4444';
  } else if (p.hiding) {
    stateLabel = 'peekaboo';
    stateColor = '#4ade80';
  } else if (p.sprinting && (p.vx || p.vy)) {
    stateLabel = 'sprint';
    stateColor = '#60a5fa';
  } else if (p.searching) {
    stateLabel = 'searching';
    stateColor = '#a78bfa';
  } else if (p.looting) {
    stateLabel = 'looting';
    stateColor = '#fbbf24';
  } else {
    stateLabel = 'idle';
    stateColor = '#4ade80';
  }

  // State label above bar
  const stPct = p.stamina / STAMINA_MAX;
  if (showPulse) {
    const t = Math.max(0, Math.min(1, game.peekabooPulseTimer / 2.0));
    const wave = (Math.sin(time * 10) + 1) / 2;
    const size = 11 + Math.round(wave * 2);
    ctx.globalAlpha = (0.35 + 0.65 * wave) * t;
    let r = 74, g = 222, b = 128;
    if (p.staminaExhausted) {
      r = 239; g = 68; b = 68;
    } else if (stPct < 0.3) {
      const k = Math.min(1, (0.3 - stPct) / 0.3);
      r = Math.round(74 + (239 - 74) * k);
      g = Math.round(222 + (68 - 222) * k);
      b = Math.round(128 + (68 - 128) * k);
    }
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
    ctx.shadowBlur = 4 + wave * 4;
    crayonText(ctx, stateLabel, pbx + pbw / 2, pby - 3, {
      fill: `rgb(${r}, ${g}, ${b})`,
      font: `bold ${size}px monospace`,
      jitterAmt: 0.3, passes: 2,
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  } else {
    crayonText(ctx, stateLabel, pbx + pbw / 2, pby - 3, {
      fill: stateColor,
      font: 'bold 11px monospace', jitterAmt: 0.3, passes: 2,
    });
  }

  // Stamina bar
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(pbx - 1, pby - 1, pbw + 2, pbh + 2);
  ctx.fillStyle = SK.cardFill; ctx.fillRect(pbx, pby, pbw, pbh);
  ctx.fillStyle = p.staminaExhausted ? '#ef4444' : (stPct < 0.3 ? '#f97316' : '#4ade80');
  ctx.fillRect(pbx, pby, pbw * stPct, pbh);
  sketchyRect(ctx, pbx, pby, pbw, pbh, { stroke: SK.accent, lineWidth: 2.5, jitterAmt: 0.5, grain: false });

  // Controls help
  ctx.textAlign = 'center'; ctx.fillStyle = SK.dim; ctx.font = '10px monospace';
  ctx.fillText('WASD: Move | SPACE: Peekaboo | CLICK: Cheese | E: Loot | Q: Use Tool | R: Restart', VIEW_W / 2, VIEW_H - 8);

  // Prize collected message (above hotbar)
  if (p.loot >= TOTAL_LOOT) {
    ctx.globalAlpha = Math.sin(time * 4) * 0.3 + 0.7;
    crayonText(ctx, 'GOLDEN BEBE ACQUIRED! HEAD TO THE EXIT!', VIEW_W / 2, VIEW_H - 62, {
      fill: SK.highlight, font: 'bold 13px monospace', jitterAmt: 0.3, passes: 2,
    });
    ctx.globalAlpha = 1;
  }

  // Crosshair
  if (game.state === 'playing' && !p.hiding && !p.looting && !p.searching) {
    renderCrosshair(ctx, game);
  }

  // Minimap
  renderMinimap(ctx, game);
}

function drawCryingBaby(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  fillLevel: number, animating: boolean, time: number,
): void {
  ctx.save();

  // Face color: peachy skin → red as fill increases
  const rr = Math.round(255 - fillLevel * 40);
  const gg = Math.round(205 - fillLevel * 100);
  const bb = Math.round(180 - fillLevel * 100);
  const faceColor = fillLevel > 0 ? `rgb(${rr},${gg},${bb})` : 'rgba(80,100,110,0.5)';

  // Head circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = faceColor;
  ctx.fill();
  ctx.strokeStyle = fillLevel > 0 ? 'rgba(200,120,100,0.6)' : 'rgba(72,129,140,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (fillLevel <= 0) {
    // Sleeping face: closed eyes (—  —) and small mouth
    ctx.strokeStyle = 'rgba(72,129,140,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 2); ctx.lineTo(cx - 2, cy - 2);
    ctx.moveTo(cx + 2, cy - 2); ctx.lineTo(cx + 5, cy - 2);
    ctx.stroke();
    // Tiny "z"
    ctx.fillStyle = 'rgba(72,129,140,0.4)';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('z', cx + r + 2, cy - r + 2);
  } else if (fillLevel < 1) {
    // Worried → crying transition
    const worry = fillLevel;

    // Eyes: dots that get bigger, with brows
    const eyeR = 1.2 + worry * 0.8;
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 2, eyeR, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 2, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Worried brows (angled up toward center)
    ctx.strokeStyle = 'rgba(60,40,30,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 5 - worry * 2);
    ctx.lineTo(cx - 3, cy - 6);
    ctx.moveTo(cx + 7, cy - 5 - worry * 2);
    ctx.lineTo(cx + 3, cy - 6);
    ctx.stroke();

    // Mouth: from flat line → open oval
    const mouthOpen = worry * 3;
    ctx.fillStyle = `rgba(180,80,80,${0.3 + worry * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 2.5 + worry, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tear drops (appear as worry grows)
    if (worry > 0.4) {
      const tearAlpha = (worry - 0.4) / 0.6;
      ctx.fillStyle = `rgba(120,180,220,${tearAlpha * 0.7})`;
      const tearY = cy + 1 + worry * 4;
      ctx.beginPath();
      ctx.ellipse(cx - 5, tearY, 1, 1.5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 5, tearY, 1, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Full crying: big open mouth, tears streaming, shake
    const shake = Math.sin(time * 25) * 1.5;
    ctx.translate(shake, 0);

    // Scrunched eyes (^ ^)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 2);
    ctx.lineTo(cx - 4, cy - 4);
    ctx.lineTo(cx - 2, cy - 2);
    ctx.moveTo(cx + 2, cy - 2);
    ctx.lineTo(cx + 4, cy - 4);
    ctx.lineTo(cx + 6, cy - 2);
    ctx.stroke();

    // Angry brows
    ctx.strokeStyle = 'rgba(60,40,30,0.7)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 7);
    ctx.lineTo(cx - 2, cy - 5);
    ctx.moveTo(cx + 7, cy - 7);
    ctx.lineTo(cx + 2, cy - 5);
    ctx.stroke();

    // Big open crying mouth
    ctx.fillStyle = 'rgba(180,60,60,0.8)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 4, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Streaming tears
    ctx.fillStyle = 'rgba(120,180,220,0.6)';
    const t1 = (time * 3) % 1;
    const t2 = (time * 3 + 0.5) % 1;
    for (const t of [t1, t2]) {
      const ty = cy + t * 10;
      ctx.beginPath();
      ctx.ellipse(cx - 6, ty, 1.2, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 6, ty, 1.2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glow when animating
    if (animating) {
      ctx.shadowColor = 'rgba(239,68,68,0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239,68,68,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}

const SLOT_SIZE = 40;
const SLOT_GAP = 4;

function renderHotbar(ctx: CanvasRenderingContext2D, game: Game): void {
  const p = game.player;
  const hasTools = p.tools.length > 0;
  const slotCount = 1 + (hasTools ? 1 : 0);
  const barW = slotCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + (hasTools ? 8 : 0);
  const barX = VIEW_W / 2 - barW / 2;
  const barY = VIEW_H - SLOT_SIZE - 14;

  sketchyRect(ctx, barX - 4, barY - 4, barW + 8, SLOT_SIZE + 8, {
    fill: SK.bg,
    stroke: SK.cardStroke,
  });

  // Cheese slot
  const csx = barX;
  ctx.fillStyle = 'rgba(20,57,94,0.8)';
  ctx.fillRect(csx, barY, SLOT_SIZE, SLOT_SIZE);
  sketchyRect(ctx, csx + 0.5, barY + 0.5, SLOT_SIZE - 1, SLOT_SIZE - 1, {
    stroke: p.cheese > 0 ? SK.accent : '#374151',
    lineWidth: 2.5, jitterAmt: 0.6, grain: false,
  });

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (p.cheese > 0) {
    drawCheeseShape(ctx, csx + SLOT_SIZE / 2, barY + SLOT_SIZE / 2, 10); // Moved icon slightly down
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace';
    // Draw count at the top of the icon area
    ctx.fillText('' + p.cheese, csx + SLOT_SIZE / 2, barY + SLOT_SIZE / 2 - 12);

    ctx.fillStyle = SK.highlight; ctx.font = '7px monospace';
    ctx.fillText('cheese', csx + SLOT_SIZE / 2, barY + SLOT_SIZE - 5);
  } else {
    ctx.fillStyle = SK.dim; ctx.font = '8px monospace';
    ctx.fillText('--', csx + SLOT_SIZE / 2, barY + SLOT_SIZE / 2);
    ctx.fillStyle = SK.dim; ctx.font = '7px monospace';
    ctx.fillText('cheese', csx + SLOT_SIZE / 2, barY + SLOT_SIZE - 5);
  }
  // Tool slot
  if (hasTools) {
    const toolX = barX + SLOT_SIZE + SLOT_GAP + 5;
    sketchyLine(ctx, toolX - 5, barY + 2, toolX - 5, barY + SLOT_SIZE - 2, {
      stroke: SK.dim, lineWidth: 2.5, jitterAmt: 0.5,
    });

    ctx.fillStyle = 'rgba(20,57,94,0.8)';
    ctx.fillRect(toolX, barY, SLOT_SIZE, SLOT_SIZE);
    sketchyRect(ctx, toolX + 0.5, barY + 0.5, SLOT_SIZE - 1, SLOT_SIZE - 1, {
      stroke: SK.accent, lineWidth: 2.5, jitterAmt: 0.6, grain: false,
    });

    const tt = TOOL_TYPES[p.tools[0]];
    const tx = toolX + SLOT_SIZE / 2;
    const ty = barY + SLOT_SIZE / 2 - 4;
    drawToolShape(ctx, tx, ty, p.tools[0], 12, game.time);

    ctx.fillStyle = SK.highlight; ctx.font = '7px monospace'; ctx.textAlign = 'center';
    ctx.fillText(tt.name.split(' ')[0].toLowerCase(), toolX + SLOT_SIZE / 2, barY + SLOT_SIZE - 5);

    ctx.fillStyle = SK.accent; ctx.font = '9px monospace'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Q', toolX + 5, barY - 2);
    if (p.tools.length > 1) {
      ctx.fillStyle = SK.dim; ctx.font = '9px monospace'; ctx.textBaseline = 'alphabetic';
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
  ctx.lineWidth = 2.5;

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

// Minimap grid cache — pre-rendered static tiles to avoid 2200 fillRect/frame
let _mmGridCanvas: HTMLCanvasElement | null = null;
let _mmGridRef: number[][] | null = null;

function getMinimapGridCache(grid: number[][]): HTMLCanvasElement {
  if (_mmGridCanvas && _mmGridRef === grid) return _mmGridCanvas;

  const mmS = 3;
  const c = document.createElement('canvas');
  c.width = COLS * mmS;
  c.height = ROWS * mmS;
  const gCtx = c.getContext('2d')!;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const v = grid[y][x];
      gCtx.fillStyle = v === 1 ? '#3a3a5c' : (v === 2 ? '#2a1f14' : '#1e1e2e');
      gCtx.fillRect(x * mmS, y * mmS, mmS, mmS);
    }
  }

  _mmGridCanvas = c;
  _mmGridRef = grid;
  return c;
}

function renderMinimap(ctx: CanvasRenderingContext2D, game: Game): void {
  const mmS = 3, mmW = COLS * mmS, mmH = ROWS * mmS;
  const mmX = VIEW_W - mmW - 8, mmY = VIEW_H - mmH - 20;

  sketchyRect(ctx, mmX - 1, mmY - 1, mmW + 2, mmH + 2, {
    fill: SK.bg,
    stroke: SK.cardStroke,
  });
  ctx.drawImage(getMinimapGridCache(game.grid), mmX, mmY);

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
    ctx.fillStyle = b.stunTimer > 0 ? '#fde047' : (b.type === 'boss' ? '#dc2626' : (b.type === 'stawler' ? '#ec4899' : '#fb923c'));
    ctx.fillRect(mmX + (b.x / T) * mmS - 1, mmY + (b.y / T) * mmS - 1, 2, 2);
  }

  for (const tv of game.tvs) {
    if (tv.active) {
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(mmX + (tv.x / T) * mmS - 1, mmY + (tv.y / T) * mmS - 1, 2, 2);
    }
  }

  // Minimap fog-of-war: rough 5px pen crayon clouds that dissolve when camera reveals them
  const PUFF_COLORS = [
    [180, 190, 200], // cool gray
    [165, 175, 185], // medium slate
    [195, 200, 210], // light steel
    [170, 180, 192], // dusty gray
    [190, 195, 205], // silver
  ];
  // Seed-based pseudo-random (deterministic per-cloud, no flicker)
  function srand(n: number): number { n = Math.sin(n) * 43758.5453; return n - Math.floor(n); }

  for (const cloud of game.minimapClouds) {
    if (cloud.dissolve >= 1) continue;
    const d = cloud.dissolve;
    let scale: number, alpha: number;
    if (d < 0.15) {
      scale = 1.0 + (d / 0.15) * 0.2;
      alpha = 1;
    } else {
      const t2 = (d - 0.15) / 0.85;
      scale = 1.2 * (1 - t2);
      alpha = 1 - t2;
    }
    if (alpha <= 0) continue;
    const s = cloud.seed;
    const ccx = mmX + cloud.tx * mmS;
    const ccy = mmY + cloud.ty * mmS;
    const r = cloud.r * scale;
    const jx = Math.sin(game.time * 7.3 + s) * 0.5;
    const jy = Math.cos(game.time * 6.1 + s * 1.3) * 0.5;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Puff positions around center
    const puffs = [
      { dx: 0, dy: 0, rMul: 1.0 },
      { dx: ((s % 7) - 3) * 1.4, dy: -((s % 5) - 2) * 1.2, rMul: 0.9 },
      { dx: -((s % 6) - 3) * 1.3, dy: ((s % 4) - 2) * 1.3, rMul: 0.85 },
      { dx: ((s % 9) - 4) * 1.1, dy: ((s % 7) - 3) * 1.0, rMul: 0.8 },
      { dx: -((s % 5) - 2) * 1.5, dy: -((s % 6) - 3) * 1.1, rMul: 0.75 },
      { dx: (((s * 3) % 7) - 3) * 1.2, dy: (((s * 7) % 5) - 2) * 1.4, rMul: 0.7 },
    ];

    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      const pcx = ccx + p.dx * scale + jx;
      const pcy = ccy + p.dy * scale + jy;
      const pr = r * p.rMul;
      const [cr, cg, cb] = PUFF_COLORS[(s + i) % PUFF_COLORS.length];

      // Pass 1: thick filled scribble rings (inner→outer) to fill the puff mass
      for (let ring = 0; ring < 3; ring++) {
        const ringR = pr * (0.25 + ring * 0.35);
        const pts = 10;
        const h = s * 13 + i * 7 + ring * 31; // deterministic hash per ring
        ctx.globalAlpha = alpha * (0.5 + srand(h + 1) * 0.3);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},1)`;
        ctx.lineWidth = 4.5 + (srand(h + 2) - 0.5) * 2;
        ctx.beginPath();
        for (let k = 0; k <= pts; k++) {
          const a = (k / pts) * Math.PI * 2;
          const wobble = ringR + (srand(h + k * 3) - 0.5) * 3;
          const px = pcx + Math.cos(a) * wobble;
          const py = pcy + Math.sin(a) * wobble;
          k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Pass 2: second rough outline at full radius for chunky edge
      const h2 = s * 17 + i * 11;
      ctx.globalAlpha = alpha * (0.35 + srand(h2) * 0.25);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},1)`;
      ctx.lineWidth = 5 + (srand(h2 + 5) - 0.5) * 2;
      ctx.beginPath();
      const pts2 = 12;
      for (let k = 0; k <= pts2; k++) {
        const a = (k / pts2) * Math.PI * 2;
        const wobble = pr + (srand(h2 + k * 5) - 0.5) * 2.5;
        const px = pcx + Math.cos(a) * wobble;
        const py = pcy + Math.sin(a) * wobble;
        k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = 'rgba(72,129,140,0.45)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(
    mmX + (game.camera.x / T) * mmS,
    mmY + (game.camera.y / T) * mmS,
    (VIEW_W / T) * mmS,
    (VIEW_H / T) * mmS
  );
}

export function renderToolWheel(ctx: CanvasRenderingContext2D, game: Game): void {
  const tools = game.player.tools;
  if (!game.wheelOpen || tools.length < 1) return;

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
  crayonCircle(ctx, cx, cy, radius + 30, {
    fill: 'rgba(20,57,94,0.7)', stroke: SK.dim, lineWidth: 2.5, jitterAmt: 0.8,
  });

  // Sector lines
  for (let i = 0; i < n; i++) {
    const ang = i * sectorSize - Math.PI / 2 - sectorSize / 2;
    sketchyLine(ctx, cx, cy,
      cx + Math.cos(ang) * (radius + 30),
      cy + Math.sin(ang) * (radius + 30),
      { stroke: 'rgba(57,100,107,0.5)', lineWidth: 1.5, jitterAmt: 0.6 },
    );
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
    crayonCircle(ctx, ix, iy, bgRadius, {
      fill: hovered ? 'rgba(72,129,140,0.35)' : 'rgba(20,57,94,0.8)',
      stroke: hovered ? SK.accent : SK.dim,
      lineWidth: hovered ? 3.5 : 2.5,
      jitterAmt: hovered ? 1.0 : 0.8,
    });

    // Tool icon
    drawToolShape(ctx, ix, iy, tools[i], hovered ? 14 : 11, game.time);

    // Tool name
    crayonText(ctx, tt.name, ix, iy + bgRadius + 12, {
      fill: hovered ? SK.highlight : SK.dim,
      font: hovered ? 'bold 12px monospace' : '11px monospace',
      jitterAmt: 0.3, passes: 2,
    });

    // Active indicator (first item = current)
    if (i === 0) {
      ctx.fillStyle = SK.accent; ctx.font = '9px monospace';
      ctx.fillText('active', ix, iy - bgRadius - 4);
    }
  }

  // Center text
  crayonText(ctx, 'SELECT', cx, cy, {
    fill: SK.primary, font: '11px monospace',
    baseline: 'middle', jitterAmt: 0.3, passes: 2,
  });
}

export function renderDetectionOverlay(ctx: CanvasRenderingContext2D, game: Game): void {
  const det = game.detection;
  if (det <= 20) return;

  const detPct = det / 100;

  // Simple red vignette that grows with detection
  const alpha = (detPct - 0.2) * 0.2; // max ~0.16 at 100%
  const edgeSize = 0.15 + detPct * 0.1;

  // Top edge
  const topGrad = ctx.createLinearGradient(0, 0, 0, VIEW_H * edgeSize);
  topGrad.addColorStop(0, `rgba(239,68,68,${alpha})`);
  topGrad.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H * edgeSize);

  // Bottom edge
  const botGrad = ctx.createLinearGradient(0, VIEW_H, 0, VIEW_H * (1 - edgeSize));
  botGrad.addColorStop(0, `rgba(239,68,68,${alpha})`);
  botGrad.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, VIEW_H * (1 - edgeSize), VIEW_W, VIEW_H * edgeSize);

  // Left edge
  const leftGrad = ctx.createLinearGradient(0, 0, VIEW_W * edgeSize, 0);
  leftGrad.addColorStop(0, `rgba(239,68,68,${alpha})`);
  leftGrad.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, VIEW_W * edgeSize, VIEW_H);

  // Right edge
  const rightGrad = ctx.createLinearGradient(VIEW_W, 0, VIEW_W * (1 - edgeSize), 0);
  rightGrad.addColorStop(0, `rgba(239,68,68,${alpha})`);
  rightGrad.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(VIEW_W * (1 - edgeSize), 0, VIEW_W * edgeSize, VIEW_H);
}
