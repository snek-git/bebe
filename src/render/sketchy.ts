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

function jitter(a: number): number {
  return (Math.random() - 0.5) * a;
}

/**
 * Overlay crayon grain texture (diagonal strokes) clipped to a rect.
 */
export function crayonGrain(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  alpha = 0.04,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.7;
  ctx.globalAlpha = alpha;
  const step = 4;
  for (let d = -h; d < w; d += step) {
    ctx.beginPath();
    ctx.moveTo(x + d + jitter(1.5), y + jitter(1.5));
    ctx.lineTo(x + d + h + jitter(1.5), y + h + jitter(1.5));
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
  const passes = opts.passes ?? 3;
  const j = opts.jitterAmt ?? 0.8;
  const prevAlpha = ctx.globalAlpha;

  ctx.font = opts.font;
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = opts.baseline ?? 'alphabetic';
  ctx.fillStyle = opts.fill;

  ctx.globalAlpha = prevAlpha * 0.85;
  ctx.fillText(text, x, y);

  for (let p = 1; p < passes; p++) {
    ctx.globalAlpha = prevAlpha * (0.15 + Math.random() * 0.2);
    ctx.fillText(text, x + jitter(j), y + jitter(j));
  }

  ctx.globalAlpha = prevAlpha;
}

/**
 * Crayon-style rectangle: multi-pass wobbly strokes + optional grain fill.
 */
export function sketchyRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { fill?: string; stroke?: string; lineWidth?: number; jitterAmt?: number; grain?: boolean } = {},
): void {
  const j = opts.jitterAmt ?? 2.5;
  const lw = opts.lineWidth ?? 2;

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
    for (let pass = 0; pass < 3; pass++) {
      ctx.save();
      ctx.strokeStyle = opts.stroke;
      ctx.lineWidth = lw + jitter(lw * 0.4);
      ctx.globalAlpha = 0.35 + Math.random() * 0.35;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + jitter(j), y + jitter(j));
      for (let s = 1; s <= segsH; s++) ctx.lineTo(x + (w * s) / segsH + jitter(j), y + jitter(j));
      for (let s = 1; s <= segsV; s++) ctx.lineTo(x + w + jitter(j), y + (h * s) / segsV + jitter(j));
      for (let s = 1; s <= segsH; s++) ctx.lineTo(x + w - (w * s) / segsH + jitter(j), y + h + jitter(j));
      for (let s = 1; s <= segsV; s++) ctx.lineTo(x + jitter(j), y + h - (h * s) / segsV + jitter(j));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * Crayon-style wavy line with multi-pass rendering.
 */
export function sketchyLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  opts: { stroke?: string; lineWidth?: number; jitterAmt?: number } = {},
): void {
  const j = opts.jitterAmt ?? 1.5;
  const lw = opts.lineWidth ?? 2;
  const segs = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 8));

  for (let pass = 0; pass < 3; pass++) {
    ctx.save();
    ctx.strokeStyle = opts.stroke ?? SK.cardStroke;
    ctx.lineWidth = lw + jitter(lw * 0.3);
    ctx.globalAlpha = 0.35 + Math.random() * 0.35;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1 + jitter(j), y1 + jitter(j));
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      ctx.lineTo(
        x1 + (x2 - x1) * t + jitter(j),
        y1 + (y2 - y1) * t + jitter(j),
      );
    }
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Crayon-style rounded rectangle with multi-pass strokes + optional grain fill.
 */
export function sketchyRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  opts: { fill?: string; stroke?: string; lineWidth?: number; jitterAmt?: number; grain?: boolean } = {},
): void {
  const rr = Math.min(r, w / 2, h / 2);
  const j = opts.jitterAmt ?? 2;
  const lw = opts.lineWidth ?? 2;

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
    for (let pass = 0; pass < 3; pass++) {
      ctx.save();
      ctx.strokeStyle = opts.stroke;
      ctx.lineWidth = lw + jitter(lw * 0.3);
      ctx.globalAlpha = 0.35 + Math.random() * 0.35;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const jx = () => jitter(j);
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
}

/**
 * Crayon-style circle with multi-pass wobbly strokes.
 */
export function crayonCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  opts: { fill?: string; stroke?: string; lineWidth?: number; jitterAmt?: number } = {},
): void {
  const j = opts.jitterAmt ?? 2;
  const lw = opts.lineWidth ?? 2;

  if (opts.fill) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = opts.fill;
    ctx.fill();
  }

  if (opts.stroke) {
    const points = 20;
    for (let pass = 0; pass < 3; pass++) {
      ctx.save();
      ctx.strokeStyle = opts.stroke;
      ctx.lineWidth = lw + jitter(lw * 0.3);
      ctx.globalAlpha = 0.35 + Math.random() * 0.35;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius + jitter(j);
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }
}
