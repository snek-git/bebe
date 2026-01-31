import Phaser from 'phaser';
import {
  T, COLS, ROWS, VIEW_W, VIEW_H, PLAYER_SPEED, SPRINT_SPEED, PLAYER_RADIUS,
  BABY_RADIUS, STAMINA_MAX, STAMINA_RECHARGE, SPRINT_DRAIN, CHEESE_COOLDOWN,
  LOOT_TIME, SEARCH_TIME, TOTAL_LOOT,
  TV_DURATION, TV_RANGE, DISTRACTION_DURATION, DISTRACTION_RANGE,
  SPRINT_NOISE_RANGE, SLAM_NOISE_RANGE,
  DOOR_SLAM_STUN, NOISE_DURATION, SUNGLASSES_DRAIN_MULT,
  VISION_RANGE, VISION_ANGLE, STAWLER_APPROACH_RANGE,
  LOOT_TYPES, TOOL_TYPES, ROOM_DEFS,
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

// ---- Shape drawing helpers (Phaser Graphics equivalents of old canvas shapes) ----

function drawToolShapeGfx(g: Phaser.GameObjects.Graphics, px: number, py: number, type: string, s: number, time: number): void {
  switch (type) {
    case 'ipad': {
      const w = s * 1.1, h = s * 1.5;
      g.fillStyle(0xd4d4d8, 1);
      g.fillRoundedRect(px - w / 2, py - h / 2, w, h, s * 0.15);
      g.fillStyle(0x18181b, 1);
      g.fillRect(px - s * 0.47, py - s * 0.62, s * 0.95, s * 1.25);
      g.fillStyle(0x3b82f6, 0.6 + Math.sin(time * 3) * 0.2);
      g.fillRect(px - s * 0.42, py - s * 0.52, s * 0.85, s * 1.05);
      // App icons grid
      const gap = s * 0.05, iconS = s * 0.18;
      const startIx = px - (iconS * 1.5 + gap);
      const startIy = py - s * 0.52 + gap * 2;
      g.fillStyle(0xeff6ff, 0.8);
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 3; col++)
          g.fillRect(startIx + col * (iconS + gap), startIy + row * (iconS + gap), iconS, iconS);
      // Home button
      g.fillStyle(0xa1a1aa, 1);
      g.fillCircle(px, py + h / 2 - s * 0.12, s * 0.05);
      break;
    }
    case 'remote': {
      g.fillStyle(0x3f3f46, 1);
      g.fillRect(px - s * 0.25, py - s * 0.6, s * 0.5, s * 1.2);
      g.lineStyle(1.5, 0x52525b, 1);
      g.strokeRect(px - s * 0.25, py - s * 0.6, s * 0.5, s * 1.2);
      g.fillStyle(0xef4444, 1);
      g.fillCircle(px, py - s * 0.3, s * 0.1);
      g.fillStyle(0x71717a, 1);
      g.fillRect(px - s * 0.12, py - s * 0.05, s * 0.24, s * 0.12);
      g.fillRect(px - s * 0.12, py + s * 0.15, s * 0.24, s * 0.12);
      break;
    }
    case 'pacifier': {
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(px, py, s * 0.4);
      g.lineStyle(s * 0.15, 0xf59e0b, 1);
      g.beginPath();
      const arcR = s * 0.55;
      g.arc(px, py - s * 0.15, arcR, -Math.PI * 0.8, -Math.PI * 0.2);
      g.strokePath();
      break;
    }
  }
}

function drawLootShapeGfx(g: Phaser.GameObjects.Graphics, px: number, py: number, type: string, s: number): void {
  switch (type) {
    case 'cash':
      g.fillStyle(0x4ade80, 1);
      g.fillRect(px - s * 0.6, py - s * 0.4, s * 1.2, s * 0.8);
      g.lineStyle(1.5, 0x22c55e, 1);
      g.strokeRect(px - s * 0.6, py - s * 0.4, s * 1.2, s * 0.8);
      break;
    case 'gold':
      g.fillStyle(0xfbbf24, 1);
      g.fillRect(px - s * 0.7, py - s * 0.3, s * 1.4, s * 0.6);
      g.lineStyle(1.5, 0xd97706, 1);
      g.strokeRect(px - s * 0.7, py - s * 0.3, s * 1.4, s * 0.6);
      g.fillStyle(0x92400e, 1);
      g.fillRect(px - s * 0.5, py - s * 0.1, s, s * 0.2);
      break;
    case 'diamond':
      g.fillStyle(0x60a5fa, 1);
      g.fillTriangle(px, py - s * 0.7, px + s * 0.5, py, px - s * 0.5, py);
      g.fillTriangle(px, py + s * 0.7, px + s * 0.5, py, px - s * 0.5, py);
      g.lineStyle(2, 0x3b82f6, 0.75);
      g.strokeTriangle(px, py - s * 0.7, px + s * 0.5, py, px - s * 0.5, py);
      g.strokeTriangle(px, py + s * 0.7, px + s * 0.5, py, px - s * 0.5, py);
      break;
    case 'key':
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(px - s * 0.3, py, s * 0.35);
      g.fillRect(px, py - s * 0.12, s * 0.7, s * 0.24);
      g.fillRect(px + s * 0.5, py, s * 0.2, s * 0.3);
      g.fillStyle(0x1e1e2e, 1);
      g.fillCircle(px - s * 0.3, py, s * 0.15);
      break;
    case 'docs':
      g.fillStyle(0xe5e7eb, 1);
      g.fillRect(px - s * 0.4, py - s * 0.55, s * 0.8, s * 1.1);
      g.lineStyle(1.5, 0x9ca3af, 1);
      g.strokeRect(px - s * 0.4, py - s * 0.55, s * 0.8, s * 1.1);
      g.lineStyle(1, 0x9ca3af, 1);
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(px - s * 0.25, py - s * 0.3 + i * s * 0.25);
        g.lineTo(px + s * 0.25, py - s * 0.3 + i * s * 0.25);
        g.strokePath();
      }
      break;
    case 'jewels':
      g.fillStyle(0xc084fc, 1);
      g.fillRect(px - s * 0.45, py - s * 0.35, s * 0.9, s * 0.7);
      g.lineStyle(1.5, 0xa855f7, 1);
      g.strokeRect(px - s * 0.45, py - s * 0.35, s * 0.9, s * 0.7);
      g.fillStyle(0xe9d5ff, 1);
      g.fillCircle(px, py, s * 0.15);
      break;
    case 'coin':
      g.fillStyle(0xfb923c, 1);
      g.fillCircle(px, py, s * 0.45);
      g.lineStyle(2, 0xc2410c, 1);
      g.strokeCircle(px, py, s * 0.45);
      break;
  }
}

