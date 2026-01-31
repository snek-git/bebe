import { T } from './config';
import { isSolid, isWalkable } from './map';
import type { Point } from './types';

export function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export function hasLOS(grid: number[][], x1: number, y1: number, x2: number, y2: number): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(d / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isSolid(grid, Math.floor((x1 + dx * t) / T), Math.floor((y1 + dy * t) / T))) return false;
  }
  return true;
}

export function resolveWalls(grid: number[][], ent: { x: number; y: number; radius: number }): void {
  const r = ent.radius;
  const tileX = Math.floor(ent.x / T);
  const tileY = Math.floor(ent.y / T);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = tileX + dx;
      const ty = tileY + dy;
      if (isWalkable(grid, tx, ty)) continue;
      const l = tx * T;
      const top = ty * T;
      const cx = Math.max(l, Math.min(ent.x, l + T));
      const cy = Math.max(top, Math.min(ent.y, top + T));
      const ex = ent.x - cx;
      const ey = ent.y - cy;
      const d = Math.sqrt(ex * ex + ey * ey);
      if (d < r && d > 0) {
        ent.x += (ex / d) * (r - d);
        ent.y += (ey / d) * (r - d);
      } else if (d === 0) {
        ent.x = (tileX + 0.5) * T;
        ent.y = (tileY + 0.5) * T;
      }
    }
  }
}
