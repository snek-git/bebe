import { COLS, ROWS } from '../config';
import type { EditorState } from './types';

export function buildGrid(state: EditorState): number[][] {
  const g: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(1));

  const carve = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h && yy < ROWS; yy++)
      for (let xx = x; xx < x + w && xx < COLS; xx++)
        if (yy >= 0 && xx >= 0) g[yy][xx] = 0;
  };

  for (const r of state.rooms) carve(r.x, r.y, r.w, r.h);
  for (const c of state.corridors) carve(c.x, c.y, c.w, c.h);

  for (const r of state.rooms) {
    for (const f of r.furn) {
      for (let yy = r.y + f.fy; yy < r.y + f.fy + f.fh && yy < ROWS; yy++)
        for (let xx = r.x + f.fx; xx < r.x + f.fx + f.fw && xx < COLS; xx++)
          if (yy >= 0 && xx >= 0) g[yy][xx] = 2;
    }
  }

  // Manual wall overrides (painted inside rooms)
  for (const w of state.walls) {
    if (w.ty >= 0 && w.ty < ROWS && w.tx >= 0 && w.tx < COLS) {
      g[w.ty][w.tx] = 1;
    }
  }

  // Foyer exit channel
  const foyer = state.rooms.find(r => r.id === 'foyer');
  if (foyer) {
    const ex = foyer.x + Math.floor(foyer.w / 2);
    for (let y = foyer.y + foyer.h; y < ROWS; y++) g[y][ex] = 0;
  }

  return g;
}
