import type { BabyType, KeyType, ToolType, LootType, DoorState } from '../types';

export type ToolMode =
  | 'select' | 'room' | 'corridor' | 'furniture' | 'wall'
  | 'door' | 'container' | 'tv'
  | 'baby' | 'key' | 'tool_pickup' | 'loot';

export interface EditorRoom {
  id: string;
  name: string;
  x: number; y: number; w: number; h: number;
  furn: { fx: number; fy: number; fw: number; fh: number }[];
}

export interface EditorCorridor {
  x: number; y: number; w: number; h: number;
}

export interface EditorDoor {
  tx: number; ty: number;
  orientation: 'h' | 'v';
  initial: DoorState;
  requiredKey?: KeyType;
}

export interface EditorContainer {
  tx: number; ty: number;
  room: string;
  fixed?: { type: string; item?: string };
}

export interface EditorTV {
  tx: number; ty: number;
  room: string;
}

export interface EditorBaby {
  room: string;
  dx: number; dy: number;
  type: BabyType;
  speed: number;
  facing: number;
  pauseTime: number;
  waypoints: { dx: number; dy: number }[];
  roamRoom?: string;
}

export interface EditorKeyPickup {
  room: string;
  dx: number; dy: number;
  type: KeyType;
}

export interface EditorToolPickup {
  room: string;
  dx: number; dy: number;
  type: ToolType;
}

export interface EditorLoot {
  room: string;
  dx: number; dy: number;
  type: LootType;
}

export interface Selection {
  kind: string;
  index: number;
  furnIndex?: number; // for furniture within a room
}

export type DragState =
  | { type: 'pan'; startCamX: number; startCamY: number; startMouseX: number; startMouseY: number }
  | { type: 'create_rect'; startTx: number; startTy: number; currentTx: number; currentTy: number }
  | { type: 'move'; entityKind: string; index: number; offsetTx: number; offsetTy: number }
  | { type: 'resize'; entityKind: string; index: number; edge: 'n' | 's' | 'e' | 'w'; startVal: number };

export interface EditorCamera {
  x: number;
  y: number;
  zoom: number;
}

export interface EditorState {
  rooms: EditorRoom[];
  corridors: EditorCorridor[];
  doors: EditorDoor[];
  containers: EditorContainer[];
  tvs: EditorTV[];
  babies: EditorBaby[];
  keys: EditorKeyPickup[];
  tools: EditorToolPickup[];
  loots: EditorLoot[];
  walls: { tx: number; ty: number }[];  // manually placed wall tiles inside rooms

  // UI state (not serialized for undo)
  activeTool: ToolMode;
  selection: Selection | null;
  camera: EditorCamera;
  dragState: DragState | null;
  babyWaypointMode: boolean;
  cursorTx: number;
  cursorTy: number;
  hoverInfo: string;
}

export interface EditorSnapshot {
  rooms: EditorRoom[];
  corridors: EditorCorridor[];
  doors: EditorDoor[];
  containers: EditorContainer[];
  tvs: EditorTV[];
  babies: EditorBaby[];
  keys: EditorKeyPickup[];
  tools: EditorToolPickup[];
  loots: EditorLoot[];
  walls: { tx: number; ty: number }[];
}

export interface ToolHandler {
  onMouseDown(state: EditorState, tx: number, ty: number, button: number, e: MouseEvent): void;
  onMouseMove(state: EditorState, tx: number, ty: number, e: MouseEvent): void;
  onMouseUp(state: EditorState, tx: number, ty: number): void;
  onKeyDown?(state: EditorState, key: string): void;
  renderOverlay(ctx: CanvasRenderingContext2D, state: EditorState, T: number): void;
}
