import Phaser from 'phaser';
import {
  VIEW_W, VIEW_H, TV_DURATION,
  DISTRACTION_DURATION, T, COLS, ROWS,
} from '../config';
import { initGame } from '../state';
import { initInput, onKeyDown, onKeyUp, mouseWorld } from '../input';
import { initAudio, startMusic, playClick, playCheeseThrow } from '../audio';
import { updatePlayer } from '../update/player';
import { updateBabies } from '../update/babies';
import { updateProjectiles } from '../update/projectiles';
import { updateDetection } from '../update/detection';
import {
  updateDistractions, updateTVs, updateDoors, updateNoiseEvents,
  checkPickups, checkWin, updateCamera, updateMinimapSeen,
} from '../update/world';
import { renderRoomLabels, renderExit, renderDoors } from '../render/map';
import {
  renderTVs, renderCheesePickups, renderToolPickups, renderDistractions,
  renderLootItems, renderCheeses, renderBabyOverlays, renderPlayer,
  renderContainers, renderKeyPickups, renderGearPickups,
} from '../render/entities';
import { renderVisionCones } from '../render/visioncones';
import { renderUI, renderToolWheel, renderDetectionOverlay } from '../render/ui';
import { renderGameOver, renderWinScreen, renderPauseScreen, retryButtonRect, RETRY_APPEAR_TIME, RETRY_PRESS_DURATION, RETRY_FADE_DURATION } from '../render/screens';
import { dist } from '../utils';
import { DrawObject } from '../objects/DrawObject';
import { DEPTH } from '../render/depth';
import type { Game } from '../types';

const PEEKABOO_PULSE_DURATION = 2.0;

export class GameScene extends Phaser.Scene {
  private game_state!: Game;
  private fpsFrames = 0;
  private fpsLast = 0;
  private fpsDisplay = 0;

  // Phaser Tilemap for map
  private mapLayer!: Phaser.Tilemaps.TilemapLayer;

  // DrawObjects for world entities
  private exitObj!: DrawObject;
  private roomLabelObj!: DrawObject;
  private doorsObj!: DrawObject;
  private tvsObj!: DrawObject;
  private containersObj!: DrawObject;
  private keyPickupsObj!: DrawObject;
  private gearPickupsObj!: DrawObject;
  private cheesePickupsObj!: DrawObject;
  private toolPickupsObj!: DrawObject;
  private distractionsObj!: DrawObject;
  private lootObj!: DrawObject;
  private visionObj!: DrawObject;
  private cheesesObj!: DrawObject;
  private babiesObj!: DrawObject;
  private playerObj!: DrawObject;

  // Phaser sprites for babies
  private babySprites!: Phaser.GameObjects.Sprite[];

  // UI DrawObjects (scrollFactor 0)
  private uiObj!: DrawObject;
  private detectionOverlayObj!: DrawObject;
  private toolWheelObj!: DrawObject;
  private screensObj!: DrawObject;
  private fpsText!: Phaser.GameObjects.Text;

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

    // --- Camera setup ---
    this.cameras.main.setBounds(0, 0, COLS * T, ROWS * T);

    // --- World-layer DrawObjects (scrollFactor 1 — camera-translated) ---

    // Background fill (drawn at 0,0 in screen space, covers viewport)
    const bgObj = new DrawObject(this);
    bgObj.setDepth(DEPTH.MAP - 1);
    bgObj.setScrollFactor(0);
    bgObj.drawFn = (ctx) => {
      ctx.fillStyle = '#0e0e1a';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    };

    // Map tiles (Phaser Tilemap)
    this.createTilemap();

    // Exit
    this.exitObj = new DrawObject(this);
    this.exitObj.setDepth(DEPTH.EXIT);
    this.exitObj.drawFn = (ctx) => {
      renderExit(ctx, this.game_state);
    };

    // Room labels
    this.roomLabelObj = new DrawObject(this);
    this.roomLabelObj.setDepth(DEPTH.ROOM_LABELS);
    this.roomLabelObj.drawFn = (ctx) => {
      renderRoomLabels(ctx, this.game_state);
    };

    // Doors
    this.doorsObj = new DrawObject(this);
    this.doorsObj.setDepth(DEPTH.DOORS);
    this.doorsObj.drawFn = (ctx) => {
      renderDoors(ctx, this.game_state);
    };

    // TVs
    this.tvsObj = new DrawObject(this);
    this.tvsObj.setDepth(DEPTH.TVS);
    this.tvsObj.drawFn = (ctx) => {
      renderTVs(ctx, this.game_state);
    };

    // Containers
    this.containersObj = new DrawObject(this);
    this.containersObj.setDepth(DEPTH.CONTAINERS);
    this.containersObj.drawFn = (ctx) => {
      renderContainers(ctx, this.game_state);
    };

    // Key pickups
    this.keyPickupsObj = new DrawObject(this);
    this.keyPickupsObj.setDepth(DEPTH.PICKUPS);
    this.keyPickupsObj.drawFn = (ctx) => {
      renderKeyPickups(ctx, this.game_state);
    };

