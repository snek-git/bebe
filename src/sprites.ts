const BABY_FRAMES = 4;
const babyImages: HTMLImageElement[] = [];
let babyLoaded = 0;

const STAWLER_FRAMES = 4;
const stawlerImages: HTMLImageElement[] = [];
let stawlerLoaded = 0;

const PLAYER_WALK_FRAMES = 4;
const playerWalkImages: HTMLImageElement[] = [];
let playerIdleImage: HTMLImageElement | null = null;
let playerHideImage: HTMLImageElement | null = null;
let babyStunnedImage: HTMLImageElement | null = null;

export function loadSpritesViaPhaser(scene: Phaser.Scene): void {
  // Baby sprites
  for (let i = 1; i <= BABY_FRAMES; i++) {
    scene.load.image(`baby${i}`, `./sprites/baby${i}.png`);
  }
  // Stawler sprites
  for (let i = 1; i <= STAWLER_FRAMES; i++) {
    scene.load.image(`str${i}`, `./sprites/str${i}.png`);
  }
  // Player sprites
  for (let i = 1; i <= PLAYER_WALK_FRAMES; i++) {
    scene.load.image(`walk${i}`, `./sprites/w${i}.png`);
  }
  scene.load.image('idle', './sprites/idle.png');
  scene.load.image('faceclosed', './sprites/faceclosed.png');
  // Stunned baby
  scene.load.image('bebestunned', './sprites/bebestunned.png');
  // Tile textures
  scene.load.image('tile_floor0', './sprites/tiles/floor0.png');
  scene.load.image('tile_floor1', './sprites/tiles/floor1.png');
  scene.load.image('tile_wall', './sprites/tiles/wall.png');
  scene.load.image('tile_furn', './sprites/tiles/furniture.png');
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
  for (let i = 1; i <= PLAYER_WALK_FRAMES; i++) {
    playerWalkImages.push(scene.textures.get(`walk${i}`).getSourceImage() as HTMLImageElement);
  }
  playerIdleImage = scene.textures.get('idle').getSourceImage() as HTMLImageElement;
  playerHideImage = scene.textures.get('faceclosed').getSourceImage() as HTMLImageElement;
  babyStunnedImage = scene.textures.get('bebestunned').getSourceImage() as HTMLImageElement;
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

export function getPlayerWalkFrame(index: number): HTMLImageElement {
  return playerWalkImages[index % PLAYER_WALK_FRAMES];
}

export function getPlayerIdle(): HTMLImageElement | null {
  return playerIdleImage;
}

export function getPlayerHide(): HTMLImageElement | null {
  return playerHideImage;
}

export function getBabyStunned(): HTMLImageElement | null {
  return babyStunnedImage;
}
