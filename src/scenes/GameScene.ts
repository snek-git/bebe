import Phaser from 'phaser';
import {
  T, COLS, ROWS, VIEW_W, VIEW_H, PLAYER_SPEED, SPRINT_SPEED, PLAYER_RADIUS,
  BABY_RADIUS, PEEKABOO_MAX, PEEKABOO_RECHARGE, CHEESE_COOLDOWN,
  LOOT_TIME, SEARCH_TIME, TOTAL_LOOT,
  TV_DURATION, DISTRACTION_DURATION,
  SPRINT_NOISE_RANGE, SLAM_NOISE_RANGE,
  DOOR_SLAM_STUN, NOISE_DURATION, SUNGLASSES_DRAIN_MULT,
  VISION_RANGE, VISION_ANGLE, STAWLER_APPROACH_RANGE,
  LOOT_TYPES,
} from '../config';
import { initGame } from '../state';
import { roomDef, isSolid, isDoorBlocking, getDoorAt } from '../map';
import { dist, resolveWalls } from '../utils';
import { updateBabies, canBabySee, canBabySeePeeker } from '../update/babies';
import { updateDetection } from '../update/detection';
import { updateProjectiles } from '../update/projectiles';
import {
  updateDistractions, updateTVs, updateDoors, updateNoiseEvents,
  checkPickups, checkWin, updateMinimapSeen,
} from '../update/world';
// shapes imported for future tool/loot rendering
import type { Game, ToolType } from '../types';

const PEEKABOO_PULSE_DURATION = 2.0;

export class GameScene extends Phaser.Scene {
  game_!: Game;
  tileLayer!: Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer;
  playerSprite!: Phaser.GameObjects.Arc;
  babySprites: Phaser.GameObjects.Sprite[] = [];
  babyImages: Phaser.Textures.Texture[] = [];

  // Input
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  eKey!: Phaser.Input.Keyboard.Key;
  qKey!: Phaser.Input.Keyboard.Key;
  spaceKey!: Phaser.Input.Keyboard.Key;
  shiftKey!: Phaser.Input.Keyboard.Key;

  // Graphics layers
  worldGfx!: Phaser.GameObjects.Graphics;
  visionGfx!: Phaser.GameObjects.Graphics;
  uiGfx!: Phaser.GameObjects.Graphics;
  overlayGfx!: Phaser.GameObjects.Graphics;

  // UI camera
  uiCamera!: Phaser.Cameras.Scene2D.Camera;

  // Music
  music!: Phaser.Sound.BaseSound;
  musicStarted = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize game state
    this.game_ = initGame();
    this.game_.state = 'playing';

    // Build tilemap from grid
    const grid = this.game_.grid;
    const map = this.make.tilemap({
      data: grid,
      tileWidth: T,
      tileHeight: T,
    });
    const tileset = map.addTilesetImage('tileset', 'tileset', T, T, 0, 0)!;
    this.tileLayer = map.createLayer(0, tileset, 0, 0)!;

    // Set collision: walls (1) and furniture (2) are solid
    this.tileLayer.setCollision([1, 2]);

    // World bounds
    const worldW = COLS * T;
    const worldH = ROWS * T;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Camera
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBackgroundColor('#0e0e1a');

    // Graphics layers for custom rendering (doors, entities, vision, UI)
    this.worldGfx = this.add.graphics();
    this.visionGfx = this.add.graphics();

    // Player - simple circle with physics
    this.playerSprite = this.add.arc(
      this.game_.player.x, this.game_.player.y,
      PLAYER_RADIUS, 0, 360, false, 0x4ade80
    );
    this.physics.add.existing(this.playerSprite);
    const playerBody = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    playerBody.setCircle(PLAYER_RADIUS);
    playerBody.setOffset(-PLAYER_RADIUS, -PLAYER_RADIUS);
    playerBody.setCollideWorldBounds(true);

    // Camera follows player
    this.cameras.main.startFollow(this.playerSprite, true, 0.15, 0.15);

    // UI graphics (fixed to camera)
    this.uiGfx = this.add.graphics();
    this.uiGfx.setScrollFactor(0);
    this.uiGfx.setDepth(100);

    this.overlayGfx = this.add.graphics();
    this.overlayGfx.setScrollFactor(0);
    this.overlayGfx.setDepth(200);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.qKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Space key for peekaboo (prevent default browser scroll)
    this.spaceKey.on('down', () => {
      this.game_.peekabooPulseTimer = PEEKABOO_PULSE_DURATION;
    });

