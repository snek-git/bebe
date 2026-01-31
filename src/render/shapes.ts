import { sketchyRect, sketchyRoundRect, sketchyLine, crayonCircle, crayonText } from './sketchy';

export function drawToolShape(ctx: CanvasRenderingContext2D, px: number, py: number, type: string, s: number, time: number): void {
  switch (type) {
    case 'ipad': {
      // Body (metallic casing) — crayon rounded rect
      const w = s * 1.1, h = s * 1.5;
      const x = px - w / 2, y = py - h / 2;
      sketchyRoundRect(ctx, x, y, w, h, s * 0.15, {
        fill: '#d4d4d8', stroke: '#a1a1aa', lineWidth: 1.5, jitterAmt: 0.4,
      });

      // Screen (black bezel)
      const bw = s * 0.95, bh = s * 1.25;
      const bx = px - bw / 2, by = py - bh / 2;
      sketchyRect(ctx, bx, by, bw, bh, {
        fill: '#18181b', lineWidth: 1, jitterAmt: 0.3, grain: false,
      });

      // Liquid Display (glowing blue)
      ctx.fillStyle = '#3b82f6';
      ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.2;
      const sw = s * 0.85, sh = s * 1.05;
      const sx = px - sw / 2, sy = py - sh / 2;
      ctx.fillRect(sx, sy, sw, sh);

      // App icons (simple grids)
      ctx.globalAlpha = 0.8 + Math.sin(time * 3) * 0.1;
      ctx.fillStyle = '#eff6ff';
      const gap = s * 0.05, iconS = s * 0.18;
      const startIx = px - (iconS * 1.5 + gap);
      const startIy = sy + gap * 2;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillRect(startIx + col * (iconS + gap), startIy + row * (iconS + gap), iconS, iconS);
        }
      }
      ctx.globalAlpha = 1;

      // Home button
      crayonCircle(ctx, px, py + h / 2 - s * 0.12, s * 0.05, {
        fill: '#a1a1aa', jitterAmt: 0.1,
      });

      // Camera dot
      crayonCircle(ctx, px, py - h / 2 + s * 0.12, s * 0.03, {
        fill: '#18181b', jitterAmt: 0.1,
      });
      break;
    }
    case 'remote': {
      // Body
      sketchyRect(ctx, px - s * 0.25, py - s * 0.6, s * 0.5, s * 1.2, {
        fill: '#3f3f46', stroke: '#52525b', lineWidth: 1.5, jitterAmt: 0.4, grain: false,
      });
      // Button
      crayonCircle(ctx, px, py - s * 0.3, s * 0.1, {
        fill: '#ef4444', stroke: '#dc2626', lineWidth: 1, jitterAmt: 0.2,
      });
      // Small buttons
      sketchyRect(ctx, px - s * 0.12, py - s * 0.05, s * 0.24, s * 0.12, {
        fill: '#71717a', lineWidth: 0.5, jitterAmt: 0.2, grain: false,
      });
      sketchyRect(ctx, px - s * 0.12, py + s * 0.15, s * 0.24, s * 0.12, {
        fill: '#71717a', lineWidth: 0.5, jitterAmt: 0.2, grain: false,
      });
      break;
    }
    case 'pacifier': {
      // Nipple
      crayonCircle(ctx, px, py, s * 0.4, {
        fill: '#f59e0b', stroke: '#d97706', lineWidth: 1.5, jitterAmt: 0.3,
      });
      // Ring — wobbly arc
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = s * 0.15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Draw ring as a series of short segments for wobble
      const cx = px, cy = py - s * 0.15, r = s * 0.55;
      const startA = -Math.PI * 0.8, endA = -Math.PI * 0.2;
      const segs = 8;
      const seed = Math.round(px * 73 + py * 137) & 0x7fffffff;
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const a = startA + (endA - startA) * t;
        const jv = Math.sin(seed * 0.0173 + i * 127.1) * 0.5;
        const ix = cx + Math.cos(a) * (r + jv);
        const iy = cy + Math.sin(a) * (r + jv);
        i === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }
  }
}

