import Phaser from 'phaser';

/**
 * Custom game object that bridges Canvas2D render functions into Phaser's display list.
 * In CANVAS mode, Phaser calls renderCanvas() on each game object every frame.
 * This lets us reuse all existing Canvas2D drawing code with proper z-ordering and camera transforms.
 */
export class CanvasLayer extends Phaser.GameObjects.Extern {
  private renderFn: (ctx: CanvasRenderingContext2D) => void;

  constructor(scene: Phaser.Scene, renderFn: (ctx: CanvasRenderingContext2D) => void) {
    super(scene);
    this.renderFn = renderFn;
    scene.add.existing(this);
  }

  renderCanvas(
    renderer: Phaser.Renderer.Canvas.CanvasRenderer,
    _src: this,
    camera: Phaser.Cameras.Scene2D.Camera,
  ): void {
    const ctx = renderer.currentContext;
    ctx.save();
    if (this.scrollFactorX !== 0 || this.scrollFactorY !== 0) {
      // World-space drawing: no camera offset needed because existing render
      // functions handle camera offset internally via game.camera
    }
    this.renderFn(ctx);
    ctx.restore();
  }

  setRenderFn(fn: (ctx: CanvasRenderingContext2D) => void): this {
    this.renderFn = fn;
    return this;
  }
}
