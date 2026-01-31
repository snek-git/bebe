import type { EditorState } from './types';

export function exportLevelData(state: EditorState): string {
  const lines: string[] = [];
  lines.push(`import type {`);
  lines.push(`  RoomDef, TVDef, DoorDef, ContainerDef,`);
  lines.push(`  BabyDef, KeyPickupDef, ToolPickupDef, LootDef,`);
  lines.push(`} from './types';`);
  lines.push('');

  // ROOM_DEFS
  lines.push('export const ROOM_DEFS: RoomDef[] = [');
  for (const r of state.rooms) {
    const furn = r.furn.length > 0
      ? `, furn: [${r.furn.map(f => `[${f.fx}, ${f.fy}, ${f.fw}, ${f.fh}]`).join(', ')}]`
      : '';
    lines.push(`  { id: '${r.id}', name: '${r.name}', x: ${r.x}, y: ${r.y}, w: ${r.w}, h: ${r.h}${furn} },`);
  }
  lines.push('];');
  lines.push('');

  // CORRIDORS
  lines.push('export const CORRIDORS: number[][] = [');
  for (const c of state.corridors) {
    lines.push(`  [${c.x}, ${c.y}, ${c.w}, ${c.h}],`);
  }
  lines.push('];');
  lines.push('');

  // TV_DEFS
  lines.push('export const TV_DEFS: TVDef[] = [');
  for (const t of state.tvs) {
    lines.push(`  { tx: ${t.tx}, ty: ${t.ty}, room: '${t.room}' },`);
  }
  lines.push('];');
  lines.push('');

  // DOOR_DEFS
  lines.push('export const DOOR_DEFS: DoorDef[] = [');
  for (const d of state.doors) {
    const key = d.requiredKey ? `, requiredKey: '${d.requiredKey}'` : '';
    lines.push(`  { tx: ${d.tx}, ty: ${d.ty}, orientation: '${d.orientation}', initial: '${d.initial}'${key} },`);
  }
  lines.push('];');
  lines.push('');

  // CONTAINER_DEFS
  lines.push('export const CONTAINER_DEFS: ContainerDef[] = [');
  for (const c of state.containers) {
    const fixed = c.fixed ? `, fixed: { type: '${c.fixed.type}'${c.fixed.item ? `, item: '${c.fixed.item}'` : ''} }` : '';
    lines.push(`  { tx: ${c.tx}, ty: ${c.ty}, room: '${c.room}'${fixed} },`);
  }
  lines.push('];');
  lines.push('');

  // BABY_DEFS
  lines.push('export const BABY_DEFS: BabyDef[] = [');
  for (const b of state.babies) {
    const wps = b.waypoints.map(wp => `{ dx: ${wp.dx}, dy: ${wp.dy} }`).join(', ');
    const roam = b.roamRoom ? `, roamRoom: '${b.roamRoom}'` : '';
    lines.push(`  { room: '${b.room}', dx: ${b.dx}, dy: ${b.dy}, type: '${b.type}', speed: ${b.speed}, facing: ${fmtNum(b.facing)}, pauseTime: ${b.pauseTime},`);
    lines.push(`    waypoints: [${wps}]${roam} },`);
  }
  lines.push('];');
  lines.push('');

  // KEY_PICKUP_DEFS
  lines.push('export const KEY_PICKUP_DEFS: KeyPickupDef[] = [');
  for (const k of state.keys) {
    lines.push(`  { room: '${k.room}', dx: ${k.dx}, dy: ${k.dy}, type: '${k.type}' },`);
  }
  lines.push('];');
  lines.push('');

  // TOOL_PICKUP_DEFS
  lines.push('export const TOOL_PICKUP_DEFS: ToolPickupDef[] = [');
  for (const t of state.tools) {
    lines.push(`  { room: '${t.room}', dx: ${t.dx}, dy: ${t.dy}, type: '${t.type}' },`);
  }
  lines.push('];');
  lines.push('');

  // LOOT_DEFS
  lines.push('export const LOOT_DEFS: LootDef[] = [');
  for (const l of state.loots) {
    lines.push(`  { room: '${l.room}', dx: ${l.dx}, dy: ${l.dy}, type: '${l.type}' },`);
  }
  lines.push('];');
  lines.push('');

  // WALL_OVERRIDES
  if (state.walls.length > 0) {
    lines.push('export const WALL_OVERRIDES: { tx: number; ty: number }[] = [');
    for (const w of state.walls) {
      lines.push(`  { tx: ${w.tx}, ty: ${w.ty} },`);
    }
    lines.push('];');
    lines.push('');
  }

  return lines.join('\n');
}

function fmtNum(n: number): string {
  if (n === Math.PI) return 'Math.PI';
  if (n === -Math.PI) return '-Math.PI';
  if (n === Math.PI / 2) return 'Math.PI / 2';
  if (n === -Math.PI / 2) return '-Math.PI / 2';
  return String(n);
}
