import {
  BABY_RADIUS, PEEKABOO_MAX, PLAYER_RADIUS, T, TV_DEFS, VIEW_H, VIEW_W,
  STAWLER_MAX_SPEED, TODDLER_SPEED,
  DOOR_DEFS, CONTAINER_DEFS, LOOT_TABLE_WEIGHTS,
} from './config';
import { createGrid, roomCenter, roomPos } from './map';
import type {
  Game, Baby, Loot, CheesePickup, ToolPickup, TV, Door,
  Container, ContainerItem, KeyPickup, GearPickup, GearType,
} from './types';

function rollLootTable(): ContainerItem | null {
  const total = Object.values(LOOT_TABLE_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of Object.entries(LOOT_TABLE_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      if (type === 'cheese') return { type: 'cheese' };
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

export function initGame(): Game {
  const grid = createGrid();
  // Spawn at bottom of entrance, near the exit -- gives player room to observe
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
    peekStamina: PEEKABOO_MAX,
    peekExhausted: false,
    tools: [] as any[],
    keys: [] as any[],
    gear: [] as any[],
    sprinting: false,
    searchTarget: null as Container | null,
    searchTimer: 0,
    searching: false,
  };

  // The golden bebe on the vault pedestal -- only loot item
  const loots: Loot[] = [
    { ...roomPos('vault', 0, 0), type: 'diamond', collected: false },
  ];

  const cheesePickups: CheesePickup[] = [];

  // Tool pickups: iPad in B1, Remote in B2 corridor, Pacifier past gate in C1
  const toolPickups: ToolPickup[] = [
    { ...roomPos('conference', -1, -3), type: 'ipad',     collected: false },
    { ...roomPos('security', -2, 1),    type: 'remote',   collected: false },
    { ...roomPos('copy_room', 0, -1),   type: 'pacifier', collected: false },
  ];

  const tvs: TV[] = TV_DEFS.map(td => ({
    x: (td.tx + 0.5) * T,
    y: (td.ty + 0.5) * T,
    room: td.room,
    active: false,
    timer: 0,
  }));

  // Doors from definitions
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

  // Containers with loot table rolls
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

  // Key pickups: KEY A on manager desk, KEY B on security desk, KEY C on copy room shelf
  const keyPickups: KeyPickup[] = [
    { ...roomPos('manager', 0, 1),    type: 'keyA', collected: false },
    { ...roomPos('security', 0, 0),   type: 'keyB', collected: false },
    { ...roomPos('copy_room', 0, 0),  type: 'keyC', collected: false },
  ];

  // No gear pickups on the ground -- they come from containers
  const gearPickups: GearPickup[] = [];

  // Baby placement per the design doc
  const babies: Baby[] = [
    // Entrance: 1 slow crawler patrolling left-right
    { ...roomPos('entrance', -3, -1), radius: BABY_RADIUS, speed: 35, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 2.0, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('entrance', -3, -1), roomPos('entrance', 3, -1)] },
    // Lobby: 1 crawler lazy loop
    { ...roomPos('lobby', -4, 0), radius: BABY_RADIUS, speed: 45, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 1.8, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('lobby', -4, -2), roomPos('lobby', 4, -2), roomPos('lobby', 4, 2), roomPos('lobby', -4, 2)] },
    // A1 Break Room: 1 crawler patrolling around table
    { ...roomPos('break_room', -4, -2), radius: BABY_RADIUS, speed: 48, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 1.5, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('break_room', -4, -2), roomPos('break_room', 3, -2), roomPos('break_room', 3, 2), roomPos('break_room', -4, 2)] },
    // A2 Manager: 1 crawler circular patrol around desk
    { ...roomPos('manager', -3, -2), radius: BABY_RADIUS, speed: 46, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 1.5, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('manager', -3, -2), roomPos('manager', 3, -2), roomPos('manager', 3, 2), roomPos('manager', -3, 2)] },
    // B1 Conference: 2 crawlers patrolling above/below table
    { ...roomPos('conference', -4, -2), radius: BABY_RADIUS, speed: 50, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 1.2, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('conference', -4, -2), roomPos('conference', 3, -2)] },
    { ...roomPos('conference', 3, 2), radius: BABY_RADIUS, speed: 48, facing: Math.PI,
      wpIndex: 0, pauseTimer: 0, pauseTime: 1.4, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('conference', 3, 2), roomPos('conference', -4, 2)] },
    // B2 Security: 1 crawler guarding below desk
    { ...roomPos('security', 0, 1), radius: BABY_RADIUS, speed: 42, facing: -Math.PI / 2,
      wpIndex: 0, pauseTimer: 0, pauseTime: 2.5, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('security', 0, 2), roomPos('security', 0, 0)] },
    // C1 Copy Room: 1 crawler + 1 stawler
    { ...roomPos('copy_room', -2, -1), radius: BABY_RADIUS, speed: 48, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 1.8, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('copy_room', -2, -1), roomPos('copy_room', 1, 1)] },
    { ...roomPos('copy_room', 1, -1), radius: BABY_RADIUS, speed: STAWLER_MAX_SPEED, facing: Math.PI,
      wpIndex: 0, pauseTimer: 0, pauseTime: 2.0, stunTimer: 0, type: 'stawler', vel: 0,
      waypoints: [roomPos('copy_room', 1, -1), roomPos('copy_room', -2, 1)], chasing: false },
    // C2 Safe Deposit: 1 stawler patrolling horizontally between shelf rows
    { ...roomPos('safe_dep', 0, -1), radius: BABY_RADIUS, speed: STAWLER_MAX_SPEED, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 2.0, stunTimer: 0, type: 'stawler', vel: 0,
      waypoints: [roomPos('safe_dep', -2, -1), roomPos('safe_dep', 2, -1)], chasing: false },
    // Vault: 1 crawler + 1 stawler + 1 toddler
    { ...roomPos('vault', -3, 0), radius: BABY_RADIUS, speed: 46, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 2.0, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('vault', -5, -1), roomPos('vault', 5, -1), roomPos('vault', 5, 2), roomPos('vault', -5, 2)] },
    { ...roomPos('vault', 3, 0), radius: BABY_RADIUS, speed: STAWLER_MAX_SPEED, facing: Math.PI,
      wpIndex: 0, pauseTimer: 0, pauseTime: 2.2, stunTimer: 0, type: 'stawler', vel: 0,
      waypoints: [roomPos('vault', -3, 0), roomPos('vault', 3, 0)], chasing: false },
    { ...roomCenter('vault'), radius: BABY_RADIUS, speed: TODDLER_SPEED, facing: 0,
      wpIndex: 0, pauseTimer: 0, pauseTime: 0, stunTimer: 0, type: 'toddler', vel: 0,
      waypoints: [], chasing: false, path: [], pathIndex: 0, pathTimer: 0, roamRoom: 'vault', roomDwell: 0, roamQueue: [], recentRooms: [] },
  ];

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
    minimapSeen: Array.from({ length: grid.length }, () => Array(grid[0].length).fill(false)),
    wheelOpen: false,
    wheelHover: -1,
    qDownTime: 0,
    time: 0,
    camera: { x: player.x - VIEW_W / 2, y: player.y - VIEW_H / 2 },
  };
}
