import {
  BABY_RADIUS, PLAYER_RADIUS, T,
  STAWLER_MAX_SPEED, STAWLER_APPROACH_RANGE,
  BOSS_SPEED, BOSS_CHASE_SPEED, BOSS_PATH_INTERVAL, BOSS_ROAM_INTERVAL, BOSS_ROOM_DWELL_MAX,
  VISION_RANGE, CRAWLER_VISION_RANGE, VISION_ANGLE, DISTRACTION_RANGE, TV_RANGE, ROOM_DEFS,
  DOOR_PUSH_TIME,
} from '../config';
import { dist, angleDiff, hasLOS, resolveWalls } from '../utils';
import { roomCenter, isDoorBlocking, getDoorAt } from '../map';
import { findPath } from '../pathfinding';
import { playBabyCry } from '../audio';
import type { Game, Baby, Point, NoiseEvent } from '../types';

const BABY_TURN_RATE = 6.0; // radians per second

function getCurrentRoom(x: number, y: number): string | null {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  for (const r of ROOM_DEFS) {
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return r.id;
  }
  return null;
}

function rotateTowards(current: number, target: number, maxDelta: number): number {
  const d = angleDiff(target, current);
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
}

function nearestAttraction(game: Game, b: Baby): Point | null {
  let best: Point | null = null;
  let bestDist = Infinity;

  for (const d of game.distractions) {
    const dd = dist(b, d);
    if (dd < DISTRACTION_RANGE && dd < bestDist && hasLOS(game.grid, b.x, b.y, d.x, d.y)) {
      best = d;
      bestDist = dd;
    }
  }

  for (const tv of game.tvs) {
    if (!tv.active) continue;
    const dd = dist(b, tv);
    if (dd < TV_RANGE && dd < bestDist && hasLOS(game.grid, b.x, b.y, tv.x, tv.y)) {
      best = tv;
      bestDist = dd;
    }
  }

  return best;
}

function nearestNoise(game: Game, b: Baby): NoiseEvent | null {
  let best: NoiseEvent | null = null;
  let bestDist = Infinity;

  for (const n of game.noiseEvents) {
    const dd = dist(b, n);
    if (dd < n.radius && dd < bestDist) {
      best = n;
      bestDist = dd;
    }
  }

  return best;
}

export function canBabySee(game: Game, b: Baby): boolean {
  if (b.stunTimer > 0) return false;
  const p = game.player;
  const dx = p.x - b.x, dy = p.y - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const range = b.type === 'crawler' ? CRAWLER_VISION_RANGE : VISION_RANGE;
  if (d > range) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), b.facing)) > VISION_ANGLE / 2) return false;
  // Check door blocking along LOS
  if (!hasLOSWithDoors(game, b.x, b.y, p.x, p.y)) return false;
  return true;
}

export function canBabySeePeeker(game: Game, b: Baby): boolean {
  if (b.stunTimer > 0) return false;
  const p = game.player;
  const dx = p.x - b.x, dy = p.y - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > STAWLER_APPROACH_RANGE) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), b.facing)) > VISION_ANGLE / 2) return false;
  if (!hasLOSWithDoors(game, b.x, b.y, p.x, p.y)) return false;
  return true;
}

function hasLOSWithDoors(game: Game, x1: number, y1: number, x2: number, y2: number): boolean {
  if (!hasLOS(game.grid, x1, y1, x2, y2)) return false;
  // Check if any closed/locked door blocks LOS
  const dx = x2 - x1, dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(d / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (isDoorBlocking(game.doors, Math.floor(px / T), Math.floor(py / T))) return false;
  }
  return true;
}

function moveStawlerToward(
  b: Baby, tx: number, ty: number, pushSpeed: number, dt: number, grid: number[][]
): void {
  const dx = tx - b.x, dy = ty - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 14) {
    b.vel = 0;
    b.chargeDist = 0;
    return;
  }

  if (b.chargeDist == null) b.chargeDist = 0;

  // Negative chargeDist = pause timer between bumps
  if (b.chargeDist < 0) {
    b.chargeDist += dt;
    b.vel = 0;
    return;
  }

  // Start a new bump: lock direction, set distance
  if (b.vel === 0) {
    b.pushDirX = dx / d;
    b.pushDirY = dy / d;
    b.chargeDist = T * (1.5 + Math.random() * 0.5); // 1.5–2 tiles
    b.vel = pushSpeed;
  }

  // Bumping forward in locked direction
  const move = b.vel * dt;
  b.x += b.pushDirX! * move;
  b.y += b.pushDirY! * move;
  resolveWalls(grid, b);
  b.chargeDist -= move;

  // Bump done — full stop, brief pause
  if (b.chargeDist <= 0) {
    b.vel = 0;
    b.chargeDist = -(0.3 + Math.random() * 0.2); // 0.3–0.5s pause
  }
}

