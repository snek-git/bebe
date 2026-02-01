import Phaser from 'phaser';
import { loadSpritesViaPhaser, initSpritesFromPhaser } from '../sprites';
import { T, TILESHEET_COLS } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load sprite images via Phaser's loader
    loadSpritesViaPhaser(this);

    // Load audio
    this.load.audio('music', './audio/music.m4a');
    this.load.audio('cheese_throw', './audio/cheese.wav');
    this.load.audio('cheese_hit', './audio/cheese2.wav');
    this.load.audio('click1', './audio/click.wav');
    this.load.audio('click2', './audio/click2.wav');
    this.load.audio('click3', './audio/click3.wav');
    this.load.audio('babycry1', './audio/babycry.wav');
    this.load.audio('babycry2', './audio/babycry2.wav');
    this.load.audio('babycry3', './audio/babycry3.wav');
  }

  create(): void {
    // Extract loaded images into sprite module for ctx.drawImage usage
    initSpritesFromPhaser(this);

    // Create tilesheet in a grid layout: floor0, floor1, 256 wall variants, furniture
    // 8-bit mask: bits 0-3 = cardinal edges, bits 4-7 = inner corners
    const WALL_VARIANTS = 256;
    const TOTAL_TILES = 2 + WALL_VARIANTS + 1; // 259
    const cols = TILESHEET_COLS;
    const rows = Math.ceil(TOTAL_TILES / cols);
    const tilesheet = document.createElement('canvas');
    tilesheet.width = T * cols;
    tilesheet.height = T * rows;
    const tsCtx = tilesheet.getContext('2d')!;

    // Helper: get pixel position for tile index in grid layout
    const tileX = (i: number) => (i % cols) * T;
    const tileY = (i: number) => Math.floor(i / cols) * T;

    // Load floor, wall, and furniture textures from PNGs
    const floor0 = this.textures.get('tile_floor0').getSourceImage() as CanvasImageSource;
    const floor1 = this.textures.get('tile_floor1').getSourceImage() as CanvasImageSource;
    const wallPng = this.textures.get('tile_wall').getSourceImage() as CanvasImageSource;
    const furn = this.textures.get('tile_furn').getSourceImage() as CanvasImageSource;

    // Tile 0-1: Floor variants
    tsCtx.drawImage(floor0, 0, 0, 128, 128, tileX(0), tileY(0), T, T);
    tsCtx.drawImage(floor1, 0, 0, 128, 128, tileX(1), tileY(1), T, T);

    // Tiles 2-257: Wall variants (256 edge+corner combinations)
    const DARK_OVERLAY = 'rgba(0,0,0,0.35)';
    const HALF = T / 2;

    for (let mask = 0; mask < WALL_VARIANTS; mask++) {
      const idx = 2 + mask;
      const x = tileX(idx);
      const y = tileY(idx);
      // Draw wall PNG as base texture (scaled from 128 to T)
      tsCtx.drawImage(wallPng, 0, 0, 128, 128, x, y, T, T);
      // Semi-transparent dark overlay on exposed cardinal edges
      tsCtx.fillStyle = DARK_OVERLAY;
      if (mask & 1) tsCtx.fillRect(x, y, T, HALF);              // top
      if (mask & 2) tsCtx.fillRect(x + HALF, y, HALF, T);       // right
      if (mask & 4) tsCtx.fillRect(x, y + HALF, T, HALF);       // bottom
      if (mask & 8) tsCtx.fillRect(x, y, HALF, T);              // left
      // Dark overlay on inner corners
      if (mask & 16)  tsCtx.fillRect(x + HALF, y, HALF, HALF);
      if (mask & 32)  tsCtx.fillRect(x + HALF, y + HALF, HALF, HALF);
      if (mask & 64)  tsCtx.fillRect(x, y + HALF, HALF, HALF);
      if (mask & 128) tsCtx.fillRect(x, y, HALF, HALF);
    }

    // Tile 258: Furniture (from loaded PNG)
    const furnIdx = 2 + WALL_VARIANTS;
    tsCtx.drawImage(furn, 0, 0, 128, 128, tileX(furnIdx), tileY(furnIdx), T, T);

    // Convert canvas to static image for faster per-frame tile blitting.
    // addCanvas creates a CanvasTexture that Phaser may refresh each frame;
    // a static image avoids that overhead entirely.
    const img = new Image();
    img.src = tilesheet.toDataURL();
    img.onload = () => {
      this.textures.addImage('tilesheet', img);
      this.scene.start('TitleScene');
    };
  }
}
