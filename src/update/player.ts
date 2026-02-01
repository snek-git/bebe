import {
  PLAYER_SPEED, SPRINT_SPEED, STAMINA_MAX, STAMINA_RECHARGE, SPRINT_DRAIN, LOOT_TIME,
  SEARCH_TIME, T, SPRINT_NOISE_RANGE, SLAM_NOISE_RANGE,
  DOOR_SLAM_STUN, NOISE_DURATION, BABY_RADIUS, SUNGLASSES_DRAIN_MULT,
} from '../config';
import { resolveWalls, dist } from '../utils';
import { isDown } from '../input';
import { isDoorBlocking, getDoorAt } from '../map';
import { playClick } from '../audio';
import type { Game, NoiseEvent, ToolType } from '../types';

export function updatePlayer(game: Game, dt: number): void {
  const p = game.player;

  const drainMult = p.gear.includes('sunglasses') ? SUNGLASSES_DRAIN_MULT : 1.0;

  if (isDown('Space') && !p.looting && !p.searching && !p.staminaExhausted && p.stamina > 0) {
    p.hiding = true;
    p.vx = 0;
    p.vy = 0;
    p.stamina = Math.max(0, p.stamina - dt * drainMult);
    // Face the closest baby
    let closest = Infinity;
    for (const b of game.babies) {
      const d = dist(p, b);
      if (d < closest) {
        closest = d;
        p.facing = Math.atan2(b.y - p.y, b.x - p.x);
      }
    }
    if (p.stamina <= 0) {
      p.staminaExhausted = true;
      p.hiding = false;
    }
  } else {
    p.hiding = false;
  }

  if (game.wheelOpen) {
    p.vx = 0;
    p.vy = 0;
  }

  // Sprint detection — requires stamina
  const wantSprint = isDown('ShiftLeft') || isDown('ShiftRight') || isDown('shift');
  p.sprinting = wantSprint && !p.staminaExhausted && p.stamina > 0;

  if (!p.hiding && !p.looting && !p.searching && !game.wheelOpen) {
    let dx = 0, dy = 0;
    if (isDown('w') || isDown('arrowup')) dy = -1;
    if (isDown('s') || isDown('arrowdown')) dy = 1;
    if (isDown('a') || isDown('arrowleft')) dx = -1;
    if (isDown('d') || isDown('arrowright')) dx = 1;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }
    const speed = p.sprinting ? SPRINT_SPEED : PLAYER_SPEED;
    p.vx = dx * speed;
    p.vy = dy * speed;
    if (dx || dy) p.facing = Math.atan2(dy, dx);

    // Sprint stamina drain (only when actually moving)
    if (p.sprinting && (dx || dy)) {
      p.stamina = Math.max(0, p.stamina - dt * SPRINT_DRAIN);
      if (p.stamina <= 0) {
        p.sprinting = false;
        p.staminaExhausted = true;
      }

      // Sprint noise
      game.noiseEvents.push({
        x: p.x, y: p.y,
        radius: SPRINT_NOISE_RANGE,
        timer: NOISE_DURATION * 0.3,
      });
    }
  }

  // Stamina recharge: when not hiding and not actively sprinting-with-movement
  const activelySprintMoving = p.sprinting && (p.vx || p.vy);
  if (!p.hiding && !activelySprintMoving) {
    p.stamina = Math.min(STAMINA_MAX, p.stamina + dt * STAMINA_RECHARGE);
    if (p.staminaExhausted && p.stamina >= STAMINA_MAX * 0.4) p.staminaExhausted = false;
  }

  // Loot grabbing (from loot items on ground)
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

  // Container searching
  if (p.searching) {
    p.searchTimer -= dt;
    if (isDown('w') || isDown('s') || isDown('a') || isDown('d') ||
        isDown('arrowup') || isDown('arrowdown') || isDown('arrowleft') || isDown('arrowright')) {
      p.searching = false;
      p.searchTarget = null;
    } else if (p.searchTimer <= 0) {
      const c = p.searchTarget!;
      c.searched = true;
      if (c.contents) {
        switch (c.contents.type) {
          case 'cheese':
            p.cheese++;
            break;
          case 'tool':
            p.tools.push(c.contents.item as ToolType);
            break;
          case 'gear':
            if (!p.gear.includes(c.contents.item as any)) {
              p.gear.push(c.contents.item as any);
            }
            break;
          case 'loot':
            p.cheese += 3;
            break;
          case 'poop':
            break;
        }
      }
      p.searching = false;
      p.searchTarget = null;
    }
  }

  // E key interactions: loot > container > door > throwable pickup
  if (!p.looting && !p.searching && !p.hiding && isDown('e')) {
    // Try looting first
    let acted = false;
    for (const l of game.loots) {
      if (!l.collected && dist(p, l) < T * 0.9) {
        p.looting = true;
        p.lootTimer = LOOT_TIME;
        p.lootTarget = l;
        p.vx = 0;
        p.vy = 0;
        acted = true;
        playClick();
        break;
      }
    }

    // Try searching container
    if (!acted) {
      for (const c of game.containers) {
        if (!c.searched && dist(p, c) < T * 0.9) {
          p.searching = true;
          p.searchTimer = SEARCH_TIME;
          p.searchTarget = c;
          p.vx = 0;
          p.vy = 0;
          acted = true;
          playClick();
          break;
        }
      }
    }

    // Try door interaction
    if (!acted) {
      for (const d of game.doors) {
        if (dist(p, d) < T * 1.2) {
          if (d.state === 'closed') {
            d.state = 'open';
            acted = true;
            playClick();
            break;
          } else if (d.state === 'open') {
            d.state = 'closed';
            acted = true;
            playClick();
            break;
          } else if (d.state === 'locked') {
            if (d.requiredKey && p.keys.includes(d.requiredKey)) {
              // For vault door, check all 3 keys
              if (d.requiredKey === 'keyC') {
                if (p.keys.includes('keyA') && p.keys.includes('keyB') && p.keys.includes('keyC')) {
                  d.state = 'open';
                  acted = true;
                  playClick();
                }
              } else {
                d.state = 'open';
                acted = true;
                playClick();
              }
            }
            break;
          }
        }
      }
    }
  }

  // Door slam: sprinting into a closed door
  if (p.sprinting && (p.vx || p.vy)) {
    const nextX = p.x + p.vx * dt * 2;
    const nextY = p.y + p.vy * dt * 2;
    const ntx = Math.floor(nextX / T);
    const nty = Math.floor(nextY / T);

    for (const d of game.doors) {
      if (d.state === 'closed' && d.tx === ntx && d.ty === nty) {
        d.state = 'open';
        d.slamTimer = 0.3;

        // Slam noise
        game.noiseEvents.push({
          x: d.x, y: d.y,
          radius: SLAM_NOISE_RANGE,
          timer: NOISE_DURATION,
        });

        // Stun babies directly behind the door
        for (const b of game.babies) {
          if (dist(b, d) < T * 1.5 && b.stunTimer <= 0) {
            b.stunTimer = DOOR_SLAM_STUN;
          }
        }
        break;
      }
    }
  }

  // Auto-pickup keys
  for (const k of game.keyPickups) {
    if (!k.collected && dist(p, k) < T * 0.6) {
      k.collected = true;
      if (!p.keys.includes(k.type)) p.keys.push(k.type);
    }
  }

  // Auto-pickup gear
  for (const g of game.gearPickups) {
    if (!g.collected && dist(p, g) < T * 0.6) {
      g.collected = true;
      if (!p.gear.includes(g.type)) p.gear.push(g.type);
    }
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Check door blocking before wall resolve
  const ptx = Math.floor(p.x / T);
  const pty = Math.floor(p.y / T);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (isDoorBlocking(game.doors, ptx + dx, pty + dy)) {
        const d = getDoorAt(game.doors, ptx + dx, pty + dy)!;
        const l = d.tx * T;
        const top = d.ty * T;
        const cx = Math.max(l, Math.min(p.x, l + T));
        const cy = Math.max(top, Math.min(p.y, top + T));
        const ex = p.x - cx;
        const ey = p.y - cy;
        const dd = Math.sqrt(ex * ex + ey * ey);
        if (dd < p.radius && dd > 0) {
          p.x += (ex / dd) * (p.radius - dd);
          p.y += (ey / dd) * (p.radius - dd);
        }
      }
    }
  }

  resolveWalls(game.grid, p);
}
