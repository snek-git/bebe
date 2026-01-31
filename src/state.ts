import {
  BABY_RADIUS, PEEKABOO_MAX, PLAYER_RADIUS, T, TV_DEFS, VIEW_H, VIEW_W,
  STAWLER_MAX_SPEED, TODDLER_SPEED,
} from './config';
import { createGrid, roomCenter, roomPos, corrMid } from './map';
import type { Game, Baby, Loot, CheesePickup, ToolPickup, TV } from './types';

export function initGame(): Game {
  const grid = createGrid();
  const start = roomCenter('entrance');

  const player = {
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2,
    hiding: false,
    looting: false,
    lootTimer: 0,
    lootTarget: null,
    cheese: 2,
    loot: 0,
    radius: PLAYER_RADIUS,
    peekStamina: PEEKABOO_MAX,
    peekExhausted: false,
    tools: [],
  };

  const loots: Loot[] = [
    { ...roomPos('vault', -3, 0),    type: 'diamond', collected: false },
    { ...roomPos('vault', 3, 0),     type: 'gold',    collected: false },
    { ...roomPos('safe_dep', 0, -1), type: 'jewels',  collected: false },
    { ...roomPos('vault_ante', 0, 0),type: 'docs',    collected: false },
    { ...roomPos('manager', 0, -1),  type: 'key',     collected: false },
    { ...roomPos('teller_l', 0, 1),  type: 'cash',    collected: false },
    { ...roomPos('teller_r', 0, 1),  type: 'coin',    collected: false },
  ];

  const cheesePickups: CheesePickup[] = [
    { ...roomPos('copy_room', 0, 0),   collected: false },
    { ...roomPos('security', 0, 1),    collected: false },
    { ...roomPos('break_room', -2, 0), collected: false },
    { ...roomPos('janitor', 0, 0),     collected: false },
  ];

  const toolPickups: ToolPickup[] = [
    { ...roomPos('conference', -5, 0),  type: 'ipad',     collected: false },
    { ...roomPos('lobby', -5, -2),      type: 'remote',   collected: false },
    { ...roomPos('teller_l', 2, 1),     type: 'pacifier', collected: false },
    { ...roomPos('break_room', 2, -1),  type: 'remote',   collected: false },
    { ...roomPos('security', 0, 2),     type: 'ipad',     collected: false },
    { ...roomPos('safe_dep', -2, 0),    type: 'pacifier', collected: false },
  ];

  const tvs: TV[] = TV_DEFS.map(td => ({
    x: (td.tx + 0.5) * T,
    y: (td.ty + 0.5) * T,
    room: td.room,
    active: false,
    timer: 0,
  }));

  const babies: Baby[] = [
    { ...roomPos('lobby', -4, -2), radius: BABY_RADIUS, speed: 35, facing: 0, wpIndex: 0, pauseTimer: 0, pauseTime: 1.5, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('lobby', -4, -2), roomPos('lobby', 4, -2)] },
    { ...roomPos('lobby', 0, -2), radius: BABY_RADIUS, speed: 33, facing: -Math.PI / 2, wpIndex: 0, pauseTimer: 0, pauseTime: 2.0, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('lobby', 0, -2), corrMid(4), roomPos('conference', 0, -3), corrMid(4)] },
    { ...roomCenter('copy_room'), radius: BABY_RADIUS, speed: 38, facing: 0, wpIndex: 0, pauseTimer: 0, pauseTime: 1.8, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomCenter('copy_room'), corrMid(8), roomPos('break_room', 0, -2), corrMid(8)] },
    { ...roomCenter('security'), radius: BABY_RADIUS, speed: 35, facing: Math.PI, wpIndex: 0, pauseTimer: 0, pauseTime: 1.8, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomCenter('security'), corrMid(7), roomPos('conference', 0, -3), corrMid(7)] },
    { ...roomPos('manager', 0, -2), radius: BABY_RADIUS, speed: 32, facing: -Math.PI / 2, wpIndex: 0, pauseTimer: 0, pauseTime: 2.2, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomPos('manager', 0, -2), corrMid(5), roomPos('break_room', 0, -2), corrMid(5)] },
    { ...roomCenter('vault_ante'), radius: BABY_RADIUS, speed: 30, facing: 0, wpIndex: 0, pauseTimer: 0, pauseTime: 2.5, stunTimer: 0, type: 'crawler', vel: 0,
      waypoints: [roomCenter('vault_ante'), corrMid(10), roomCenter('vault'), corrMid(11), roomCenter('safe_dep'), corrMid(11), roomCenter('vault'), corrMid(10)] },
    { ...roomPos('conference', 0, -3), radius: BABY_RADIUS, speed: STAWLER_MAX_SPEED, facing: -Math.PI / 2, wpIndex: 0, pauseTimer: 0, pauseTime: 2.0, stunTimer: 0, type: 'stawler', vel: 0,
      waypoints: [roomPos('conference', 0, -3), corrMid(7), roomCenter('security'), corrMid(7)], chasing: false },
    { ...roomPos('vault', 0, -2), radius: BABY_RADIUS, speed: STAWLER_MAX_SPEED, facing: Math.PI, wpIndex: 0, pauseTimer: 0, pauseTime: 2.2, stunTimer: 0, type: 'stawler', vel: 0,
      waypoints: [roomPos('vault', -4, 0), roomPos('vault', 4, 0)], chasing: false },
    { ...roomPos('lobby', 5, -2), radius: BABY_RADIUS, speed: STAWLER_MAX_SPEED, facing: Math.PI, wpIndex: 0, pauseTimer: 0, pauseTime: 1.8, stunTimer: 0, type: 'stawler', vel: 0,
      waypoints: [roomPos('lobby', -5, -2), roomPos('lobby', 5, -2)], chasing: false },
    { ...roomCenter('vault'), radius: BABY_RADIUS, speed: TODDLER_SPEED, facing: 0, wpIndex: 0, pauseTimer: 0, pauseTime: 0, stunTimer: 0, type: 'toddler', vel: 0,
      waypoints: [], chasing: false, path: [], pathIndex: 0, pathTimer: 0 },
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
    detection: 0,
    cheeseCooldown: 0,
    gameOverTimer: 0,
    retryPressTimer: 0,
    retryFadeTimer: 0,
    retryPending: false,
    peekabooPulseTimer: 0,
    wheelOpen: false,
    wheelHover: -1,
    qDownTime: 0,
    time: 0,
    camera: { x: player.x - VIEW_W / 2, y: player.y - VIEW_H / 2 },
  };
}