export function drawLootShape(ctx: CanvasRenderingContext2D, px: number, py: number, type: string, s: number): void {
  switch (type) {
    case 'cash': {
      sketchyRect(ctx, px - s * 0.6, py - s * 0.4, s * 1.2, s * 0.8, {
        fill: '#4ade80', stroke: '#22c55e', lineWidth: 1.5, jitterAmt: 0.4,
      });
      crayonText(ctx, '$', px, py + 1, {
        fill: '#166534', font: `bold ${s}px monospace`, align: 'center', baseline: 'middle',
      });
      break;
    }
    case 'gold': {
      // Gold bar layers
      sketchyRect(ctx, px - s * 0.7, py - s * 0.3, s * 1.4, s * 0.6, {
        fill: '#fbbf24', stroke: '#d97706', lineWidth: 1.5, jitterAmt: 0.4,
      });
      sketchyRect(ctx, px - s * 0.5, py - s * 0.1, s, s * 0.2, {
        fill: '#92400e', lineWidth: 0.5, jitterAmt: 0.3, grain: false,
      });
      break;
    }
    case 'diamond': {
      // Wobbly diamond path with thick strokes
      const seed = Math.round(px * 73 + py * 137) & 0x7fffffff;
      const j = (i: number) => Math.sin(seed * 0.0173 + i * 127.1) * 0.8;
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(px + j(1), py - s * 0.7 + j(2));
      ctx.lineTo(px + s * 0.5 + j(3), py + j(4));
      ctx.lineTo(px + j(5), py + s * 0.7 + j(6));
      ctx.lineTo(px - s * 0.5 + j(7), py + j(8));
      ctx.closePath(); ctx.fill();
      // Thick crayon outline
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.75;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px + j(1), py - s * 0.7 + j(2));
      ctx.lineTo(px + s * 0.5 + j(3), py + j(4));
      ctx.lineTo(px + j(5), py + s * 0.7 + j(6));
      ctx.lineTo(px - s * 0.5 + j(7), py + j(8));
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'key': {
      // Key head
      crayonCircle(ctx, px - s * 0.3, py, s * 0.35, {
        fill: '#facc15', stroke: '#d97706', lineWidth: 1.5, jitterAmt: 0.3,
      });
      // Shaft
      sketchyRect(ctx, px, py - s * 0.12, s * 0.7, s * 0.24, {
        fill: '#facc15', lineWidth: 1, jitterAmt: 0.3, grain: false,
      });
      sketchyRect(ctx, px + s * 0.5, py, s * 0.2, s * 0.3, {
        fill: '#facc15', lineWidth: 0.5, jitterAmt: 0.2, grain: false,
      });
      // Hole
      crayonCircle(ctx, px - s * 0.3, py, s * 0.15, {
        fill: '#1e1e2e', jitterAmt: 0.2,
      });
      break;
    }
    case 'docs': {
      // Paper
      sketchyRect(ctx, px - s * 0.4, py - s * 0.55, s * 0.8, s * 1.1, {
        fill: '#e5e7eb', stroke: '#9ca3af', lineWidth: 1.5, jitterAmt: 0.4,
      });
      // Text lines
      for (let i = 0; i < 3; i++) {
        sketchyLine(ctx,
          px - s * 0.25, py - s * 0.3 + i * s * 0.25,
          px + s * 0.25, py - s * 0.3 + i * s * 0.25,
          { stroke: '#9ca3af', lineWidth: 1, jitterAmt: 0.3 },
        );
      }
      break;
    }
    case 'jewels': {
      // Box layers
      sketchyRect(ctx, px - s * 0.45, py - s * 0.35, s * 0.9, s * 0.7, {
        fill: '#c084fc', stroke: '#a855f7', lineWidth: 1.5, jitterAmt: 0.4,
      });
      sketchyRect(ctx, px - s * 0.35, py - s * 0.25, s * 0.7, s * 0.5, {
        fill: '#a855f7', lineWidth: 1, jitterAmt: 0.3, grain: false,
      });
      // Gem
      crayonCircle(ctx, px, py, s * 0.15, {
        fill: '#e9d5ff', stroke: '#c084fc', lineWidth: 1, jitterAmt: 0.2,
      });
      break;
    }
    case 'coin': {
      // Coin body
      crayonCircle(ctx, px, py, s * 0.45, {
        fill: '#fb923c', stroke: '#c2410c', lineWidth: 2, jitterAmt: 0.4,
      });
      // Label
      crayonText(ctx, 'B', px, py + 1, {
        fill: '#c2410c', font: `bold ${s * 0.5}px monospace`, align: 'center', baseline: 'middle',
      });
      break;
    }
  }
}
