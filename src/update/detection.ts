import {
  DETECTION_RATE, DETECTION_DECAY,
  SNEAKER_DETECTION_MULT,
} from '../config';
import { canBabySee } from './babies';
import { playBabyCry } from '../audio';
import type { Game } from '../types';

const CRY_COUNT = 3;
const DET_PER_CRY = 100 / CRY_COUNT; // ~33.33

export function updateDetection(game: Game, dt: number): void {
  const p = game.player;
  let maxDet = 0;

  for (const b of game.babies) {
    if (b.type === 'boss') continue;
    if (b.type === 'stawler') continue;

    const seeing = !b.distracted && canBabySee(game, b) && !p.hiding;

    if (seeing) {
      const mult = p.gear.includes('sneakers') ? SNEAKER_DETECTION_MULT : 1.0;
      b.detection = Math.min(100, b.detection + DETECTION_RATE * mult * dt);
    } else {
      b.detection = Math.max(0, b.detection - DETECTION_DECAY * dt);
    }

    // Update per-baby cry indicator animations (3 indicators)
    const cryIndex = Math.min(CRY_COUNT, Math.floor(b.detection / DET_PER_CRY));
    for (let i = 0; i < CRY_COUNT; i++) {
      if (i < cryIndex && b.cryAnim[i] === 0) {
        b.cryAnim[i] = 0.3; // start bounce
      }
      if (i >= cryIndex) {
        b.cryAnim[i] = 0; // detection decayed, reset
      }
      if (b.cryAnim[i] > 0) {
        b.cryAnim[i] -= dt;
        if (b.cryAnim[i] <= 0) {
          b.cryAnim[i] = -1; // settled
        }
      }
    }

    if (b.detection > maxDet) maxDet = b.detection;

    // Game over when this baby's frustration maxes out and all 3 indicators settled
    if (b.detection >= 100 && b.cryAnim.every(t => t <= 0)) {
      game.state = 'gameover';
      game.gameOverTimer = 0;
      playBabyCry();
    }
  }

  // Global detection = max across all crawlers (used by boss AI + vignette)
  game.detection = maxDet;
}
