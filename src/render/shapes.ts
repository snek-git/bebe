export function drawToolShape(ctx: CanvasRenderingContext2D, px: number, py: number, type: string, s: number, time: number): void {
  switch (type) {
    case 'ipad':
      // Body (metallic casing)
      ctx.fillStyle = '#d4d4d8';
      ctx.beginPath();
      const w = s * 1.1, h = s * 1.5;
      const x = px - w / 2, y = py - h / 2;
      const r = s * 0.15;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();

      // Screen (black bezel)
      ctx.fillStyle = '#18181b';
      const bw = s * 0.95, bh = s * 1.25;
      const bx = px - bw / 2, by = py - bh / 2;
      ctx.fillRect(bx, by, bw, bh);

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
      ctx.fillStyle = '#a1a1aa';
      ctx.beginPath(); ctx.arc(px, py + h / 2 - s * 0.12, s * 0.05, 0, Math.PI * 2); ctx.fill();

      // Camera dot
      ctx.fillStyle = '#18181b';
      ctx.beginPath(); ctx.arc(px, py - h / 2 + s * 0.12, s * 0.03, 0, Math.PI * 2); ctx.fill();
      break;
    case 'remote':
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(px - s * 0.25, py - s * 0.6, s * 0.5, s * 1.2);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(px, py - s * 0.3, s * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#71717a';
      ctx.fillRect(px - s * 0.12, py - s * 0.05, s * 0.24, s * 0.12);
      ctx.fillRect(px - s * 0.12, py + s * 0.15, s * 0.24, s * 0.12);
      break;
    case 'pacifier':
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(px, py, s * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = s * 0.15;
      ctx.beginPath(); ctx.arc(px, py - s * 0.15, s * 0.55, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
      break;
  }
}

export function drawLootShape(ctx: CanvasRenderingContext2D, px: number, py: number, type: string, s: number): void {
  switch (type) {
    case 'cash':
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(px - s * 0.6, py - s * 0.4, s * 1.2, s * 0.8);
      ctx.fillStyle = '#166534';
      ctx.font = `bold ${s}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', px, py + 1);
      break;
    case 'gold':
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px - s * 0.7, py - s * 0.3, s * 1.4, s * 0.6);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px - s * 0.5, py - s * 0.1, s, s * 0.2);
      break;
    case 'diamond':
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(px, py - s * 0.7); ctx.lineTo(px + s * 0.5, py);
      ctx.lineTo(px, py + s * 0.7); ctx.lineTo(px - s * 0.5, py);
      ctx.closePath(); ctx.fill();
      break;
    case 'key':
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(px - s * 0.3, py, s * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(px, py - s * 0.12, s * 0.7, s * 0.24);
      ctx.fillRect(px + s * 0.5, py, s * 0.2, s * 0.3);
      ctx.fillStyle = '#1e1e2e';
      ctx.beginPath(); ctx.arc(px - s * 0.3, py, s * 0.15, 0, Math.PI * 2); ctx.fill();
      break;
    case 'docs':
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(px - s * 0.4, py - s * 0.55, s * 0.8, s * 1.1);
      ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(px - s * 0.25, py - s * 0.3 + i * s * 0.25);
        ctx.lineTo(px + s * 0.25, py - s * 0.3 + i * s * 0.25);
        ctx.stroke();
      }
      break;
    case 'jewels':
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(px - s * 0.45, py - s * 0.35, s * 0.9, s * 0.7);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(px - s * 0.35, py - s * 0.25, s * 0.7, s * 0.5);
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath(); ctx.arc(px, py, s * 0.15, 0, Math.PI * 2); ctx.fill();
      break;
    case 'coin':
      ctx.fillStyle = '#fb923c';
      ctx.beginPath(); ctx.arc(px, py, s * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#c2410c';
      ctx.font = `bold ${s * 0.5}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('B', px, py + 1);
      break;
  }
}
