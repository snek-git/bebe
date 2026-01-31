const BABY_FRAMES = 4;
const babyImages: HTMLImageElement[] = [];
let loaded = 0;

for (let i = 1; i <= BABY_FRAMES; i++) {
  const img = new Image();
  img.src = `./sprites/baby${i}.png`;
  img.onload = () => { loaded++; };
  babyImages.push(img);
}

export function babySpritesReady(): boolean {
  return loaded >= BABY_FRAMES;
}

export function getBabyFrame(index: number): HTMLImageElement {
  return babyImages[index % BABY_FRAMES];
}
