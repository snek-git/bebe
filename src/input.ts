import { VIEW_W, VIEW_H } from './config';
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

let _scene: Phaser.Scene | null = null;
let _canvas: HTMLCanvasElement | null = null;

export function initInput(scene: Phaser.Scene): void {
  _scene = scene;

  // Get the canvas element from Phaser's game
  _canvas = scene.game.canvas;

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

export function addClickHandler(canvas: HTMLCanvasElement, handler: (worldX: number, worldY: number) => void, camera: Camera): void {
  // Not used in Phaser migration - click handling done via scene.input.on('pointerdown')
}

export function addScreenClickHandler(canvas: HTMLCanvasElement, handler: (screenX: number, screenY: number) => void): void {
  // Not used in Phaser migration - click handling done via scene.input.on('pointerdown')
}
