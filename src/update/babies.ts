import {
  BABY_RADIUS, PLAYER_RADIUS,
  STAWLER_MAX_SPEED, STAWLER_FRICTION, STAWLER_PUSH_THRESHOLD, STAWLER_APPROACH_RANGE,
  VISION_RANGE, VISION_ANGLE, DISTRACTION_RANGE, TV_RANGE,
} from '../config';
import { dist, angleDiff, hasLOS, resolveWalls } from '../utils';
import type { Game, Baby, Point } from '../types';

const BABY_TURN_RATE = 6.0; // radians per second

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

export function canBabySee(game: Game, b: Baby): boolean {
  if (b.stunTimer > 0) return false;
  const p = game.player;
  const dx = p.x - b.x, dy = p.y - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > VISION_RANGE) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), b.facing)) > VISION_ANGLE / 2) return false;
  return hasLOS(game.grid, b.x, b.y, p.x, p.y);
}

export function canBabySeePeeker(game: Game, b: Baby): boolean {
  if (b.stunTimer > 0) return false;
  const p = game.player;
  const dx = p.x - b.x, dy = p.y - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > STAWLER_APPROACH_RANGE) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), b.facing)) > VISION_ANGLE / 2) return false;
  return hasLOS(game.grid, b.x, b.y, p.x, p.y);
}

function moveStawlerToward(
  b: Baby, tx: number, ty: number, pushSpeed: number, dt: number, grid: number[][]
): void {
  const dx = tx - b.x, dy = ty - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 4) {
    b.vel = 0;
    return;
  }

  // Friction: exponential drag (always coasting to a stop)
  b.vel *= Math.exp(-STAWLER_FRICTION * dt);
  if (b.vel < 1) b.vel = 0;

  // Push! Burst to full speed when slow enough and far enough from target
  const coastDist = b.vel / STAWLER_FRICTION;
  if (b.vel < STAWLER_PUSH_THRESHOLD && d > coastDist + 15) {
    b.vel = pushSpeed;
  }

  if (b.vel > 0) {
    const nx = dx / d, ny = dy / d;
    b.x += nx * b.vel * dt;
    b.y += ny * b.vel * dt;
    resolveWalls(grid, b);
  }
}

export function updateBabies(game: Game, dt: number): void {
  const p = game.player;

  for (const b of game.babies) {
    const turn = BABY_TURN_RATE * dt;

    if (b.stunTimer > 0) {
      b.stunTimer -= dt;
      if (b.type === 'stawler') { b.chasing = false; b.vel = 0; }
      b.distracted = false;
      continue;
    }

    const attr = nearestAttraction(game, b);
    if (attr) {
      b.distracted = true;
      if (b.type === 'stawler') b.chasing = false;
      const dx = attr.x - b.x, dy = attr.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 12) {
        if (b.type === 'stawler') {
          moveStawlerToward(b, attr.x, attr.y, b.speed * 0.55, dt, game.grid);
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

    if (b.type === 'stawler') {
      const canSee = canBabySeePeeker(game, b);
      if (canSee && p.hiding) {
        b.chasing = true;
        const dx = p.x - b.x, dy = p.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > BABY_RADIUS + PLAYER_RADIUS + 2) {
          moveStawlerToward(b, p.x, p.y, STAWLER_MAX_SPEED, dt, game.grid);
        }
        b.facing = rotateTowards(b.facing, Math.atan2(dy, dx), turn);
        b.pauseTimer = 0;
        continue;
      } else {
        b.chasing = false;
      }
    }

    const wp = b.waypoints[b.wpIndex];
    const dx = wp.x - b.x, dy = wp.y - b.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 4) {
      if (b.type === 'stawler') b.vel = 0;
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
    }
  }
}
