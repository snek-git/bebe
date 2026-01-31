import { VIEW_W, VIEW_H, CHEESE_COOLDOWN, CHEESE_SPEED, TV_DURATION, DISTRACTION_DURATION } from './config';
import { initGame } from './state';
import { initInput, isDown, onKeyDown, addClickHandler, mouseWorld } from './input';
import { updatePlayer } from './update/player';
import { updateBabies } from './update/babies';
import { updateProjectiles } from './update/projectiles';
import { updateDetection } from './update/detection';
import { updateDistractions, updateTVs, checkPickups, checkWin, updateCamera } from './update/world';
import { render } from './render/index';
import { dist } from './utils';
import type { Game } from './types';

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
  }

  if ((game.state === 'gameover' || game.state === 'win') && e.key.toLowerCase() === 'r') {
    game = initGame();
    game.state = 'playing';
  }

  if (game.state === 'playing' && e.key.toLowerCase() === 'q' &&
      !game.player.hiding && !game.player.looting && game.player.tools.length > 0) {
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
});

addClickHandler(canvas, (worldX, worldY) => {
  if (game.state !== 'playing' || game.player.hiding || game.player.looting) return;
  if (game.player.cheese <= 0 || game.cheeseCooldown > 0) return;
  game.player.cheese--;
  game.cheeseCooldown = CHEESE_COOLDOWN;
  game.cheeses.push({
    x: game.player.x, y: game.player.y,
    targetX: worldX, targetY: worldY,
    landed: false, timer: 0, dead: false, stuckBaby: null,
  });
}, game.camera);

function update(dt: number): void {
  if (game.state !== 'playing' && game.state !== 'gameover') return;
  game.time += dt;
  if (game.state === 'gameover') { game.gameOverTimer += dt; return; }

  game.cheeseCooldown = Math.max(0, game.cheeseCooldown - dt);
  updatePlayer(game, dt);
  updateBabies(game, dt);
  updateProjectiles(game, dt);
  updateDistractions(game, dt);
  updateTVs(game, dt);
  updateDetection(game, dt);
  checkPickups(game);
  checkWin(game);
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
