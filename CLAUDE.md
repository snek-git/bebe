# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build
```

No test runner or linter is configured.

## Architecture

**Bebe Heist** is a 2D stealth game (game jam project) built with TypeScript + Vite. It renders to a single HTML5 canvas (800x576) with no framework dependencies.

### Game Loop (src/main.ts)

`requestAnimationFrame` drives the loop. Each frame runs updates then renders, all using delta-time for frame-rate independence.

**Update order matters:**
`updatePlayer → updateBabies → updateProjectiles → updateDistractions → updateTVs → updateDetection → checkPickups → checkWin → updateCamera`

### State Model

A single `Game` object (defined in `src/types.ts`, initialized in `src/state.ts`) holds all game state: entities, grid, camera, detection meter, game phase. Every update and render function receives this object and mutates it directly.

### Module Organization

- **src/config.ts** — All balance constants (speeds, ranges, durations) and level data (room definitions, baby waypoints, loot/pickup placements, corridors)
- **src/types.ts** — All TypeScript interfaces (`Game`, `Baby`, `Player`, `Projectile`, etc.)
- **src/input.ts** — Keyboard/mouse state stored in module-level closure, queried each frame
- **src/map.ts** — Generates the tile grid (50x40, 32px tiles) from room/corridor/furniture definitions
- **src/utils.ts** — Pure utilities: distance, angle diff, line-of-sight raycasting (8px steps), wall collision resolution
- **src/update/** — Game logic systems (player movement/peekaboo, baby AI/pathfinding, projectile physics, detection meter, world interactions)
- **src/render/** — Drawing systems (map tiles, entities, vision cones, HUD/minimap, title/gameover/win screens)

### Coordinate System

50x40 tile grid at 32px per tile (1600x1280 world pixels). Camera smoothly follows the player. Grid values: 0=walkable, 1=wall, 2=furniture.

### Baby AI (src/update/babies.ts)

Two types: **Crawlers** (orange, patrol waypoints, can't see hiding player) and **Stawlers** (pink, faster, can chase hiding players at melee range). Both use vision cones with raycasted line-of-sight checks and can be distracted by iPads, TVs, and pacifiers.

### Detection System (src/update/detection.ts)

Detection meter (0-100) increases when babies see the player and decays when unseen. Reaching 100 triggers game over.

### Game States

`title` → `playing` → `gameover` or `win` (R to retry, managed via `game.state` field)
