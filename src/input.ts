import type { Camera } from './types';

export interface InputState {
  keys: Record<string, boolean>;
  mouse: { x: number; y: number };
}

const state: InputState = {
  keys: {},
  mouse: { x: 0, y: 0 },
};

type KeyHandler = (e: KeyboardEvent) => void;
let keyDownHandler: KeyHandler | null = null;
let keyUpHandler: KeyHandler | null = null;

export function initInput(scene: Phaser.Scene): void {
  // Keyboard input via Phaser - listen for native events to maintain compatibility
  scene.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
    state.keys[event.key.toLowerCase()] = true;
    state.keys[event.code] = true;
    if (event.code === 'Space') event.preventDefault();
    keyDownHandler?.(event);
  });

  scene.input.keyboard!.on('keyup', (event: KeyboardEvent) => {
    state.keys[event.key.toLowerCase()] = false;
    state.keys[event.code] = false;
    keyUpHandler?.(event);
  });

  // Mouse tracking via Phaser's pointer
  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    // pointer.x/y are already in game coordinate space (Phaser handles scaling)
    state.mouse.x = pointer.x;
    state.mouse.y = pointer.y;
  });
}

export function isDown(key: string): boolean {
  return !!state.keys[key];
}

export function mouseWorld(camera: Camera): { x: number; y: number } {
  return {
    x: state.mouse.x + camera.x,
    y: state.mouse.y + camera.y,
  };
}

export function mouseScreen(): { x: number; y: number } {
  return { x: state.mouse.x, y: state.mouse.y };
}

export function onKeyDown(handler: KeyHandler): void {
  keyDownHandler = handler;
}

export function onKeyUp(handler: KeyHandler): void {
  keyUpHandler = handler;
}
