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

    // Stawler sprites
    this.load.image('str1', './sprites/str1.png');
    this.load.image('str2', './sprites/str2.png');
    this.load.image('str3', './sprites/str3.png');
    this.load.image('str4', './sprites/str4.png');

    // Audio
    this.load.audio('music', './audio/music.m4a');
    this.load.audio('cheese1', './audio/Cheese.ogg');
    this.load.audio('cheese2', './audio/Cheese2.ogg');
    this.load.audio('click1', './audio/Click.ogg');
    this.load.audio('click2', './audio/Click2.ogg');
    this.load.audio('click3', './audio/Click3.ogg');

    // Floor tile sprites
    this.load.image('floor1', './sprites/tiles/floor1.png');
    this.load.image('floor2', './sprites/tiles/floor2.png');

    // Tileset - generated at runtime in create()
  }

  create(): void {
    // Generate a 4-tile tileset texture: floor1 (0), wall (1), furniture (2), floor2 (3)
    // Each tile 32x32, strip is 128x32
    const T = 32;

    // Create a canvas to composite loaded images + generated tiles
    const canvas = document.createElement('canvas');
    canvas.width = T * 4;
    canvas.height = T;
    const ctx = canvas.getContext('2d')!;

    // Tile 0: floor1 (from loaded sprite)
    const floor1Tex = this.textures.get('floor1').getSourceImage() as HTMLImageElement;
    ctx.drawImage(floor1Tex, 0, 0, T, T);

    // Tile 1: wall (generated)
    ctx.fillStyle = '#3a3a5c';
    ctx.fillRect(T, 0, T, T);
    ctx.fillStyle = '#4e4e70';
    ctx.fillRect(T, 0, T, 2);
    ctx.fillRect(T, 0, 2, T);
    ctx.fillStyle = '#28283e';
    ctx.fillRect(T, T - 2, T, 2);
    ctx.fillRect(T + T - 2, 0, 2, T);

    // Tile 2: furniture (generated)
    ctx.fillStyle = '#2a1f14';
    ctx.fillRect(T * 2, 0, T, T);
    ctx.fillStyle = '#3d2e1c';
    ctx.fillRect(T * 2 + 1, 1, T - 2, T - 2);
    ctx.fillStyle = '#4a3828';
    ctx.fillRect(T * 2 + 3, 3, T - 6, T - 6);

    // Tile 3: floor2 (from loaded sprite)
    const floor2Tex = this.textures.get('floor2').getSourceImage() as HTMLImageElement;
    ctx.drawImage(floor2Tex, T * 3, 0, T, T);

    // Add the canvas as a texture
    this.textures.addCanvas('tileset', canvas);

    this.scene.start('TitleScene');
  }
}
