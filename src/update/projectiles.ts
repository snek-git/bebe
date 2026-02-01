import {
  CHEESE_SPEED, CHEESE_STUN_TIME, PACIFIER_CALM_TIME,
  BABY_RADIUS, T,
} from '../config';
import { isSolid } from '../map';
import { dist } from '../utils';
import { playCheeseHit } from '../audio';
import type { Game } from '../types';

export function updateProjectiles(game: Game, dt: number): void {
  for (const c of game.cheeses) {
    if (!c.landed) {
      const px = c.x, py = c.y;
      const spd = c.isPacifier ? CHEESE_SPEED * 0.8 : CHEESE_SPEED;

      const dx = c.targetX - c.x, dy = c.targetY - c.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const mv = spd * dt;

      if (mv >= d) {
        c.x = c.targetX;
        c.y = c.targetY;
      } else {
        c.x += (dx / d) * mv;
        c.y += (dy / d) * mv;
      }

      const stunTime = c.isPacifier ? PACIFIER_CALM_TIME : CHEESE_STUN_TIME;

      if (isSolid(game.grid, Math.floor(c.x / T), Math.floor(c.y / T))) {
        c.x = px;
        c.y = py;
        c.landed = true;
        c.timer = stunTime;
        continue;
      }

      for (const b of game.babies) {
        if (b.stunTimer > 0) continue;
        if (dist(c, b) < BABY_RADIUS + 6) {
          if (b.type === 'boss' && !c.isPacifier) {
            if (Math.random() < 0.5) {
              c.landed = true;
              c.timer = 0.5;
              continue;
            }
          }
          c.landed = true;
          c.timer = stunTime;
          c.stuckBaby = b;
          b.stunTimer = stunTime;
          playCheeseHit();
          break;
        }
      }

      if (!c.landed && dist(c, { x: c.targetX, y: c.targetY }) < 4) {
        c.landed = true;
        c.timer = stunTime;
      }
    } else {
      if (c.stuckBaby) {
        c.timer -= dt;
        c.x = c.stuckBaby.x;
        c.y = c.stuckBaby.y - BABY_RADIUS - 4;
        if (c.timer <= 0) c.dead = true;
      }
      // Missed cheese (no stuckBaby) stays on ground — picked up via checkPickups
    }
  }

  game.cheeses = game.cheeses.filter(c => !c.dead);
}
