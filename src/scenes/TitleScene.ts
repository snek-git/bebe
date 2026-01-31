import Phaser from 'phaser';
import { VIEW_W, VIEW_H, T } from '../config';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0e0e1a');

    // Checkerboard pattern
    const gfx = this.add.graphics();
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 25; x++) {
        if ((x + y) % 3 === 0) {
          gfx.fillStyle(0x3a3a5c, 0.3);
          gfx.fillRect(x * T, y * T, T, T);
        }
      }
    }

    // Title
    this.add.text(VIEW_W / 2, 100, 'BEBE HEIST', {
      fontFamily: 'monospace',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#fbbf24',
    }).setOrigin(0.5, 1);

    this.add.text(VIEW_W / 2, 130, "Steal the Golden Bebe. Don't get caught.", {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fb923c',
    }).setOrigin(0.5, 1);

    this.add.text(VIEW_W / 2, 190, '(o_o)', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#fb923c',
    }).setOrigin(0.5, 1);

    // Instructions
    const lines = [
      'Infiltrate the baby bank. Find 3 keycards. Reach the vault.',
      'Babies have no object permanence -- hide your face and they forget you.', '',
      'WASD - Move    SHIFT - Sprint (noisy!)    HOLD SPACE - Peekaboo',
      'CLICK - Throw cheese    E - Interact (loot/search/doors)',
      'Q - Use tool    HOLD Q - Tool wheel', '',
      'PINK stawlers charge at you while you hide. Cheese or run!',
      'RED toddler hunts you down. Only items can stop it!', '',
      'DOORS: E to open quietly. Sprint into them to SLAM (stuns nearby babies).',
      'CONTAINERS: E to search. Find cheese, gear, or... poop.',
      'KEYS: A (restricted zone) | B+C (vault). All 3 open the final door.',
    ];
    lines.forEach((l, i) => {
      this.add.text(VIEW_W / 2, 230 + i * 16, l, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e5e7eb',
      }).setOrigin(0.5, 1);
    });

    // Pulsing start prompt
    const startText = this.add.text(VIEW_W / 2, VIEW_H - 20, 'PRESS SPACE TO START', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#4ade80',
    }).setOrigin(0.5, 1);

    this.tweens.add({
      targets: startText,
      alpha: { from: 0.4, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Space key starts game
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
