export type GameState = 'title' | 'playing' | 'gameover' | 'win';
export type ToolType = 'ipad' | 'remote' | 'pacifier';
export type LootType = 'cash' | 'gold' | 'diamond' | 'key' | 'docs' | 'jewels' | 'coin';

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
  peekStamina: number;
  peekExhausted: boolean;
  tools: ToolType[];
}

export type BabyType = 'crawler' | 'stawler' | 'toddler';

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
  detection: number;
  cheeseCooldown: number;
  gameOverTimer: number;
  retryPressTimer: number;
  retryFadeTimer: number;
  retryPending: boolean;
  peekabooPulseTimer: number;
  wheelOpen: boolean;
  wheelHover: number;
  qDownTime: number;
  time: number;
  camera: Camera;
}
