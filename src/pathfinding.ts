import { T, COLS, ROWS } from './config';
import { isWalkable } from './map';
import type { Point } from './types';

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

export function findPath(grid: number[][], startX: number, startY: number, goalX: number, goalY: number): Point[] {
  const sx = Math.floor(startX / T);
  const sy = Math.floor(startY / T);
  const gx = Math.floor(goalX / T);
  const gy = Math.floor(goalY / T);

  if (sx === gx && sy === gy) return [];
  if (!isWalkable(grid, gx, gy)) return [];

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
