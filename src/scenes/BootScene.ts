import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Baby spritesheets - 4 individual frames loaded as separate images
    this.load.image('baby1', './sprites/baby1.png');
    this.load.image('baby2', './sprites/baby2.png');
    this.load.image('baby3', './sprites/baby3.png');
    this.load.image('baby4', './sprites/baby4.png');

    // Audio
    this.load.audio('music', './audio/music.m4a');

    // Tileset - generated at runtime in create()
  }

  create(): void {
    // Generate a 3-tile tileset texture: floor (0), wall (1), furniture (2)
    // Each tile 32x32, strip is 96x32
    const T = 32;
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.setVisible(false);

    // Tile 0: floor
    gfx.fillStyle(0x1e1e2e, 1);
    gfx.fillRect(0, 0, T, T);
    gfx.lineStyle(0.5, 0x262640, 1);
    gfx.strokeRect(0, 0, T, T);

    // Tile 1: wall
    gfx.fillStyle(0x3a3a5c, 1);
    gfx.fillRect(T, 0, T, T);
    gfx.fillStyle(0x4e4e70, 1);
    gfx.fillRect(T, 0, T, 2);
    gfx.fillRect(T, 0, 2, T);
    gfx.fillStyle(0x28283e, 1);
    gfx.fillRect(T, T - 2, T, 2);
    gfx.fillRect(T + T - 2, 0, 2, T);

    // Tile 2: furniture
    gfx.fillStyle(0x2a1f14, 1);
    gfx.fillRect(T * 2, 0, T, T);
    gfx.fillStyle(0x3d2e1c, 1);
    gfx.fillRect(T * 2 + 1, 1, T - 2, T - 2);
    gfx.fillStyle(0x4a3828, 1);
    gfx.fillRect(T * 2 + 3, 3, T - 6, T - 6);

    gfx.generateTexture('tileset', T * 3, T);
    gfx.destroy();

    this.scene.start('TitleScene');
  }
}
