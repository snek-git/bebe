import type {
  RoomDef, TVDef, DoorDef, ContainerDef,
  BabyDef, KeyPickupDef, ToolPickupDef, LootDef,
} from './types';

export const ROOM_DEFS: RoomDef[] = [
  { id: 'foyer', name: 'FOYER', x: 21, y: 40, w: 8, h: 3 },
  { id: 'entrance', name: 'ENTRANCE', x: 20, y: 35, w: 10, h: 4 },
  { id: 'lobby', name: 'LOBBY', x: 14, y: 24, w: 22, h: 9, furn: [[9, 3, 4, 2]] },
  { id: 'break_room', name: 'BREAK ROOM', x: 2, y: 24, w: 10, h: 9, furn: [[3, 3, 4, 2]] },
  { id: 'manager', name: 'MANAGER', x: 2, y: 13, w: 10, h: 8, furn: [[3, 3, 4, 2]] },
  { id: 'conference', name: 'CONFERENCE', x: 38, y: 24, w: 10, h: 9, furn: [[2, 3, 6, 3]] },
  { id: 'security', name: 'SECURITY', x: 38, y: 13, w: 10, h: 8, furn: [[1, 1, 4, 2]] },
  { id: 'copy_room', name: 'COPY ROOM', x: 2, y: 2, w: 10, h: 8, furn: [[2, 1, 1, 6], [7, 1, 1, 6]] },
  { id: 'safe_dep', name: 'SAFE DEPOSIT', x: 38, y: 2, w: 10, h: 8, furn: [[2, 5, 6, 1]] },
  { id: 'vault', name: 'VAULT', x: 18, y: 2, w: 14, h: 8, furn: [[3, 2, 2, 1], [9, 2, 2, 1], [3, 5, 2, 1], [9, 5, 2, 1]] },
];

export const CORRIDORS: number[][] = [
  [24, 39, 2, 1],
  [24, 33, 2, 2],
  [12, 27, 2, 2],
  [36, 27, 2, 2],
  [5, 21, 3, 3],
  [42, 21, 3, 3],
  [24, 10, 1, 14],
  [5, 10, 3, 3],
  [42, 10, 3, 3],
  [32, 5, 6, 2],
];

export const TV_DEFS: TVDef[] = [
  { tx: 3, ty: 25, room: 'break_room' },
  { tx: 25, ty: 25, room: 'lobby' },
  { tx: 45, ty: 27, room: 'conference' },
  { tx: 45, ty: 14, room: 'security' },
  { tx: 24, ty: 3, room: 'vault' },
];

export const DOOR_DEFS: DoorDef[] = [
  { tx: 13, ty: 28, orientation: 'v', initial: 'closed' },
  { tx: 36, ty: 28, orientation: 'v', initial: 'closed' },
  { tx: 6, ty: 21, orientation: 'h', initial: 'closed' },
  { tx: 43, ty: 21, orientation: 'h', initial: 'closed' },
  { tx: 24, ty: 16, orientation: 'h', initial: 'locked', requiredKey: 'keyA' },
  { tx: 24, ty: 10, orientation: 'h', initial: 'locked', requiredKey: 'keyC' },
  { tx: 6, ty: 11, orientation: 'h', initial: 'closed' },
];

export const CONTAINER_DEFS: ContainerDef[] = [
  { tx: 18, ty: 26, room: 'lobby' },
  { tx: 20, ty: 26, room: 'lobby' },
  { tx: 3, ty: 28, room: 'break_room' },
  { tx: 9, ty: 28, room: 'break_room' },
  { tx: 9, ty: 17, room: 'manager' },
  { tx: 40, ty: 30, room: 'conference' },
  { tx: 44, ty: 18, room: 'security' },
  { tx: 5, ty: 4, room: 'copy_room' },
  { tx: 8, ty: 4, room: 'copy_room' },
  { tx: 43, ty: 3, room: 'safe_dep', fixed: { type: 'cheese' } },
  { tx: 43, ty: 6, room: 'safe_dep' },
  { tx: 20, ty: 4, room: 'vault' },
  { tx: 29, ty: 4, room: 'vault' },
];

