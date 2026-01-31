import { DETECTION_RATE, DETECTION_DECAY, BABY_RADIUS, PLAYER_RADIUS, PEEKABOO_MAX } from '../config';
import { dist } from '../utils';
import { canBabySee } from './babies';
import type { Game } from '../types';

export function updateDetection(game: Game, dt: number): void {
  let seen = false;
  const p = game.player;

  for (const b of game.babies) {
    if (b.distracted) continue;
    if (canBabySee(game, b) && !p.hiding) {
      seen = true;
      break;
    }
    if (b.type === 'stawler' && b.chasing && !b.stunTimer && dist(b, p) < BABY_RADIUS + PLAYER_RADIUS + 8) {
      p.hiding = false;
      p.peekStamina = 0;
      p.peekExhausted = true;
      seen = true;
      break;
    }
  }

  if (seen) {
    game.detection += DETECTION_RATE * dt;
    if (game.detection >= 100) {
      game.state = 'gameover';
      game.gameOverTimer = 0;
    }
  } else {
    game.detection = Math.max(0, game.detection - DETECTION_DECAY * dt);
  }
}
