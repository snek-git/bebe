import Phaser from 'phaser';
import {
  VIEW_W, VIEW_H, CHEESE_COOLDOWN, TV_DURATION,
  DISTRACTION_DURATION, COLS, ROWS, T,
} from '../config';
import { initGame } from '../state';
import { initInput, onKeyDown, onKeyUp, mouseWorld } from '../input';
import { initAudio, startMusic } from '../audio';
import { updatePlayer } from '../update/player';
import { updateBabies } from '../update/babies';
import { updateProjectiles } from '../update/projectiles';
import { updateDetection } from '../update/detection';
import {
  updateDistractions, updateTVs, updateDoors, updateNoiseEvents,
  checkPickups, checkWin, updateCamera, updateMinimapSeen,
} from '../update/world';
import { renderMap, renderRoomLabels, renderExit, renderDoors } from '../render/map';
import {
  renderTVs, renderCheesePickups, renderToolPickups, renderDistractions,
  renderLootItems, renderCheeses, renderBabies, renderPlayer,
  renderContainers, renderKeyPickups, renderGearPickups,
} from '../render/entities';
import { renderVisionCones } from '../render/visioncones';
import { renderGameOver, renderWinScreen, renderPauseScreen, retryButtonRect, RETRY_APPEAR_TIME, RETRY_PRESS_DURATION, RETRY_FADE_DURATION } from '../render/screens';
import { dist } from '../utils';
import { CanvasLayer } from '../objects/CanvasLayer';
import type { Game } from '../types';

const PEEKABOO_PULSE_DURATION = 2.0;

export class GameScene extends Phaser.Scene {
  private game_state!: Game;
  private fpsFrames = 0;
  private fpsLast = 0;
  private fpsDisplay = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize game state
    this.game_state = initGame();
    this.game_state.state = 'playing';

    // Initialize input & audio
    initInput(this);
    initAudio(this);

    // Set up CanvasLayer display list (ordered by depth for proper z-ordering)
    // Background layer: black fill + map tiles
    const bgLayer = new CanvasLayer(this, (ctx) => {
      ctx.fillStyle = '#0e0e1a';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      renderMap(ctx, this.game_state);
    });
    bgLayer.setDepth(0);

    // Exit marker
    const exitLayer = new CanvasLayer(this, (ctx) => {
      renderExit(ctx, this.game_state);
    });
    exitLayer.setDepth(1);

    // Room labels
    const labelsLayer = new CanvasLayer(this, (ctx) => {
      renderRoomLabels(ctx, this.game_state);
    });
    labelsLayer.setDepth(2);

    // Doors
    const doorsLayer = new CanvasLayer(this, (ctx) => {
      renderDoors(ctx, this.game_state);
    });
    doorsLayer.setDepth(3);

    // TVs
    const tvsLayer = new CanvasLayer(this, (ctx) => {
      renderTVs(ctx, this.game_state);
    });
    tvsLayer.setDepth(4);

    // Containers
    const containersLayer = new CanvasLayer(this, (ctx) => {
      renderContainers(ctx, this.game_state);
    });
    containersLayer.setDepth(5);

    // Pickups (keys, gear, cheese, tools)
    const pickupsLayer = new CanvasLayer(this, (ctx) => {
      renderKeyPickups(ctx, this.game_state);
      renderGearPickups(ctx, this.game_state);
      renderCheesePickups(ctx, this.game_state);
      renderToolPickups(ctx, this.game_state);
    });
    pickupsLayer.setDepth(6);

    // Distractions
    const distractionsLayer = new CanvasLayer(this, (ctx) => {
      renderDistractions(ctx, this.game_state);
    });
    distractionsLayer.setDepth(7);

    // Loot items
    const lootLayer = new CanvasLayer(this, (ctx) => {
      renderLootItems(ctx, this.game_state);
    });
    lootLayer.setDepth(8);

    // Vision cones
    const visionLayer = new CanvasLayer(this, (ctx) => {
      renderVisionCones(ctx, this.game_state);
    });
    visionLayer.setDepth(9);

    // Projectiles
    const cheesesLayer = new CanvasLayer(this, (ctx) => {
      renderCheeses(ctx, this.game_state);
    });
    cheesesLayer.setDepth(10);

    // Babies
    const babiesLayer = new CanvasLayer(this, (ctx) => {
      renderBabies(ctx, this.game_state);
    });
    babiesLayer.setDepth(11);

    // Player
    const playerLayer = new CanvasLayer(this, (ctx) => {
      renderPlayer(ctx, this.game_state);
    });
    playerLayer.setDepth(12);

    // Screen overlays (gameover, win, pause) — rendered on top of everything in screen space
    const overlayLayer = new CanvasLayer(this, (ctx) => {
      const game = this.game_state;
      if (game.state === 'gameover') renderGameOver(ctx, game);
      if (game.state === 'win') renderWinScreen(ctx, game);
      if (game.state === 'paused') renderPauseScreen(ctx);
    });
    overlayLayer.setDepth(100);

