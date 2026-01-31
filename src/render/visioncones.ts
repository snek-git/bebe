import { VISION_RANGE, VISION_ANGLE, STAWLER_APPROACH_RANGE, T, VIEW_W, VIEW_H } from '../config';
import { isSolid } from '../map';
import { canBabySee, canBabySeePeeker } from '../update/babies';
import type { Game } from '../types';

const RAY_COUNT = 48;

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
        if (isSolid(game.grid, Math.floor((b.x + cs * d) / T), Math.floor((b.y + sn * d) / T))) {
          hitD = d;
          break;
        }
      }
      pts.push({ x: b.x + cs * hitD, y: b.y + sn * hitD });
    }

    const bx = b.x - cam.x, by = b.y - cam.y;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    for (const p of pts) ctx.lineTo(p.x - cam.x, p.y - cam.y);
    ctx.closePath();

    if (seeing) ctx.fillStyle = 'rgba(239,68,68,0.18)';
    else if (crawlerSeeHiding) ctx.fillStyle = 'rgba(244,114,182,0.15)';
    else ctx.fillStyle = b.type === 'stawler' ? 'rgba(236,72,153,0.08)' : 'rgba(251,191,36,0.08)';
    ctx.fill();

    if (seeing) ctx.strokeStyle = 'rgba(239,68,68,0.35)';
    else if (crawlerSeeHiding) ctx.strokeStyle = 'rgba(244,114,182,0.3)';
    else ctx.strokeStyle = b.type === 'stawler' ? 'rgba(236,72,153,0.15)' : 'rgba(251,191,36,0.12)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    for (const p of pts) ctx.lineTo(p.x - cam.x, p.y - cam.y);
    ctx.closePath();
    ctx.stroke();
  }
}
