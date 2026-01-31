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

export function initInput(canvas: HTMLCanvasElement): void {
  document.addEventListener('keydown', (e) => {
    state.keys[e.key.toLowerCase()] = true;
    state.keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    keyDownHandler?.(e);
  });

  document.addEventListener('keyup', (e) => {
    state.keys[e.key.toLowerCase()] = false;
    state.keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    state.mouse.x = (e.clientX - r.left) * (VIEW_W / r.width);
    state.mouse.y = (e.clientY - r.top) * (VIEW_H / r.height);
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

export function addClickHandler(canvas: HTMLCanvasElement, handler: (worldX: number, worldY: number) => void, camera: Camera): void {
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const wx = (e.clientX - r.left) * (VIEW_W / r.width) + camera.x;
    const wy = (e.clientY - r.top) * (VIEW_H / r.height) + camera.y;
    handler(wx, wy);
  });
}

export function addScreenClickHandler(canvas: HTMLCanvasElement, handler: (screenX: number, screenY: number) => void): void {
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const sx = (e.clientX - r.left) * (VIEW_W / r.width);
    const sy = (e.clientY - r.top) * (VIEW_H / r.height);
    handler(sx, sy);
  });
}
