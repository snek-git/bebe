let music: HTMLAudioElement | null = null;
let started = false;

function initMusic(): void {
  if (music) return;
  music = new Audio('./audio/music.m4a');
  music.loop = true;
  music.volume = 0.35;
}

export function startMusic(): void {
  if (started) return;
  initMusic();
  music!.play().then(() => { started = true; }).catch(() => {});
}

export function stopMusic(): void {
  if (!music) return;
  music.pause();
  music.currentTime = 0;
  started = false;
}

export function setMusicVolume(v: number): void {
  if (music) music.volume = Math.max(0, Math.min(1, v));
}
