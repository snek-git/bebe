import { pushUndo } from './state';
import type { EditorState } from './types';

export function updatePanel(container: HTMLElement, state: EditorState): void {
  container.innerHTML = '';

  if (!state.selection) {
    container.innerHTML = `
      <span style="color:#4b5563">Nothing selected</span>
      <div style="margin-top:12px;color:#4b5563;font-size:10px">
        Rooms: ${state.rooms.length}<br>
        Corridors: ${state.corridors.length}<br>
        Doors: ${state.doors.length}<br>
        Containers: ${state.containers.length}<br>
        TVs: ${state.tvs.length}<br>
        Babies: ${state.babies.length}<br>
        Keys: ${state.keys.length}<br>
        Tools: ${state.tools.length}<br>
        Loots: ${state.loots.length}
      </div>`;
    return;
  }

  const { kind, index, furnIndex } = state.selection;

  if (kind === 'room' && state.rooms[index]) {
    const r = state.rooms[index];
    addText(container, 'ROOM', r.name);
    addField(container, 'id', r.id, v => { pushUndo(state); r.id = v; });
    addField(container, 'name', r.name, v => { pushUndo(state); r.name = v; });
    addNumber(container, 'x', r.x, v => { pushUndo(state); r.x = v; });
    addNumber(container, 'y', r.y, v => { pushUndo(state); r.y = v; });
    addNumber(container, 'w', r.w, v => { pushUndo(state); r.w = Math.max(1, v); });
    addNumber(container, 'h', r.h, v => { pushUndo(state); r.h = Math.max(1, v); });
    addInfo(container, `Furniture: ${r.furn.length}`);
  }

  else if (kind === 'corridor' && state.corridors[index]) {
    const c = state.corridors[index];
    addText(container, 'CORRIDOR', `${c.w}x${c.h}`);
    addNumber(container, 'x', c.x, v => { pushUndo(state); c.x = v; });
    addNumber(container, 'y', c.y, v => { pushUndo(state); c.y = v; });
    addNumber(container, 'w', c.w, v => { pushUndo(state); c.w = Math.max(1, v); });
    addNumber(container, 'h', c.h, v => { pushUndo(state); c.h = Math.max(1, v); });
  }

  else if (kind === 'furniture' && state.rooms[index]) {
    const r = state.rooms[index];
    const f = r.furn[furnIndex!];
    if (!f) return;
    addText(container, 'FURNITURE', `in ${r.name}`);
    addNumber(container, 'fx', f.fx, v => { pushUndo(state); f.fx = v; });
    addNumber(container, 'fy', f.fy, v => { pushUndo(state); f.fy = v; });
    addNumber(container, 'fw', f.fw, v => { pushUndo(state); f.fw = Math.max(1, v); });
    addNumber(container, 'fh', f.fh, v => { pushUndo(state); f.fh = Math.max(1, v); });
  }

  else if (kind === 'door' && state.doors[index]) {
    const d = state.doors[index];
    addText(container, 'DOOR', `${d.tx},${d.ty}`);
    addNumber(container, 'tx', d.tx, v => { pushUndo(state); d.tx = v; });
    addNumber(container, 'ty', d.ty, v => { pushUndo(state); d.ty = v; });
    addSelect(container, 'orient', d.orientation, ['h', 'v'], v => { pushUndo(state); d.orientation = v as 'h' | 'v'; });
    addSelect(container, 'state', d.initial, ['open', 'closed', 'locked'], v => { pushUndo(state); d.initial = v as any; });
    addSelect(container, 'key', d.requiredKey || 'none', ['none', 'keyA', 'keyB', 'keyC'], v => {
      pushUndo(state); d.requiredKey = v === 'none' ? undefined : v as any;
    });
  }

  else if (kind === 'container' && state.containers[index]) {
    const c = state.containers[index];
    addText(container, 'CONTAINER', c.room);
    addNumber(container, 'tx', c.tx, v => { pushUndo(state); c.tx = v; });
    addNumber(container, 'ty', c.ty, v => { pushUndo(state); c.ty = v; });
    addSelect(container, 'room', c.room,
      state.rooms.map(r => r.id),
      v => { pushUndo(state); c.room = v; });
    const hasFixed = !!c.fixed;
    addSelect(container, 'fixed', hasFixed ? c.fixed!.type : 'random',
      ['random', 'cheese', 'throwable', 'gear', 'key'],
      v => {
        pushUndo(state);
        if (v === 'random') c.fixed = undefined;
        else c.fixed = { type: v };
      });
  }

  else if (kind === 'tv' && state.tvs[index]) {
    const tv = state.tvs[index];
    addText(container, 'TV', tv.room);
    addNumber(container, 'tx', tv.tx, v => { pushUndo(state); tv.tx = v; });
    addNumber(container, 'ty', tv.ty, v => { pushUndo(state); tv.ty = v; });
    addSelect(container, 'room', tv.room,
      state.rooms.map(r => r.id),
      v => { pushUndo(state); tv.room = v; });
  }

  else if (kind === 'baby' && state.babies[index]) {
    const b = state.babies[index];
    addText(container, 'BABY', `${b.type} in ${b.room}`);
    addSelect(container, 'type', b.type, ['crawler', 'stawler', 'toddler'],
      v => { pushUndo(state); b.type = v as any; });
    addSelect(container, 'room', b.room,
      state.rooms.map(r => r.id),
      v => { pushUndo(state); b.room = v; });
    addNumber(container, 'dx', b.dx, v => { pushUndo(state); b.dx = v; });
    addNumber(container, 'dy', b.dy, v => { pushUndo(state); b.dy = v; });
    addNumber(container, 'speed', b.speed, v => { pushUndo(state); b.speed = v; });
    addNumber(container, 'pause', b.pauseTime, v => { pushUndo(state); b.pauseTime = v; });
    addInfo(container, `Waypoints: ${b.waypoints.length}`);
    // Waypoint list with remove buttons
    for (let wi = 0; wi < b.waypoints.length; wi++) {
      const wp = b.waypoints[wi];
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:2px;padding-left:4px';
      row.innerHTML = `<span style="color:#6b7280;font-size:9px;width:24px">#${wi}</span>
        <span style="color:#9ca3af;font-size:10px">${wp.dx}, ${wp.dy}</span>`;
      const rmBtn = document.createElement('button');
      rmBtn.textContent = 'x';
      rmBtn.style.cssText = 'background:#7f1d1d;color:#fca5a5;border:none;padding:0 4px;cursor:pointer;font-size:9px;margin-left:auto;border-radius:2px';
      rmBtn.addEventListener('click', () => {
        pushUndo(state);
        b.waypoints.splice(wi, 1);
      });
      row.appendChild(rmBtn);
      container.appendChild(row);
    }
    // Toggle waypoint mode button
    const wpBtn = document.createElement('button');
    wpBtn.textContent = state.babyWaypointMode ? 'Stop Adding Waypoints' : 'Add Waypoints';
    wpBtn.style.cssText = 'width:100%;margin-top:4px;padding:3px;background:#1e3a5f;color:#93c5fd;border:1px solid #2563eb;cursor:pointer;font-family:inherit;font-size:10px;border-radius:2px';
    wpBtn.addEventListener('click', () => {
      state.babyWaypointMode = !state.babyWaypointMode;
    });
    container.appendChild(wpBtn);
  }

  else if (kind === 'key' && state.keys[index]) {
    const k = state.keys[index];
    addText(container, 'KEY', k.type);
    addSelect(container, 'type', k.type, ['keyA', 'keyB', 'keyC'],
      v => { pushUndo(state); k.type = v as any; });
    addSelect(container, 'room', k.room,
      state.rooms.map(r => r.id),
      v => { pushUndo(state); k.room = v; });
    addNumber(container, 'dx', k.dx, v => { pushUndo(state); k.dx = v; });
    addNumber(container, 'dy', k.dy, v => { pushUndo(state); k.dy = v; });
  }

  else if (kind === 'tool_pickup' && state.tools[index]) {
    const t = state.tools[index];
    addText(container, 'TOOL', t.type);
    addSelect(container, 'type', t.type, ['ipad', 'remote', 'pacifier'],
      v => { pushUndo(state); t.type = v as any; });
    addSelect(container, 'room', t.room,
      state.rooms.map(r => r.id),
      v => { pushUndo(state); t.room = v; });
    addNumber(container, 'dx', t.dx, v => { pushUndo(state); t.dx = v; });
    addNumber(container, 'dy', t.dy, v => { pushUndo(state); t.dy = v; });
  }

  else if (kind === 'loot' && state.loots[index]) {
    const l = state.loots[index];
    addText(container, 'LOOT', l.type);
    addSelect(container, 'type', l.type,
      ['cash', 'gold', 'diamond', 'key', 'docs', 'jewels', 'coin'],
      v => { pushUndo(state); l.type = v as any; });
    addSelect(container, 'room', l.room,
      state.rooms.map(r => r.id),
      v => { pushUndo(state); l.room = v; });
    addNumber(container, 'dx', l.dx, v => { pushUndo(state); l.dx = v; });
    addNumber(container, 'dy', l.dy, v => { pushUndo(state); l.dy = v; });
  }

  // Delete button
  const del = document.createElement('button');
  del.className = 'btn-delete';
  del.textContent = 'Delete';
  del.addEventListener('click', () => {
    pushUndo(state);
    if (kind === 'room') state.rooms.splice(index, 1);
    else if (kind === 'corridor') state.corridors.splice(index, 1);
    else if (kind === 'furniture' && state.rooms[index]) state.rooms[index].furn.splice(furnIndex!, 1);
    else if (kind === 'door') state.doors.splice(index, 1);
    else if (kind === 'container') state.containers.splice(index, 1);
    else if (kind === 'tv') state.tvs.splice(index, 1);
    else if (kind === 'baby') state.babies.splice(index, 1);
    else if (kind === 'key') state.keys.splice(index, 1);
    else if (kind === 'tool_pickup') state.tools.splice(index, 1);
    else if (kind === 'loot') state.loots.splice(index, 1);
    state.selection = null;
  });
  container.appendChild(del);
}

