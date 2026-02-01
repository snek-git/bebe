/**
 * Generate tile PNG textures for Bebe Heist.
 * Outputs 4 tiles at 128x128 to public/sprites/tiles/.
 *
 * Usage: npx tsx scripts/generate-tiles.ts
 */

import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const S = 128;
const OUT_DIR = join(import.meta.dirname ?? __dirname, '..', 'public', 'sprites', 'tiles');

// --- PRNG (ported from src/render/sketchy.ts) ---
let _seed = 0;
function srand(): number {
  _seed = (_seed * 16807 + 11) % 2147483647;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}
function sjitter(a: number): number {
  return (srand() - 0.5) * a;
}

// --- Crayon grain (ported from src/render/sketchy.ts) ---
function crayonGrain(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  alpha = 0.07,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = alpha;
  const step = 4;
  _seed = Math.round(x * 73 + y * 137) & 0x7fffffff;
  for (let d = -h; d < w; d += step) {
    ctx.beginPath();
    ctx.moveTo(x + d + sjitter(1.5), y + sjitter(1.5));
    ctx.lineTo(x + d + h + sjitter(1.5), y + h + sjitter(1.5));
    ctx.stroke();
  }
  ctx.restore();
}

// --- Sketchy rect (ported from src/render/sketchy.ts) ---
function sketchyRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { fill?: string; stroke?: string; lineWidth?: number; jitterAmt?: number; grain?: boolean } = {},
): void {
  const j = opts.jitterAmt ?? 1.0;
  const lw = opts.lineWidth ?? 6;

  if (opts.fill) {
    ctx.fillStyle = opts.fill;
    ctx.fillRect(x, y, w, h);
    if (opts.grain !== false) {
      crayonGrain(ctx, x, y, w, h);
    }
  }

  if (opts.stroke) {
    const segsH = Math.max(2, Math.round(w / 15));
    const segsV = Math.max(2, Math.round(h / 15));
    _seed = Math.round(x * 73 + y * 137 + w * 31) & 0x7fffffff;
    ctx.save();
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = lw + sjitter(lw * 0.2);
    ctx.globalAlpha = 0.75;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + sjitter(j), y + sjitter(j));
    for (let s = 1; s <= segsH; s++) ctx.lineTo(x + (w * s) / segsH + sjitter(j), y + sjitter(j));
    for (let s = 1; s <= segsV; s++) ctx.lineTo(x + w + sjitter(j), y + (h * s) / segsV + sjitter(j));
    for (let s = 1; s <= segsH; s++) ctx.lineTo(x + w - (w * s) / segsH + sjitter(j), y + h + sjitter(j));
    for (let s = 1; s <= segsV; s++) ctx.lineTo(x + sjitter(j), y + h - (h * s) / segsV + sjitter(j));
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// --- Tile generators ---

function generateFloor(variant: number): Buffer {
  const c = createCanvas(S, S);
  const ctx = c.getContext('2d') as unknown as CanvasRenderingContext2D;

  // Base colour
  const base = variant === 0 ? '#1e1e2e' : '#1c1c2a';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);

  // Diagonal grain lines (matching existing generateFloorTiles)
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  const step = 6;
  for (let d = -S; d < S; d += step) {
    const jx = () => (Math.sin(d * 73.1 + variant * 137) * 43758.5453 % 1 - 0.5) * 1.5;
    ctx.beginPath();
    ctx.moveTo(d + jx(), jx());
    ctx.lineTo(d + S + jx(), S + jx());
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Subtle dark speckles
  _seed = (variant * 9999 + 42) & 0x7fffffff;
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let i = 0; i < 60; i++) {
    const sx = srand() * S;
    const sy = srand() * S;
    const sr = srand() * 1.5 + 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  return c.toBuffer('image/png');
}

function generateWall(): Buffer {
  const c = createCanvas(S, S);
  const ctx = c.getContext('2d') as unknown as CanvasRenderingContext2D;

  // Base
  ctx.fillStyle = '#2a3a5c';
  ctx.fillRect(0, 0, S, S);

  // Grain overlay
  crayonGrain(ctx, 0, 0, S, S, 0.06);

  // Subtle darker edge borders for masonry feel
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, S - 2, S - 2);

  // Faint horizontal mortar lines
  _seed = 7777;
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  const mortarSpacing = 16;
  for (let y = mortarSpacing; y < S; y += mortarSpacing) {
    ctx.beginPath();
    ctx.moveTo(0 + sjitter(1), y + sjitter(0.5));
    ctx.lineTo(S + sjitter(1), y + sjitter(0.5));
    ctx.stroke();
  }

  return c.toBuffer('image/png');
}

function generateFurniture(): Buffer {
  const c = createCanvas(S, S);
  const ctx = c.getContext('2d') as unknown as CanvasRenderingContext2D;

  // Base with grain via sketchyRect
  sketchyRect(ctx, 0, 0, S, S, {
    fill: '#3d2e1c', stroke: 'rgba(90,65,40,0.5)', lineWidth: 2, jitterAmt: 0.5,
  });

  // Subtle wood-grain horizontal lines
  _seed = 5555;
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.8;
  for (let y = 8; y < S; y += 10 + Math.floor(srand() * 6)) {
    ctx.beginPath();
    ctx.moveTo(0, y + sjitter(1));
    for (let x = 10; x <= S; x += 10) {
      ctx.lineTo(x, y + sjitter(1.2));
    }
    ctx.stroke();
  }

  return c.toBuffer('image/png');
}

// --- Main ---
mkdirSync(OUT_DIR, { recursive: true });

const tiles: [string, Buffer][] = [
  ['floor0.png', generateFloor(0)],
  ['floor1.png', generateFloor(1)],
  ['wall.png', generateWall()],
  ['furniture.png', generateFurniture()],
];

for (const [name, buf] of tiles) {
  const path = join(OUT_DIR, name);
  writeFileSync(path, buf);
  console.log(`  wrote ${path} (${buf.length} bytes)`);
}

console.log('Done — 4 tile PNGs generated.');
