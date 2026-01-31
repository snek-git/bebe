import {
  BABY_RADIUS, STAMINA_MAX, PLAYER_RADIUS, T, VIEW_H, VIEW_W,
  LOOT_TABLE_WEIGHTS, COLS, ROWS,
} from './config';
import {
  TV_DEFS, DOOR_DEFS, CONTAINER_DEFS,
  BABY_DEFS, KEY_PICKUP_DEFS, TOOL_PICKUP_DEFS, LOOT_DEFS,
} from './level-data';
import { createGrid, roomCenter, roomPos } from './map';
import type {
  Game, Baby, Loot, CheesePickup, ToolPickup, TV, Door,
  Container, ContainerItem, KeyPickup, GearPickup, GearType, ToolType,
  MinimapCloud,
} from './types';

function rollLootTable(): ContainerItem | null {
  const total = Object.values(LOOT_TABLE_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of Object.entries(LOOT_TABLE_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      if (type === 'cheese') return { type: 'cheese' };
      if (type === 'tool') {
        const tools: ToolType[] = ['ipad', 'remote', 'pacifier'];
        return { type: 'tool', item: tools[Math.floor(Math.random() * tools.length)] };
      }
      if (type === 'gear') {
        const g: GearType[] = ['sneakers', 'sunglasses'];
        return { type: 'gear', item: g[Math.floor(Math.random() * g.length)] };
      }
      if (type === 'poop') return { type: 'poop' };
      if (type === 'loot') return { type: 'loot' };
      return null;
    }
  }
  return null;
}

function generateClouds(): MinimapCloud[] {
  const clouds: MinimapCloud[] = [];
  const spacing = 2.8;
  for (let gy = -1; gy < ROWS + 1; gy += spacing) {
    for (let gx = -1; gx < COLS + 1; gx += spacing) {
      const tx = gx + (Math.random() - 0.5) * 1.6; // ±0.8 tile jitter
      const ty = gy + (Math.random() - 0.5) * 1.6;
      clouds.push({
        tx,
        ty,
        r: 8 + Math.random() * 5, // 8–13 minimap-px
        dissolve: 0,
        seed: Math.floor(Math.random() * 10000),
      });
    }
  }
  return clouds;
}

export function initGame(): Game {
  const grid = createGrid();
  const start = roomCenter('foyer');

  const player = {
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2,
    hiding: false,
    looting: false,
    lootTimer: 0,
    lootTarget: null as Loot | null,
    cheese: 2,
    loot: 0,
    radius: PLAYER_RADIUS,
    stamina: STAMINA_MAX,
    staminaExhausted: false,
    tools: [] as any[],
    keys: [] as any[],
    gear: [] as any[],
    sprinting: false,
    searchTarget: null as Container | null,
    searchTimer: 0,
    searching: false,
  };

  const loots: Loot[] = LOOT_DEFS.map(ld => ({
    ...roomPos(ld.room, ld.dx, ld.dy),
    type: ld.type,
    collected: false,
  }));

  const cheesePickups: CheesePickup[] = [];

  const toolPickups: ToolPickup[] = TOOL_PICKUP_DEFS.map(td => ({
    ...roomPos(td.room, td.dx, td.dy),
    type: td.type,
    collected: false,
  }));

  const tvs: TV[] = TV_DEFS.map(td => ({
    x: (td.tx + 0.5) * T,
    y: (td.ty + 0.5) * T,
    room: td.room,
    active: false,
    timer: 0,
  }));

  const doors: Door[] = DOOR_DEFS.map(dd => ({
    x: (dd.tx + 0.5) * T,
    y: (dd.ty + 0.5) * T,
    tx: dd.tx,
    ty: dd.ty,
    state: dd.initial,
    orientation: dd.orientation,
    requiredKey: dd.requiredKey,
    slamTimer: 0,
  }));

  const containers: Container[] = CONTAINER_DEFS.map(cd => {
    let contents: ContainerItem | null = null;
    if (cd.fixed) {
      contents = { type: cd.fixed.type as any, item: cd.fixed.item };
    } else {
      contents = rollLootTable();
    }
    return {
      x: (cd.tx + 0.5) * T,
      y: (cd.ty + 0.5) * T,
      tx: cd.tx,
      ty: cd.ty,
      room: cd.room,
      searched: false,
      contents,
    };
  });

  const keyPickups: KeyPickup[] = KEY_PICKUP_DEFS.map(kd => ({
    ...roomPos(kd.room, kd.dx, kd.dy),
    type: kd.type,
    collected: false,
  }));

  const gearPickups: GearPickup[] = [];

  const babies: Baby[] = BABY_DEFS.map(bd => {
    const spawn = roomPos(bd.room, bd.dx, bd.dy);
    const wps = bd.waypoints.map(wp => roomPos(bd.room, wp.dx, wp.dy));
    const base: Baby = {
      ...spawn,
      radius: BABY_RADIUS,
      speed: bd.speed,
      facing: bd.facing,
      wpIndex: 0,
      pauseTimer: 0,
      pauseTime: bd.pauseTime,
      stunTimer: 0,
      type: bd.type,
      vel: 0,
      waypoints: wps,
    };
    if (bd.type === 'stawler') {
      base.chasing = false;
    }
    if (bd.type === 'boss') {
      base.chasing = false;
      base.path = [];
      base.pathIndex = 0;
      base.pathTimer = 0;
      base.roamRoom = bd.roamRoom ?? bd.room;
      base.roomDwell = 0;
      base.roamQueue = [];
      base.recentRooms = [];
    }
    return base;
  });

  return {
    state: 'title',
    grid,
    player,
    babies,
    loots,
    cheeses: [],
    cheesePickups,
    toolPickups,
    distractions: [],
    tvs,
    doors,
    containers,
    keyPickups,
    gearPickups,
    noiseEvents: [],
    detection: 0,
    cheeseCooldown: 0,
    gameOverTimer: 0,
    retryPressTimer: 0,
    retryFadeTimer: 0,
    retryPending: false,
    peekabooPulseTimer: 0,
    minimapClouds: generateClouds(),
    wheelOpen: false,
    wheelHover: -1,
    qDownTime: 0,
    time: 0,
    camera: { x: player.x - VIEW_W / 2, y: player.y - VIEW_H / 2 },
    milkFillAnim: [],
  };
}