function addText(parent: HTMLElement, label: string, value: string): void {
  const div = document.createElement('div');
  div.style.cssText = 'margin-bottom:8px;font-weight:bold;color:#d1d5db';
  div.textContent = `${label}: ${value}`;
  parent.appendChild(div);
}

function addInfo(parent: HTMLElement, text: string): void {
  const div = document.createElement('div');
  div.style.cssText = 'color:#6b7280;font-size:10px;margin:4px 0';
  div.textContent = text;
  parent.appendChild(div);
}

function addField(parent: HTMLElement, label: string, value: string, onChange: (v: string) => void): void {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.innerHTML = `<span class="prop-label">${label}</span>`;
  const input = document.createElement('input');
  input.className = 'prop-input';
  input.value = value;
  input.addEventListener('change', () => onChange(input.value));
  row.appendChild(input);
  parent.appendChild(row);
}

function addNumber(parent: HTMLElement, label: string, value: number, onChange: (v: number) => void): void {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.innerHTML = `<span class="prop-label">${label}</span>`;
  const input = document.createElement('input');
  input.className = 'prop-input';
  input.type = 'number';
  input.value = String(value);
  input.step = '1';
  input.addEventListener('change', () => onChange(Number(input.value)));
  row.appendChild(input);
  parent.appendChild(row);
}

function addSelect(parent: HTMLElement, label: string, value: string, options: string[], onChange: (v: string) => void): void {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.innerHTML = `<span class="prop-label">${label}</span>`;
  const select = document.createElement('select');
  select.className = 'prop-select';
  for (const opt of options) {
    const el = document.createElement('option');
    el.value = opt;
    el.textContent = opt;
    if (opt === value) el.selected = true;
    select.appendChild(el);
  }
  select.addEventListener('change', () => onChange(select.value));
  row.appendChild(select);
  parent.appendChild(row);
}
