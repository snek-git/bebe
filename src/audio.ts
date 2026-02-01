let _scene: Phaser.Scene | null = null;
let music: Phaser.Sound.BaseSound | null = null;
let started = false;

export function initAudio(scene: Phaser.Scene): void {
  _scene = scene;
}

export function startMusic(): void {
  if (!_scene || started) return;
  try {
    if (music) {
      music.stop();
      music.destroy();
    }
    music = _scene.sound.add('music', { loop: true, volume: 0.4 });
    music.play();
    started = true;
  } catch {
    // Silently ignore playback errors (same as original)
  }
}

export function stopMusic(): void {
  if (!music) return;
  music.stop();
  started = false;
}

export function setMusicVolume(v: number): void {
  if (music && 'setVolume' in music) {
    (music as Phaser.Sound.WebAudioSound).setVolume(Math.max(0, Math.min(1, v)));
  }
}

export function playSfx(key: string, volume = 0.5): void {
  if (!_scene) return;
  try {
    _scene.sound.play(key, { volume });
  } catch {
    // ignore playback errors
  }
}

export function playCheeseThrow(): void {
  const keys = ['cheese_throw', 'cheese_hit'];
  playSfx(keys[Math.floor(Math.random() * keys.length)], 1.0);
}

export function playCheeseHit(): void {
  const keys = ['cheese_throw', 'cheese_hit'];
  playSfx(keys[Math.floor(Math.random() * keys.length)], 1.0);
}

export function playClick(): void {
  const keys = ['click1', 'click2', 'click3'];
  playSfx(keys[Math.floor(Math.random() * keys.length)], 0.35);
}

export function playBabyCry(): void {
  const keys = ['babycry1', 'babycry2', 'babycry3'];
  playSfx(keys[Math.floor(Math.random() * keys.length)], 0.7);
}
