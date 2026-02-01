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

    // Create 4-tile tilesheet (128x32): floor0, floor1, wall, furniture
    const tilesheet = document.createElement('canvas');
    tilesheet.width = T * 4;
    tilesheet.height = T;
    const tsCtx = tilesheet.getContext('2d')!;

    // Tile 0: Floor variant 0
    tsCtx.drawImage(getFloorSprite(0), 0, 0, 128, 128, 0, 0, T, T);
    // Tile 1: Floor variant 1
    tsCtx.drawImage(getFloorSprite(1), 0, 0, 128, 128, T, 0, T, T);
    // Tile 2: Wall
    tsCtx.fillStyle = '#2a3a5c';
    tsCtx.fillRect(T * 2, 0, T, T);
    // Tile 3: Furniture
    sketchyRect(tsCtx, T * 3, 0, T, T, {
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