export class GameScene extends Phaser.Scene {
  game_!: Game;
  tileLayer!: Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer;
  playerSprite!: Phaser.GameObjects.Arc;
  babyImages: Phaser.GameObjects.Image[] = [];

  // Input
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  eKey!: Phaser.Input.Keyboard.Key;
  qKey!: Phaser.Input.Keyboard.Key;
  spaceKey!: Phaser.Input.Keyboard.Key;
  shiftKey!: Phaser.Input.Keyboard.Key;
  rKey!: Phaser.Input.Keyboard.Key;
  escKey!: Phaser.Input.Keyboard.Key;

  // Graphics layers
  worldGfx!: Phaser.GameObjects.Graphics;
  playerDetailGfx!: Phaser.GameObjects.Graphics;
  visionGfx!: Phaser.GameObjects.Graphics;
  uiGfx!: Phaser.GameObjects.Graphics;
  overlayGfx!: Phaser.GameObjects.Graphics;

  // UI Text objects (screen-space, setScrollFactor(0))
  detectionText!: Phaser.GameObjects.Text;
  staminaLabel!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  cheeseCountText!: Phaser.GameObjects.Text;
  controlsText!: Phaser.GameObjects.Text;
  lootMessageText!: Phaser.GameObjects.Text;
  overlayTitleText!: Phaser.GameObjects.Text;
  overlaySubText!: Phaser.GameObjects.Text;
  overlayStatsText!: Phaser.GameObjects.Text;
  overlayPromptText!: Phaser.GameObjects.Text;
  retryButtonText!: Phaser.GameObjects.Text;
  gearText1!: Phaser.GameObjects.Text;
  gearText2!: Phaser.GameObjects.Text;
  proximityText!: Phaser.GameObjects.Text;

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

