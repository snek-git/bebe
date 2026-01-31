import type {
  RoomDef, TVDef, DoorDef, ContainerDef,
  BabyDef, KeyPickupDef, ToolPickupDef, LootDef,
} from './types';

// 9 rooms: hub + 3 wings layout
// Grid is 50 cols x 44 rows, each tile 32px
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
  [24, 39, 2, 1],   // Foyer to entrance
  [24, 33, 2, 2],   // Entrance to lobby
  [12, 27, 2, 2],   // Lobby to Wing A break room
  [36, 27, 2, 2],   // Lobby to Wing B conference
  [5, 21, 3, 3],    // Break room up to manager
  [42, 21, 3, 3],   // Conference up to security
  [24, 10, 2, 14],  // Center vertical: lobby top to restricted zone
  [5, 10, 3, 3],    // Manager to copy room
  [42, 10, 3, 3],   // Security to safe deposit
  [12, 5, 6, 2],    // Left restricted corridor (copy room to vault)
  [32, 5, 6, 2],    // Right restricted corridor (safe dep to vault)
];

export const TV_DEFS: TVDef[] = [
  { tx: 3,  ty: 25, room: 'break_room' },
  { tx: 25, ty: 25, room: 'lobby' },
  { tx: 45, ty: 27, room: 'conference' },
  { tx: 45, ty: 14, room: 'security' },
  { tx: 24, ty: 3,  room: 'vault' },
];

export const DOOR_DEFS: DoorDef[] = [
  { tx: 13, ty: 28, orientation: 'v', initial: 'closed' },
  { tx: 36, ty: 28, orientation: 'v', initial: 'closed' },
  { tx: 6,  ty: 21, orientation: 'h', initial: 'closed' },
  { tx: 43, ty: 21, orientation: 'h', initial: 'closed' },
  { tx: 24, ty: 16, orientation: 'h', initial: 'locked', requiredKey: 'keyA' },
  { tx: 24, ty: 10, orientation: 'h', initial: 'locked', requiredKey: 'keyC' },
  { tx: 6,  ty: 11, orientation: 'h', initial: 'closed' },
];

export const CONTAINER_DEFS: ContainerDef[] = [
  { tx: 18, ty: 26, room: 'lobby' },
  { tx: 20, ty: 26, room: 'lobby' },
  { tx: 3,  ty: 28, room: 'break_room' },
  { tx: 9,  ty: 28, room: 'break_room' },
  { tx: 9,  ty: 17, room: 'manager' },
  { tx: 40, ty: 30, room: 'conference' },
  { tx: 44, ty: 18, room: 'security' },
  { tx: 5,  ty: 4,  room: 'copy_room' },
  { tx: 8,  ty: 4,  room: 'copy_room' },
  { tx: 43, ty: 3,  room: 'safe_dep', fixed: { type: 'cheese' } },
  { tx: 43, ty: 6,  room: 'safe_dep' },
  { tx: 20, ty: 4,  room: 'vault' },
  { tx: 29, ty: 4,  room: 'vault' },
];

