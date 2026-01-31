import {
  VIEW_W, VIEW_H, CHEESE_COOLDOWN, TV_DURATION,
  DISTRACTION_DURATION,
} from './config';
import { initGame } from './state';
import { initInput, isDown, onKeyDown, onKeyUp, addClickHandler, addScreenClickHandler, mouseWorld } from './input';
import { updatePlayer } from './update/player';
import { updateBabies } from './update/babies';
import { updateProjectiles } from './update/projectiles';
import { updateDetection } from './update/detection';
import {
  updateDistractions, updateTVs, updateDoors, updateNoiseEvents,
  checkPickups, checkWin, updateCamera, updateMinimapSeen,
} from './update/world';
import { render } from './render/index';
import { retryButtonRect, RETRY_APPEAR_TIME, RETRY_PRESS_DURATION, RETRY_FADE_DURATION } from './render/screens';
import { dist } from './utils';
import { startMusic } from './audio';
import type { Game } from './types';

const PEEKABOO_PULSE_DURATION = 2.0;

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
canvas.width = VIEW_W;
canvas.height = VIEW_H;

function resize(): void {
  const s = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = (VIEW_W * s) + 'px';
  canvas.style.height = (VIEW_H * s) + 'px';
}
resize();
window.addEventListener('resize', resize);

let game: Game = initGame();

initInput(canvas);

onKeyDown((e) => {
  if (game.state === 'title' && e.code === 'Space') {
    game.state = 'playing';
    startMusic();
  }

  if ((game.state === 'gameover' || game.state === 'win' || game.state === 'playing' || game.state === 'paused') && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    game = initGame();
    game.state = 'playing';
    startMusic();
  }

  if (game.state === 'playing' && e.code === 'Escape') {
    game.wheelOpen = false;
    game.wheelHover = -1;
    game.qDownTime = 0;
    game.state = 'paused';
  } else if (game.state === 'paused' && e.code === 'Escape') {
    game.state = 'playing';
  }

  if (game.state === 'playing' && e.key.toLowerCase() === 'q' &&
    !game.player.hiding && !game.player.looting && !game.player.searching && game.player.tools.length > 0 && game.qDownTime === 0) {
    game.qDownTime = performance.now();
  }

  if (game.state === 'playing' && e.code === 'Space') {
    game.peekabooPulseTimer = PEEKABOO_PULSE_DURATION;
  }
});

function useTool(): void {
  if (game.player.tools.length === 0 || game.player.hiding || game.player.looting) return;
  const tool = game.player.tools[0];
  if (tool === 'remote') {
    let best: typeof game.tvs[0] | null = null;
    let bestDist = Infinity;
    for (const tv of game.tvs) {
      if (tv.active) continue;
      const d = dist(game.player, tv);
      if (d < bestDist) { best = tv; bestDist = d; }
    }
    if (best) {
      game.player.tools.shift();
      best.active = true;
      best.timer = TV_DURATION;
    }
  } else if (tool === 'pacifier') {
    game.player.tools.shift();
    const m = mouseWorld(game.camera);
    game.cheeses.push({
      x: game.player.x, y: game.player.y,
      targetX: m.x, targetY: m.y,
      landed: false, timer: 0, dead: false, stuckBaby: null, isPacifier: true,
    });
  } else {
    game.player.tools.shift();
    game.distractions.push({
      x: game.player.x, y: game.player.y,
      type: tool, timer: DISTRACTION_DURATION,
    });
  }
}

onKeyUp((e) => {
  if (e.key.toLowerCase() !== 'q' || game.qDownTime === 0) return;
  if (game.wheelOpen) {
    if (game.wheelHover >= 0 && game.wheelHover < game.player.tools.length) {
      const selected = game.player.tools.splice(game.wheelHover, 1)[0];
      game.player.tools.unshift(selected);
    }
    game.wheelOpen = false;
    game.wheelHover = -1;
  } else if (game.state === 'playing') {
    useTool();
  }
  game.qDownTime = 0;
});

canvas.addEventListener('click', (e) => {
  if (game.state !== 'playing' || game.player.hiding || game.player.looting || game.player.searching) return;
  const r = canvas.getBoundingClientRect();
  const worldX = (e.clientX - r.left) * (VIEW_W / r.width) + game.camera.x;
  const worldY = (e.clientY - r.top) * (VIEW_H / r.height) + game.camera.y;
  const p = game.player;
  if (p.cheese > 0 && game.cheeseCooldown <= 0) {
    p.cheese--;
    game.cheeseCooldown = CHEESE_COOLDOWN;
    game.cheeses.push({
      x: p.x, y: p.y,
      targetX: worldX, targetY: worldY,
      landed: false, timer: 0, dead: false, stuckBaby: null,
    });
  }
});

addScreenClickHandler(canvas, (screenX, screenY) => {
  if (game.state !== 'gameover' || game.gameOverTimer <= RETRY_APPEAR_TIME) return;
  const btn = retryButtonRect();
  if (screenX >= btn.x && screenX <= btn.x + btn.w && screenY >= btn.y && screenY <= btn.y + btn.h) {
    game.retryPressTimer = RETRY_PRESS_DURATION;
    game.retryFadeTimer = RETRY_FADE_DURATION;
    game.retryPending = true;
  }
});

function update(dt: number): void {
  if (game.state !== 'playing' && game.state !== 'gameover') return;
  game.time += dt;
  if (game.state === 'gameover') {
    game.gameOverTimer += dt;
    if (game.retryPressTimer > 0) {
      game.retryPressTimer = Math.max(0, game.retryPressTimer - dt);
    }
    if (game.retryFadeTimer > 0) {
      game.retryFadeTimer = Math.max(0, game.retryFadeTimer - dt);
      if (game.retryFadeTimer === 0 && game.retryPending) {
        game = initGame();
        game.state = 'playing';
        startMusic();
      }
    }
    return;
  }

  if (game.peekabooPulseTimer > 0) {
    game.peekabooPulseTimer = Math.max(0, game.peekabooPulseTimer - dt);
  }

  if (game.qDownTime > 0 && !game.wheelOpen && game.player.tools.length >= 2 &&
    performance.now() - game.qDownTime >= 250) {
    game.wheelOpen = true;
  }

  game.cheeseCooldown = Math.max(0, game.cheeseCooldown - dt);
  updatePlayer(game, dt);
  updateBabies(game, dt);
  updateProjectiles(game, dt);
  updateDistractions(game, dt);
  updateTVs(game, dt);
  updateDoors(game, dt);
  updateNoiseEvents(game, dt);
  updateDetection(game, dt);
  checkPickups(game);
  checkWin(game);
  updateMinimapSeen(game, dt);
  updateCamera(game, dt);
}

let lastTime = performance.now();
function loop(now: number): void {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  update(dt);
  render(ctx, game);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
