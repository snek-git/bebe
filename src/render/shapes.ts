export function drawToolShape(ctx: CanvasRenderingContext2D, px: number, py: number, type: string, s: number, time: number): void {
  switch (type) {
    case 'ipad':
      ctx.fillStyle = '#52525b';
      ctx.fillRect(px - s * 0.5, py - s * 0.65, s, s * 1.3);
      ctx.fillStyle = '#a1a1aa';
      ctx.fillRect(px - s * 0.38, py - s * 0.5, s * 0.76, s);
      ctx.fillStyle = '#60a5fa';
      ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.3;
      ctx.fillRect(px - s * 0.3, py - s * 0.4, s * 0.6, s * 0.8);
      ctx.globalAlpha = 1;
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