    // Build tilemap from grid — apply checkered floor pattern
    const grid = this.game_.grid;
    // Create a display grid with floor tiles alternated (0 and 3) for checkered pattern
    const displayGrid = grid.map((row, y) =>
      row.map((v, x) => v === 0 ? ((x + y) % 2 === 0 ? 0 : 3) : v)
    );
    const map = this.make.tilemap({
      data: displayGrid,
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

    // Player detail layer (eyes, hiding ring) — added after playerSprite so it draws on top
    this.playerDetailGfx = this.add.graphics();
    this.physics.add.existing(this.playerSprite);
    const playerBody = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    playerBody.setCircle(PLAYER_RADIUS);
    playerBody.setOffset(-PLAYER_RADIUS, -PLAYER_RADIUS);
    playerBody.setCollideWorldBounds(true);

    // Create baby image objects
    const tints: Record<string, number> = { crawler: 0xffffff, stawler: 0xff69b4, toddler: 0xff4444 };
    for (const b of this.game_.babies) {
      const tex = b.type === 'stawler' ? 'str1' : 'baby1';
      const img = this.add.image(b.x, b.y, tex);
      img.setDisplaySize(T * 2, T * 2);
      if (b.type !== 'stawler') img.setTint(tints[b.type] || 0xffffff);
      this.babyImages.push(img);
    }

    // Room labels (world-space, dim)
    for (const r of ROOM_DEFS) {
      const cx = (r.x + r.w / 2) * T;
      const cy = (r.y + 0.8) * T;
      this.add.text(cx, cy, r.name, {
        fontFamily: 'monospace', fontSize: '8px', color: '#6b7280',
      }).setOrigin(0.5, 0.5).setAlpha(0.35).setDepth(1);
    }

    // Camera follows player
    this.cameras.main.startFollow(this.playerSprite, true, 0.15, 0.15);

    // UI graphics (fixed to camera)
    this.uiGfx = this.add.graphics();
    this.uiGfx.setScrollFactor(0);
    this.uiGfx.setDepth(100);

    this.overlayGfx = this.add.graphics();
    this.overlayGfx.setScrollFactor(0);
    this.overlayGfx.setDepth(200);

    // UI Text objects
    const mono = { fontFamily: 'monospace' };
    this.detectionText = this.add.text(VIEW_W / 2, 33, '', { ...mono, fontSize: '9px', color: '#6b7280' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
    this.staminaLabel = this.add.text(60, VIEW_H - 37, 'idle', { ...mono, fontSize: '11px', fontStyle: 'bold', color: '#4ade80' })
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(101);
    this.statusText = this.add.text(VIEW_W - 12, 22, '', { ...mono, fontSize: '10px', color: '#fbbf24' })
      .setOrigin(1, 1).setScrollFactor(0).setDepth(101);
    this.cheeseCountText = this.add.text(0, 0, '', { ...mono, fontSize: '9px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(101);
    this.controlsText = this.add.text(VIEW_W / 2, VIEW_H - 8, 'WASD: Move | SPACE: Peekaboo | CLICK: Cheese | E: Loot | Q: Use Tool', { ...mono, fontSize: '9px', color: 'rgba(255,255,255,0.55)' })
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(101);
    this.lootMessageText = this.add.text(VIEW_W / 2, VIEW_H - 62, '', { ...mono, fontSize: '11px', fontStyle: 'bold', color: '#4ade80' })
      .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(101);

    // Overlay text (gameover/win)
    this.overlayTitleText = this.add.text(VIEW_W / 2, 0, '', { ...mono, fontSize: '44px', fontStyle: 'bold', color: '#ef4444' })
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(201).setVisible(false);
    this.overlaySubText = this.add.text(VIEW_W / 2, 0, '', { ...mono, fontSize: '14px', color: '#fca5a5' })
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(201).setVisible(false);
    this.overlayStatsText = this.add.text(VIEW_W / 2, 0, '', { ...mono, fontSize: '12px', color: '#e5e7eb' })
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(201).setVisible(false);
    this.overlayPromptText = this.add.text(VIEW_W / 2, 0, '', { ...mono, fontSize: '14px', fontStyle: 'bold', color: '#e5e7eb' })
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(201).setVisible(false);
    this.retryButtonText = this.add.text(VIEW_W / 2, 0, '', { ...mono, fontSize: '14px', fontStyle: 'bold', color: '#fdba74' })
      .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(201).setVisible(false);
    this.gearText1 = this.add.text(12, 42, '', { ...mono, fontSize: '9px', fontStyle: 'bold', color: '#4ade80' })
      .setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);
    this.gearText2 = this.add.text(62, 42, '', { ...mono, fontSize: '9px', fontStyle: 'bold', color: '#a855f7' })
      .setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);
    this.proximityText = this.add.text(0, 0, '', { ...mono, fontSize: '9px', fontStyle: 'bold', color: '#e5e7eb' })
      .setOrigin(0.5, 1).setDepth(50).setVisible(false);

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
    this.rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // ESC key for pause toggle
    this.escKey.on('down', () => {
      if (this.game_.state === 'playing') {
        this.game_.state = 'paused';
      } else if (this.game_.state === 'paused') {
        this.game_.state = 'playing';
      }
    });

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
        this.sound.play(Math.random() < 0.5 ? 'cheese1' : 'cheese2', { volume: 1.0 });
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

    // R key for retry — in-place reset (scene.restart/scene.start are broken in Phaser 4 RC6)
    this.input.keyboard!.on('keydown-R', () => {
      if (this.game_.state === 'gameover' || this.game_.state === 'win' || this.game_.state === 'paused') {
        this.resetGame();
      }
    });
  }

  resetGame(): void {
    // Re-initialize game state in-place (scene.restart/scene.start are broken in Phaser 4 RC6)
    this.game_ = initGame();
    this.game_.state = 'playing';

    // Reset player sprite position + velocity
    this.playerSprite.setPosition(this.game_.player.x, this.game_.player.y);
    const playerBody = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocity(0, 0);

    // Reset baby images to match new state
    const tints: Record<string, number> = { crawler: 0xffffff, stawler: 0xff69b4, toddler: 0xff4444 };
    for (let i = 0; i < this.game_.babies.length; i++) {
      const b = this.game_.babies[i];
      if (this.babyImages[i]) {
        this.babyImages[i].setPosition(b.x, b.y);
        const tex = b.type === 'stawler' ? 'str1' : 'baby1';
        this.babyImages[i].setTexture(tex);
        if (b.type !== 'stawler') this.babyImages[i].setTint(tints[b.type] || 0xffffff);
        else this.babyImages[i].clearTint();
        this.babyImages[i].setAlpha(1);
        this.babyImages[i].setRotation(0);
        this.babyImages[i].setVisible(true);
      }
    }

    // Clear all graphics
    this.worldGfx.clear();
    this.playerDetailGfx.clear();
    this.visionGfx.clear();
    this.uiGfx.clear();
    this.overlayGfx.clear();

    // Hide all overlay texts
    this.overlayTitleText.setVisible(false);
    this.overlaySubText.setVisible(false);
    this.overlayStatsText.setVisible(false);
    this.overlayPromptText.setVisible(false);
    this.retryButtonText.setVisible(false);
  }

  playClick(): void {
    const keys = ['click1', 'click2', 'click3'];
    this.sound.play(keys[Math.floor(Math.random() * keys.length)], { volume: 0.4 });
  }

  useTool(): void {
    const game = this.game_;
    if (game.player.tools.length === 0 || game.player.hiding || game.player.looting) return;
    this.playClick();
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

    if (game.state === 'paused') {
      this.renderAll();
      return;
    }

    if (game.state !== 'playing' && game.state !== 'gameover' && game.state !== 'win') return;

    game.time += dt;

    if (game.state === 'gameover') {
      game.gameOverTimer += dt;
      if (game.retryFadeTimer > 0) {
        game.retryFadeTimer = Math.max(0, game.retryFadeTimer - dt);
        if (game.retryFadeTimer === 0 && game.retryPending) {
          this.resetGame();
        }
      }
      this.renderAll();
      return;
    }

    if (game.state === 'win') {
      this.renderAll();
      return;
    }

    // Peekaboo pulse timer
    if (game.peekabooPulseTimer > 0) {
      game.peekabooPulseTimer = Math.max(0, game.peekabooPulseTimer - dt);
    }

    // Tool wheel hold detection
    if (this.qKey.isDown && !game.wheelOpen && game.player.tools.length >= 1 && game.qDownTime === 0) {
      game.qDownTime = time;
    }
    if (game.qDownTime > 0 && !game.wheelOpen && game.player.tools.length >= 1 &&
        time - game.qDownTime >= 250) {
      game.wheelOpen = true;
    }

    // Tool wheel hover tracking
    if (game.wheelOpen && game.player.tools.length >= 1) {
      const pointer = this.input.activePointer;
      const cx = VIEW_W / 2, cy = VIEW_H / 2;
      const mdx = pointer.x - cx, mdy = pointer.y - cy;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      const n = game.player.tools.length;
      const sectorSize = (Math.PI * 2) / n;
      if (mDist > 20) {
        const mouseAngle = Math.atan2(mdy, mdx);
        const adjusted = ((mouseAngle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        game.wheelHover = Math.floor(adjusted / sectorSize) % n;
      } else {
        game.wheelHover = 0;
      }
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
    updateMinimapSeen(game, dt);

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

    // Peekaboo (hiding) — uses unified stamina
    if (this.spaceKey.isDown && !p.looting && !p.searching && !p.staminaExhausted && p.stamina > 0) {
      p.hiding = true;
      p.vx = 0;
      p.vy = 0;
      p.stamina = Math.max(0, p.stamina - dt * drainMult);
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

    // Sprint — requires stamina
    const wantSprint = this.shiftKey.isDown;
    p.sprinting = wantSprint && !p.staminaExhausted && p.stamina > 0;

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

      // Sprint stamina drain (only when actually moving)
      if (p.sprinting && (dx || dy)) {
        p.stamina = Math.max(0, p.stamina - dt * SPRINT_DRAIN);
        if (p.stamina <= 0) {
          p.sprinting = false;
          p.staminaExhausted = true;
        }

        // Sprint noise (reuse existing to avoid spam)
        const existing = game.noiseEvents.find(n => n.radius === SPRINT_NOISE_RANGE);
        if (existing) {
          existing.x = p.x;
          existing.y = p.y;
          existing.timer = NOISE_DURATION * 0.3;
        } else {
          game.noiseEvents.push({
            x: p.x, y: p.y,
            radius: SPRINT_NOISE_RANGE,
            timer: NOISE_DURATION * 0.3,
          });
        }
      }
    }

    // Stamina recharge: when not hiding and not actively sprinting-with-movement
    const activelySprintMoving = p.sprinting && (p.vx || p.vy);
    if (!p.hiding && !activelySprintMoving) {
      p.stamina = Math.min(STAMINA_MAX, p.stamina + dt * STAMINA_RECHARGE);
      if (p.staminaExhausted && p.stamina >= STAMINA_MAX * 0.4) p.staminaExhausted = false;
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
      this.playClick();
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
    this.playerDetailGfx.clear();
    this.visionGfx.clear();
    this.uiGfx.clear();
    this.overlayGfx.clear();

    // Hide overlay texts each frame (gameover/win renderers show them if needed)
    this.overlayTitleText.setVisible(false);
    this.overlaySubText.setVisible(false);
    this.overlayStatsText.setVisible(false);
    this.overlayPromptText.setVisible(false);
    this.retryButtonText.setVisible(false);

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
    this.renderProximityLabels();
    if (game.wheelOpen) this.renderToolWheel();

    if (game.state === 'paused') this.renderPauseOverlay();
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
    // "EXIT" proximity label
    if (allLoot && dist(game.player, { x: ex + T / 2, y: ey + T / 2 }) < T * 3) {
      this.proximityText.setPosition(ex + T / 2, ey - 8).setText('EXIT').setColor('#4ade80').setVisible(true);
    }
  }

  renderRoomLabels(): void {
    // Room labels are created as static text objects in create()
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
        // Red X lock indicator
        const cx = px + T / 2, cy = py + T / 2;
        this.worldGfx.lineStyle(2, 0xef4444, 0.8);
        this.worldGfx.beginPath();
        this.worldGfx.moveTo(cx - 5, cy - 5); this.worldGfx.lineTo(cx + 5, cy + 5);
        this.worldGfx.moveTo(cx + 5, cy - 5); this.worldGfx.lineTo(cx - 5, cy + 5);
        this.worldGfx.strokePath();
      }
    }
  }

  renderTVs(): void {
    const game = this.game_;
    for (const tv of game.tvs) {
      const px = tv.x, py = tv.y;
      // TV body
      this.worldGfx.fillStyle(0x1a1a2e, 1);
      this.worldGfx.fillRect(px - 10, py - 8, 20, 16);
      this.worldGfx.lineStyle(2, 0x374151, 1);
      this.worldGfx.strokeRect(px - 10, py - 8, 20, 16);
      if (tv.active) {
        const pulse = Math.sin(game.time * 8) * 0.2 + 0.8;
        this.worldGfx.fillStyle(0x4ade80, pulse * 0.8);
        this.worldGfx.fillRect(px - 8, py - 6, 16, 12);
        // Colored bars
        const colors = [0xef4444, 0xfbbf24, 0x4ade80, 0x60a5fa];
        for (let i = 0; i < 4; i++) {
          this.worldGfx.fillStyle(colors[i], 1);
          this.worldGfx.fillRect(px - 8 + i * 4, py - 6, 4, 12);
        }
        // Range circle
        this.worldGfx.lineStyle(1, 0x4ade80, Math.sin(game.time * 4) * 0.05 + 0.08);
        this.worldGfx.strokeCircle(px, py, TV_RANGE);
        // Timer arc
        const pct = tv.timer / TV_DURATION;
        this.worldGfx.lineStyle(2, 0x4ade80, 0.6);
        this.worldGfx.beginPath();
        this.worldGfx.arc(px, py, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        this.worldGfx.strokePath();
      } else {
        this.worldGfx.fillStyle(0x111111, 1);
        this.worldGfx.fillRect(px - 8, py - 6, 16, 12);
      }
      // TV stand
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
      // American cheese slice (square)
      this.worldGfx.fillStyle(0xfbbf24, 1);
      this.worldGfx.fillRect(px - 6, py - 6, 12, 12);
      this.worldGfx.fillStyle(0xffffff, 0.35);
      this.worldGfx.fillEllipse(px - 1, py - 1, 2, 1.5);
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
      drawToolShapeGfx(this.worldGfx, px, py, tp.type, 10, game.time);
    }
  }

  renderDistractions(): void {
    const game = this.game_;
    for (const d of game.distractions) {
      const px = d.x, py = d.y;
      const pulse = Math.sin(game.time * 6) * 0.2 + 0.5;
      // Range circle
      this.worldGfx.lineStyle(1.5, 0xa855f7, pulse * 0.08);
      this.worldGfx.strokeCircle(px, py, DISTRACTION_RANGE);
      // Center glow
      this.worldGfx.fillStyle(0xa855f7, pulse * 0.3);
      this.worldGfx.fillCircle(px, py, 18);
      // Tool shape
      drawToolShapeGfx(this.worldGfx, px, py, d.type, 10, game.time);
      // Timer arc
      const pct = d.timer / DISTRACTION_DURATION;
      this.worldGfx.lineStyle(2, 0xa855f7, 0.7);
      this.worldGfx.beginPath();
      this.worldGfx.arc(px, py, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      this.worldGfx.strokePath();
      // Floating ~ marks
      for (let i = 0; i < 3; i++) {
        const a = game.time * 3 + i * 2.094, r = 20 + Math.sin(game.time * 4 + i) * 5;
        this.worldGfx.fillStyle(0xc4b5fd, pulse);
        this.worldGfx.fillCircle(px + Math.cos(a) * r, py + Math.sin(a) * r, 1.5);
      }
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
      drawLootShapeGfx(this.worldGfx, px, py, l.type, 10);
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
      if (c.isPacifier) {
        // Pacifier: yellow circle + ring
        this.worldGfx.fillStyle(0xf59e0b, 1);
        this.worldGfx.fillCircle(c.x, c.y, 4);
        this.worldGfx.lineStyle(2, 0xf59e0b, 0.8);
        this.worldGfx.strokeCircle(c.x, c.y - 3, 5);
      } else {
        // American cheese slice (square)
        this.worldGfx.fillStyle(0xfbbf24, 1);
        this.worldGfx.fillRect(c.x - 5, c.y - 5, 10, 10);
        this.worldGfx.fillStyle(0xffffff, 0.3);
        this.worldGfx.fillEllipse(c.x - 1, c.y - 1, 1.5, 1);
      }
    }
  }

  renderBabies(): void {
    const game = this.game_;
    const tints: Record<string, number> = { crawler: 0xffffff, stawler: 0xff69b4, toddler: 0xff4444 };

    for (let i = 0; i < game.babies.length; i++) {
      const b = game.babies[i];
      const img = this.babyImages[i];
      if (!img) continue;

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

      // Frame selection
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

      const frameKey = b.type === 'stawler' ? `str${frameIndex + 1}` : `baby${frameIndex + 1}`;
      img.setTexture(frameKey);
      img.setPosition(bx, by);
      img.setRotation(b.facing + Math.PI / 2);
      if (b.type === 'stawler') {
        if (stunned) img.setTint(0x888888); else img.clearTint();
      } else {
        img.setTint(stunned ? 0x888888 : (tints[b.type] || 0xffffff));
      }
      img.setAlpha(stunned ? 0.5 : 1);

      // Distraction heart indicator
      if (!stunned && b.distracted) {
        // Pink heart using two circles + triangle
        const hx = bx, hy = by - BABY_RADIUS - 12;
        this.worldGfx.fillStyle(0xf472b6, 0.9);
        this.worldGfx.fillCircle(hx - 2.5, hy - 1, 3);
        this.worldGfx.fillCircle(hx + 2.5, hy - 1, 3);
        this.worldGfx.fillTriangle(hx - 5, hy, hx + 5, hy, hx, hy + 5);
      }

      // Alert indicators
      const indY = BABY_RADIUS + 14;
      if (!stunned && !b.distracted && canBabySee(game, b) && !game.player.hiding) {
        // Red ! when spotting player
        this.worldGfx.fillStyle(0xef4444, 1);
        this.worldGfx.fillRect(bx - 1.5, by - indY - 8, 3, 7);
        this.worldGfx.fillCircle(bx, by - indY + 1, 1.5);
      }
      if (b.type === 'stawler' && b.chasing && !stunned) {
        // Pink ?! when stawler chasing
        this.worldGfx.fillStyle(0xf472b6, 1);
        this.worldGfx.fillCircle(bx - 3, by - indY - 4, 1.5);
        this.worldGfx.fillRect(bx - 4.5, by - indY - 2, 3, 4);
        this.worldGfx.fillCircle(bx - 3, by - indY + 3, 1);
        this.worldGfx.fillRect(bx + 1, by - indY - 8, 3, 7);
        this.worldGfx.fillCircle(bx + 2.5, by - indY + 1, 1.5);
      }
      if (b.type === 'toddler' && b.chasing && !stunned) {
        // Red !! when toddler chasing
        this.worldGfx.fillStyle(0xef4444, 1);
        this.worldGfx.fillRect(bx - 4, by - indY - 8, 3, 7);
        this.worldGfx.fillCircle(bx - 2.5, by - indY + 1, 1.5);
        this.worldGfx.fillRect(bx + 1, by - indY - 8, 3, 7);
        this.worldGfx.fillCircle(bx + 2.5, by - indY + 1, 1.5);
      }

      // Stun stars
      if (stunned) {
        for (let j = 0; j < 3; j++) {
          const a = game.time * 5 + j * 2.094;
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
    const pg = this.playerDetailGfx;

    // Update arc position (the physics circle)
    this.playerSprite.setPosition(p.x, p.y);

    if (p.hiding) {
      const stPct = p.stamina / STAMINA_MAX;
      const flicker = stPct < 0.3 ? (Math.sin(game.time * 12) * 0.15 + 0.45) : 0.6;
      this.playerSprite.setFillStyle(stPct < 0.3 ? 0xa3e635 : 0x22c55e);
      this.playerSprite.setAlpha(flicker);

      // Peekaboo eyes (yellow arcs)
      pg.lineStyle(3, 0xfcd34d, flicker);
      pg.beginPath();
      pg.arc(px, py, PLAYER_RADIUS * 0.5, -0.8, 0.8);
      pg.strokePath();
      pg.beginPath();
      pg.arc(px, py, PLAYER_RADIUS * 0.5, Math.PI - 0.8, Math.PI + 0.8);
      pg.strokePath();

      // Hiding ring
      const ringSize = stPct < 0.3
        ? (PLAYER_RADIUS + 3 + Math.sin(game.time * 8) * 3)
        : (PLAYER_RADIUS + 6 + Math.sin(game.time * 4) * 2);
      pg.lineStyle(1.5, stPct < 0.3 ? 0xef4444 : 0x4ade80, stPct < 0.3 ? 0.4 : 0.3);
      pg.strokeCircle(px, py, ringSize);
    } else {
      this.playerSprite.setFillStyle(p.sprinting ? 0x86efac : 0x4ade80);
      this.playerSprite.setAlpha(1);

      // Eyes
      const eo = 4;
      const e1x = px + Math.cos(p.facing - 0.4) * eo;
      const e1y = py + Math.sin(p.facing - 0.4) * eo;
      const e2x = px + Math.cos(p.facing + 0.4) * eo;
      const e2y = py + Math.sin(p.facing + 0.4) * eo;
      pg.fillStyle(0xffffff, 1);
      pg.fillCircle(e1x, e1y, 2.5);
      pg.fillCircle(e2x, e2y, 2.5);
      pg.fillStyle(0x1e1e2e, 1);
      pg.fillCircle(e1x + Math.cos(p.facing) * 0.8, e1y + Math.sin(p.facing) * 0.8, 1.2);
      pg.fillCircle(e2x + Math.cos(p.facing) * 0.8, e2y + Math.sin(p.facing) * 0.8, 1.2);
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

    // Detection — 5 crying baby face indicators (matching main's drawCryingBaby)
    const det = game.detection;
    const babyIndex = Math.min(5, Math.floor(det / 20));
    const fillFraction = (det % 20) / 20;
    const faceR = 13, faceGap = 6;
    const faceTotalW = 5 * (faceR * 2) + 4 * faceGap;
    const faceStartX = VIEW_W / 2 - faceTotalW / 2;
    const faceBaseY = 20;

    for (let i = 0; i < 5; i++) {
      const fx = faceStartX + i * (faceR * 2 + faceGap) + faceR;

      // Bounce from milkFillAnim
      const anim = game.milkFillAnim[i];
      const bounceT = anim > 0 ? anim / 0.3 : 0;
      const yOff = bounceT > 0 ? -10 * Math.sin(bounceT * Math.PI) * bounceT : 0;
      const fy = faceBaseY + yOff;

      let fill = 0;
      if (i < babyIndex) fill = 1;
      else if (i === babyIndex) fill = fillFraction;

      // Face color: peachy → red as fill increases
      const rr = Math.round(255 - fill * 40);
      const gg = Math.round(205 - fill * 100);
      const bb = Math.round(180 - fill * 100);
      const faceColor = fill > 0
        ? ((rr << 16) | (gg << 8) | bb)
        : 0x506e74;
      const faceAlpha = fill > 0 ? 1 : 0.5;

      // Head circle
      g.fillStyle(faceColor, faceAlpha);
      g.fillCircle(fx, fy, faceR);
      g.lineStyle(2, fill > 0 ? 0xc87864 : 0x48818c, fill > 0 ? 0.6 : 0.4);
      g.strokeCircle(fx, fy, faceR);

      if (fill <= 0) {
        // Sleeping: closed eyes (— —) and tiny mouth
        g.lineStyle(1.5, 0x48818c, 0.5);
        g.beginPath();
        g.moveTo(fx - 5, fy - 2); g.lineTo(fx - 2, fy - 2);
        g.moveTo(fx + 2, fy - 2); g.lineTo(fx + 5, fy - 2);
        g.strokePath();
        // Tiny mouth line
        g.lineStyle(1, 0x48818c, 0.3);
        g.beginPath();
        g.moveTo(fx - 2, fy + 4); g.lineTo(fx + 2, fy + 4);
        g.strokePath();
      } else if (fill < 1) {
        // Worried → crying transition
        const worry = fill;
        const eyeR = 1.2 + worry * 0.8;

        // Eyes
        g.fillStyle(0x333333, 1);
        g.fillCircle(fx - 4, fy - 2, eyeR);
        g.fillCircle(fx + 4, fy - 2, eyeR);

        // Worried brows (angled up toward center)
        g.lineStyle(1.2, 0x3c281e, 0.6);
        g.beginPath();
        g.moveTo(fx - 7, fy - 5 - worry * 2); g.lineTo(fx - 3, fy - 6);
        g.moveTo(fx + 7, fy - 5 - worry * 2); g.lineTo(fx + 3, fy - 6);
        g.strokePath();

        // Mouth: small → open oval
        const mouthOpen = worry * 3;
        g.fillStyle(0xb45050, 0.3 + worry * 0.5);
        g.fillEllipse(fx, fy + 4, 2.5 + worry, mouthOpen);

        // Tear drops (appear past 40% worry)
        if (worry > 0.4) {
          const tearAlpha = (worry - 0.4) / 0.6 * 0.7;
          const tearY = fy + 1 + worry * 4;
          g.fillStyle(0x78b4dc, tearAlpha);
          g.fillEllipse(fx - 5, tearY, 1, 1.5);
          g.fillEllipse(fx + 5, tearY, 1, 1.5);
        }
      } else {
        // Full crying: scrunched eyes, open mouth, streaming tears, shake
        const shake = Math.sin(game.time * 25) * 1.5;
        const sx = fx + shake;

        // Scrunched eyes (^ ^)
        g.lineStyle(1.5, 0x333333, 1);
        g.beginPath();
        g.moveTo(sx - 6, fy - 2); g.lineTo(sx - 4, fy - 4); g.lineTo(sx - 2, fy - 2);
        g.moveTo(sx + 2, fy - 2); g.lineTo(sx + 4, fy - 4); g.lineTo(sx + 6, fy - 2);
        g.strokePath();

        // Angry brows
        g.lineStyle(1.3, 0x3c281e, 0.7);
        g.beginPath();
        g.moveTo(sx - 7, fy - 7); g.lineTo(sx - 2, fy - 5);
        g.moveTo(sx + 7, fy - 7); g.lineTo(sx + 2, fy - 5);
        g.strokePath();

        // Big open crying mouth
        g.fillStyle(0xb43c3c, 0.8);
        g.fillEllipse(sx, fy + 4, 4, 3.5);

        // Streaming tears (animated)
        g.fillStyle(0x78b4dc, 0.6);
        const t1 = (game.time * 3) % 1;
        const t2 = (game.time * 3 + 0.5) % 1;
        for (const t of [t1, t2]) {
          const ty = fy + t * 10;
          g.fillEllipse(sx - 6, ty, 1.2, 2);
          g.fillEllipse(sx + 6, ty, 1.2, 2);
        }

        // Glow when animating
        if (bounceT > 0) {
          g.lineStyle(2, 0xef4444, 0.3);
          g.strokeCircle(fx, fy, faceR + 1);
        }
      }
    }

    // Unified stamina bar (bottom-left, matching main)
    const pbw = 96, pbh = 10, pbx = 12, pby = VIEW_H - 34;
    g.fillStyle(0x000000, 0.4);
    g.fillRect(pbx - 1, pby - 1, pbw + 2, pbh + 2);
    g.fillStyle(0x1e1e2e, 1);
    g.fillRect(pbx, pby, pbw, pbh);
    const stPct = p.stamina / STAMINA_MAX;
    g.fillStyle(p.staminaExhausted ? 0xef4444 : (stPct < 0.3 ? 0xf97316 : 0x4ade80), 1);
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

    // Gear icons (top-left, below keys)
    this.gearText1.setVisible(false);
    this.gearText2.setVisible(false);
    if (p.gear.length > 0) {
      for (let gi = 0; gi < p.gear.length; gi++) {
        const gr = p.gear[gi];
        const txt = gi === 0 ? this.gearText1 : this.gearText2;
        txt.setX(12 + gi * 50).setText(gr === 'sneakers' ? 'SNEAK' : 'SHADE')
          .setColor(gr === 'sneakers' ? '#4ade80' : '#a855f7').setVisible(true);
      }
    }

    // Hotbar (matching main's 40px slots)
    const SLOT_SIZE = 40;
    const SLOT_GAP = 4;
    const hasTools = p.tools.length > 0;
    const slotCount = 1 + (hasTools ? 1 : 0);
    const barW2 = slotCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + (hasTools ? 8 : 0);
    const barX = VIEW_W / 2 - barW2 / 2;
    const barY = VIEW_H - SLOT_SIZE - 50;

    g.fillStyle(0x000000, 0.6);
    g.fillRect(barX - 4, barY - 4, barW2 + 8, SLOT_SIZE + 8);

    // Cheese slot
    g.fillStyle(0x14395e, 0.8);
    g.fillRect(barX, barY, SLOT_SIZE, SLOT_SIZE);
    g.lineStyle(2, p.cheese > 0 ? 0xfbbf24 : 0x374151, 1);
    g.strokeRect(barX + 0.5, barY + 0.5, SLOT_SIZE - 1, SLOT_SIZE - 1);

    if (p.cheese > 0) {
      // American cheese slice (square)
      const cx = barX + SLOT_SIZE / 2, cy = barY + SLOT_SIZE / 2;
      const sz = 16;
      g.fillStyle(0xfbbf24, 1);
      g.fillRect(cx - sz / 2, cy - sz / 2, sz, sz);
      g.fillStyle(0xffffff, 0.4);
      g.fillEllipse(cx - sz * 0.15, cy - sz * 0.15, sz * 0.2, sz * 0.15);
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
      // Divider line
      g.lineStyle(2, 0x6b7280, 0.5);
      g.beginPath();
      g.moveTo(toolX - 5, barY + 2); g.lineTo(toolX - 5, barY + SLOT_SIZE - 2);
      g.strokePath();
      // Slot background
      g.fillStyle(0x14395e, 0.8);
      g.fillRect(toolX, barY, SLOT_SIZE, SLOT_SIZE);
      g.lineStyle(2, 0xfbbf24, 1);
      g.strokeRect(toolX + 0.5, barY + 0.5, SLOT_SIZE - 1, SLOT_SIZE - 1);
      // Draw tool icon
      drawToolShapeGfx(g, toolX + SLOT_SIZE / 2, barY + SLOT_SIZE / 2 - 4, p.tools[0], 12, game.time);
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

    // Stamina label (above bar, matching main's states)
    let staminaLabelText = 'idle';
    let staminaLabelColor = '#4ade80';
    if (p.staminaExhausted) {
      staminaLabelText = 'exhausted';
      staminaLabelColor = '#ef4444';
    } else if (p.hiding) {
      staminaLabelText = 'peekaboo';
      staminaLabelColor = '#4ade80';
    } else if (p.sprinting && (p.vx || p.vy)) {
      staminaLabelText = 'sprint';
      staminaLabelColor = '#60a5fa';
    } else if (p.searching) {
      staminaLabelText = 'searching';
      staminaLabelColor = '#a78bfa';
    } else if (p.looting) {
      staminaLabelText = 'looting';
      staminaLabelColor = '#fbbf24';
    }
    this.staminaLabel.setText(staminaLabelText);
    this.staminaLabel.setColor(staminaLabelColor);

    // Status text is now handled by stamina label
    this.statusText.setVisible(false);

    // Cheese count on hotbar (uses same barX/barY as above)
    if (p.cheese > 0) {
      this.cheeseCountText.setText('' + p.cheese).setColor('#ffffff')
        .setPosition(barX + SLOT_SIZE / 2, barY + SLOT_SIZE / 2 - 12).setVisible(true);
    } else {
      this.cheeseCountText.setText('--').setColor('#4b5563')
        .setPosition(barX + SLOT_SIZE / 2, barY + SLOT_SIZE / 2).setVisible(true);
    }

    // Loot message
    if (p.loot >= TOTAL_LOOT) {
      this.lootMessageText.setText('GOLDEN BEBE ACQUIRED! HEAD TO THE EXIT!');
      this.lootMessageText.setAlpha(Math.sin(game.time * 4) * 0.3 + 0.7);
      this.lootMessageText.setVisible(true);
    } else {
      this.lootMessageText.setVisible(false);
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

    // Draw all tiles
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = game.grid[y][x];
        g.fillStyle(v === 1 ? 0x3a3a5c : (v === 2 ? 0x2a1f14 : 0x1e1e2e), 1);
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

    // Active TV dots
    for (const tv of game.tvs) {
      if (tv.active) {
        g.fillStyle(0x4ade80, 1);
        g.fillRect(mmX + (tv.x / T) * mmS - 1, mmY + (tv.y / T) * mmS - 1, 2, 2);
      }
    }

    // Camera viewport
    g.lineStyle(1, 0x48818c, 0.45);
    g.strokeRect(
      mmX + (game.camera.x / T) * mmS,
      mmY + (game.camera.y / T) * mmS,
      (VIEW_W / T) * mmS,
      (VIEW_H / T) * mmS
    );

    // Cloud fog overlay (with scale animation on dissolve)
    for (const cloud of game.minimapClouds) {
      if (cloud.dissolve >= 1) continue;
      const d = cloud.dissolve;
      let scale: number, alpha: number;
      if (d < 0.15) {
        scale = 1.0 + (d / 0.15) * 0.2;
        alpha = 1;
      } else {
        const t2 = (d - 0.15) / 0.85;
        scale = 1.2 * (1 - t2);
        alpha = 1 - t2;
      }
      if (alpha <= 0) continue;
      const cx = mmX + cloud.tx * mmS;
      const cy = mmY + cloud.ty * mmS;
      const r = cloud.r * scale;
      const s = cloud.seed;

      // Multi-layer puffs
      g.fillStyle(0xb4bec8, alpha * 0.7);
      g.fillCircle(cx, cy, r);
      g.fillStyle(0xa5afb9, alpha * 0.55);
      g.fillCircle(cx + ((s % 7) - 3) * scale, cy + ((s % 5) - 2) * scale, r * 0.7);
      g.fillStyle(0x96a0ac, alpha * 0.4);
      g.fillCircle(cx - ((s % 6) - 3) * scale, cy + ((s % 4) - 2) * scale, r * 0.5);
      // Additional puffs for coverage
      g.fillStyle(0xaab4be, alpha * 0.5);
      g.fillCircle(cx + ((s % 9) - 4) * scale, cy + ((s % 7) - 3) * scale, r * 0.6);
      g.fillCircle(cx - ((s % 5) - 2) * scale, cy - ((s % 6) - 3) * scale, r * 0.55);
    }
  }

  renderProximityLabels(): void {
    const game = this.game_;
    const p = game.player;
    this.proximityText.setVisible(false);
    if (p.hiding || p.looting || p.searching || game.state !== 'playing') return;

    const INTERACT_RANGE = T * 1.8;

    // Nearest container
    for (const c of game.containers) {
      if (!c.searched && dist(p, c) < INTERACT_RANGE) {
        this.proximityText.setPosition(c.x, c.y - T).setText('[E] Search').setColor('#a78bfa').setVisible(true);
        return;
      }
    }

    // Nearest door
    for (const d of game.doors) {
      if (d.state === 'closed' && dist(p, d) < INTERACT_RANGE) {
        this.proximityText.setPosition(d.x, d.y - T).setText('[E] Open').setColor('#fbbf24').setVisible(true);
        return;
      }
    }

    // Nearest tool pickup
    for (const tp of game.toolPickups) {
      if (!tp.collected && dist(p, tp) < INTERACT_RANGE) {
        const tt = TOOL_TYPES[tp.type];
        this.proximityText.setPosition(tp.x, tp.y - T).setText('[E] ' + tt.name).setColor('#c084fc').setVisible(true);
        return;
      }
    }
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

  renderToolWheel(): void {
    const game = this.game_;
    const tools = game.player.tools;
    if (tools.length < 1) return;

    const g = this.overlayGfx;
    const cx = VIEW_W / 2, cy = VIEW_H / 2;
    const radius = 80;
    const n = tools.length;
    const sectorSize = (Math.PI * 2) / n;

    // Dim overlay
    g.fillStyle(0x000000, 0.45);
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    // Center ring
    g.fillStyle(0x0e0e1a, 0.7);
    g.fillCircle(cx, cy, radius + 30);
    g.lineStyle(2, 0xc084fc, 0.3);
    g.strokeCircle(cx, cy, radius + 30);

    // Sector lines
    g.lineStyle(1, 0xc084fc, 0.15);
    for (let i = 0; i < n; i++) {
      const ang = i * sectorSize - Math.PI / 2 - sectorSize / 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(ang) * (radius + 30), cy + Math.sin(ang) * (radius + 30));
      g.strokePath();
    }

    // Items
    for (let i = 0; i < n; i++) {
      const ang = i * sectorSize - Math.PI / 2;
      const ix = cx + Math.cos(ang) * radius;
      const iy = cy + Math.sin(ang) * radius;
      const hovered = i === game.wheelHover;
      const bgRadius = hovered ? 26 : 22;

      g.fillStyle(hovered ? 0xc084fc : 0x1e1e2e, hovered ? 0.35 : 0.8);
      g.fillCircle(ix, iy, bgRadius);
      g.lineStyle(hovered ? 2.5 : 1, hovered ? 0xc084fc : 0x6b7280, hovered ? 1 : 0.5);
      g.strokeCircle(ix, iy, bgRadius);

      // Tool icon inside circle
      drawToolShapeGfx(g, ix, iy, tools[i], hovered ? 14 : 11, game.time);

      // Active indicator
      if (i === 0) {
        this.overlayPromptText.setPosition(ix, iy - bgRadius - 4)
          .setText('active').setColor('#c084fc').setFontSize('7px')
          .setAlpha(0.6).setVisible(true);
      }
    }

    // Center text
    this.overlayTitleText.setPosition(cx, cy)
      .setText('SELECT').setColor('rgba(255,255,255,0.5)').setFontSize('9px')
      .setVisible(true);

    // Tool name labels as text objects — reuse statsText for hovered tool name
    if (game.wheelHover >= 0 && game.wheelHover < tools.length) {
      const tt = TOOL_TYPES[tools[game.wheelHover]];
      const ang = game.wheelHover * sectorSize - Math.PI / 2;
      const ix = cx + Math.cos(ang) * radius;
      const iy = cy + Math.sin(ang) * radius;
      const bgRadius = 26;
      this.overlaySubText.setPosition(ix, iy + bgRadius + 12)
        .setText(tt.name).setColor('#e9d5ff').setFontSize('10px')
        .setVisible(true);
    }
  }

  renderPauseOverlay(): void {
    const g = this.overlayGfx;
    g.fillStyle(0x000000, 0.55);
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    this.overlayTitleText.setPosition(VIEW_W / 2, VIEW_H / 2 - 10)
      .setText('PAUSED').setColor('#e5e7eb').setFontSize('36px').setVisible(true);
    this.overlaySubText.setPosition(VIEW_W / 2, VIEW_H / 2 + 20)
      .setText('ESC to resume  |  R to restart')
      .setColor('#9ca3af').setFontSize('12px').setVisible(true);
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

    this.overlayTitleText.setPosition(VIEW_W / 2, cardY + 58)
      .setText('BUSTED!').setColor('#ef4444').setFontSize('44px').setVisible(true);
    this.overlaySubText.setPosition(VIEW_W / 2, cardY + 98)
      .setText('The baby saw your face and started crying.')
      .setColor('#fca5a5').setFontSize('14px').setVisible(true);
    this.overlayStatsText.setPosition(VIEW_W / 2, cardY + 124)
      .setText('Keys: ' + game.player.keys.length + '/3 | Golden Bebe: ' + (game.player.loot > 0 ? 'YES' : 'NO'))
      .setColor('#e5e7eb').setFontSize('12px').setVisible(true);

    if (game.gameOverTimer > 0.8) {
      // Retry button background
      const btnW = 180, btnH = 36;
      const btnX = VIEW_W / 2 - btnW / 2, btnY = cardY + cardH - 52;
      g.fillStyle(0x0f172a, 0.9);
      g.fillRoundedRect(btnX, btnY + 5, btnW, btnH, 8);
      g.fillStyle(0x0f172a, 1);
      g.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
      g.lineStyle(2, 0xf97316, 1);
      g.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);

      this.overlayPromptText.setPosition(VIEW_W / 2, btnY - 10)
        .setText('Press R or click').setColor('#cbd5e1').setFontSize('11px').setVisible(true);
      this.retryButtonText.setPosition(VIEW_W / 2, btnY + btnH / 2)
        .setText('RETRY HEIST').setVisible(true);
    }
  }

  renderWinScreen(): void {
    const game = this.game_;
    const g = this.overlayGfx;
    g.fillStyle(0x000000, 0.6);
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    g.fillStyle(0x4ade80, 0.3);
    g.fillRoundedRect(VIEW_W / 2 - 200, VIEW_H / 2 - 80, 400, 180, 10);

    this.overlayTitleText.setPosition(VIEW_W / 2, VIEW_H / 2 - 40)
      .setText('ESCAPED!').setColor('#4ade80').setFontSize('48px').setVisible(true);
    this.overlaySubText.setPosition(VIEW_W / 2, VIEW_H / 2 + 10)
      .setText('You stole the Golden Bebe and got away clean.')
      .setColor('#86efac').setFontSize('14px').setVisible(true);
    this.overlayStatsText.setPosition(VIEW_W / 2, VIEW_H / 2 + 50)
      .setText('Cheese remaining: ' + game.player.cheese + ' | Tools: ' + game.player.tools.length)
      .setColor('#fbbf24').setFontSize('12px').setVisible(true);

    const pulse = Math.sin(this.time.now / 300) * 0.3 + 0.7;
    this.overlayPromptText.setPosition(VIEW_W / 2, VIEW_H / 2 + 90)
      .setText('PRESS R TO PLAY AGAIN').setColor('#e5e7eb').setFontSize('14px')
      .setAlpha(pulse).setVisible(true);
  }
}