export function updateBabies(game: Game, dt: number): void {
  const p = game.player;

  for (const b of game.babies) {
    const turn = BABY_TURN_RATE * dt;

    if (b.stunTimer > 0) {
      b.stunTimer -= dt;
      if (b.type === 'stawler') { b.chasing = false; b.vel = 0; b.chargeDist = 0; }
      if (b.type === 'boss') { b.chasing = false; b.path = []; b.pathIndex = 0; }
      b.distracted = false;
      b.lastSeenX = undefined;
      b.lastSeenY = undefined;
      continue;
    }

    // Check for noise reactions first
    const noise = nearestNoise(game, b);
    if (noise && !b.distracted) {
      const dx = noise.x - b.x, dy = noise.y - b.y;
      b.facing = Math.atan2(dy, dx);
    }

    const attr = nearestAttraction(game, b);
    if (attr) {
      b.distracted = true;
      if (b.type === 'stawler') b.chasing = false;
      if (b.type === 'boss') { b.chasing = false; b.path = []; b.pathIndex = 0; }
      b.lastSeenX = undefined;
      b.lastSeenY = undefined;
      const dx = attr.x - b.x, dy = attr.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 12) {
        if (b.type === 'stawler') {
          moveStawlerToward(b, attr.x, attr.y, b.speed * 0.55, dt, game.grid);
        } else if (b.type === 'boss') {
          const nx = dx / d, ny = dy / d;
          b.x += nx * b.speed * 0.7 * dt;
          b.y += ny * b.speed * 0.7 * dt;
          resolveWalls(game.grid, b);
        } else {
          const crawl = game.time * 8 + b.pauseTime * 10;
          const stride = 0.6 + 0.4 * Math.abs(Math.sin(crawl));
          const wobble = Math.sin(crawl * 2) * 6;
          const nx = dx / d, ny = dy / d;
          b.x += (nx * b.speed * 0.7 * stride - ny * wobble) * dt;
          b.y += (ny * b.speed * 0.7 * stride + nx * wobble) * dt;
          resolveWalls(game.grid, b);
        }
      }
      b.facing = rotateTowards(b.facing, Math.atan2(dy, dx), turn);
      b.pauseTimer = 0;
      continue;
    }
    b.distracted = false;

    // Stawler contact = instant death (unless player is hiding)
    if (b.type === 'stawler' && !p.hiding) {
      if (dist(b, p) < BABY_RADIUS + PLAYER_RADIUS + 4) {
        game.state = 'gameover';
        game.gameOverTimer = 0;
        playBabyCry();
        continue;
      }
    }

    // Stawler chase: push/coast toward player when visible
    if (b.type === 'stawler') {
      const canSee = canBabySeePeeker(game, b);
      if (canSee && !p.hiding) {
        b.chasing = true;
        b.lastSeenX = p.x;
        b.lastSeenY = p.y;
        const dx = p.x - b.x, dy = p.y - b.y;
        moveStawlerToward(b, p.x, p.y, STAWLER_MAX_SPEED, dt, game.grid);
        b.facing = rotateTowards(b.facing, Math.atan2(dy, dx), turn);
        b.pauseTimer = 0;
        continue;
      } else {
        b.chasing = false;
      }
    }

    // Crawler chase: turn and crawl toward player while visible
    if (b.type === 'crawler') {
      const canSee = canBabySee(game, b) && !p.hiding;
      if (canSee) {
        b.chasing = true;
        b.lastSeenX = p.x;
        b.lastSeenY = p.y;
        const dx = p.x - b.x, dy = p.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > BABY_RADIUS + PLAYER_RADIUS) {
          const crawl = game.time * 8 + b.pauseTime * 10;
          const stride = 0.6 + 0.4 * Math.abs(Math.sin(crawl));
          const wobble = Math.sin(crawl * 2) * 6;
          const nx = dx / d, ny = dy / d;
          b.x += (nx * b.speed * stride - ny * wobble) * dt;
          b.y += (ny * b.speed * stride + nx * wobble) * dt;
          resolveWalls(game.grid, b);
        }
        b.facing = rotateTowards(b.facing, Math.atan2(dy, dx), turn);
        b.pauseTimer = 0;
        continue;
      } else {
        b.chasing = false;
      }
    }

    if (b.type === 'boss') {
      b.pathTimer = (b.pathTimer ?? 0) - dt;
      const bossTurn = BABY_TURN_RATE * 3 * dt;

      // Boss catches player = instant bust
      if (!b.stunTimer && dist(b, p) < BABY_RADIUS + PLAYER_RADIUS + 4) {
        game.state = 'gameover';
        game.gameOverTimer = 0;
        playBabyCry();
        continue;
      }

      // Chase trigger: detection bar > 0 OR direct line of sight
      if (!b.chasing && (game.detection > 0 || (canBabySee(game, b) && !p.hiding))) {
        b.chasing = true;
        b.path = findPath(game.grid, b.x, b.y, p.x, p.y, game.doors);
        b.pathIndex = 0;
        b.pathTimer = BOSS_PATH_INTERVAL;
        b.pauseTimer = 0;
        continue;
      }

      // Chase mode
      if (b.chasing) {
        // Track player position while chasing
        b.lastSeenX = p.x;
        b.lastSeenY = p.y;

        // Lose player when detection drops to 0 AND can't directly see
        if (game.detection <= 0 && !canBabySee(game, b)) {
          b.chasing = false;
          // Path to last seen position instead of giving up
          b.path = findPath(game.grid, b.x, b.y, b.lastSeenX, b.lastSeenY, game.doors);
          b.pathIndex = 0;
          b.pathTimer = BOSS_ROAM_INTERVAL;
          b.pauseTimer = 0;
        } else {
          if (b.pathTimer! <= 0) {
            b.path = findPath(game.grid, b.x, b.y, p.x, p.y, game.doors);
            b.pathIndex = 0;
            b.pathTimer = BOSS_PATH_INTERVAL;
          }
          if (b.path && b.path.length > 0 && b.pathIndex! < b.path.length) {
            const target = b.path[b.pathIndex!];
            const tdx = target.x - b.x, tdy = target.y - b.y;
            const td = Math.sqrt(tdx * tdx + tdy * tdy);
            if (td < 8) {
              b.pathIndex = (b.pathIndex ?? 0) + 1;
            } else {
              const burst = 1.0 + 0.25 * Math.sin(game.time * 14);
              b.x += (tdx / td) * BOSS_CHASE_SPEED * burst * dt;
              b.y += (tdy / td) * BOSS_CHASE_SPEED * burst * dt;
              resolveWalls(game.grid, b);
              b.facing = rotateTowards(b.facing, Math.atan2(tdy, tdx), bossTurn);
            }
          }
          continue;
        }
      }

      // === ROAMING ===

      // Clear last-seen when we've arrived at that spot
      if (b.lastSeenX != null && b.lastSeenY != null) {
        if (dist(b, { x: b.lastSeenX, y: b.lastSeenY }) < 24) {
          b.lastSeenX = undefined;
          b.lastSeenY = undefined;
        }
      }

      // Room tracking
      const curRoom = getCurrentRoom(b.x, b.y);
      if (curRoom && curRoom !== b.roamRoom) {
        b.roamRoom = curRoom;
        b.roomDwell = 0;
        if (!b.recentRooms) b.recentRooms = [];
        if (!b.recentRooms.includes(curRoom)) {
          b.recentRooms.push(curRoom);
          if (b.recentRooms.length > 6) b.recentRooms.shift();
        }
      } else {
        b.roomDwell = (b.roomDwell ?? 0) + dt;
      }

      // Refill room queue -- fresh rooms first, recently visited last
      if (!b.roamQueue || b.roamQueue.length === 0) {
        const recent = b.recentRooms || [];
        const all = ROOM_DEFS.filter(r => r.id !== 'entrance' && r.id !== 'foyer').map(r => r.id);
        const fresh = all.filter(r => !recent.includes(r));
        const stale = all.filter(r => recent.includes(r));
        const shuffle = (a: string[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
        b.roamQueue = [...shuffle(fresh), ...shuffle(stale)];
      }

      const needsNewPath = b.pathTimer! <= 0 || !b.path || b.path.length === 0 || b.pathIndex! >= b.path.length;
      const dwellExpired = (b.roomDwell ?? 0) >= BOSS_ROOM_DWELL_MAX;
      const investigating = b.lastSeenX != null && b.lastSeenY != null;
      if (!investigating && (dwellExpired || needsNewPath)) {
        // Try rooms until we get a valid path
        let found = false;
        for (let attempts = 0; attempts < 5 && b.roamQueue!.length > 0; attempts++) {
          let nextRoom = b.roamQueue!.shift()!;
          if (nextRoom === curRoom && b.roamQueue!.length > 0) nextRoom = b.roamQueue!.shift()!;
          const target = roomCenter(nextRoom);
          const path = findPath(game.grid, b.x, b.y, target.x, target.y, game.doors);
          if (path.length > 0) {
            b.path = path;
            b.pathIndex = 0;
            b.pathTimer = BOSS_ROAM_INTERVAL;
            b.pauseTimer = 0;
            found = true;
            break;
          }
        }
        if (!found) {
          // Fallback: clear queue so it reshuffles next frame
          b.roamQueue = [];
          b.pathTimer = 0.2;
        }
        if (dwellExpired) b.roomDwell = 0;
      }

      // Stop-and-scan: periodically stop to aggressively look around
      b.pauseTimer += dt;
      const SCAN_INTERVAL = 3.5;
      const SCAN_DURATION = 1.0;
      if (b.pauseTimer >= SCAN_INTERVAL && b.pauseTimer < SCAN_INTERVAL + SCAN_DURATION) {
        const scanT = (b.pauseTimer - SCAN_INTERVAL) / SCAN_DURATION;
        const fwd = (b.path && b.path.length > 0 && b.pathIndex! < b.path.length)
          ? Math.atan2(b.path[b.pathIndex!].y - b.y, b.path[b.pathIndex!].x - b.x)
          : b.facing;
        // Sharp snaps: left, right, left, right
        const snap = Math.sin(scanT * Math.PI * 3.5) * 1.5;
        b.facing = rotateTowards(b.facing, fwd + snap, bossTurn * 2);
        continue;
      }
      if (b.pauseTimer >= SCAN_INTERVAL + SCAN_DURATION) {
        b.pauseTimer = 0;
      }

      // Follow path with zigzag searching movement
      if (b.path && b.path.length > 0 && b.pathIndex! < b.path.length) {
        const target = b.path[b.pathIndex!];
        const tdx = target.x - b.x, tdy = target.y - b.y;
        const td = Math.sqrt(tdx * tdx + tdy * tdy);
        if (td < 8) {
          b.pathIndex = (b.pathIndex ?? 0) + 1;
        } else {
          // Searching movement: deliberate zigzag
          const burst = 0.85 + 0.3 * Math.abs(Math.sin(game.time * 9 + b.y));
          const zigzag = Math.sin(game.time * 5) * 20;
          const nx = tdx / td, ny = tdy / td;
          b.x += (nx * BOSS_SPEED * burst - ny * zigzag) * dt;
          b.y += (ny * BOSS_SPEED * burst + nx * zigzag) * dt;
          resolveWalls(game.grid, b);
          const scanSnap = Math.sin(game.time * 5) * 0.8;
          b.facing = rotateTowards(b.facing, Math.atan2(tdy, tdx) + scanSnap, bossTurn);
        }
      }
      continue;
    }

    // Investigate last-seen position (crawlers and stawlers)
    if ((b.type === 'crawler' || b.type === 'stawler') && b.lastSeenX != null && b.lastSeenY != null) {
      const lsx = b.lastSeenX, lsy = b.lastSeenY;
      const dd = dist(b, { x: lsx, y: lsy });
      if (dd < 24) {
        // Arrived — clear last-seen, resume patrol
        b.lastSeenX = undefined;
        b.lastSeenY = undefined;
        b.pauseTimer = 0;
      } else {
        // Move toward last-seen position
        const idx = lsx - b.x, idy = lsy - b.y;
        const id = Math.sqrt(idx * idx + idy * idy);
        if (b.type === 'stawler') {
          moveStawlerToward(b, lsx, lsy, b.speed, dt, game.grid);
        } else {
          const crawl = game.time * 8 + b.pauseTime * 10;
          const stride = 0.6 + 0.4 * Math.abs(Math.sin(crawl));
          const wobble = Math.sin(crawl * 2) * 6;
          const nx = idx / id, ny = idy / id;
          b.x += (nx * b.speed * stride - ny * wobble) * dt;
          b.y += (ny * b.speed * stride + nx * wobble) * dt;
          resolveWalls(game.grid, b);
        }
        b.facing = rotateTowards(b.facing, Math.atan2(idy, idx), turn);
        b.pauseTimer = 0;
        continue;
      }
    }

    // Baby door pushing: if walking toward a closed door, push it slowly
    const wp = b.waypoints[b.wpIndex];
    const dx = wp.x - b.x, dy = wp.y - b.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const arrivalDist = b.type === 'stawler' ? 14 : 4;

    if (d >= arrivalDist) {
      const lookAhead = Math.max(b.speed * dt * 3, T);
      const nextTx = Math.floor((b.x + (dx / d) * lookAhead) / T);
      const nextTy = Math.floor((b.y + (dy / d) * lookAhead) / T);
      const door = getDoorAt(game.doors, nextTx, nextTy);
      if (door && door.state === 'closed') {
        b.doorPushTimer = (b.doorPushTimer || 0) + dt;
        b.doorPushTarget = door;
        if (b.doorPushTimer >= DOOR_PUSH_TIME) {
          door.state = 'open';
          b.doorPushTimer = 0;
          b.doorPushTarget = undefined;
        }
        b.facing = Math.atan2(dy, dx);
        continue;
      } else {
        b.doorPushTimer = 0;
        b.doorPushTarget = undefined;
      }
    }

    if (d < arrivalDist) {
      if (b.type === 'stawler') {
        // Stawlers skip the long pause — immediately advance and keep bumping
        b.vel = 0;
        b.chargeDist = 0;
        b.wpIndex = (b.wpIndex + 1) % b.waypoints.length;
        b.pauseTimer = 0;
      } else {
        b.pauseTimer += dt;
        const nw = b.waypoints[(b.wpIndex + 1) % b.waypoints.length];
        const toN = Math.atan2(nw.y - b.y, nw.x - b.x);
        const ph = b.pauseTimer / b.pauseTime;
        let target = toN;
        if (ph < 0.35) target = toN;
        else if (ph < 0.6) target = toN + Math.PI / 2;
        else if (ph < 0.85) target = toN - Math.PI / 2;
        else target = toN;
        b.facing = rotateTowards(b.facing, target, turn);
        if (b.pauseTimer >= b.pauseTime) {
          b.wpIndex = (b.wpIndex + 1) % b.waypoints.length;
          b.pauseTimer = 0;
        }
      }
    } else {
      if (b.type === 'stawler') {
        moveStawlerToward(b, wp.x, wp.y, b.speed, dt, game.grid);
      } else {
        const crawl = game.time * 8 + b.pauseTime * 10;
        const stride = 0.6 + 0.4 * Math.abs(Math.sin(crawl));
        const wobble = Math.sin(crawl * 2) * 6;
        const nx = dx / d, ny = dy / d;
        b.x += (nx * b.speed * stride - ny * wobble) * dt;
        b.y += (ny * b.speed * stride + nx * wobble) * dt;
        resolveWalls(game.grid, b);
      }
      b.facing = rotateTowards(b.facing, Math.atan2(dy, dx), turn);
      b.pauseTimer = 0;

      // Baby door collision
      const btx = Math.floor(b.x / T);
      const bty = Math.floor(b.y / T);
      for (let ddy = -1; ddy <= 1; ddy++) {
        for (let ddx = -1; ddx <= 1; ddx++) {
          if (isDoorBlocking(game.doors, btx + ddx, bty + ddy)) {
            const door = getDoorAt(game.doors, btx + ddx, bty + ddy)!;
            const l = door.tx * T;
            const top = door.ty * T;
            const cx = Math.max(l, Math.min(b.x, l + T));
            const cy = Math.max(top, Math.min(b.y, top + T));
            const ex = b.x - cx;
            const ey = b.y - cy;
            const dd = Math.sqrt(ex * ex + ey * ey);
            if (dd < b.radius && dd > 0) {
              b.x += (ex / dd) * (b.radius - dd);
              b.y += (ey / dd) * (b.radius - dd);
            }
          }
        }
      }

      resolveWalls(game.grid, b);
    }
  }
}
