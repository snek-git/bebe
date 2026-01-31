import type { EditorState, ToolHandler, ToolMode } from './types';
import { selectTool } from './tools/select';
import { roomTool } from './tools/room';
import { corridorTool } from './tools/corridor';
import { furnitureTool } from './tools/furniture';
import { makeEntityTool } from './tools/entity';
import { babyTool } from './tools/baby';
import { wallTool } from './tools/wall';


const HANDLERS: Record<ToolMode, ToolHandler> = {
  select: selectTool,
  room: roomTool,
  corridor: corridorTool,
  furniture: furnitureTool,
  door: makeEntityTool('door'),
  container: makeEntityTool('container'),
  tv: makeEntityTool('tv'),
  baby: babyTool,
  key: makeEntityTool('key'),
  tool_pickup: makeEntityTool('tool_pickup'),
  loot: makeEntityTool('loot'),
  wall: wallTool,
};

export function getToolHandler(state: EditorState): ToolHandler {
  return HANDLERS[state.activeTool];
}
