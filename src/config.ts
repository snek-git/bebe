import type { RoomDef, TVDef, LootTypeDef, ToolTypeDef, DoorDef, ContainerDef } from './types';

export const T = 32;
export const VIEW_W = 800;
export const VIEW_H = 576;

export const PLAYER_SPEED = 120;
export const SPRINT_SPEED = 200;
export const PLAYER_RADIUS = 9;
export const BABY_RADIUS = 10;
export const VISION_RANGE = 180;
export const VISION_ANGLE = Math.PI * 0.45;
export const DETECTION_RATE = 200;
export const DETECTION_DECAY = 150;
export const LOOT_TIME = 0.8;
export const SEARCH_TIME = 1.0;
export const CHEESE_SPEED = 350;
export const CHEESE_STUN_TIME = 3.0;
export const CHEESE_COOLDOWN = 3.0;
export const PEEKABOO_MAX = 3.0;
export const PEEKABOO_RECHARGE = 1.2;
export const STAWLER_MAX_SPEED = 90;
export const STAWLER_FRICTION = 3.0;
export const STAWLER_PUSH_THRESHOLD = 25;
export const STAWLER_APPROACH_RANGE = 160;
export const TODDLER_SPEED = 80;
export const TODDLER_CHASE_SPEED = 115;
export const TODDLER_CHASE_RANGE = 192;
export const TODDLER_PATH_INTERVAL = 0.4;
export const TODDLER_ROAM_INTERVAL = 1.5;
export const TODDLER_ROOM_DWELL_MAX = 5.0;
export const DISTRACTION_DURATION = 5.0;
export const DISTRACTION_RANGE = 140;
export const TV_DURATION = 8.0;
export const TV_RANGE = 180;
export const PACIFIER_CALM_TIME = 8.0;
export const COLS = 50;
export const ROWS = 44;
export const TOTAL_LOOT = 1;

export const SPRINT_NOISE_RANGE = 3 * T;
export const SLAM_NOISE_RANGE = 5 * T;
export const DOOR_PUSH_TIME = 1.5;
export const DOOR_SLAM_STUN = 2.0;
export const NOISE_DURATION = 0.5;

export const SNEAKER_DETECTION_MULT = 0.6;
export const SUNGLASSES_DRAIN_MULT = 0.7;

// 9 rooms: hub + 3 wings layout
// Grid is 50 cols x 40 rows, each tile 32px
export const ROOM_DEFS: RoomDef[] = [
  // Ground floor
  { id: 'foyer',       name: 'FOYER',          x: 21, y: 40, w: 8,  h: 3 },
  { id: 'entrance',    name: 'ENTRANCE',       x: 20, y: 35, w: 10, h: 4 },
  { id: 'lobby',       name: 'LOBBY',          x: 14, y: 24, w: 22, h: 9, furn: [[9, 3, 4, 2]] },

  // Wing A (left) - Offices
  { id: 'break_room',  name: 'BREAK ROOM',     x: 2,  y: 24, w: 10, h: 9, furn: [[3, 3, 4, 2]] },
  { id: 'manager',     name: 'MANAGER',        x: 2,  y: 13, w: 10, h: 8, furn: [[3, 3, 4, 2]] },

  // Wing B (right) - Tech
  { id: 'conference',  name: 'CONFERENCE',     x: 38, y: 24, w: 10, h: 9, furn: [[2, 3, 6, 3]] },
  { id: 'security',    name: 'SECURITY',       x: 38, y: 13, w: 10, h: 8, furn: [[3, 2, 4, 2]] },

  // Restricted zone (past locked gate)
  { id: 'copy_room',   name: 'COPY ROOM',      x: 2,  y: 2,  w: 10, h: 8, furn: [[2, 1, 1, 6], [7, 1, 1, 6]] },
  { id: 'safe_dep',    name: 'SAFE DEPOSIT',   x: 38, y: 2,  w: 10, h: 8, furn: [[2, 2, 6, 1], [2, 5, 6, 1]] },

  // Vault (center top, needs all 3 keys)
  { id: 'vault',       name: 'VAULT',          x: 18, y: 2,  w: 14, h: 8, furn: [[3, 2, 2, 1], [9, 2, 2, 1], [3, 5, 2, 1], [9, 5, 2, 1]] },
];

