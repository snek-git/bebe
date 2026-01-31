import type { RoomDef, TVDef, LootTypeDef, ToolTypeDef } from './types';

export const T = 32;
export const VIEW_W = 800;
export const VIEW_H = 576;

export const PLAYER_SPEED = 120;
export const PLAYER_RADIUS = 9;
export const BABY_RADIUS = 10;
export const VISION_RANGE = 180;
export const VISION_ANGLE = Math.PI * 0.45;
export const DETECTION_RATE = 200;
export const DETECTION_DECAY = 150;
export const LOOT_TIME = 0.8;
export const CHEESE_SPEED = 350;
export const CHEESE_STUN_TIME = 3.0;
export const CHEESE_COOLDOWN = 3.0;
export const PEEKABOO_MAX = 3.0;
export const PEEKABOO_RECHARGE = 1.2;
export const STAWLER_MAX_SPEED = 90;
export const STAWLER_FRICTION = 3.0;
export const STAWLER_PUSH_THRESHOLD = 25;
export const STAWLER_APPROACH_RANGE = 160;
export const DISTRACTION_DURATION = 5.0;
export const DISTRACTION_RANGE = 140;
export const TV_DURATION = 8.0;
export const TV_RANGE = 180;
export const PACIFIER_CALM_TIME = 8.0;
export const COLS = 50;
export const ROWS = 40;
export const TOTAL_LOOT = 7;

export const ROOM_DEFS: RoomDef[] = [
  { id: 'entrance',   name: 'ENTRANCE',    x: 21, y: 36, w: 8,  h: 3 },
  { id: 'lobby',      name: 'LOBBY',       x: 13, y: 25, w: 24, h: 9,  furn: [[5, 4, 14, 1]] },
  { id: 'teller_l',   name: 'TELLER LEFT', x: 3,  y: 26, w: 8,  h: 6,  furn: [[2, 2, 4, 1]] },
  { id: 'teller_r',   name: 'TELLER RIGHT',x: 39, y: 26, w: 8,  h: 6,  furn: [[2, 2, 4, 1]] },
  { id: 'break_room', name: 'BREAK ROOM',  x: 1,  y: 14, w: 11, h: 9,  furn: [[4, 3, 3, 2]] },
  { id: 'manager',    name: 'MANAGER',     x: 15, y: 15, w: 8,  h: 7,  furn: [[2, 3, 4, 1]] },
  { id: 'conference', name: 'CONFERENCE',  x: 26, y: 14, w: 12, h: 9,  furn: [[3, 3, 6, 3]] },
  { id: 'security',   name: 'SECURITY',    x: 41, y: 14, w: 8,  h: 9,  furn: [[2, 2, 4, 2]] },
  { id: 'copy_room',  name: 'COPY ROOM',   x: 1,  y: 4,  w: 8,  h: 8,  furn: [[2, 1, 1, 6], [5, 1, 1, 6]] },
  { id: 'vault_ante', name: 'VAULT ANTE',  x: 12, y: 3,  w: 7,  h: 7 },
  { id: 'vault',      name: 'MAIN VAULT',  x: 21, y: 1,  w: 14, h: 10, furn: [[3, 3, 2, 1], [9, 3, 2, 1], [3, 7, 2, 1], [9, 7, 2, 1]] },
  { id: 'safe_dep',   name: 'SAFE DEPOSIT',x: 38, y: 1,  w: 10, h: 9,  furn: [[2, 2, 6, 1], [2, 5, 6, 1]] },
  { id: 'janitor',    name: 'JANITOR',     x: 12, y: 0,  w: 5,  h: 2 },
];

export const CORRIDORS: number[][] = [
  [24, 34, 3, 2],
  [11, 28, 2, 2],
  [37, 28, 2, 2],
  [18, 23, 2, 2],
  [30, 23, 2, 2],
  [12, 18, 3, 2],
  [23, 18, 3, 2],
  [38, 18, 3, 2],
  [4,  12, 2, 2],
  [9,   7, 3, 2],
  [19,  6, 2, 2],
  [35,  5, 3, 2],
  [44, 10, 2, 4],
  [14,  2, 2, 1],
];

export const TV_DEFS: TVDef[] = [
  { tx: 2,  ty: 14, room: 'break_room' },
  { tx: 25, ty: 25, room: 'lobby' },
  { tx: 37, ty: 17, room: 'conference' },
  { tx: 44, ty: 14, room: 'security' },
];

export const LOOT_TYPES: Record<string, LootTypeDef> = {
  cash:    { name: 'Cash Bundle',  color: '#4ade80', glow: 'rgba(74,222,128,0.2)' },
  gold:    { name: 'Gold Bar',     color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
  diamond: { name: 'Diamond',      color: '#60a5fa', glow: 'rgba(96,165,250,0.25)' },
  key:     { name: 'Golden Key',   color: '#facc15', glow: 'rgba(250,204,21,0.2)' },
  docs:    { name: 'Secret Docs',  color: '#e5e7eb', glow: 'rgba(229,231,235,0.2)' },
  jewels:  { name: 'Jewel Box',    color: '#c084fc', glow: 'rgba(192,132,252,0.25)' },
  coin:    { name: 'Ancient Coin', color: '#fb923c', glow: 'rgba(251,146,60,0.2)' },
};

export const TOOL_TYPES: Record<string, ToolTypeDef> = {
  ipad:     { name: 'iPad',      color: '#a1a1aa', desc: 'Drop to distract babies' },
  remote:   { name: 'TV Remote', color: '#71717a', desc: 'Turn on nearest TV' },
  pacifier: { name: 'Pacifier',  color: '#f59e0b', desc: 'Throw to calm a baby' },
};
