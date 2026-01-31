import Phaser from 'phaser';
import { VIEW_W, VIEW_H, T } from '../config';

// Seeded floating doodle data
const _tdS = (n: number): number => { const v = Math.sin(n) * 43758.5453; return v - Math.floor(v); };
const _titleDoodles = Array.from({ length: 16 }, (_, i) => ({
  x0: _tdS(i * 127.1 + 3.7) * VIEW_W,
  y0: _tdS(i * 269.5 + 18.3) * VIEW_H,
  sp: 10 + _tdS(i * 53.3 + 7.1) * 20,
  dx: (_tdS(i * 31.7 + 91.2) - 0.5) * 30,
  sz: 6 + _tdS(i * 97.3 + 41.7) * 12,
  kind: i % 5,
  r0: _tdS(i * 173.9 + 61.3) * Math.PI * 2,
  rs: (_tdS(i * 211.3 + 33.7) - 0.5) * 1.5,
}));

export class TitleScene extends Phaser.Scene {
  gfx!: Phaser.GameObjects.Graphics;
  titleTexts: Phaser.GameObjects.Text[] = [];
  startText!: Phaser.GameObjects.Text;
  subtitleText!: Phaser.GameObjects.Text;
  mottoText!: Phaser.GameObjects.Text;
  restartText!: Phaser.GameObjects.Text;
  ctrlTexts: Phaser.GameObjects.Text[] = [];
  intelTexts: Phaser.GameObjects.Text[] = [];
  ctrlHeader!: Phaser.GameObjects.Text;
  intelHeader!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0e0e1a');

    this.gfx = this.add.graphics();

    const mono = { fontFamily: 'monospace' };
    const cx = VIEW_W / 2;

    // Title letters (individual for wave animation)
    const title = 'BEBE HEIST';
    this.titleTexts = [];
    for (let i = 0; i < title.length; i++) {
      if (title[i] === ' ') {
        this.titleTexts.push(null as any);
        continue;
      }
      const txt = this.add.text(0, 0, title[i], {
        ...mono, fontSize: '54px', fontStyle: 'bold', color: '#f0ea9e',
      }).setOrigin(0.5, 1).setDepth(10);
      this.titleTexts.push(txt);
    }

    // Subtitle
    this.subtitleText = this.add.text(cx, 133, "Steal the Golden Bebe. Don't get caught.", {
      ...mono, fontSize: '16px', color: '#fb923c',
    }).setOrigin(0.5, 1).setDepth(10);

    // Two-column instruction card — rendered as graphics + text
    const cardW = 680, cardH = 200;
    const cardX = cx - cardW / 2;
    const cardY = 215;

    // Controls header
    this.ctrlHeader = this.add.text((cardX + cx) / 2, cardY + 24, 'CONTROLS', {
      ...mono, fontSize: '12px', fontStyle: 'bold', color: '#f0ea9e',
    }).setOrigin(0.5, 0.5).setDepth(10);

    const lcx = cardX + 25;
    const ctrlLines = [
      'WASD          Move',
      'SHIFT         Sprint (noisy!)',
      'HOLD SPACE    Peekaboo (hide face)',
      'CLICK         Throw cheese',
      'E             Interact / Search / Doors',
      'Q / HOLD Q    Use tool / Tool wheel',
    ];
    this.ctrlTexts = ctrlLines.map((l, i) =>
      this.add.text(lcx, cardY + 46 + i * 17, l, {
        ...mono, fontSize: '11px', color: '#e5e7eb',
      }).setOrigin(0, 0.5).setDepth(10)
    );

    // Intel header
    this.intelHeader = this.add.text((cx + cardX + cardW) / 2, cardY + 24, 'INTEL', {
      ...mono, fontSize: '12px', fontStyle: 'bold', color: '#f0ea9e',
    }).setOrigin(0.5, 0.5).setDepth(10);

    const rcx = cx + 20;
    const intelLines: { text: string; color: string }[] = [
      { text: 'ORANGE crawlers patrol set paths', color: '#fb923c' },
      { text: 'PINK stawlers charge while you hide', color: '#ec4899' },
      { text: 'RED toddler hunts you down', color: '#dc2626' },
      { text: '', color: '' },
      { text: 'Find 3 keycards to open the vault', color: '#e5e7eb' },
      { text: 'Sprint into doors to SLAM (stun!)', color: '#e5e7eb' },
      { text: 'Search containers for gear & items', color: '#e5e7eb' },
    ];
    this.intelTexts = intelLines.map((l, i) =>
      l.text
        ? this.add.text(rcx, cardY + 46 + i * 17, l.text, {
            ...mono, fontSize: '11px', color: l.color,
          }).setOrigin(0, 0.5).setDepth(10)
        : null as any
    );

