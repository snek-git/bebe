import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#0a0a14',
  parent: 'game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, GameScene, UIScene],
  fps: { target: 60, forceSetTimeOut: false },
  input: {
    keyboard: true,
    mouse: true,
  },
  audio: {
    disableWebAudio: false,
  },
};

new Phaser.Game(config);
