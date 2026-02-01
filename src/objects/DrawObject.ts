import Phaser from 'phaser';

/**
 * Per-entity Canvas2D game object that participates in Phaser's display list.
 * Replaces monolithic CanvasLayer with one DrawObject per entity/entity-group.
 *
 * In CANVAS mode Phaser calls renderCanvas() each frame. DrawObject applies
 * its position, scrollFactor, and alpha, then delegates to drawFn for raw
 * Canvas2D drawing at local (0,0) coordinates.
 */
export class DrawObject extends Phaser.GameObjects.Extern {
  drawFn: ((ctx: CanvasRenderingContext2D) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
  }

  renderCanvas(
    renderer: Phaser.Renderer.Canvas.CanvasRenderer,
    _src: this,
    camera: Phaser.Cameras.Scene2D.Camera,
  ): void {
    if (!this.drawFn || !this.visible) return;

    const ctx = renderer.currentContext;
    ctx.save();
    // Reset transform — Phaser's camera matrix is already on the context,
    // but our drawFn handles camera offset via game.camera / scrollFactor.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = this.alpha;

    // Apply camera scroll scaled by scrollFactor, then object position
    const sx = this.scrollFactorX;
    const sy = this.scrollFactorY;
    ctx.translate(
      this.x - camera.scrollX * sx,
      this.y - camera.scrollY * sy,
    );

    this.drawFn(ctx);
    ctx.restore();
  }
}