// Baby definitions -- positions are room-relative offsets from room center (in tiles)
export const BABY_DEFS: BabyDef[] = [
  // Entrance: 1 slow crawler patrolling left-right
  { room: 'entrance', dx: -3, dy: -1, type: 'crawler', speed: 35, facing: 0, pauseTime: 2.0,
    waypoints: [{ dx: -3, dy: -1 }, { dx: 3, dy: -1 }] },
  // Lobby: 1 crawler lazy loop
  { room: 'lobby', dx: -4, dy: 0, type: 'crawler', speed: 45, facing: 0, pauseTime: 1.8,
    waypoints: [{ dx: -4, dy: -2 }, { dx: 4, dy: -2 }, { dx: 4, dy: 2 }, { dx: -4, dy: 2 }] },
  // A1 Break Room: 1 crawler patrolling around table
  { room: 'break_room', dx: -4, dy: -2, type: 'crawler', speed: 48, facing: 0, pauseTime: 1.5,
    waypoints: [{ dx: -4, dy: -2 }, { dx: 3, dy: -2 }, { dx: 3, dy: 2 }, { dx: -4, dy: 2 }] },
  // A2 Manager: 1 crawler circular patrol around desk
  { room: 'manager', dx: -3, dy: -2, type: 'crawler', speed: 46, facing: 0, pauseTime: 1.5,
    waypoints: [{ dx: -3, dy: -2 }, { dx: 3, dy: -2 }, { dx: 3, dy: 2 }, { dx: -3, dy: 2 }] },
  // B1 Conference: 2 crawlers patrolling above/below table
  { room: 'conference', dx: -4, dy: -2, type: 'crawler', speed: 50, facing: 0, pauseTime: 1.2,
    waypoints: [{ dx: -4, dy: -2 }, { dx: 3, dy: -2 }] },
  { room: 'conference', dx: 3, dy: 2, type: 'crawler', speed: 48, facing: Math.PI, pauseTime: 1.4,
    waypoints: [{ dx: 3, dy: 2 }, { dx: -4, dy: 2 }] },
  // B2 Security: 1 crawler guarding below desk
  { room: 'security', dx: 0, dy: 1, type: 'crawler', speed: 42, facing: -Math.PI / 2, pauseTime: 2.5,
    waypoints: [{ dx: 0, dy: 2 }, { dx: 0, dy: 0 }] },
  // C1 Copy Room: 1 crawler + 1 stawler
  { room: 'copy_room', dx: -2, dy: -1, type: 'crawler', speed: 48, facing: 0, pauseTime: 1.8,
    waypoints: [{ dx: -2, dy: -1 }, { dx: 1, dy: 1 }] },
  { room: 'copy_room', dx: 1, dy: -1, type: 'stawler', speed: 90, facing: Math.PI, pauseTime: 2.0,
    waypoints: [{ dx: 1, dy: -1 }, { dx: -2, dy: 1 }] },
  // C2 Safe Deposit: 1 stawler patrolling between shelf rows
  { room: 'safe_dep', dx: 0, dy: -1, type: 'stawler', speed: 90, facing: 0, pauseTime: 2.0,
    waypoints: [{ dx: -2, dy: -1 }, { dx: 2, dy: -1 }] },
  // Vault: 1 crawler + 1 stawler + 1 toddler
  { room: 'vault', dx: -3, dy: 0, type: 'crawler', speed: 46, facing: 0, pauseTime: 2.0,
    waypoints: [{ dx: -5, dy: -1 }, { dx: 5, dy: -1 }, { dx: 5, dy: 2 }, { dx: -5, dy: 2 }] },
  { room: 'vault', dx: 3, dy: 0, type: 'stawler', speed: 90, facing: Math.PI, pauseTime: 2.2,
    waypoints: [{ dx: -3, dy: 0 }, { dx: 3, dy: 0 }] },
  { room: 'vault', dx: 0, dy: 0, type: 'toddler', speed: 80, facing: 0, pauseTime: 0,
    waypoints: [], roamRoom: 'vault' },
];

// Key pickups -- room-relative offsets
export const KEY_PICKUP_DEFS: KeyPickupDef[] = [
  { room: 'manager',   dx: 0, dy: 1,  type: 'keyA' },
  { room: 'security',  dx: 0, dy: 0,  type: 'keyB' },
  { room: 'copy_room', dx: 0, dy: 0,  type: 'keyC' },
];

// Tool pickups -- room-relative offsets
export const TOOL_PICKUP_DEFS: ToolPickupDef[] = [
  { room: 'conference', dx: -1, dy: -3, type: 'ipad' },
  { room: 'security',   dx: -2, dy: 1,  type: 'remote' },
  { room: 'copy_room',  dx: 0,  dy: -1, type: 'pacifier' },
];

// Loot placements -- room-relative offsets
export const LOOT_DEFS: LootDef[] = [
  { room: 'vault', dx: 0, dy: 0, type: 'diamond' },
];
