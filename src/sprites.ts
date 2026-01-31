const BABY_FRAMES = 4;
const babyImages: HTMLImageElement[] = [];
let babyLoaded = 0;

const STAWLER_FRAMES = 4;
const stawlerImages: HTMLImageElement[] = [];
let stawlerLoaded = 0;

// Boss baby sprites — procedurally generated (baby in a suit)
const BOSS_FRAMES = 4;
const bossCanvases: HTMLCanvasElement[] = [];

// ---- Tile sprites ----

const floorImages: HTMLImageElement[] = [];
let floorsLoaded = 0;

export function loadSpritesViaPhaser(scene: Phaser.Scene): void {
  // Baby sprites
  for (let i = 1; i <= BABY_FRAMES; i++) {
    scene.load.image(`baby${i}`, `./sprites/baby${i}.png`);
  }
  // Stawler sprites
  for (let i = 1; i <= STAWLER_FRAMES; i++) {
    scene.load.image(`str${i}`, `./sprites/str${i}.png`);
  }
}

export function initSpritesFromPhaser(scene: Phaser.Scene): void {
  // Extract HTMLImageElement from Phaser's texture manager for use with ctx.drawImage
  for (let i = 1; i <= BABY_FRAMES; i++) {
    const tex = scene.textures.get(`baby${i}`);
    const source = tex.getSourceImage() as HTMLImageElement;
    babyImages.push(source);
    babyLoaded++;
  }
  for (let i = 1; i <= STAWLER_FRAMES; i++) {
    const tex = scene.textures.get(`str${i}`);
    const source = tex.getSourceImage() as HTMLImageElement;
    stawlerImages.push(source);
    stawlerLoaded++;
  }
}

/** Generate procedural floor tile canvases and register them as ready. */
export function generateFloorTiles(): void {
  if (floorsLoaded >= 2) return;
  const S = 128;
  for (let v = 0; v < 2; v++) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d')!;

    // Base floor color — two subtly different dark tones for checkerboard
    const base = v === 0 ? '#1e1e2e' : '#1c1c2a';
    g.fillStyle = base;
    g.fillRect(0, 0, S, S);

    // Subtle grain texture for hand-drawn feel
    g.globalAlpha = 0.04;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1;
    const step = 6;
    for (let d = -S; d < S; d += step) {
      const jx = () => (Math.sin(d * 73.1 + v * 137) * 43758.5453 % 1 - 0.5) * 1.5;
      g.beginPath();
      g.moveTo(d + jx(), jx());
      g.lineTo(d + S + jx(), S + jx());
      g.stroke();
    }
    g.globalAlpha = 1;

    // Convert canvas to an img element for drawImage compatibility
    const img = new Image();
    img.src = c.toDataURL();
    floorImages.push(img);
    floorsLoaded++;
  }
}

export function babySpritesReady(): boolean {
  return babyLoaded >= BABY_FRAMES;
}

export function getBabyFrame(index: number): HTMLImageElement {
  return babyImages[index % BABY_FRAMES];
}

export function stawlerSpritesReady(): boolean {
  return stawlerLoaded >= STAWLER_FRAMES;
}

export function getStawlerFrame(index: number): HTMLImageElement {
  return stawlerImages[index % STAWLER_FRAMES];
}

export function tileSpritesReady(): boolean {
  return floorsLoaded >= 2;
}

export function getFloorSprite(variant: number): HTMLImageElement {
  return floorImages[variant % 2];
}

