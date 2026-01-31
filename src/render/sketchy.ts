/** Crayon-style drawing helpers & unified palette */

export const SK = {
  bg:         'rgba(20,57,94,0.65)',
  cardFill:   'rgba(20,57,94,0.92)',
  cardStroke: 'rgba(72,129,140,0.45)',
  primary:    '#77989e',
  accent:     '#48818c',
  highlight:  '#f0ea9e',
  warning:    '#e0745e',
  dim:        '#39646b',
} as const;

// Stable pseudo-random: deterministic per-position, no flicker
let _seed = 0;
function srand(): number {
  _seed = (_seed * 16807 + 11) % 2147483647;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}
function sjitter(a: number): number {
  return (srand() - 0.5) * a;
}

/**
 * Overlay crayon grain texture (diagonal strokes) clipped to a rect.
 */
export function crayonGrain(
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

/**
 * Draw text with a crayon multi-pass effect.
 * Respects current ctx.globalAlpha.
 */
export function crayonText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  opts: {
    fill: string;
    font: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    passes?: number;
    jitterAmt?: number;
  },
): void {
  const passes = opts.passes ?? 2;
  const j = opts.jitterAmt ?? 0.3;
  const prevAlpha = ctx.globalAlpha;

  ctx.font = opts.font;
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = opts.baseline ?? 'alphabetic';
  ctx.fillStyle = opts.fill;

  _seed = Math.round(x * 97 + y * 53 + text.length * 11) & 0x7fffffff;

  ctx.globalAlpha = prevAlpha * 0.9;
  ctx.fillText(text, x, y);

  for (let p = 1; p < passes; p++) {
    ctx.globalAlpha = prevAlpha * (0.15 + srand() * 0.15);
    ctx.fillText(text, x + sjitter(j), y + sjitter(j));
  }

  ctx.globalAlpha = prevAlpha;
}

/**
 * Crayon-style rectangle: thick stable strokes + optional grain fill.
 */
export function sketchyRect(
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

/**
 * Crayon-style wavy line.
 */
export function sketchyLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  opts: { stroke?: string; lineWidth?: number; jitterAmt?: number } = {},
): void {
  const j = opts.jitterAmt ?? 0.6;
  const lw = opts.lineWidth ?? 6;
  const segs = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 8));

  _seed = Math.round(x1 * 97 + y1 * 53 + x2 * 31 + y2 * 71) & 0x7fffffff;
  ctx.save();
  ctx.strokeStyle = opts.stroke ?? SK.cardStroke;
  ctx.lineWidth = lw + sjitter(lw * 0.2);
  ctx.globalAlpha = 0.75;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1 + sjitter(j), y1 + sjitter(j));
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    ctx.lineTo(
      x1 + (x2 - x1) * t + sjitter(j),
      y1 + (y2 - y1) * t + sjitter(j),
    );
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Crayon-style rounded rectangle with thick stable strokes + optional grain fill.
 */
export function sketchyRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  opts: { fill?: string; stroke?: string; lineWidth?: number; jitterAmt?: number; grain?: boolean } = {},
): void {
  const rr = Math.min(r, w / 2, h / 2);
  const j = opts.jitterAmt ?? 0.8;
  const lw = opts.lineWidth ?? 6;

  function cleanRoundPath() {
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

  if (opts.fill) {
    cleanRoundPath();
    ctx.fillStyle = opts.fill;
    ctx.fill();
    if (opts.grain !== false) {
      ctx.save();
      cleanRoundPath();
      ctx.clip();
      crayonGrain(ctx, x, y, w, h);
      ctx.restore();
    }
  }

  if (opts.stroke) {
    _seed = Math.round(x * 73 + y * 137 + w * 31 + h * 17) & 0x7fffffff;
    ctx.save();
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = lw + sjitter(lw * 0.2);
    ctx.globalAlpha = 0.75;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const jx = () => sjitter(j);
    ctx.beginPath();
    ctx.moveTo(x + rr + jx(), y + jx());
    ctx.lineTo(x + w - rr + jx(), y + jx());
    ctx.quadraticCurveTo(x + w + jx(), y + jx(), x + w + jx(), y + rr + jx());
    ctx.lineTo(x + w + jx(), y + h - rr + jx());
    ctx.quadraticCurveTo(x + w + jx(), y + h + jx(), x + w - rr + jx(), y + h + jx());
    ctx.lineTo(x + rr + jx(), y + h + jx());
    ctx.quadraticCurveTo(x + jx(), y + h + jx(), x + jx(), y + h - rr + jx());
    ctx.lineTo(x + jx(), y + rr + jx());
    ctx.quadraticCurveTo(x + jx(), y + jx(), x + rr + jx(), y + jx());
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Crayon-style circle with thick stable strokes.
 */
export function crayonCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  opts: { fill?: string; stroke?: string; lineWidth?: number; jitterAmt?: number } = {},
): void {
  const j = opts.jitterAmt ?? 0.8;
  const lw = opts.lineWidth ?? 6;

  if (opts.fill) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = opts.fill;
    ctx.fill();
  }

  if (opts.stroke) {
    const points = 20;
    _seed = Math.round(cx * 73 + cy * 137 + radius * 31) & 0x7fffffff;
    ctx.save();
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = lw + sjitter(lw * 0.2);
    ctx.globalAlpha = 0.75;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius + sjitter(j);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
