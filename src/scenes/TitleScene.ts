import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config';
import { DrawObject } from '../objects/DrawObject';
import { renderTitle } from '../render/screens';
import { startMusic } from '../audio';
import { initAudio } from '../audio';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    initAudio(this);

    // Title screen rendered via DrawObject using existing renderTitle function
    const titleObj = new DrawObject(this);
    titleObj.setScrollFactor(0);
    titleObj.setDepth(0);
    titleObj.drawFn = (ctx) => {
      // Clear with background color
      ctx.fillStyle = '#0e0e1a';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      renderTitle(ctx);
    };

    // Listen for Space to start game
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        startMusic();
        this.scene.start('GameScene');
      }
    });
  }
}
