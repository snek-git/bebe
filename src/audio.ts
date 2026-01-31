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
    music = _scene.sound.add('music', { loop: true, volume: 0.35 });
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
