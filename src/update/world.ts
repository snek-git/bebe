import { T, TOTAL_LOOT, COLS, ROWS, VIEW_W, VIEW_H } from '../config';
import { roomDef } from '../map';
import { dist } from '../utils';
import type { Game } from '../types';

export function updateDistractions(game: Game, dt: number): void {
  for (const d of game.distractions) d.timer -= dt;
  game.distractions = game.distractions.filter(d => d.timer > 0);
}

export function updateTVs(game: Game, dt: number): void {
  for (const tv of game.tvs) {
    if (tv.active) {
      tv.timer -= dt;
      if (tv.timer <= 0) tv.active = false;
    }
  }
}

export function updateDoors(game: Game, dt: number): void {
  for (const d of game.doors) {
    if (d.slamTimer > 0) d.slamTimer -= dt;
  }
}

export function updateNoiseEvents(game: Game, dt: number): void {
  for (const n of game.noiseEvents) n.timer -= dt;
  game.noiseEvents = game.noiseEvents.filter(n => n.timer > 0);
}

export function checkPickups(game: Game): void {
  const p = game.player;
  for (const cp of game.cheesePickups) {
    if (!cp.collected && dist(p, cp) < T * 0.6) {
      cp.collected = true;
      p.cheese++;
    }
  }
  for (const tp of game.toolPickups) {
    if (!tp.collected && dist(p, tp) < T * 0.6) {
      tp.collected = true;
      p.tools.push(tp.type);
    }
  }
  // Reclaim missed cheese/pacifiers from the ground
  for (const c of game.cheeses) {
    if (c.landed && !c.stuckBaby && dist(p, c) < T * 0.6) {
      if (c.isPacifier) {
        p.tools.push('pacifier');
      } else {
        p.cheese++;
      }
      c.dead = true;
    }
  }
}

export function checkWin(game: Game): void {
  const p = game.player;
  if (p.loot >= TOTAL_LOOT) {
    const er = roomDef('foyer')!;
    const ex = er.x + Math.floor(er.w / 2);
    if (Math.floor(p.x / T) === ex && p.y > (ROWS - 2) * T) {
      game.state = 'win';
    }
  }
}

export function updateCamera(game: Game, dt: number): void {
  const p = game.player;
  const tx = p.x - VIEW_W / 2;
  const ty = p.y - VIEW_H / 2;
  const sm = 8;
  game.camera.x += (tx - game.camera.x) * sm * dt;
  game.camera.y += (ty - game.camera.y) * sm * dt;
  game.camera.x = Math.max(0, Math.min(game.camera.x, COLS * T - VIEW_W));
  game.camera.y = Math.max(0, Math.min(game.camera.y, ROWS * T - VIEW_H));
}

export function updateMinimapSeen(game: Game, dt: number): void {
  const margin = 5; // dissolve clouds within 5 tiles beyond viewport edge
  const startX = game.camera.x / T - margin;
  const startY = game.camera.y / T - margin;
  const endX = (game.camera.x + VIEW_W) / T + margin;
  const endY = (game.camera.y + VIEW_H) / T + margin;
  for (const cloud of game.minimapClouds) {
    if (cloud.dissolve >= 1) continue;
    if (cloud.tx >= startX && cloud.tx <= endX && cloud.ty >= startY && cloud.ty <= endY) {
      cloud.dissolve += dt * 2.5; // ~0.4s full dissolve
    }
  }
}
