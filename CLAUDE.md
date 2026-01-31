# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build
```

No test runner or linter is configured. Two entry points: `index.html` (game) and `editor.html` (level editor).

## Architecture

**Bebe Heist** is a 2D stealth game (game jam project) built with TypeScript + Vite. It renders to a single HTML5 canvas (800x576) with no framework dependencies.

### Game Loop (src/main.ts)

`requestAnimationFrame` drives the loop. Each frame runs updates then renders, all using delta-time for frame-rate independence.

**Update order matters:**
`updatePlayer → updateBabies → updateProjectiles → updateDistractions → updateTVs → updateDoors → updateNoiseEvents → updateDetection → checkPickups → checkWin → updateMinimapSeen → updateCamera`

### State Model

A single `Game` object (defined in `src/types.ts`, initialized in `src/state.ts`) holds all game state: entities, grid, camera, detection meter, game phase. Every update and render function receives this object and mutates it directly.

### Module Organization

- **src/config.ts** — All balance constants (speeds, ranges, durations). Re-exports spatial data from `level-data.ts`
- **src/level-data.ts** — Room definitions, corridors, baby waypoints, loot/pickup placements, door/TV/container defs
- **src/types.ts** — All TypeScript interfaces (`Game`, `Baby`, `Player`, `Projectile`, `Door`, etc.)
- **src/input.ts** — Keyboard/mouse state stored in module-level closure, queried each frame
- **src/map.ts** — Generates the tile grid from room/corridor/furniture definitions, grid query helpers (`isWall`, `isSolid`, `isWalkable`, `isDoorBlocking`)
- **src/utils.ts** — Pure utilities: distance, angle diff, line-of-sight raycasting (8px steps), wall collision resolution
- **src/pathfinding.ts** — A* implementation with nearest-walkable snapping, used by toddler AI and chase behavior
- **src/sprites.ts** — Sprite sheet loading for baby/stawler animations
- **src/audio.ts** — Audio system (music, SFX)
- **src/update/** — Game logic systems (player movement/peekaboo, baby AI/pathfinding, projectile physics, detection meter, world interactions)
- **src/render/** — Drawing systems (map tiles, entities, vision cones, HUD/minimap, title/gameover/win screens, sketchy hand-drawn effects)
- **src/editor/** — Separate level editor app with tools for rooms, corridors, furniture, walls, baby placement, entity editing

### Coordinate System

50x44 tile grid (`COLS=50`, `ROWS=44`) at 32px per tile (`T=32`). Camera smoothly follows the player. Grid values: 0=walkable, 1=wall, 2=furniture.

### Baby AI (src/update/babies.ts)

Three types: **Crawlers** (orange, patrol waypoints, can't see hiding player), **Stawlers** (pink, faster with friction-based movement, can chase hiding players at melee range), and **Toddlers** (roaming AI using A* pathfinding, chase when player visible). All use vision cones with raycasted line-of-sight checks and can be distracted by iPads, TVs, and pacifiers.

### Detection System (src/update/detection.ts)

Detection meter (0-100) increases when babies see the player and decays when unseen. Reaching 100 triggers game over. Gear modifiers: Sneakers (0.6x detection), Sunglasses (0.7x stamina drain).

### Game States

`title` → `playing` ↔ `paused` → `gameover` or `win` (R to retry, ESC to pause, managed via `game.state` field)