export const BABY_DEFS: BabyDef[] = [
  { room: 'entrance', dx: -3, dy: -1, type: 'crawler', speed: 35, facing: 0, pauseTime: 2,
    waypoints: [{ dx: -3, dy: -1 }, { dx: 3, dy: -1 }] },
  { room: 'lobby', dx: -4, dy: 0, type: 'crawler', speed: 45, facing: 0, pauseTime: 1.8,
    waypoints: [{ dx: -4, dy: -2 }, { dx: 4, dy: -2 }, { dx: 4, dy: 2 }, { dx: -4, dy: 2 }] },
  { room: 'break_room', dx: -4, dy: -2, type: 'crawler', speed: 48, facing: 0, pauseTime: 1.5,
    waypoints: [{ dx: -4, dy: -2 }, { dx: 3, dy: -2 }, { dx: 3, dy: 2 }, { dx: -4, dy: 2 }] },
  { room: 'manager', dx: -3, dy: -2, type: 'crawler', speed: 46, facing: 0, pauseTime: 1.5,
    waypoints: [{ dx: -3, dy: -2 }, { dx: 3, dy: -2 }, { dx: 3, dy: 2 }, { dx: -3, dy: 2 }] },
  { room: 'conference', dx: -4, dy: -2, type: 'crawler', speed: 50, facing: 0, pauseTime: 1.2,
    waypoints: [{ dx: -4, dy: -2 }, { dx: 3, dy: -2 }] },
  { room: 'conference', dx: 3, dy: 2, type: 'crawler', speed: 48, facing: Math.PI, pauseTime: 1.4,
    waypoints: [{ dx: 3, dy: 2 }, { dx: -4, dy: 2 }] },
  { room: 'security', dx: 0, dy: 1, type: 'crawler', speed: 42, facing: -Math.PI / 2, pauseTime: 2.5,
    waypoints: [{ dx: 0, dy: 2 }, { dx: 0, dy: 0 }] },
  { room: 'copy_room', dx: -2, dy: -1, type: 'crawler', speed: 48, facing: 0, pauseTime: 1.8,
    waypoints: [{ dx: -2, dy: -1 }, { dx: 1, dy: 1 }] },
  { room: 'copy_room', dx: 1, dy: -1, type: 'stawler', speed: 90, facing: Math.PI, pauseTime: 2,
    waypoints: [{ dx: 1, dy: -1 }, { dx: -2, dy: 1 }] },
  { room: 'safe_dep', dx: 0, dy: -1, type: 'stawler', speed: 90, facing: 0, pauseTime: 2,
    waypoints: [{ dx: -2, dy: -1 }, { dx: 2, dy: -1 }] },
  { room: 'vault', dx: -3, dy: 0, type: 'crawler', speed: 46, facing: 0, pauseTime: 2,
    waypoints: [{ dx: -5, dy: -1 }, { dx: 5, dy: -1 }, { dx: 5, dy: 2 }, { dx: -5, dy: 2 }] },
  { room: 'vault', dx: 3, dy: 0, type: 'stawler', speed: 90, facing: Math.PI, pauseTime: 2.2,
    waypoints: [{ dx: -3, dy: 0 }, { dx: 3, dy: 0 }] },
  { room: 'vault', dx: 0, dy: 0, type: 'boss', speed: 80, facing: 0, pauseTime: 0,
    waypoints: [], roamRoom: 'vault' },
  { room: 'lobby', dx: 7, dy: 2.5, type: 'stawler', speed: 45, facing: 0, pauseTime: 2,
    waypoints: [{ dx: 5, dy: -1.5 }, { dx: 9, dy: -1.5 }, { dx: 9, dy: 3.5 }, { dx: 3, dy: 2.5 }] },
];

export const KEY_PICKUP_DEFS: KeyPickupDef[] = [
  { room: 'manager', dx: 0, dy: 1, type: 'keyA' },
  { room: 'security', dx: 0, dy: 0, type: 'keyB' },
  { room: 'copy_room', dx: 0, dy: 0, type: 'keyC' },
];

export const TOOL_PICKUP_DEFS: ToolPickupDef[] = [
  { room: 'conference', dx: -1, dy: -3, type: 'ipad' },
  { room: 'security', dx: -2, dy: 1, type: 'remote' },
  { room: 'copy_room', dx: 0, dy: -1, type: 'pacifier' },
  { room: 'entrance', dx: 3, dy: 0, type: 'remote' },
];

export const LOOT_DEFS: LootDef[] = [
  { room: 'vault', dx: 0, dy: 0, type: 'diamond' },
];

export const WALL_OVERRIDES: { tx: number; ty: number }[] = [
  { tx: 7, ty: 21 },
  { tx: 5, ty: 21 },
  { tx: 3, ty: 24 },
  { tx: 2, ty: 24 },
  { tx: 10, ty: 24 },
  { tx: 11, ty: 24 },
  { tx: 15, ty: 32 },
  { tx: 14, ty: 32 },
  { tx: 14, ty: 31 },
  { tx: 15, ty: 31 },
  { tx: 39, ty: 32 },
  { tx: 38, ty: 32 },
  { tx: 38, ty: 24 },
  { tx: 39, ty: 24 },
  { tx: 46, ty: 32 },
  { tx: 47, ty: 32 },
  { tx: 47, ty: 31 },
  { tx: 47, ty: 25 },
  { tx: 47, ty: 24 },
  { tx: 46, ty: 24 },
  { tx: 7, ty: 11 },
  { tx: 5, ty: 11 },
  { tx: 42, ty: 21 },
  { tx: 44, ty: 21 },
  { tx: 44, ty: 22 },
  { tx: 42, ty: 22 },
  { tx: 36, ty: 27 },
  { tx: 37, ty: 27 },
  { tx: 13, ty: 27 },
  { tx: 12, ty: 27 },
];
