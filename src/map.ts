import { ROOM_DEFS, CORRIDORS, COLS, ROWS, T } from './config';
import type { Point, RoomDef, Door } from './types';

export function createGrid(): number[][] {
  const g: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(1));

  const carve = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h && yy < ROWS; yy++)
      for (let xx = x; xx < x + w && xx < COLS; xx++)
        if (yy >= 0 && xx >= 0) g[yy][xx] = 0;
  };

  for (const r of ROOM_DEFS) carve(r.x, r.y, r.w, r.h);
  for (const [x, y, w, h] of CORRIDORS) carve(x, y, w, h);

  for (const r of ROOM_DEFS) {
    if (!r.furn) continue;
    for (const [fx, fy, fw, fh] of r.furn)
      for (let yy = r.y + fy; yy < r.y + fy + fh && yy < ROWS; yy++)
        for (let xx = r.x + fx; xx < r.x + fx + fw && xx < COLS; xx++)
          if (yy >= 0 && xx >= 0) g[yy][xx] = 2;
  }

  const fr = roomDef('foyer')!;
  const ex = fr.x + Math.floor(fr.w / 2);
  for (let y = fr.y + fr.h; y < ROWS; y++) g[y][ex] = 0;

  return g;
}

export function roomDef(id: string): RoomDef | undefined {
  return ROOM_DEFS.find(r => r.id === id);
}

export function roomCenter(id: string): Point {
  const r = roomDef(id)!;
  return { x: (r.x + r.w / 2) * T, y: (r.y + r.h / 2) * T };
}

export function roomPos(id: string, dx: number, dy: number): Point {
  const c = roomCenter(id);
  return { x: c.x + dx * T, y: c.y + dy * T };
}

export function corrMid(idx: number): Point {
  const c = CORRIDORS[idx];
  return { x: (c[0] + c[2] / 2) * T, y: (c[1] + c[3] / 2) * T };
}

export function isWall(grid: number[][], tx: number, ty: number): boolean {
  return tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS || grid[ty][tx] >= 1;
}

export function isSolid(grid: number[][], tx: number, ty: number): boolean {
  return tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS || grid[ty][tx] === 1;
}

export function isWalkable(grid: number[][], tx: number, ty: number): boolean {
  return tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS && grid[ty][tx] === 0;
}

export function isDoorBlocking(doors: Door[], tx: number, ty: number): boolean {
  for (const d of doors) {
    if (d.tx === tx && d.ty === ty && d.state !== 'open') return true;
  }
  return false;
}

export function getDoorAt(doors: Door[], tx: number, ty: number): Door | undefined {
  return doors.find(d => d.tx === tx && d.ty === ty);
}
