export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'win';
export type ToolType = 'ipad' | 'remote' | 'pacifier';
export type LootType = 'cash' | 'gold' | 'diamond' | 'key' | 'docs' | 'jewels' | 'coin';
export type KeyType = 'keyA' | 'keyB' | 'keyC';
export type GearType = 'sneakers' | 'sunglasses';
export type DoorState = 'open' | 'closed' | 'locked';

export interface Point {
  x: number;
  y: number;
}

export interface RoomDef {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  furn?: number[][];
}

export interface TVDef {
  tx: number;
  ty: number;
  room: string;
}

export interface LootTypeDef {
  name: string;
  color: string;
  glow: string;
}

export interface ToolTypeDef {
  name: string;
  color: string;
  desc: string;
}

export interface DoorDef {
  tx: number;
  ty: number;
  orientation: 'h' | 'v';
  initial: DoorState;
  requiredKey?: KeyType;
}

export interface ContainerDef {
  tx: number;
  ty: number;
  room: string;
  fixed?: { type: 'cheese' | 'throwable' | 'gear' | 'key'; item?: string };
}

export interface BabyDef {
  room: string;
  dx: number;
  dy: number;
  type: BabyType;
  speed: number;
  facing: number;
  pauseTime: number;
  waypoints: { dx: number; dy: number }[];
  roamRoom?: string;
}

export interface KeyPickupDef {
  room: string;
  dx: number;
  dy: number;
  type: KeyType;
}

export interface ToolPickupDef {
  room: string;
  dx: number;
  dy: number;
  type: ToolType;
}

export interface LootDef {
  room: string;
  dx: number;
  dy: number;
  type: LootType;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  hiding: boolean;
  looting: boolean;
  lootTimer: number;
  lootTarget: Loot | null;
  cheese: number;
  loot: number;
  radius: number;
  stamina: number;
  staminaExhausted: boolean;
  tools: ToolType[];
  keys: KeyType[];
  gear: GearType[];
  sprinting: boolean;
  searchTarget: Container | null;
  searchTimer: number;
  searching: boolean;
}

export type BabyType = 'crawler' | 'stawler' | 'boss';

export interface Baby {
  x: number;
  y: number;
  radius: number;
  speed: number;
  facing: number;
  wpIndex: number;
  pauseTimer: number;
  pauseTime: number;
  stunTimer: number;
  type: BabyType;
  vel: number;
  waypoints: Point[];
  chasing?: boolean;
  distracted?: boolean;
  path?: Point[];
  pathIndex?: number;
  pathTimer?: number;
  roamRoom?: string;
  roomDwell?: number;
  roamQueue?: string[];
  recentRooms?: string[];
  lastSeenX?: number;
  lastSeenY?: number;
  doorPushTimer?: number;
  doorPushTarget?: Door;
}

export interface Loot {
  x: number;
  y: number;
  type: LootType;
  collected: boolean;
}

export interface Cheese {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  landed: boolean;
  timer: number;
  dead: boolean;
  stuckBaby: Baby | null;
  isPacifier?: boolean;
}

export interface CheesePickup {
  x: number;
  y: number;
  collected: boolean;
}

export interface ToolPickup {
  x: number;
  y: number;
  type: ToolType;
  collected: boolean;
}

export interface Distraction {
  x: number;
  y: number;
  type: ToolType;
  timer: number;
}

export interface TV {
  x: number;
  y: number;
  room: string;
  active: boolean;
  timer: number;
}

export interface Camera {
  x: number;
  y: number;
}

export interface Door {
  x: number;
  y: number;
  tx: number;
  ty: number;
  state: DoorState;
  orientation: 'h' | 'v';
  requiredKey?: KeyType;
  slamTimer: number;
}

export interface Container {
  x: number;
  y: number;
  tx: number;
  ty: number;
  room: string;
  searched: boolean;
  contents: ContainerItem | null;
}

export interface ContainerItem {
  type: 'cheese' | 'throwable' | 'gear' | 'key' | 'poop' | 'loot' | 'tool';
  item?: string;
}

export interface KeyPickup {
  x: number;
  y: number;
  type: KeyType;
  collected: boolean;
}

export interface GearPickup {
  x: number;
  y: number;
  type: GearType;
  collected: boolean;
}

export interface NoiseEvent {
  x: number;
  y: number;
  radius: number;
  timer: number;
}

export interface MinimapCloud {
  tx: number;       // tile-space center X
  ty: number;       // tile-space center Y
  r: number;        // base radius in minimap-pixels (5-9)
  dissolve: number; // 0 = opaque, >=1 = gone
  seed: number;     // deterministic shape/color variation
}

export interface Game {
  state: GameState;
  grid: number[][];
  player: Player;
  babies: Baby[];
  loots: Loot[];
  cheeses: Cheese[];
  cheesePickups: CheesePickup[];
  toolPickups: ToolPickup[];
  distractions: Distraction[];
  tvs: TV[];
  doors: Door[];
  containers: Container[];
  keyPickups: KeyPickup[];
  gearPickups: GearPickup[];
  noiseEvents: NoiseEvent[];
  detection: number;
  cheeseCooldown: number;
  gameOverTimer: number;
  retryPressTimer: number;
  retryFadeTimer: number;
  retryPending: boolean;
  peekabooPulseTimer: number;
  minimapClouds: MinimapCloud[];
  wheelOpen: boolean;
  wheelHover: number;
  qDownTime: number;
  time: number;
  camera: Camera;
  milkFillAnim: number[];
}