    // FPS counter
    const fpsLayer = new CanvasLayer(this, (ctx) => {
      ctx.fillStyle = '#4ade80';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(this.fpsDisplay + ' fps', VIEW_W - 6, 12);
    });
    fpsLayer.setDepth(200);

    // Launch UI scene in parallel
    this.scene.launch('UIScene', { getGame: () => this.game_state });

    // Set up key handlers
    this.setupKeyHandlers();

    // Set up click handler
    this.setupClickHandlers();

    // FPS tracking
    this.fpsFrames = 0;
    this.fpsLast = performance.now();
    this.fpsDisplay = 0;
  }

  private setupKeyHandlers(): void {
    const self = this;

    onKeyDown((e) => {
      const game = self.game_state;

      // Restart from any state
      if ((game.state === 'gameover' || game.state === 'win' || game.state === 'playing' || game.state === 'paused') && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        self.restartGame();
      }

      // Pause/unpause
      if (game.state === 'playing' && e.code === 'Escape') {
        game.wheelOpen = false;
        game.wheelHover = -1;
        game.qDownTime = 0;
        game.state = 'paused';
      } else if (game.state === 'paused' && e.code === 'Escape') {
        game.state = 'playing';
      }

      // Tool wheel open
      if (game.state === 'playing' && e.key.toLowerCase() === 'q' &&
        !game.player.hiding && !game.player.looting && !game.player.searching && game.player.tools.length > 0 && game.qDownTime === 0) {
        game.qDownTime = performance.now();
      }

      // Peekaboo pulse
      if (game.state === 'playing' && e.code === 'Space') {
        game.peekabooPulseTimer = PEEKABOO_PULSE_DURATION;
      }
    });

    onKeyUp((e) => {
      const game = self.game_state;
      if (e.key.toLowerCase() !== 'q' || game.qDownTime === 0) return;
      if (game.wheelOpen) {
        if (game.wheelHover >= 0 && game.wheelHover < game.player.tools.length) {
          const selected = game.player.tools.splice(game.wheelHover, 1)[0];
          game.player.tools.unshift(selected);
        }
        game.wheelOpen = false;
        game.wheelHover = -1;
      } else if (game.state === 'playing') {
        self.useTool();
      }
      game.qDownTime = 0;
    });
  }

  private setupClickHandlers(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const game = this.game_state;

      // Screen-space click for retry button
      if (game.state === 'gameover' && game.gameOverTimer > RETRY_APPEAR_TIME) {
        const btn = retryButtonRect();
        if (pointer.x >= btn.x && pointer.x <= btn.x + btn.w && pointer.y >= btn.y && pointer.y <= btn.y + btn.h) {
          game.retryPressTimer = RETRY_PRESS_DURATION;
          game.retryFadeTimer = RETRY_FADE_DURATION;
          game.retryPending = true;
          return;
        }
      }

      // World-space click for cheese throwing
      if (game.state !== 'playing' || game.player.hiding || game.player.looting || game.player.searching) return;
      const worldX = pointer.x + game.camera.x;
      const worldY = pointer.y + game.camera.y;
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
  }

  private useTool(): void {
    const game = this.game_state;
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

  private restartGame(): void {
    this.game_state = initGame();
    this.game_state.state = 'playing';
    startMusic();
  }

  update(time: number, delta: number): void {
    const game = this.game_state;

    // FPS counter
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLast >= 500) {
      this.fpsDisplay = Math.round(this.fpsFrames / ((now - this.fpsLast) / 1000));
      this.fpsFrames = 0;
      this.fpsLast = now;
    }

    // Delta time in seconds, capped at 0.1s (same as original)
    const dt = Math.min(delta / 1000, 0.1);

    if (game.state !== 'playing' && game.state !== 'gameover') return;

    game.time += dt;

    // Gameover timer logic
    if (game.state === 'gameover') {
      game.gameOverTimer += dt;
      if (game.retryPressTimer > 0) {
        game.retryPressTimer = Math.max(0, game.retryPressTimer - dt);
      }
      if (game.retryFadeTimer > 0) {
        game.retryFadeTimer = Math.max(0, game.retryFadeTimer - dt);
        if (game.retryFadeTimer === 0 && game.retryPending) {
          this.restartGame();
        }
      }
      return;
    }

    // Peekaboo pulse timer
    if (game.peekabooPulseTimer > 0) {
      game.peekabooPulseTimer = Math.max(0, game.peekabooPulseTimer - dt);
    }

    // Tool wheel open logic (250ms hold)
    if (game.qDownTime > 0 && !game.wheelOpen && game.player.tools.length >= 1 &&
      performance.now() - game.qDownTime >= 250) {
      game.wheelOpen = true;
    }

    game.cheeseCooldown = Math.max(0, game.cheeseCooldown - dt);

    // SAME UPDATE ORDER — critical
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
}
