import Phaser from 'phaser';
import { loadSpritesViaPhaser, initSpritesFromPhaser, generateBossSprites, generateFloorTiles } from '../sprites';

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

    // Transition to title screen
    this.scene.start('TitleScene');
  }
}
