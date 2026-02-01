import { VISION_RANGE, VISION_ANGLE, STAWLER_APPROACH_RANGE, T, VIEW_W, VIEW_H } from '../config';
import { isSolid, isDoorBlocking } from '../map';
import { canBabySee, canBabySeePeeker } from '../update/babies';
import type { Game } from '../types';

const RAY_COUNT = 48;

/** Deterministic wobble from baby position + ray index */
function wobble(bx: number, by: number, i: number): number {
  const seed = Math.round(bx * 73 + by * 137 + i * 31) & 0x7fffffff;
  return (Math.sin(seed * 0.0173) * 43758.5453 % 1) * 3 - 1.5;
}

export function renderVisionCones(ctx: CanvasRenderingContext2D, game: Game): void {
  const cam = game.camera;

  for (const b of game.babies) {
    if (b.stunTimer > 0) continue;
    if (b.x < cam.x - VISION_RANGE - 50 || b.x > cam.x + VIEW_W + VISION_RANGE + 50 ||
        b.y < cam.y - VISION_RANGE - 50 || b.y > cam.y + VIEW_H + VISION_RANGE + 50) continue;

    const range = b.type === 'stawler' ? STAWLER_APPROACH_RANGE : VISION_RANGE;
    const seeing = canBabySee(game, b) && !game.player.hiding;
    const crawlerSeeHiding = b.type === 'stawler' && canBabySeePeeker(game, b) && game.player.hiding;
    const halfAngle = VISION_ANGLE / 2;

    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= RAY_COUNT; i++) {
      const ang = b.facing - halfAngle + (VISION_ANGLE * i / RAY_COUNT);
      const cs = Math.cos(ang), sn = Math.sin(ang);
      let hitD = range;
      for (let d = 8; d <= range; d += 8) {
        const tx = Math.floor((b.x + cs * d) / T);
        const ty = Math.floor((b.y + sn * d) / T);
        if (isSolid(game.grid, tx, ty) || isDoorBlocking(game.doors, tx, ty)) {
          hitD = d;
          break;
        }
      }
      // Add slight wobble to ray endpoints for hand-drawn feel
      const wx = wobble(b.x, b.y, i * 2);
      const wy = wobble(b.x, b.y, i * 2 + 1);
      pts.push({ x: b.x + cs * hitD + wx, y: b.y + sn * hitD + wy });
    }

    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.closePath();

    if (seeing) ctx.fillStyle = 'rgba(239,68,68,0.18)';
    else if (crawlerSeeHiding) ctx.fillStyle = 'rgba(244,114,182,0.15)';
    else ctx.fillStyle = b.type === 'boss' ? 'rgba(220,38,38,0.08)' : (b.type === 'stawler' ? 'rgba(236,72,153,0.08)' : 'rgba(251,191,36,0.08)');
    ctx.fill();

    if (seeing) ctx.strokeStyle = 'rgba(239,68,68,0.35)';
    else if (crawlerSeeHiding) ctx.strokeStyle = 'rgba(244,114,182,0.3)';
    else ctx.strokeStyle = b.type === 'boss' ? 'rgba(220,38,38,0.15)' : (b.type === 'stawler' ? 'rgba(236,72,153,0.15)' : 'rgba(251,191,36,0.12)');
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.stroke();
  }
}
