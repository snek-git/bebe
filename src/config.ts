import type { LootTypeDef, ToolTypeDef } from './types';

// Re-export spatial definitions from level-data
export {
  ROOM_DEFS, CORRIDORS, TV_DEFS, DOOR_DEFS, CONTAINER_DEFS,
  BABY_DEFS, KEY_PICKUP_DEFS, TOOL_PICKUP_DEFS, LOOT_DEFS,
} from './level-data';

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
export const TODDLER_ROOM_DWELL_MAX = 4.0;
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
  cheese: 25,
  tool: 25,
  gear: 15,
  poop: 25,
  loot: 10,
};
