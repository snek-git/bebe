import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config';
import { CanvasLayer } from '../objects/CanvasLayer';
import { renderTitle } from '../render/screens';
import { startMusic } from '../audio';
import { initAudio } from '../audio';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    initAudio(this);

    // Title screen rendered via CanvasLayer using existing renderTitle function
    new CanvasLayer(this, (ctx) => {
      // Clear with background color
      ctx.fillStyle = '#0e0e1a';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      renderTitle(ctx);
    });

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