    // Click handler for cheese throw
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.game_.state !== 'playing') return;
      const p = this.game_.player;
      if (p.hiding || p.looting || p.searching) return;
      if (p.cheese > 0 && this.game_.cheeseCooldown <= 0) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        p.cheese--;
        this.game_.cheeseCooldown = CHEESE_COOLDOWN;
        this.game_.cheeses.push({
          x: p.x, y: p.y,
          targetX: worldPoint.x, targetY: worldPoint.y,
          landed: false, timer: 0, dead: false, stuckBaby: null,
        });
      }
    });

    // Start music
    if (!this.musicStarted) {
      this.music = this.sound.add('music', { loop: true, volume: 0.35 });
      this.music.play();
      this.musicStarted = true;
    }

    // Q key tool usage
    this.qKey.on('up', () => {
      if (this.game_.wheelOpen) {
        if (this.game_.wheelHover >= 0 && this.game_.wheelHover < this.game_.player.tools.length) {
          const selected = this.game_.player.tools.splice(this.game_.wheelHover, 1)[0];
          this.game_.player.tools.unshift(selected);
        }
        this.game_.wheelOpen = false;
        this.game_.wheelHover = -1;
      } else if (this.game_.state === 'playing') {
        this.useTool();
      }
      this.game_.qDownTime = 0;
    });

    // R key for retry
    this.input.keyboard!.on('keydown-R', () => {
      if (this.game_.state === 'gameover' || this.game_.state === 'win') {
        this.scene.restart();
      }
    });

    // ESC for pause (future)
  }

  useTool(): void {
    const game = this.game_;
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
      const worldPoint = this.cameras.main.getWorldPoint(
        this.input.activePointer.x, this.input.activePointer.y
      );
      game.cheeses.push({
        x: game.player.x, y: game.player.y,
        targetX: worldPoint.x, targetY: worldPoint.y,
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

  update(time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.1);
    const game = this.game_;

    if (game.state !== 'playing' && game.state !== 'gameover') return;

    game.time += dt;

    if (game.state === 'gameover') {
      game.gameOverTimer += dt;
      // Handle retry fade
      if (game.retryFadeTimer > 0) {
        game.retryFadeTimer = Math.max(0, game.retryFadeTimer - dt);
        if (game.retryFadeTimer === 0 && game.retryPending) {
          this.scene.restart();
        }
      }
      this.renderAll();
      return;
    }

    // Peekaboo pulse timer
    if (game.peekabooPulseTimer > 0) {
      game.peekabooPulseTimer = Math.max(0, game.peekabooPulseTimer - dt);
    }

    // Tool wheel hold detection
    if (this.qKey.isDown && !game.wheelOpen && game.player.tools.length >= 2 && game.qDownTime === 0) {
      game.qDownTime = time;
    }
    if (game.qDownTime > 0 && !game.wheelOpen && game.player.tools.length >= 2 &&
        time - game.qDownTime >= 250) {
      game.wheelOpen = true;
    }

    game.cheeseCooldown = Math.max(0, game.cheeseCooldown - dt);

    // Player movement via Phaser input
    this.updatePlayerMovement(dt);

    // All the custom game logic updates
    updateBabies(game, dt);
    updateProjectiles(game, dt);
    updateDistractions(game, dt);
    updateTVs(game, dt);
    updateDoors(game, dt);
    updateNoiseEvents(game, dt);
    updateDetection(game, dt);
    checkPickups(game);
    checkWin(game);
    updateMinimapSeen(game);

    // Sync player sprite position (game state -> Phaser sprite)
    this.playerSprite.setPosition(game.player.x, game.player.y);

    // Sync camera for the game state's camera tracking
    game.camera.x = this.cameras.main.scrollX;
    game.camera.y = this.cameras.main.scrollY;

    // Render custom graphics
    this.renderAll();
  }

  updatePlayerMovement(dt: number): void {
    const p = this.game_.player;
    const game = this.game_;
    const drainMult = p.gear.includes('sunglasses') ? SUNGLASSES_DRAIN_MULT : 1.0;

    // Peekaboo
    if (this.spaceKey.isDown && !p.looting && !p.searching && !p.peekExhausted && p.peekStamina > 0) {
      p.hiding = true;
      p.vx = 0;
      p.vy = 0;
      p.peekStamina = Math.max(0, p.peekStamina - dt * drainMult);
      if (p.peekStamina <= 0) {
        p.peekExhausted = true;
        p.hiding = false;
      }
    } else {
      p.hiding = false;
      p.peekStamina = Math.min(PEEKABOO_MAX, p.peekStamina + dt * PEEKABOO_RECHARGE);
      if (p.peekExhausted && p.peekStamina >= PEEKABOO_MAX * 0.4) p.peekExhausted = false;
    }

    if (game.wheelOpen) {
      p.vx = 0;
      p.vy = 0;
    }

    // Sprint
    p.sprinting = this.shiftKey.isDown;

    if (!p.hiding && !p.looting && !p.searching && !game.wheelOpen) {
      let dx = 0, dy = 0;
      if (this.wasd.w.isDown || this.cursors.up.isDown) dy = -1;
      if (this.wasd.s.isDown || this.cursors.down.isDown) dy = 1;
      if (this.wasd.a.isDown || this.cursors.left.isDown) dx = -1;
      if (this.wasd.d.isDown || this.cursors.right.isDown) dx = 1;
      if (dx && dy) { dx *= 0.707; dy *= 0.707; }
      const speed = p.sprinting ? SPRINT_SPEED : PLAYER_SPEED;
      p.vx = dx * speed;
      p.vy = dy * speed;
      if (dx || dy) p.facing = Math.atan2(dy, dx);

      // Sprint noise
      if (p.sprinting && (dx || dy)) {
        game.noiseEvents.push({
          x: p.x, y: p.y,
          radius: SPRINT_NOISE_RANGE,
          timer: NOISE_DURATION * 0.3,
        });
      }
    }

    // Loot grabbing
    if (p.looting) {
      p.lootTimer -= dt;
      if (this.wasd.w.isDown || this.wasd.s.isDown || this.wasd.a.isDown || this.wasd.d.isDown ||
          this.cursors.up.isDown || this.cursors.down.isDown || this.cursors.left.isDown || this.cursors.right.isDown) {
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
      if (this.wasd.w.isDown || this.wasd.s.isDown || this.wasd.a.isDown || this.wasd.d.isDown ||
          this.cursors.up.isDown || this.cursors.down.isDown || this.cursors.left.isDown || this.cursors.right.isDown) {
        p.searching = false;
        p.searchTarget = null;
      } else if (p.searchTimer <= 0) {
        const c = p.searchTarget!;
        c.searched = true;
        if (c.contents) {
          switch (c.contents.type) {
            case 'cheese': p.cheese++; break;
            case 'tool': p.tools.push(c.contents.item as ToolType); break;
            case 'gear':
              if (!p.gear.includes(c.contents.item as any)) p.gear.push(c.contents.item as any);
              break;
            case 'loot': p.cheese += 3; break;
            case 'poop': break;
          }
        }
        p.searching = false;
        p.searchTarget = null;
      }
    }

    // E key interactions
    if (!p.looting && !p.searching && !p.hiding && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      let acted = false;

      // Try looting
      for (const l of game.loots) {
        if (!l.collected && dist(p, l) < T * 0.9) {
          p.looting = true;
          p.lootTimer = LOOT_TIME;
          p.lootTarget = l;
          p.vx = 0; p.vy = 0;
          acted = true;
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
            p.vx = 0; p.vy = 0;
            acted = true;
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
              break;
            } else if (d.state === 'open') {
              d.state = 'closed';
              acted = true;
              break;
            } else if (d.state === 'locked') {
              if (d.requiredKey && p.keys.includes(d.requiredKey)) {
                if (d.requiredKey === 'keyC') {
                  if (p.keys.includes('keyA') && p.keys.includes('keyB') && p.keys.includes('keyC')) {
                    d.state = 'open';
                    acted = true;
                  }
                } else {
                  d.state = 'open';
                  acted = true;
                }
              }
              break;
            }
          }
        }
      }
    }

    // Door slam
    if (p.sprinting && (p.vx || p.vy)) {
      const nextX = p.x + p.vx * dt * 2;
      const nextY = p.y + p.vy * dt * 2;
      const ntx = Math.floor(nextX / T);
      const nty = Math.floor(nextY / T);
      for (const d of game.doors) {
        if (d.state === 'closed' && d.tx === ntx && d.ty === nty) {
          d.state = 'open';
          d.slamTimer = 0.3;
          game.noiseEvents.push({ x: d.x, y: d.y, radius: SLAM_NOISE_RANGE, timer: NOISE_DURATION });
          for (const b of game.babies) {
            if (dist(b, d) < T * 1.5 && b.stunTimer <= 0) b.stunTimer = DOOR_SLAM_STUN;
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

    // Move player
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Door blocking collision
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

    // Wall collision - manual resolution (same as original)
    resolveWalls(game.grid, p);
  }

  renderAll(): void {
    const game = this.game_;
    const cam = this.cameras.main;

    // Clear graphics layers
    this.worldGfx.clear();
    this.visionGfx.clear();
    this.uiGfx.clear();
    this.overlayGfx.clear();

    // Render world objects
    this.renderExit();
    this.renderRoomLabels();
    this.renderDoors();
    this.renderTVs();
    this.renderContainers();
    this.renderKeyPickups();
    this.renderGearPickups();
    this.renderCheesePickups();
    this.renderToolPickups();
    this.renderDistractions();
    this.renderLootItems();
    this.renderVisionCones();
    this.renderCheeses();
    this.renderBabies();
    this.renderPlayerVisuals();

    // UI (screen-space)
    this.renderUI();
    this.renderDetectionOverlay();

    if (game.state === 'gameover') this.renderGameOver();
    if (game.state === 'win') this.renderWinScreen();
  }

  // World rendering helpers - all use worldGfx which is in world space
  renderExit(): void {
    const game = this.game_;
    const er = roomDef('foyer')!;
    const ex = (er.x + Math.floor(er.w / 2)) * T;
    const ey = (ROWS - 1) * T;
    const allLoot = game.player.loot >= TOTAL_LOOT;
    const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;

    this.worldGfx.fillStyle(allLoot ? 0x4ade80 : 0x6b7280, allLoot ? pulse * 0.3 : 0.2);
    this.worldGfx.fillRect(ex, ey, T, T);
    this.worldGfx.lineStyle(2, allLoot ? 0x4ade80 : 0x6b7280, allLoot ? pulse : 1);
    this.worldGfx.strokeRect(ex + 2, ey + 2, T - 4, T - 4);
  }

  renderRoomLabels(): void {
    // Room labels are static text, skip for now to keep perf
    // Will add as Phaser Text objects in polish phase
  }

  renderDoors(): void {
    const game = this.game_;
    for (const d of game.doors) {
      const px = d.x - T / 2;
      const py = d.y - T / 2;
      if (d.state === 'open') {
        this.worldGfx.lineStyle(1, 0x6b7280, 1);
        if (d.orientation === 'v') {
          this.worldGfx.strokeRect(px, py, 4, T);
        } else {
          this.worldGfx.strokeRect(px, py, T, 4);
        }
      } else if (d.state === 'closed') {
        this.worldGfx.fillStyle(0x8B4513, 1);
        this.worldGfx.fillRect(px, py, T, T);
        this.worldGfx.lineStyle(2, 0x654321, 1);
        this.worldGfx.strokeRect(px + 1, py + 1, T - 2, T - 2);
        // Handle
        this.worldGfx.fillStyle(0xDAA520, 1);
        this.worldGfx.fillCircle(px + T * 0.75, py + T / 2, 2);
        if (d.slamTimer > 0) {
          this.worldGfx.fillStyle(0xffc800, d.slamTimer);
          this.worldGfx.fillRect(px - 4, py - 4, T + 8, T + 8);
        }
      } else {
        // Locked
        this.worldGfx.fillStyle(0x4a4a6a, 1);
        this.worldGfx.fillRect(px, py, T, T);
        this.worldGfx.lineStyle(2, 0x6b6b8a, 1);
        this.worldGfx.strokeRect(px + 1, py + 1, T - 2, T - 2);
      }
    }
  }

  renderTVs(): void {
    const game = this.game_;
    for (const tv of game.tvs) {
      const px = tv.x, py = tv.y;
      this.worldGfx.fillStyle(0x1a1a2e, 1);
      this.worldGfx.fillRect(px - 10, py - 8, 20, 16);
      this.worldGfx.lineStyle(1.5, 0x374151, 1);
      this.worldGfx.strokeRect(px - 10, py - 8, 20, 16);
      if (tv.active) {
        const pulse = Math.sin(game.time * 8) * 0.2 + 0.8;
        this.worldGfx.fillStyle(0x4ade80, pulse * 0.8);
        this.worldGfx.fillRect(px - 8, py - 6, 16, 12);
      } else {
        this.worldGfx.fillStyle(0x111111, 1);
        this.worldGfx.fillRect(px - 8, py - 6, 16, 12);
      }
      this.worldGfx.fillStyle(0x374151, 1);
      this.worldGfx.fillRect(px - 2, py + 8, 4, 3);
    }
  }

  renderContainers(): void {
    const game = this.game_;
    for (const c of game.containers) {
      const px = c.x, py = c.y;
      if (c.searched) {
        this.worldGfx.fillStyle(0x2a2a3a, 1);
        this.worldGfx.fillRect(px - 10, py - 8, 20, 16);
        this.worldGfx.lineStyle(1, 0x3a3a4a, 1);
        this.worldGfx.strokeRect(px - 10, py - 8, 20, 16);
      } else {
        const glow = Math.sin(game.time * 2 + c.x) * 0.1 + 0.3;
        this.worldGfx.fillStyle(0x3d2e1c, 1);
        this.worldGfx.fillRect(px - 10, py - 8, 20, 16);
        this.worldGfx.lineStyle(1.5, 0xfbbf24, glow);
        this.worldGfx.strokeRect(px - 10, py - 8, 20, 16);
        this.worldGfx.fillStyle(0xDAA520, 1);
        this.worldGfx.fillRect(px - 2, py - 8, 4, 3);
      }
    }
  }

  renderKeyPickups(): void {
    const game = this.game_;
    for (const k of game.keyPickups) {
      if (k.collected) continue;
      const bob = Math.sin(game.time * 3 + k.x) * 2;
      const px = k.x, py = k.y + bob;
      this.worldGfx.fillStyle(0xfacc15, 0.2);
      this.worldGfx.fillCircle(px, py, 14);
      const colors: Record<string, number> = { keyA: 0xef4444, keyB: 0x3b82f6, keyC: 0x22c55e };
      this.worldGfx.fillStyle(colors[k.type] || 0xfacc15, 1);
      this.worldGfx.fillRect(px - 8, py - 5, 16, 10);
      this.worldGfx.lineStyle(1, 0xffffff, 1);
      this.worldGfx.strokeRect(px - 8, py - 5, 16, 10);
    }
  }

  renderGearPickups(): void {
    const game = this.game_;
    for (const g of game.gearPickups) {
      if (g.collected) continue;
      const bob = Math.sin(game.time * 2 + g.x + g.y) * 1.5;
      const px = g.x, py = g.y + bob;
      this.worldGfx.fillStyle(0x4ade80, 0.15);
      this.worldGfx.fillCircle(px, py, 12);
      if (g.type === 'sneakers') {
        this.worldGfx.fillStyle(0x4ade80, 1);
        this.worldGfx.fillRect(px - 5, py - 3, 10, 6);
      } else {
        this.worldGfx.fillStyle(0x1e1e2e, 1);
        this.worldGfx.fillEllipse(px - 4, py, 10, 8);
        this.worldGfx.fillEllipse(px + 4, py, 10, 8);
      }
    }
  }

  renderCheesePickups(): void {
    const game = this.game_;
    for (const cp of game.cheesePickups) {
      if (cp.collected) continue;
      const bob = Math.sin(game.time * 2 + cp.x) * 1.5;
      const px = cp.x, py = cp.y + bob;
      this.worldGfx.fillStyle(0xfde047, 0.15);
      this.worldGfx.fillCircle(px, py, 12);
      // Cheese triangle
      this.worldGfx.fillStyle(0xfde047, 1);
      this.worldGfx.fillTriangle(px, py - 6, px + 6, py + 2, px - 6, py + 2);
    }
  }

  renderToolPickups(): void {
    const game = this.game_;
    for (const tp of game.toolPickups) {
      if (tp.collected) continue;
      const bob = Math.sin(game.time * 2.5 + tp.x + tp.y) * 1.5;
      const px = tp.x, py = tp.y + bob;
      this.worldGfx.fillStyle(0xa855f7, 0.15);
      this.worldGfx.fillCircle(px, py, 13);
      // Simple indicator per tool type
      const colors: Record<string, number> = { ipad: 0xa1a1aa, remote: 0x71717a, pacifier: 0xf59e0b };
      this.worldGfx.fillStyle(colors[tp.type] || 0xa1a1aa, 1);
      this.worldGfx.fillRect(px - 5, py - 5, 10, 10);
    }
  }

  renderDistractions(): void {
    const game = this.game_;
    for (const d of game.distractions) {
      const px = d.x, py = d.y;
      const pulse = Math.sin(game.time * 6) * 0.2 + 0.5;
      this.worldGfx.fillStyle(0xa855f7, pulse * 0.3);
      this.worldGfx.fillCircle(px, py, 18);
    }
  }

  renderLootItems(): void {
    const game = this.game_;
    for (const l of game.loots) {
      if (l.collected) continue;
      const bob = Math.sin(game.time * 3 + l.x + l.y) * 1.5;
      const px = l.x, py = l.y + bob;
      const lt = LOOT_TYPES[l.type];
      // Glow
      this.worldGfx.fillStyle(parseInt(lt.color.slice(1), 16), 0.25);
      this.worldGfx.fillCircle(px, py, 16);
      // Diamond shape
      this.worldGfx.fillStyle(parseInt(lt.color.slice(1), 16), 1);
      this.worldGfx.fillTriangle(px, py - 8, px + 6, py, px - 6, py);
      this.worldGfx.fillTriangle(px, py + 8, px + 6, py, px - 6, py);
    }
  }

  renderVisionCones(): void {
    const game = this.game_;
    const RAY_COUNT = 48;

    for (const b of game.babies) {
      if (b.stunTimer > 0) continue;

      const range = b.type === 'stawler' ? STAWLER_APPROACH_RANGE : VISION_RANGE;
      const seeing = canBabySee(game, b) && !game.player.hiding;
      const crawlerSeeHiding = b.type === 'stawler' && canBabySeePeeker(game, b) && game.player.hiding;
      const halfAngle = VISION_ANGLE / 2;

      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= RAY_COUNT; i++) {
        const ang = b.facing - halfAngle + (VISION_ANGLE * i / RAY_COUNT);
        const cs = Math.cos(ang), sn = Math.sin(ang);
        let hitD = range;
        for (let d = 8; d <= range; d += 8) {
          const tx = Math.floor((b.x + cs * d) / T);
          const ty = Math.floor((b.y + sn * d) / T);
          if (isSolid(game.grid, tx, ty) || isDoorBlocking(game.doors, tx, ty)) {
            hitD = d;
            break;
          }
        }
        pts.push({ x: b.x + cs * hitD, y: b.y + sn * hitD });
      }

      // Fill
      let fillColor = 0xfbbf24;
      let fillAlpha = 0.08;
      if (seeing) { fillColor = 0xef4444; fillAlpha = 0.18; }
      else if (crawlerSeeHiding) { fillColor = 0xf472b6; fillAlpha = 0.15; }
      else if (b.type === 'toddler') { fillColor = 0xdc2626; fillAlpha = 0.08; }
      else if (b.type === 'stawler') { fillColor = 0xec4899; fillAlpha = 0.08; }

      this.visionGfx.fillStyle(fillColor, fillAlpha);
      this.visionGfx.beginPath();
      this.visionGfx.moveTo(b.x, b.y);
      for (const p of pts) this.visionGfx.lineTo(p.x, p.y);
      this.visionGfx.closePath();
      this.visionGfx.fillPath();

      // Stroke
      let strokeColor = 0xfbbf24;
      let strokeAlpha = 0.12;
      if (seeing) { strokeColor = 0xef4444; strokeAlpha = 0.35; }
      else if (crawlerSeeHiding) { strokeColor = 0xf472b6; strokeAlpha = 0.3; }
      else if (b.type === 'toddler') { strokeColor = 0xdc2626; strokeAlpha = 0.15; }
      else if (b.type === 'stawler') { strokeColor = 0xec4899; strokeAlpha = 0.15; }

      this.visionGfx.lineStyle(1, strokeColor, strokeAlpha);
      this.visionGfx.beginPath();
      this.visionGfx.moveTo(b.x, b.y);
      for (const p of pts) this.visionGfx.lineTo(p.x, p.y);
      this.visionGfx.closePath();
      this.visionGfx.strokePath();
    }
  }

  renderCheeses(): void {
    const game = this.game_;
    for (const c of game.cheeses) {
      if (c.stuckBaby && c.landed) continue;
      this.worldGfx.fillStyle(0xfde047, 1);
      this.worldGfx.fillTriangle(c.x, c.y - 5, c.x + 5, c.y + 4, c.x - 5, c.y + 4);
    }
  }

  renderBabies(): void {
    const game = this.game_;
    const SPRITE_SIZE = T * 2;

    for (const b of game.babies) {
      const stunned = b.stunTimer > 0;
      let bx = b.x, by = b.y;

      // Toddler shake
      if (b.type === 'toddler' && !stunned) {
        if (b.chasing) {
          bx += Math.sin(game.time * 45 + b.y * 7) * 3.0;
          by += Math.cos(game.time * 51 + b.x * 7) * 3.0;
        } else {
          const sway = Math.sin(game.time * 6) * 4.5;
          const perp = b.facing + Math.PI / 2;
          bx += Math.cos(perp) * sway;
          by += Math.sin(perp) * sway;
        }
      }

      // Draw baby using sprites
      const moving = b.pauseTimer <= 0 && !stunned;
      const FRAME_DURATION = 0.15;
      let frameIndex: number;
      if (moving) {
        frameIndex = Math.floor(game.time / FRAME_DURATION) % 4;
      } else {
        const facingLeft = Math.cos(b.facing) < 0;
        const tick = Math.floor(game.time / 0.4) % 2;
        frameIndex = facingLeft
          ? (tick === 0 ? 3 : 2)
          : (tick === 0 ? 1 : 0);
      }

      const frameKey = `baby${frameIndex + 1}`;
      const half = SPRITE_SIZE / 2;

      // Use a temporary sprite or draw from the texture
      // For now, draw a colored circle as placeholder
      const colors: Record<string, number> = { crawler: 0xfb923c, stawler: 0xec4899, toddler: 0xdc2626 };
      this.worldGfx.fillStyle(stunned ? 0x888888 : (colors[b.type] || 0xfb923c), stunned ? 0.5 : 1);
      this.worldGfx.fillCircle(bx, by, BABY_RADIUS);
      this.worldGfx.lineStyle(1.5, 0xfdba74, 1);
      this.worldGfx.strokeCircle(bx, by, BABY_RADIUS);

      // Direction indicator
      if (!stunned) {
        const dirX = bx + Math.cos(b.facing) * BABY_RADIUS;
        const dirY = by + Math.sin(b.facing) * BABY_RADIUS;
        this.worldGfx.fillStyle(0xffffff, 0.6);
        this.worldGfx.fillCircle(dirX, dirY, 2);
      }

      // Alert indicators using worldGfx
      if (!stunned && !b.distracted && canBabySee(game, b) && !game.player.hiding) {
        this.worldGfx.fillStyle(0xef4444, 1);
        this.worldGfx.fillCircle(bx, by - BABY_RADIUS - 8, 3);
      }
      if (stunned) {
        // Stun stars
        for (let i = 0; i < 3; i++) {
          const a = game.time * 5 + i * 2.094;
          this.worldGfx.fillStyle(0xfde047, 1);
          this.worldGfx.fillCircle(bx + Math.cos(a) * 16, by + Math.sin(a) * 16 - 4, 2);
        }
      }
    }
  }

  renderPlayerVisuals(): void {
    const game = this.game_;
    const p = game.player;
    const bob = Math.sin(game.time * 8) * ((p.vx || p.vy) ? 1.5 : 0);
    const px = p.x, py = p.y + bob;

    // Update arc position (the physics circle)
    this.playerSprite.setPosition(p.x, p.y);

    if (p.hiding) {
      const stPct = p.peekStamina / PEEKABOO_MAX;
      this.playerSprite.setFillStyle(stPct < 0.3 ? 0xa3e635 : 0x22c55e);
      this.playerSprite.setAlpha(stPct < 0.3 ? 0.45 : 0.6);
    } else {
      this.playerSprite.setFillStyle(p.sprinting ? 0x86efac : 0x4ade80);
      this.playerSprite.setAlpha(1);

      // Eyes
      const eo = 4;
      const e1x = px + Math.cos(p.facing - 0.4) * eo;
      const e1y = py + Math.sin(p.facing - 0.4) * eo;
      const e2x = px + Math.cos(p.facing + 0.4) * eo;
      const e2y = py + Math.sin(p.facing + 0.4) * eo;
      this.worldGfx.fillStyle(0xffffff, 1);
      this.worldGfx.fillCircle(e1x, e1y, 2.5);
      this.worldGfx.fillCircle(e2x, e2y, 2.5);
      this.worldGfx.fillStyle(0x1e1e2e, 1);
      this.worldGfx.fillCircle(e1x + Math.cos(p.facing) * 0.8, e1y + Math.sin(p.facing) * 0.8, 1.2);
      this.worldGfx.fillCircle(e2x + Math.cos(p.facing) * 0.8, e2y + Math.sin(p.facing) * 0.8, 1.2);
    }

    // Loot progress bar
    if (p.looting) {
      const pct = 1 - p.lootTimer / LOOT_TIME;
      const bw = 30;
      this.worldGfx.fillStyle(0x000000, 0.6);
      this.worldGfx.fillRect(px - bw / 2, py - PLAYER_RADIUS - 14, bw, 4);
      this.worldGfx.fillStyle(0xfbbf24, 1);
      this.worldGfx.fillRect(px - bw / 2, py - PLAYER_RADIUS - 14, bw * pct, 4);
    }
    if (p.searching) {
      const pct = 1 - p.searchTimer / SEARCH_TIME;
      const bw = 30;
      this.worldGfx.fillStyle(0x000000, 0.6);
      this.worldGfx.fillRect(px - bw / 2, py - PLAYER_RADIUS - 14, bw, 4);
      this.worldGfx.fillStyle(0xa78bfa, 1);
      this.worldGfx.fillRect(px - bw / 2, py - PLAYER_RADIUS - 14, bw * pct, 4);
    }
  }

  renderUI(): void {
    const game = this.game_;
    const p = game.player;
    const g = this.uiGfx;

    // Detection bar
    const det = game.detection;
    const detPct = det / 100;
    const bw = 160, bh = 12, bx = VIEW_W / 2 - bw / 2, by = 10;

    g.fillStyle(0x000000, 0.5);
    g.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    g.fillStyle(0x374151, 1);
    g.fillRect(bx, by, bw, bh);

    if (det > 0) {
      // Detection fill - gradient approximation
      g.fillStyle(det > 50 ? 0xef4444 : 0xfbbf24, 1);
      g.fillRect(bx, by, bw * detPct, bh);
    }

    g.lineStyle(det > 70 ? 1.5 : 1, det > 70 ? 0xef4444 : 0x6b7280, det > 70 ? 0.7 : 1);
    g.strokeRect(bx, by, bw, bh);

    // Peekaboo stamina bar
    const pbw = 80, pbh = 8, pbx = VIEW_W - pbw - 12, pby = 30;
    g.fillStyle(0x000000, 0.4);
    g.fillRect(pbx - 1, pby - 1, pbw + 2, pbh + 2);
    g.fillStyle(0x1e1e2e, 1);
    g.fillRect(pbx, pby, pbw, pbh);
    const stPct = p.peekStamina / PEEKABOO_MAX;
    g.fillStyle(p.peekExhausted ? 0xef4444 : (stPct < 0.3 ? 0xf97316 : 0x4ade80), 1);
    g.fillRect(pbx, pby, pbw * stPct, pbh);
    g.lineStyle(1, 0x6b7280, 1);
    g.strokeRect(pbx, pby, pbw, pbh);

    // Key cards (top-left)
    if (p.keys.length > 0) {
      let keyX = 12;
      const kColors: Record<string, number> = { keyA: 0xef4444, keyB: 0x3b82f6, keyC: 0x22c55e };
      for (const k of p.keys) {
        g.fillStyle(kColors[k] || 0xfacc15, 1);
        g.fillRect(keyX, 22, 20, 10);
        keyX += 24;
      }
    }

    // Hotbar
    const SLOT_SIZE = 34;
    const SLOT_GAP = 3;
    const hasTools = p.tools.length > 0;
    const slotCount = 1 + (hasTools ? 1 : 0);
    const barW2 = slotCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + (hasTools ? 8 : 0);
    const barX = VIEW_W / 2 - barW2 / 2;
    const barY = VIEW_H - SLOT_SIZE - 14;

    g.fillStyle(0x000000, 0.6);
    g.fillRect(barX - 4, barY - 4, barW2 + 8, SLOT_SIZE + 8);

    // Cheese slot
    g.fillStyle(0x1e1e2e, 0.8);
    g.fillRect(barX, barY, SLOT_SIZE, SLOT_SIZE);
    g.lineStyle(1, p.cheese > 0 ? 0xfbbf24 : 0x374151, 1);
    g.strokeRect(barX, barY, SLOT_SIZE, SLOT_SIZE);

    if (p.cheese > 0) {
      g.fillStyle(0xfde047, 1);
      g.fillCircle(barX + SLOT_SIZE / 2, barY + SLOT_SIZE / 2 - 2, 8);
    }

    // Cheese cooldown overlay
    if (game.cheeseCooldown > 0) {
      const cdPct = game.cheeseCooldown / 3.0;
      g.fillStyle(0x000000, 0.5);
      g.fillRect(barX, barY, SLOT_SIZE, SLOT_SIZE * cdPct);
    }

    // Tool slot
    if (hasTools) {
      const toolX = barX + SLOT_SIZE + SLOT_GAP + 5;
      g.fillStyle(0x1e1e2e, 0.8);
      g.fillRect(toolX, barY, SLOT_SIZE, SLOT_SIZE);
      g.lineStyle(1, 0xc084fc, 1);
      g.strokeRect(toolX, barY, SLOT_SIZE, SLOT_SIZE);
    }

    // Crosshair
    if (game.state === 'playing' && !p.hiding && !p.looting && !p.searching) {
      const pointer = this.input.activePointer;
      const cx = pointer.x, cy = pointer.y;
      const size = 10, gap = 3;
      g.lineStyle(1.5, 0xffffff, 0.7);
      g.beginPath();
      g.moveTo(cx - size, cy); g.lineTo(cx - gap, cy);
      g.moveTo(cx + gap, cy); g.lineTo(cx + size, cy);
      g.moveTo(cx, cy - size); g.lineTo(cx, cy - gap);
      g.moveTo(cx, cy + gap); g.lineTo(cx, cy + size);
      g.strokePath();
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(cx, cy, 1.5);
    }

    // Minimap
    this.renderMinimap();
  }

  renderMinimap(): void {
    const game = this.game_;
    const g = this.uiGfx;
    const mmS = 3, mmW = COLS * mmS, mmH = ROWS * mmS;
    const mmX = VIEW_W - mmW - 8, mmY = VIEW_H - mmH - 20;

    g.fillStyle(0x000000, 0.6);
    g.fillRect(mmX - 1, mmY - 1, mmW + 2, mmH + 2);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (game.minimapSeen[y]?.[x]) {
          const v = game.grid[y][x];
          g.fillStyle(v === 1 ? 0x3a3a5c : (v === 2 ? 0x2a1f14 : 0x1e1e2e), 1);
        } else {
          g.fillStyle(0xf8fafc, 1);
        }
        g.fillRect(mmX + x * mmS, mmY + y * mmS, mmS, mmS);
      }
    }

    // Doors on minimap
    for (const d of game.doors) {
      g.fillStyle(d.state === 'open' ? 0x4ade80 : (d.state === 'closed' ? 0x8B4513 : 0xef4444), 1);
      g.fillRect(mmX + d.tx * mmS, mmY + d.ty * mmS, mmS, mmS);
    }

    // Player dot
    g.fillStyle(0x4ade80, 1);
    g.fillRect(mmX + (game.player.x / T) * mmS - 1, mmY + (game.player.y / T) * mmS - 1, 3, 3);

    // Baby dots
    for (const b of game.babies) {
      g.fillStyle(b.stunTimer > 0 ? 0xfde047 : (b.type === 'toddler' ? 0xdc2626 : (b.type === 'stawler' ? 0xec4899 : 0xfb923c)), 1);
      g.fillRect(mmX + (b.x / T) * mmS - 1, mmY + (b.y / T) * mmS - 1, 2, 2);
    }

    // Camera viewport
    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeRect(
      mmX + (game.camera.x / T) * mmS,
      mmY + (game.camera.y / T) * mmS,
      (VIEW_W / T) * mmS,
      (VIEW_H / T) * mmS
    );
  }

  renderDetectionOverlay(): void {
    const det = this.game_.detection;
    if (det <= 20) return;
    const detPct = det / 100;
    const alpha = (detPct - 0.2) * 0.2;

    this.overlayGfx.fillStyle(0xef4444, alpha);
    this.overlayGfx.fillRect(0, 0, VIEW_W, 40);
    this.overlayGfx.fillRect(0, VIEW_H - 40, VIEW_W, 40);
    this.overlayGfx.fillRect(0, 0, 40, VIEW_H);
    this.overlayGfx.fillRect(VIEW_W - 40, 0, 40, VIEW_H);
  }

  renderGameOver(): void {
    const game = this.game_;
    if (game.gameOverTimer < 0.3) return;

    const g = this.overlayGfx;
    g.fillStyle(0x000000, Math.min(0.6, (game.gameOverTimer - 0.3) * 2));
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    const cardW = 384, cardH = 237;
    const cardX = VIEW_W / 2 - cardW / 2, cardY = VIEW_H / 2 - cardH / 2;
    g.fillStyle(0x0f172a, 0.92);
    g.fillRoundedRect(cardX, cardY, cardW, cardH, 10);
    g.lineStyle(2, 0xef4444, 0.5);
    g.strokeRoundedRect(cardX, cardY, cardW, cardH, 10);
  }

  renderWinScreen(): void {
    const g = this.overlayGfx;
    g.fillStyle(0x000000, 0.6);
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    g.fillStyle(0x4ade80, 0.3);
    g.fillRoundedRect(VIEW_W / 2 - 200, VIEW_H / 2 - 60, 400, 120, 10);
  }
}
