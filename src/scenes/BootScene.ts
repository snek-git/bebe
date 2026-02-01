import Phaser from 'phaser';
import { loadSpritesViaPhaser, initSpritesFromPhaser, generateBossSprites, generateFloorTiles, getBossFrame, getFloorSprite } from '../sprites';
import { sketchyRect } from '../render/sketchy';
import { T } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load sprite images via Phaser's loader
    loadSpritesViaPhaser(this);

    // Load audio
    this.load.audio('music', './audio/music.m4a');
  }

  create(): void {
    // Extract loaded images into sprite module for ctx.drawImage usage
    initSpritesFromPhaser(this);

    // Generate procedural sprites
    generateBossSprites();
    generateFloorTiles();

    // Create tilesheet: floor0, floor1, 256 wall variants, furniture
    // 8-bit mask: bits 0-3 = cardinal edges, bits 4-7 = inner corners
    const WALL_VARIANTS = 256;
    const TOTAL_TILES = 2 + WALL_VARIANTS + 1; // 259
    const tilesheet = document.createElement('canvas');
    tilesheet.width = T * TOTAL_TILES;
    tilesheet.height = T;
    const tsCtx = tilesheet.getContext('2d')!;

    // Tile 0-1: Floor variants
    tsCtx.drawImage(getFloorSprite(0), 0, 0, 128, 128, 0, 0, T, T);
    tsCtx.drawImage(getFloorSprite(1), 0, 0, 128, 128, T, 0, T, T);

    // Tiles 2-257: Wall variants (256 edge+corner combinations)
    // Cardinal: bit0=top, bit1=right, bit2=bottom, bit3=left
    // Corners:  bit4=top-right, bit5=bottom-right, bit6=bottom-left, bit7=top-left
    const WALL_OUTER = '#2a3d52';
    const WALL_INNER = '#3d5a78';
    const HALF = T / 2;

    for (let mask = 0; mask < WALL_VARIANTS; mask++) {
      const x = (2 + mask) * T;
      // Base inner fill
      tsCtx.fillStyle = WALL_INNER;
      tsCtx.fillRect(x, 0, T, T);
      // Dark outer borders on exposed cardinal sides
      tsCtx.fillStyle = WALL_OUTER;
      if (mask & 1) tsCtx.fillRect(x, 0, T, HALF);              // top
      if (mask & 2) tsCtx.fillRect(x + HALF, 0, HALF, T);       // right
      if (mask & 4) tsCtx.fillRect(x, HALF, T, HALF);            // bottom
      if (mask & 8) tsCtx.fillRect(x, 0, HALF, T);              // left
      // Dark inner corner fills (diagonal exposed, both adjacent cardinals are walls)
      if (mask & 16)  tsCtx.fillRect(x + HALF, 0, HALF, HALF);       // top-right
      if (mask & 32)  tsCtx.fillRect(x + HALF, HALF, HALF, HALF);    // bottom-right
      if (mask & 64)  tsCtx.fillRect(x, HALF, HALF, HALF);           // bottom-left
      if (mask & 128) tsCtx.fillRect(x, 0, HALF, HALF);              // top-left
      // Rough grain texture
      tsCtx.save();
      tsCtx.beginPath();
      tsCtx.rect(x, 0, T, T);
      tsCtx.clip();
      tsCtx.globalAlpha = 0.08;
      tsCtx.strokeStyle = '#a0b8cc';
      tsCtx.lineWidth = 1;
      const step = 5;
      for (let d = -T; d < T; d += step) {
        const j = () => (Math.sin(d * 73.1 + mask * 37) * 43758.5453 % 1 - 0.5) * 2;
        tsCtx.beginPath();
        tsCtx.moveTo(x + d + j(), j());
        tsCtx.lineTo(x + d + T + j(), T + j());
        tsCtx.stroke();
      }
      tsCtx.restore();
    }

    // Tile 258: Furniture
    sketchyRect(tsCtx, (2 + WALL_VARIANTS) * T, 0, T, T, {
      fill: '#3d2e1c', stroke: 'rgba(90,65,40,0.5)', lineWidth: 2, jitterAmt: 0.5,
    });

    this.textures.addCanvas('tilesheet', tilesheet);

    // Register boss canvas textures for Phaser sprites
    for (let i = 0; i < 4; i++) {
      this.textures.addCanvas(`boss${i + 1}`, getBossFrame(i));
    }

    // Transition to title screen
    this.scene.start('TitleScene');
  }
}
