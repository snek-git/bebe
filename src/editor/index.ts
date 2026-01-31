import { T, COLS, ROWS } from '../config';
import { createEditorState } from './state';
import { undo, redo } from './state';
import { importLevelData } from './import';
import { exportLevelData } from './export';
import { renderEditor, renderCursorHighlight, renderDragPreview } from './render';
import { getToolHandler } from './tools';
import { buildToolbar, updateToolbarActive, getToolFromKey } from './toolbar';
import { updatePanel } from './panel';

const state = createEditorState();

// Import current level data on load
importLevelData(state);

// Canvas setup
const canvasWrap = document.getElementById('canvas-wrap')!;
const canvas = document.getElementById('editor-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resizeCanvas(): void {
  const rect = canvasWrap.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Fit grid in viewport
const cw = canvasWrap.getBoundingClientRect();
const fitZoom = Math.min(cw.width / (COLS * T), cw.height / (ROWS * T)) * 0.95;
state.camera.zoom = fitZoom;
state.camera.x = (COLS * T - cw.width / fitZoom) / 2;
state.camera.y = (ROWS * T - cw.height / fitZoom) / 2;

// Toolbar
const toolbarEl = document.getElementById('toolbar')!;
const propsContent = document.getElementById('props-content')!;

function refreshUI(): void {
  updateToolbarActive(toolbarEl, state);
  updatePanel(propsContent, state);
  updateStatus();
}

buildToolbar(toolbarEl, state, refreshUI);

// Status bar
const statusPos = document.getElementById('status-pos')!;
const statusZoom = document.getElementById('status-zoom')!;
const statusTool = document.getElementById('status-tool')!;

function updateStatus(): void {
  statusPos.textContent = `${state.cursorTx}, ${state.cursorTy}`;
  statusZoom.textContent = `${Math.round(state.camera.zoom * 100)}%`;
  statusTool.textContent = state.activeTool;
}

// Edge cursor detection for resize feedback
function getEdgeCursor(state: ReturnType<typeof createEditorState>, tx: number, ty: number): string {
  if (state.activeTool !== 'select' || !state.selection) return 'default';
  const { kind, index } = state.selection;

  let rx = 0, ry = 0, rw = 0, rh = 0;
  if (kind === 'room' && state.rooms[index]) {
    const r = state.rooms[index];
    rx = r.x; ry = r.y; rw = r.w; rh = r.h;
  } else if (kind === 'corridor' && state.corridors[index]) {
    const c = state.corridors[index];
    rx = c.x; ry = c.y; rw = c.w; rh = c.h;
  } else return 'default';

  // Check if cursor is on an edge of the selected rect
  const inX = tx >= rx && tx < rx + rw;
  const inY = ty >= ry && ty < ry + rh;
  if (!inX && !inY) return 'default';

  const onN = ty === ry && inX;
  const onS = ty === ry + rh - 1 && inX;
  const onW = tx === rx && inY;
  const onE = tx === rx + rw - 1 && inY;

  if (onN && !onE && !onW) return 'ns-resize';
  if (onS && !onE && !onW) return 'ns-resize';
  if (onW) return 'ew-resize';
  if (onE) return 'ew-resize';

  return 'default';
}

// Mouse -> tile coordinate conversion
function screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
  const rect = canvas.getBoundingClientRect();
  const px = (sx - rect.left) / state.camera.zoom + state.camera.x;
  const py = (sy - rect.top) / state.camera.zoom + state.camera.y;
  return { wx: px, wy: py };
}

function screenToTile(sx: number, sy: number): { tx: number; ty: number } {
  const { wx, wy } = screenToWorld(sx, sy);
  return {
    tx: Math.floor(wx / T),
    ty: Math.floor(wy / T),
  };
}

// Track last selection for panel refresh
let lastSelKey = '';

function selKey(): string {
  if (!state.selection) return '';
  return `${state.selection.kind}:${state.selection.index}:${state.selection.furnIndex ?? ''}`;
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();

  // Middle click or ctrl+left for pan
  if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
    state.dragState = {
      type: 'pan',
      startCamX: state.camera.x,
      startCamY: state.camera.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    };
    return;
  }

  const { tx, ty } = screenToTile(e.clientX, e.clientY);
  const tool = getToolHandler(state);
  tool.onMouseDown(state, tx, ty, e.button, e);
  refreshUI();
});

