const BABY_FRAMES = 4;
const babyImages: HTMLImageElement[] = [];
let babyLoaded = 0;

for (let i = 1; i <= BABY_FRAMES; i++) {
  const img = new Image();
  img.src = `./sprites/baby${i}.png`;
  img.onload = () => { babyLoaded++; };
  babyImages.push(img);
}

const STAWLER_FRAMES = 4;
const stawlerImages: HTMLImageElement[] = [];
let stawlerLoaded = 0;

for (let i = 1; i <= STAWLER_FRAMES; i++) {
  const img = new Image();
  img.src = `./sprites/str${i}.png`;
  img.onload = () => { stawlerLoaded++; };
  stawlerImages.push(img);
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

// ---- Tile sprites ----

const floorImages: HTMLImageElement[] = [];
let floorsLoaded = 0;
for (let i = 1; i <= 2; i++) {
  const img = new Image();
  img.src = `./sprites/tiles/floor${i}.png`;
  img.onload = () => { floorsLoaded++; };
  floorImages.push(img);
}

export function tileSpritesReady(): boolean {
  return floorsLoaded >= 2;
}

export function getFloorSprite(variant: number): HTMLImageElement {
  return floorImages[variant % 2];
}