    // Gear pickups
    this.gearPickupsObj = new DrawObject(this);
    this.gearPickupsObj.setDepth(DEPTH.PICKUPS);
    this.gearPickupsObj.drawFn = (ctx) => {
      renderGearPickups(ctx, this.game_state);
    };

    // Cheese pickups
    this.cheesePickupsObj = new DrawObject(this);
    this.cheesePickupsObj.setDepth(DEPTH.PICKUPS);
    this.cheesePickupsObj.drawFn = (ctx) => {
      renderCheesePickups(ctx, this.game_state);
    };

    // Tool pickups
    this.toolPickupsObj = new DrawObject(this);
    this.toolPickupsObj.setDepth(DEPTH.PICKUPS);
    this.toolPickupsObj.drawFn = (ctx) => {
      renderToolPickups(ctx, this.game_state);
    };

    // Distractions
    this.distractionsObj = new DrawObject(this);
    this.distractionsObj.setDepth(DEPTH.DISTRACTIONS);
    this.distractionsObj.drawFn = (ctx) => {
      renderDistractions(ctx, this.game_state);
    };

    // Loot
    this.lootObj = new DrawObject(this);
    this.lootObj.setDepth(DEPTH.LOOT);
    this.lootObj.drawFn = (ctx) => {
      renderLootItems(ctx, this.game_state);
    };

    // Vision cones
    this.visionObj = new DrawObject(this);
    this.visionObj.setDepth(DEPTH.VISION);
    this.visionObj.drawFn = (ctx) => {
      renderVisionCones(ctx, this.game_state);
    };

    // Cheeses
    this.cheesesObj = new DrawObject(this);
    this.cheesesObj.setDepth(DEPTH.CHEESES);
    this.cheesesObj.drawFn = (ctx) => {
      renderCheeses(ctx, this.game_state);
    };

    // Baby sprites — one per baby, using Phaser.GameObjects.Sprite
    this.createBabySprites();

    // Baby overlays (stun stars, alerts, hearts) — DrawObject with Canvas2D
    this.babiesObj = new DrawObject(this);
    this.babiesObj.setDepth(DEPTH.BABIES + 1);
    this.babiesObj.drawFn = (ctx) => {
      renderBabyOverlays(ctx, this.game_state);
    };

    // Player
    this.playerObj = new DrawObject(this);
    this.playerObj.setDepth(DEPTH.PLAYER);
    this.playerObj.drawFn = (ctx) => {
      renderPlayer(ctx, this.game_state);
    };

    // --- UI DrawObjects (scrollFactor 0 — screen-space) ---

    // HUD
    this.uiObj = new DrawObject(this);
    this.uiObj.setDepth(DEPTH.UI);
    this.uiObj.setScrollFactor(0);
    this.uiObj.drawFn = (ctx) => {
      renderUI(ctx, this.game_state);
    };

    // Detection overlay
    this.detectionOverlayObj = new DrawObject(this);
    this.detectionOverlayObj.setDepth(DEPTH.UI_DETECTION_OVERLAY);
    this.detectionOverlayObj.setScrollFactor(0);
    this.detectionOverlayObj.drawFn = (ctx) => {
      renderDetectionOverlay(ctx, this.game_state);
    };

    // Tool wheel
    this.toolWheelObj = new DrawObject(this);
    this.toolWheelObj.setDepth(DEPTH.UI_WHEEL);
    this.toolWheelObj.setScrollFactor(0);
    this.toolWheelObj.drawFn = (ctx) => {
      renderToolWheel(ctx, this.game_state);
    };

    // Screen overlays (gameover/win/pause)
    this.screensObj = new DrawObject(this);
    this.screensObj.setDepth(DEPTH.UI_SCREENS);
    this.screensObj.setScrollFactor(0);
    this.screensObj.drawFn = (ctx) => {
      const game = this.game_state;
      if (game.state === 'gameover') renderGameOver(ctx, game);
      if (game.state === 'win') renderWinScreen(ctx, game);
      if (game.state === 'paused') renderPauseScreen(ctx);
    };

