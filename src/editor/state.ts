import type { EditorState, EditorSnapshot } from './types';

export function createEditorState(): EditorState {
  return {
    rooms: [],
    corridors: [],
    doors: [],
    containers: [],
    tvs: [],
    babies: [],
    keys: [],
    tools: [],
    loots: [],
    walls: [],
    activeTool: 'select',
    selection: null,
    camera: { x: 0, y: 0, zoom: 1 },
    dragState: null,
    babyWaypointMode: false,
    cursorTx: 0,
    cursorTy: 0,
    hoverInfo: '',
  };
}

function snapshot(state: EditorState): EditorSnapshot {
  return structuredClone({
    rooms: state.rooms,
    corridors: state.corridors,
    doors: state.doors,
    containers: state.containers,
    tvs: state.tvs,
    babies: state.babies,
    keys: state.keys,
    tools: state.tools,
    loots: state.loots,
    walls: state.walls,
  });
}

function applySnapshot(state: EditorState, snap: EditorSnapshot): void {
  state.rooms = snap.rooms;
  state.corridors = snap.corridors;
  state.doors = snap.doors;
  state.containers = snap.containers;
  state.tvs = snap.tvs;
  state.babies = snap.babies;
  state.keys = snap.keys;
  state.tools = snap.tools;
  state.loots = snap.loots;
  state.walls = snap.walls;
}

const MAX_UNDO = 50;
const past: EditorSnapshot[] = [];
const future: EditorSnapshot[] = [];

export function pushUndo(state: EditorState): void {
  past.push(snapshot(state));
  if (past.length > MAX_UNDO) past.shift();
  future.length = 0;
}

export function undo(state: EditorState): void {
  if (past.length === 0) return;
  future.push(snapshot(state));
  applySnapshot(state, past.pop()!);
  state.selection = null;
}

export function redo(state: EditorState): void {
  if (future.length === 0) return;
  past.push(snapshot(state));
  applySnapshot(state, future.pop()!);
  state.selection = null;
}

export function canUndo(): boolean { return past.length > 0; }
export function canRedo(): boolean { return future.length > 0; }
