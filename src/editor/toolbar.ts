import type { EditorState, ToolMode } from './types';

interface ToolDef {
  mode: ToolMode;
  label: string;
  color: string;
  key: string;
}

const TOOL_GROUPS: { label: string; tools: ToolDef[] }[] = [
  {
    label: 'Layout',
    tools: [
      { mode: 'select',    label: 'Select',    color: '#9ca3af', key: 'S' },
      { mode: 'room',      label: 'Room',      color: '#4ade80', key: 'R' },
      { mode: 'corridor',  label: 'Corridor',  color: '#fbbf24', key: 'C' },
      { mode: 'furniture', label: 'Furniture', color: '#8B6914', key: 'F' },
      { mode: 'wall',      label: 'Wall',      color: '#3a3a5c', key: 'W' },
    ],
  },
  {
    label: 'Entities',
    tools: [
      { mode: 'door',      label: 'Door',      color: '#8B4513', key: 'D' },
      { mode: 'container', label: 'Container', color: '#7c3aed', key: 'N' },
      { mode: 'tv',        label: 'TV',        color: '#3b82f6', key: 'T' },
    ],
  },
  {
    label: 'NPCs',
    tools: [
      { mode: 'baby',      label: 'Baby',      color: '#f59e0b', key: 'B' },
    ],
  },
  {
    label: 'Pickups',
    tools: [
      { mode: 'key',         label: 'Key',    color: '#ef4444', key: 'K' },
      { mode: 'tool_pickup', label: 'Tool',   color: '#a1a1aa', key: 'P' },
      { mode: 'loot',        label: 'Loot',   color: '#60a5fa', key: 'L' },
    ],
  },
];

const keyToMode: Record<string, ToolMode> = {};
for (const g of TOOL_GROUPS) {
  for (const t of g.tools) {
    keyToMode[t.key.toLowerCase()] = t.mode;
  }
}

export function getToolFromKey(key: string): ToolMode | null {
  return keyToMode[key.toLowerCase()] ?? null;
}

export function buildToolbar(container: HTMLElement, state: EditorState, onChange: () => void): void {
  container.innerHTML = '';
  for (const group of TOOL_GROUPS) {
    const div = document.createElement('div');
    div.className = 'tool-group';
    const label = document.createElement('div');
    label.className = 'tool-group-label';
    label.textContent = group.label;
    div.appendChild(label);

    for (const tool of group.tools) {
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      if (state.activeTool === tool.mode) btn.classList.add('active');
      btn.dataset.mode = tool.mode;

      const icon = document.createElement('span');
      icon.className = 'tool-icon';
      icon.style.background = tool.color;
      btn.appendChild(icon);

      const text = document.createElement('span');
      text.textContent = `${tool.label} (${tool.key})`;
      btn.appendChild(text);

      btn.addEventListener('click', () => {
        state.activeTool = tool.mode;
        state.babyWaypointMode = false;
        onChange();
      });

      div.appendChild(btn);
    }
    container.appendChild(div);
  }
}

export function updateToolbarActive(container: HTMLElement, state: EditorState): void {
  for (const btn of container.querySelectorAll('.tool-btn')) {
    const el = btn as HTMLElement;
    el.classList.toggle('active', el.dataset.mode === state.activeTool);
  }
}
