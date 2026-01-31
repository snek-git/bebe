import { PLAYER_SPEED, PEEKABOO_MAX, PEEKABOO_RECHARGE, LOOT_TIME, T } from '../config';
import { resolveWalls, dist } from '../utils';
import { isDown } from '../input';
import type { Game } from '../types';

export function updatePlayer(game: Game, dt: number): void {
  const p = game.player;

  if (isDown('Space') && !p.looting && !p.peekExhausted && p.peekStamina > 0) {
    p.hiding = true;
    p.vx = 0;
    p.vy = 0;
    p.peekStamina = Math.max(0, p.peekStamina - dt);
    if (p.peekStamina <= 0) {
      p.peekExhausted = true;
      p.hiding = false;
    }
  } else {
    p.hiding = false;
    p.peekStamina = Math.min(PEEKABOO_MAX, p.peekStamina + dt * PEEKABOO_RECHARGE);
    if (p.peekExhausted && p.peekStamina >= PEEKABOO_MAX * 0.4) p.peekExhausted = false;
  }

  if (!p.hiding && !p.looting) {
    let dx = 0, dy = 0;
    if (isDown('w') || isDown('arrowup')) dy = -1;
    if (isDown('s') || isDown('arrowdown')) dy = 1;
    if (isDown('a') || isDown('arrowleft')) dx = -1;
    if (isDown('d') || isDown('arrowright')) dx = 1;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }
    p.vx = dx * PLAYER_SPEED;
    p.vy = dy * PLAYER_SPEED;
    if (dx || dy) p.facing = Math.atan2(dy, dx);
  }

  if (p.looting) {
    p.lootTimer -= dt;
    if (isDown('w') || isDown('s') || isDown('a') || isDown('d') ||
        isDown('arrowup') || isDown('arrowdown') || isDown('arrowleft') || isDown('arrowright')) {
      p.looting = false;
      p.lootTarget = null;
    } else if (p.lootTimer <= 0) {
      p.lootTarget!.collected = true;
      p.loot++;
      p.looting = false;
      p.lootTarget = null;
    }
  }

  if (!p.looting && !p.hiding && isDown('e')) {
    for (const l of game.loots) {
      if (!l.collected && dist(p, l) < T * 0.9) {
        p.looting = true;
        p.lootTimer = LOOT_TIME;
        p.lootTarget = l;
        p.vx = 0;
        p.vy = 0;
        break;
      }
    }
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;
  resolveWalls(game.grid, p);
}
