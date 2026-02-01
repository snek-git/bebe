import { T, COLS, ROWS } from './config';
import { isWalkable, isDoorBlocking } from './map';
import type { Point, Door } from './types';

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function nearestWalkable(grid: number[][], tx: number, ty: number): { x: number; y: number } | null {
  if (isWalkable(grid, tx, ty)) return { x: tx, y: ty };
  for (let r = 1; r <= 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        if (isWalkable(grid, tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy };
      }
    }
  }
  return null;
}

export function findPath(grid: number[][], startX: number, startY: number, goalX: number, goalY: number, doors?: Door[]): Point[] {
  let sx = Math.floor(startX / T);
  let sy = Math.floor(startY / T);
  let gx = Math.floor(goalX / T);
  let gy = Math.floor(goalY / T);

  // Snap start/goal to nearest walkable tile if on furniture/wall
  const startSnap = nearestWalkable(grid, sx, sy);
  if (!startSnap) return [];
  sx = startSnap.x; sy = startSnap.y;

  const goalSnap = nearestWalkable(grid, gx, gy);
  if (!goalSnap) return [];
  gx = goalSnap.x; gy = goalSnap.y;

  if (sx === gx && sy === gy) return [];

  const open: Node[] = [];
  const closed = new Set<number>();
  const key = (x: number, y: number) => y * COLS + x;

  const start: Node = { x: sx, y: sy, g: 0, h: heuristic(sx, sy, gx, gy), f: 0, parent: null };
  start.f = start.g + start.h;
  open.push(start);

  let iterations = 0;
  while (open.length > 0 && iterations < 4000) {
    iterations++;

    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const current = open[bestIdx];
    open.splice(bestIdx, 1);

    if (current.x === gx && current.y === gy) {
      const path: Point[] = [];
      let node: Node | null = current;
      while (node) {
        path.push({ x: (node.x + 0.5) * T, y: (node.y + 0.5) * T });
        node = node.parent;
      }
      path.reverse();
      return path.slice(1);
    }

    const ck = key(current.x, current.y);
    if (closed.has(ck)) continue;
    closed.add(ck);

    for (const [dx, dy] of DIRS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!isWalkable(grid, nx, ny)) continue;
      if (doors && isDoorBlocking(doors, nx, ny)) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;

      const g = current.g + 1;
      const h = heuristic(nx, ny, gx, gy);
      const existing = open.find(n => n.x === nx && n.y === ny);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = g + h;
          existing.parent = current;
        }
      } else {
        open.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
      }
    }
  }

  return [];
}