    // Motto
    this.mottoText = this.add.text(cx, cardY + cardH - 14,
      'Babies have no object permanence \u2014 hide your face and they forget you.', {
      ...mono, fontSize: '10px', color: '#6b7280',
    }).setOrigin(0.5, 0.5).setDepth(10).setAlpha(0.6);

    // Restart hint
    this.restartText = this.add.text(cx, VIEW_H - 8, 'R: Restart at any time', {
      ...mono, fontSize: '10px', color: '#6b7280',
    }).setOrigin(0.5, 1).setDepth(10);

    // Start prompt
    this.startText = this.add.text(cx, VIEW_H - 42, 'PRESS SPACE TO START', {
      ...mono, fontSize: '20px', fontStyle: 'bold', color: '#f0ea9e',
    }).setOrigin(0.5, 0.5).setDepth(10);

    // Space key starts game
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }

  update(): void {
    const t = this.time.now / 1000;
    const cx = VIEW_W / 2;
    const g = this.gfx;
    g.clear();

    // Breathing tile background
    for (let ty = 0; ty < 18; ty++) {
      for (let tx = 0; tx < 25; tx++) {
        if ((tx + ty) % 3 === 0) {
          const wave = Math.sin(t * 0.8 + tx * 0.3 + ty * 0.4) * 0.1;
          g.fillStyle(0x14395e, 0.18 + wave);
          g.fillRect(tx * T, ty * T, T, T);
        }
      }
    }

    // Floating doodles
    for (const d of _titleDoodles) {
      const y = ((d.y0 - t * d.sp) % (VIEW_H + 40) + VIEW_H + 40) % (VIEW_H + 40) - 20;
      const x = d.x0 + Math.sin(t * 0.5 + d.r0) * d.dx;
      g.setAlpha(0.1);
      switch (d.kind) {
        case 0: // Baby face
          g.fillStyle(0xfb923c, 1);
          g.fillCircle(x, y, d.sz * 0.5);
          g.fillStyle(0x333333, 1);
          g.fillCircle(x - d.sz * 0.15, y - d.sz * 0.1, 1.2);
          g.fillCircle(x + d.sz * 0.15, y - d.sz * 0.1, 1.2);
          break;
        case 1: // Cheese
          g.fillStyle(0xfbbf24, 1);
          g.fillRect(x - d.sz * 0.3, y - d.sz * 0.3, d.sz * 0.6, d.sz * 0.6);
          break;
        case 2: // Star
          g.fillStyle(0xf0ea9e, 1);
          g.fillCircle(x, y, d.sz * 0.2);
          g.fillRect(x - d.sz * 0.05, y - d.sz * 0.4, d.sz * 0.1, d.sz * 0.8);
          g.fillRect(x - d.sz * 0.4, y - d.sz * 0.05, d.sz * 0.8, d.sz * 0.1);
          break;
        case 3: // Heart
          g.fillStyle(0xec4899, 1);
          g.fillCircle(x - d.sz * 0.12, y - d.sz * 0.1, d.sz * 0.18);
          g.fillCircle(x + d.sz * 0.12, y - d.sz * 0.1, d.sz * 0.18);
          g.fillTriangle(x - d.sz * 0.28, y - d.sz * 0.05, x + d.sz * 0.28, y - d.sz * 0.05, x, y + d.sz * 0.25);
          break;
        case 4: // Key
          g.fillStyle(0xfacc15, 1);
          g.fillCircle(x - d.sz * 0.15, y, d.sz * 0.2);
          g.fillRect(x, y - d.sz * 0.08, d.sz * 0.4, d.sz * 0.16);
          break;
      }
    }
    g.setAlpha(1);

    // Vignette (dark edges)
    g.fillStyle(0x000000, 0.35);
    g.fillRect(0, 0, VIEW_W, 30);
    g.fillRect(0, VIEW_H - 30, VIEW_W, 30);
    g.fillRect(0, 0, 30, VIEW_H);
    g.fillRect(VIEW_W - 30, 0, 30, VIEW_H);

    // Wave title letters
    const title = 'BEBE HEIST';
    const titleY = 90;
    const charW = 33;
    const startX = cx - (title.length * charW) / 2 + charW / 2;

    for (let i = 0; i < title.length; i++) {
      const txt = this.titleTexts[i];
      if (!txt) continue;
      const lx = startX + i * charW;
      const wave = Math.sin(t * 3 + i * 0.6) * 8;
      txt.setPosition(lx, titleY + wave);
    }

    // Subtitle pulse
    this.subtitleText.setAlpha(Math.sin(t * 1.5) * 0.12 + 0.88);

    // Animated mascot (peekaboo loop)
    const mascotY = 178;
    const bob = Math.sin(t * 2) * 2;
    const peekWave = Math.sin(t * 1.5);
    const isHiding = peekWave < -0.2;
    const mr = 16;
    const my = mascotY + bob;

    g.setDepth(10);
    if (isHiding) {
      // Hiding: translucent green body
      g.fillStyle(0x22c55e, 0.5);
      g.fillCircle(cx, my, mr);
      // Peekaboo eyes (yellow arcs)
      g.lineStyle(3, 0xfcd34d, 0.5);
      g.beginPath();
      g.arc(cx, my, mr * 0.5, -0.6, 0.6);
      g.strokePath();
      g.beginPath();
      g.arc(cx, my, mr * 0.5, Math.PI - 0.6, Math.PI + 0.6);
      g.strokePath();
      // Hiding ring
      const ringR = mr + 5 + Math.sin(t * 5) * 3;
      g.lineStyle(1.5, 0x4ade80, 0.35);
      g.strokeCircle(cx, my, ringR);
      // Circling babies with ?
      for (let i = 0; i < 3; i++) {
        const ba = t * 2 + i * (Math.PI * 2 / 3);
        const bx = cx + Math.cos(ba) * 32;
        const by = my + Math.sin(ba) * 14;
        g.fillStyle(0xfb923c, 0.65);
        g.fillCircle(bx, by, 5);
        g.fillStyle(0x333333, 0.65);
        g.fillCircle(bx - 1.5, by - 1, 0.8);
        g.fillCircle(bx + 1.5, by - 1, 0.8);
      }
    } else {
      // Visible: bright green body with eyes
      g.fillStyle(0x4ade80, 1);
      g.fillCircle(cx, my, mr);
      g.lineStyle(2, 0x22c55e, 1);
      g.strokeCircle(cx, my, mr);
      const facing = Math.sin(t * 0.7) * 0.4;
      const eo = 5;
      const e1x = cx + Math.cos(facing - 0.4) * eo;
      const e1y = my + Math.sin(facing - 0.4) * eo;
      const e2x = cx + Math.cos(facing + 0.4) * eo;
      const e2y = my + Math.sin(facing + 0.4) * eo;
      g.fillStyle(0xffffff, 1);
      g.fillCircle(e1x, e1y, 2.5);
      g.fillCircle(e2x, e2y, 2.5);
      g.fillStyle(0x1e1e2e, 1);
      g.fillCircle(e1x + Math.cos(facing) * 0.8, e1y + Math.sin(facing) * 0.8, 1.2);
      g.fillCircle(e2x + Math.cos(facing) * 0.8, e2y + Math.sin(facing) * 0.8, 1.2);
    }

    // Instruction card background
    const cardW = 680, cardH = 200;
    const cardX = cx - cardW / 2;
    const cardY = 215;
    g.fillStyle(0x0e0e1a, 0.75);
    g.fillRoundedRect(cardX, cardY, cardW, cardH, 8);
    g.lineStyle(1.5, 0x374151, 0.6);
    g.strokeRoundedRect(cardX, cardY, cardW, cardH, 8);

    // Divider line
    g.lineStyle(2, 0x374151, 0.5);
    g.beginPath();
    g.moveTo(cx, cardY + 14);
    g.lineTo(cx, cardY + cardH - 14);
    g.strokePath();

    // Start prompt bounce + glow
    const promptY = VIEW_H - 42;
    const bounce = Math.sin(t * 4) * 4;
    this.startText.setPosition(cx, promptY + bounce);
    this.startText.setAlpha(0.7 + Math.sin(t * 3) * 0.3);

    // Orbiting sparkles around prompt
    for (let i = 0; i < 6; i++) {
      const sa = t * 2 + i * (Math.PI * 2 / 6);
      const sr = 130 + Math.sin(t * 3 + i * 1.5) * 15;
      const spx = cx + Math.cos(sa) * sr;
      const spy = promptY + bounce + Math.sin(sa) * 10;
      const sparkAlpha = (Math.sin(t * 5 + i * 2.1) + 1) / 2 * 0.35;
      g.fillStyle(0xf0ea9e, sparkAlpha);
      g.fillCircle(spx, spy, 2);
    }
  }
}
