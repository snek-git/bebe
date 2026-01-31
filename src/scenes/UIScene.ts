import Phaser from 'phaser';
import { renderUI, renderToolWheel, renderDetectionOverlay } from '../render/ui';
import { CanvasLayer } from '../objects/CanvasLayer';
import type { Game } from '../types';

export class UIScene extends Phaser.Scene {
  private getGame!: () => Game;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { getGame: () => Game }): void {
    this.getGame = data.getGame;
  }

  create(): void {
    // UI layer renders the HUD, minimap, stamina bar, hotbar, crosshair
    const uiLayer = new CanvasLayer(this, (ctx) => {
      const game = this.getGame();
      renderUI(ctx, game);
    });
    uiLayer.setDepth(0);

    // Detection overlay (red vignette edges)
    const detLayer = new CanvasLayer(this, (ctx) => {
      const game = this.getGame();
      renderDetectionOverlay(ctx, game);
    });
    detLayer.setDepth(1);

    // Tool wheel (rendered on top of everything)
    const wheelLayer = new CanvasLayer(this, (ctx) => {
      const game = this.getGame();
      renderToolWheel(ctx, game);
    });
    wheelLayer.setDepth(2);
  }
}