export const CORRIDORS: number[][] = [
  // Foyer to entrance (vertical)
  [24, 39, 2, 1],
  // Entrance to lobby (vertical)
  [24, 33, 2, 2],
  // Lobby to Wing A break room (horizontal)
  [12, 27, 2, 2],
  // Lobby to Wing B conference (horizontal)
  [36, 27, 2, 2],
  // Break room up to manager (vertical, left side)
  [5, 21, 3, 3],
  // Conference up to security (vertical, right side)
  [42, 21, 3, 3],
  // Center vertical: lobby top to restricted zone (long corridor)
  [24, 10, 2, 14],
  // Manager to copy room (vertical, left side)
  [5, 10, 3, 3],
  // Security to safe deposit (vertical, right side)
  [42, 10, 3, 3],
  // Left restricted corridor (copy room to vault, horizontal)
  [12, 5, 6, 2],
  // Right restricted corridor (safe dep to vault, horizontal)
  [32, 5, 6, 2],
];

export const TV_DEFS: TVDef[] = [
  { tx: 3,  ty: 25, room: 'break_room' },
  { tx: 25, ty: 25, room: 'lobby' },
  { tx: 45, ty: 27, room: 'conference' },
  { tx: 45, ty: 14, room: 'security' },
  { tx: 24, ty: 3,  room: 'vault' },
];

export const DOOR_DEFS: DoorDef[] = [
  // Lobby to break room
  { tx: 13, ty: 28, orientation: 'v', initial: 'closed' },
  // Lobby to conference
  { tx: 36, ty: 28, orientation: 'v', initial: 'closed' },
  // Break room corridor to manager
  { tx: 6,  ty: 21, orientation: 'h', initial: 'closed' },
  // Conference corridor to security
  { tx: 43, ty: 21, orientation: 'h', initial: 'closed' },
  // Upper gate (locked, needs Key A) -- blocks center corridor
  { tx: 24, ty: 16, orientation: 'h', initial: 'locked', requiredKey: 'keyA' },
  // Vault entrance (locked, all 3 keys)
  { tx: 24, ty: 10, orientation: 'h', initial: 'locked', requiredKey: 'keyC' },
  // Internal door in left wing upper area
  { tx: 6,  ty: 11, orientation: 'h', initial: 'closed' },
];

export const CONTAINER_DEFS: ContainerDef[] = [
  // Lobby
  { tx: 18, ty: 26, room: 'lobby' },
  { tx: 20, ty: 26, room: 'lobby' },
  // Break room
  { tx: 3,  ty: 28, room: 'break_room' },
  { tx: 9,  ty: 28, room: 'break_room' },
  // Manager
  { tx: 9,  ty: 17, room: 'manager' },
  // Conference
  { tx: 40, ty: 30, room: 'conference' },
  // Security
  { tx: 44, ty: 18, room: 'security' },
  // Copy room
  { tx: 5,  ty: 4,  room: 'copy_room' },
  { tx: 8,  ty: 4,  room: 'copy_room' },
  // Safe deposit
  { tx: 43, ty: 3,  room: 'safe_dep', fixed: { type: 'cheese' } },
  { tx: 43, ty: 6,  room: 'safe_dep' },
  // Vault
  { tx: 20, ty: 4,  room: 'vault' },
  { tx: 29, ty: 4,  room: 'vault' },
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

export const LOOT_TABLE_WEIGHTS = {
  cheese: 35,
  gear: 20,
  poop: 30,
  loot: 15,
};