canvas.addEventListener('mousemove', (e) => {
  const { tx, ty } = screenToTile(e.clientX, e.clientY);
  state.cursorTx = tx;
  state.cursorTy = ty;

  if (state.dragState?.type === 'pan') {
    const d = state.dragState;
    state.camera.x = d.startCamX - (e.clientX - d.startMouseX) / state.camera.zoom;
    state.camera.y = d.startCamY - (e.clientY - d.startMouseY) / state.camera.zoom;
    canvas.style.cursor = 'grabbing';
    return;
  }

  // Cursor feedback for resize edges on selected rooms/corridors
  canvas.style.cursor = getEdgeCursor(state, tx, ty);

  const tool = getToolHandler(state);
  tool.onMouseMove(state, tx, ty, e);
  updateStatus();
});

canvas.addEventListener('mouseup', (e) => {
  if (state.dragState?.type === 'pan') {
    state.dragState = null;
    return;
  }

  const { tx, ty } = screenToTile(e.clientX, e.clientY);
  const tool = getToolHandler(state);
  tool.onMouseUp(state, tx, ty);
  state.dragState = null;
  refreshUI();
});

// Zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { wx, wy } = screenToWorld(e.clientX, e.clientY);
  const factor = e.deltaY < 0 ? 1.15 : 0.87;
  const newZoom = Math.max(0.15, Math.min(6, state.camera.zoom * factor));
  // Zoom toward cursor
  state.camera.x = wx - (wx - state.camera.x) * (state.camera.zoom / newZoom);
  state.camera.y = wy - (wy - state.camera.y) * (state.camera.zoom / newZoom);
  state.camera.zoom = newZoom;
  updateStatus();
}, { passive: false });

// Keyboard
window.addEventListener('keydown', (e) => {
  // Don't capture when typing in inputs
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;

  // Undo/redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(state); else undo(state);
    refreshUI();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    redo(state);
    refreshUI();
    return;
  }

  // Tool shortcuts
  const toolMode = getToolFromKey(e.key);
  if (toolMode) {
    state.activeTool = toolMode;
    state.babyWaypointMode = false;
    refreshUI();
    return;
  }

  // Forward to tool handler
  const tool = getToolHandler(state);
  if (tool.onKeyDown) {
    tool.onKeyDown(state, e.key);
    refreshUI();
  }
});

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Header buttons
document.getElementById('btn-import')!.addEventListener('click', () => {
  importLevelData(state);
  state.selection = null;
  refreshUI();
});

document.getElementById('btn-export')!.addEventListener('click', () => {
  const text = exportLevelData(state);
  const textarea = document.getElementById('export-textarea') as HTMLTextAreaElement;
  textarea.value = text;
  document.getElementById('export-modal')!.classList.add('visible');
});

document.getElementById('btn-copy')!.addEventListener('click', () => {
  const textarea = document.getElementById('export-textarea') as HTMLTextAreaElement;
  navigator.clipboard.writeText(textarea.value);
});

document.getElementById('btn-close-export')!.addEventListener('click', () => {
  document.getElementById('export-modal')!.classList.remove('visible');
});

document.getElementById('btn-undo')!.addEventListener('click', () => { undo(state); refreshUI(); });
document.getElementById('btn-redo')!.addEventListener('click', () => { redo(state); refreshUI(); });

// Render loop
function frame(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderEditor(ctx, state);
  renderCursorHighlight(ctx, state);
  renderDragPreview(ctx, state);

  // Active tool overlay (resize handles, waypoint preview, etc.)
  const activeTool = getToolHandler(state);
  ctx.save();
  ctx.setTransform(state.camera.zoom, 0, 0, state.camera.zoom, -state.camera.x * state.camera.zoom, -state.camera.y * state.camera.zoom);
  activeTool.renderOverlay(ctx, state, T);
  ctx.restore();

  // Refresh panel when selection changes
  const sk = selKey();
  if (sk !== lastSelKey) {
    lastSelKey = sk;
    updatePanel(propsContent, state);
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