export function generateBossSprites(): void {
  if (bossCanvases.length > 0) return; // Already generated

  const S = 128;
  const cx = S / 2, cy = S / 2 + 4;

  const frames = [
    { la: -0.3, ra: 0.3, ll: -0.15, rl: 0.15 },
    { la: -0.5, ra: 0.1, ll: 0.2, rl: -0.25 },
    { la: -0.1, ra: 0.5, ll: -0.25, rl: 0.2 },
    { la: -0.4, ra: 0.4, ll: 0.0, rl: 0.0 },
  ];

  const SKIN = '#e8c4a0';
  const SUIT = '#1e293b';
  const SUIT_LIGHT = '#334155';
  const OUTLINE = '#0f172a';

  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d')!;
    const lm = frames[f];

    // Legs (suit pants)
    for (const [ox, angle] of [[-13, lm.ll], [13, lm.rl]] as [number, number][]) {
      const lx = cx + ox + Math.sin(angle) * 5;
      const ly = cy + 26;
      g.fillStyle = SUIT;
      g.beginPath(); g.ellipse(lx, ly, 9, 15, angle, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1a1a1a';
      g.beginPath(); g.ellipse(lx + Math.sin(angle) * 4, ly + 13, 10, 5, angle * 0.4, 0, Math.PI * 2); g.fill();
      g.strokeStyle = OUTLINE; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(lx, ly, 9, 15, angle, 0, Math.PI * 2); g.stroke();
    }

    // Arms (suit sleeves + skin hands)
    for (const [ox, angle, side] of [[-27, lm.la, -1], [27, lm.ra, 1]] as [number, number, number][]) {
      const ax = cx + ox + Math.sin(angle) * 7;
      const ay = cy + Math.cos(angle) * 3;
      g.fillStyle = SUIT;
      g.beginPath(); g.ellipse(ax, ay, 9, 13, angle + side * 0.3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = OUTLINE; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(ax, ay, 9, 13, angle + side * 0.3, 0, Math.PI * 2); g.stroke();
      g.fillStyle = SKIN;
      g.beginPath(); g.arc(ax + Math.sin(angle + side * 0.3) * 10, ay + Math.cos(angle + side * 0.3) * 10, 5.5, 0, Math.PI * 2); g.fill();
    }

    // Body (suit jacket)
    g.fillStyle = SUIT;
    g.beginPath(); g.ellipse(cx, cy + 6, 25, 27, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = SUIT_LIGHT;
    g.beginPath(); g.ellipse(cx, cy + 6, 14, 22, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e2e8f0';
    g.beginPath(); g.ellipse(cx, cy + 8, 8, 18, 0, 0, Math.PI * 2); g.fill();

    // Tie
    g.fillStyle = '#dc2626';
    g.beginPath(); g.arc(cx, cy - 8, 3, 0, Math.PI * 2); g.fill();
    g.beginPath();
    g.moveTo(cx - 5, cy - 6); g.lineTo(cx + 5, cy - 6);
    g.lineTo(cx + 3, cy + 14); g.lineTo(cx, cy + 18); g.lineTo(cx - 3, cy + 14);
    g.closePath(); g.fill();
    g.strokeStyle = '#991b1b'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx - 2, cy + 2); g.lineTo(cx + 2, cy + 2); g.stroke();
    g.beginPath(); g.moveTo(cx - 2, cy + 7); g.lineTo(cx + 2, cy + 7); g.stroke();

    // Body outline
    g.strokeStyle = OUTLINE; g.lineWidth = 2;
    g.beginPath(); g.ellipse(cx, cy + 6, 25, 27, 0, 0, Math.PI * 2); g.stroke();

    // Head
    g.fillStyle = SKIN;
    g.beginPath(); g.arc(cx, cy - 22, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f0b0a0';
    g.beginPath(); g.arc(cx - 13, cy - 17, 5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 13, cy - 17, 5, 0, Math.PI * 2); g.fill();

    // Eyes
    g.fillStyle = '#1a1a2e';
    g.beginPath(); g.arc(cx - 7, cy - 24, 2.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 7, cy - 24, 2.5, 0, Math.PI * 2); g.fill();
    // Brows
    g.strokeStyle = '#8B7355'; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - 12, cy - 30); g.lineTo(cx - 4, cy - 29); g.stroke();
    g.beginPath(); g.moveTo(cx + 12, cy - 30); g.lineTo(cx + 4, cy - 29); g.stroke();
    // Mouth
    g.strokeStyle = '#8B6B50'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(cx - 4, cy - 15); g.lineTo(cx + 4, cy - 15); g.stroke();
    // Hair curl
    g.strokeStyle = '#8B7355'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy - 43); g.quadraticCurveTo(cx + 6, cy - 50, cx + 2, cy - 46); g.stroke();

    // Head outline
    g.strokeStyle = OUTLINE; g.lineWidth = 2; g.globalAlpha = 0.3;
    g.beginPath(); g.arc(cx, cy - 22, 22, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1;

    bossCanvases.push(c);
  }
}

export function bossSpritesReady(): boolean {
  return bossCanvases.length >= BOSS_FRAMES;
}

export function getBossFrame(index: number): HTMLCanvasElement {
  return bossCanvases[index % BOSS_FRAMES];
}