    // FPS counter
    this.fpsText = this.add.text(VIEW_W - 6, 4, '0 fps', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#4ade80',
    });
    this.fpsText.setOrigin(1, 0);
    this.fpsText.setDepth(DEPTH.UI_FPS);
    this.fpsText.setScrollFactor(0);

    // Set up key handlers
    this.setupKeyHandlers();

    // Set up click handler
    this.setupClickHandlers();

    // FPS tracking
    this.fpsFrames = 0;
    this.fpsLast = performance.now();
    this.fpsDisplay = 0;
  }

  /** Build a Phaser Tilemap from the game grid. */
  private createTilemap(): void {
    const grid = this.game_state.grid;
    const mapData: number[][] = [];
    for (let y = 0; y < ROWS; y++) {
      const row: number[] = [];
      for (let x = 0; x < COLS; x++) {
        const v = grid[y][x];
        if (v === 0) {
          // Floor: checkerboard variants (tile indices 1 and 2, firstgid=1)
          row.push((x + y) % 2 + 1);
        } else if (v === 1) {
          // Wall: edge-aware variant (tile indices 3-258, firstgid=1)
          // Cardinal: bit0=top, bit1=right, bit2=bottom, bit3=left
          // Corners:  bit4=TR, bit5=BR, bit6=BL, bit7=TL
          const exp = (r: number, c: number) =>
            r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c] !== 1;
          let mask = 0;
          const top = exp(y - 1, x), right = exp(y, x + 1),
                bot = exp(y + 1, x), left  = exp(y, x - 1);
          if (top)   mask |= 1;
          if (right) mask |= 2;
          if (bot)   mask |= 4;
          if (left)  mask |= 8;
          // Inner corners: diagonal exposed but both adjacent cardinals are walls
          if (!top && !right && exp(y - 1, x + 1)) mask |= 16;
          if (!right && !bot && exp(y + 1, x + 1)) mask |= 32;
          if (!bot && !left && exp(y + 1, x - 1))  mask |= 64;
          if (!left && !top && exp(y - 1, x - 1))  mask |= 128;
          row.push(3 + mask);
        } else {
          // Furniture (tile index 259)
          row.push(259);
        }
      }
      mapData.push(row);
    }
    const map = this.make.tilemap({ data: mapData, tileWidth: T, tileHeight: T });
    const tileset = map.addTilesetImage('tilesheet', 'tilesheet', T, T, 0, 0, 1);
    this.mapLayer = map.createLayer(0, tileset!)! as Phaser.Tilemaps.TilemapLayer;
    this.mapLayer.setDepth(DEPTH.MAP);
  }

  /** Create Phaser sprites for all babies. */
  private createBabySprites(): void {
    const SPRITE_SIZE = T * 2;
    this.babySprites = this.game_state.babies.map(b => {
      const key = b.type === 'stawler' ? 'str1' : 'baby1';
      const sprite = this.add.sprite(b.x, b.y, key);
      sprite.setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
      sprite.setDepth(DEPTH.BABIES);
      return sprite;
    });
  }

  /** Sync baby Phaser sprites to game state each frame. */
  private syncBabySprites(): void {
    const game = this.game_state;
    const time = game.time;
    const FRAME_DURATION = 0.15;

    for (let i = 0; i < game.babies.length; i++) {
      const b = game.babies[i];
      const sprite = this.babySprites[i];
      if (!sprite) continue;

      const stunned = b.stunTimer > 0;
      let bx = b.x, by = b.y;

      // Boss shake/sway
      if (b.type === 'boss' && !stunned) {
        if (b.chasing) {
          bx += Math.sin(time * 45 + b.y * 7) * 3.0;
          by += Math.cos(time * 51 + b.x * 7) * 3.0;
        } else {
          const sway = Math.sin(time * 6) * 4.5;
          const perp = b.facing + Math.PI / 2;
          bx += Math.cos(perp) * sway;
          by += Math.sin(perp) * sway;
        }
      }

      sprite.setPosition(bx, by);
      sprite.setAlpha(stunned ? 0.7 : 1);

      if (stunned) {
        sprite.setTexture('bebestunned');
        sprite.setRotation(0);
        continue;
      }

      sprite.setRotation(b.facing + Math.PI / 2);

      // Frame selection
      const moving = b.pauseTimer <= 0 && !stunned;
      let frameIndex: number;
      if (moving) {
        frameIndex = Math.floor(time / FRAME_DURATION) % 4;
      } else {
        const facingLeft = Math.cos(b.facing) < 0;
        const tick = Math.floor(time / 0.4) % 2;
        frameIndex = facingLeft ? (tick === 0 ? 3 : 2) : (tick === 0 ? 1 : 0);
      }

      // Set texture by type + frame
      const prefix = b.type === 'stawler' ? 'str' : 'baby';
      sprite.setTexture(`${prefix}${frameIndex + 1}`);
    }
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
          playClick();
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
      if (p.cheese > 0) {
        p.cheese--;
        game.cheeses.push({
          x: p.x, y: p.y,
          targetX: worldX, targetY: worldY,
          landed: false, timer: 0, dead: false, stuckBaby: null,
        });
        playCheeseThrow();
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

    // Recreate tilemap
    if (this.mapLayer) {
      this.mapLayer.tilemap.destroy();
    }
    this.createTilemap();

    // Recreate baby sprites
    if (this.babySprites) {
      for (const s of this.babySprites) s.destroy();
    }
    this.createBabySprites();

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
      this.fpsText.setText(this.fpsDisplay + ' fps');
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

    // Sync baby sprites to game state
    this.syncBabySprites();

    // Sync Phaser camera to game camera
    this.cameras.main.scrollX = Math.round(game.camera.x);
    this.cameras.main.scrollY = Math.round(game.camera.y);
  }
}
