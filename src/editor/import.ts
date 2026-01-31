import {
  ROOM_DEFS, CORRIDORS, TV_DEFS, DOOR_DEFS, CONTAINER_DEFS,
  BABY_DEFS, KEY_PICKUP_DEFS, TOOL_PICKUP_DEFS, LOOT_DEFS,
} from '../level-data';
import type { EditorState } from './types';

export function importLevelData(state: EditorState): void {
  state.rooms = ROOM_DEFS.map(r => ({
    id: r.id,
    name: r.name,
    x: r.x, y: r.y, w: r.w, h: r.h,
    furn: (r.furn || []).map(([fx, fy, fw, fh]) => ({ fx, fy, fw, fh })),
  }));

  state.corridors = CORRIDORS.map(([x, y, w, h]) => ({ x, y, w, h }));

  state.tvs = TV_DEFS.map(t => ({ tx: t.tx, ty: t.ty, room: t.room }));

  state.doors = DOOR_DEFS.map(d => ({
    tx: d.tx, ty: d.ty,
    orientation: d.orientation,
    initial: d.initial,
    requiredKey: d.requiredKey,
  }));

  state.containers = CONTAINER_DEFS.map(c => ({
    tx: c.tx, ty: c.ty,
    room: c.room,
    fixed: c.fixed ? { type: c.fixed.type, item: c.fixed.item } : undefined,
  }));

  state.babies = BABY_DEFS.map(b => ({
    room: b.room,
    dx: b.dx, dy: b.dy,
    type: b.type,
    speed: b.speed,
    facing: b.facing,
    pauseTime: b.pauseTime,
    waypoints: b.waypoints.map(wp => ({ dx: wp.dx, dy: wp.dy })),
    roamRoom: b.roamRoom,
  }));

  state.keys = KEY_PICKUP_DEFS.map(k => ({
    room: k.room, dx: k.dx, dy: k.dy, type: k.type,
  }));

  state.tools = TOOL_PICKUP_DEFS.map(t => ({
    room: t.room, dx: t.dx, dy: t.dy, type: t.type,
  }));

  state.loots = LOOT_DEFS.map(l => ({
    room: l.room, dx: l.dx, dy: l.dy, type: l.type,
  }));
}
