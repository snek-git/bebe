import {
  DETECTION_RATE, DETECTION_DECAY, BABY_RADIUS, PLAYER_RADIUS,
  SNEAKER_DETECTION_MULT,
} from '../config';
import { dist } from '../utils';
import { canBabySee } from './babies';
import type { Game } from '../types';

export function updateDetection(game: Game, dt: number): void {
  let seen = false;
  const p = game.player;

  for (const b of game.babies) {
    if (b.distracted) continue;
    if (b.type === 'toddler') continue;
    if (canBabySee(game, b) && !p.hiding) {
      seen = true;
      break;
    }
    if (b.type === 'stawler' && b.chasing && !b.stunTimer && dist(b, p) < BABY_RADIUS + PLAYER_RADIUS + 8) {
      p.hiding = false;
      p.stamina = 0;
      p.staminaExhausted = true;
      seen = true;
      break;
    }
  }

  if (seen) {
    const mult = p.gear.includes('sneakers') ? SNEAKER_DETECTION_MULT : 1.0;
    game.detection += DETECTION_RATE * mult * dt;
    if (game.detection >= 100) {
      game.detection = 100;
    }
  } else if (game.detection < 100) {
    game.detection = Math.max(0, game.detection - DETECTION_DECAY * dt);
  }

  // Update milk bottle drop animations
  // Timer values: 0 = never triggered, >0 = animating, -1 = settled
  const milkIndex = Math.min(5, Math.floor(game.detection / 20));
  for (let i = 0; i < 5; i++) {
    if (i < milkIndex && game.milkFillAnim[i] === 0) {
      game.milkFillAnim[i] = 0.3;
    }
    if (i >= milkIndex) {
      game.milkFillAnim[i] = 0; // detection decayed, reset
    }
    if (game.milkFillAnim[i] > 0) {
      game.milkFillAnim[i] -= dt;
      if (game.milkFillAnim[i] <= 0) {
        game.milkFillAnim[i] = -1; // settled, don't re-trigger
      }
    }
  }

  // End game after all 5 bottles have filled and settled
  if (game.detection >= 100 && game.milkFillAnim.every(t => t <= 0)) {
    game.state = 'gameover';
    game.gameOverTimer = 0;
  }
}
