# REFLECTION

REFLECTION is a lightweight 2D browser rage/puzzle platformer. The player controls Reality and Reflection simultaneously. Both worlds continuously simulate from the same input while each level applies different Reflection rules.

The objective in every level is the same: reach the door.

## Run Locally

Requirements:

- Node.js 18 or newer
- npm

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Production Build

```bash
npm run build
npm run preview
npm test
```

The deployable static build is written to `dist/`. No backend is required.

## Controls

Desktop:

- `A` or `Left Arrow`: move left
- `D` or `Right Arrow`: move right
- `W` or `Up Arrow`: jump
- `S` or `Down Arrow`: hold to crouch
- `Space` or `Escape`: pause/resume
- `R`: restart the current level
- Click the floating viewport: swap the main and floating worlds
- Double-press left/right: horizontal boost
- Collect a `BJ` power-up, then double-press jump to consume it for a super jump

Mobile:

- Bottom-left buttons: move left/right
- Bottom-right buttons: crouch/jump
- Top-right menu button: pause
- Tap the floating viewport: swap worlds
- Double-tap left/right for a horizontal boost; collect `BJ`, then double-tap jump for a super jump
- Landscape orientation is required
- Starting a level requests immersive fullscreen on supported mobile browsers
- Swipe down or use the browser's native fullscreen gesture to exit fullscreen

## Included MVP Features

- 30 canonical data-driven levels across five worlds on a fixed 32x18 logical grid
- Separate Reality and Reflection layouts, spawns, doors, hazards, checkpoints, wind zones, and dynamic objects
- Reality and Reflection simulated continuously and independently
- Live floating Reflection viewport and animated viewport swapping
- Inverted movement, per-world gravity, deterministic wind zones, momentum, time scale, and level-gated booster rules
- Responsive movement, air control, coyote time, jump buffering, variable jump height, and hold crouch
- Spikes, rolling blades, crushers, lasers, moving platforms, falling platforms, and disappearing platforms
- Shared three-life system, fast collapse death animation, serializable dual-world checkpoint snapshots, and fresh full reset on the third death
- Door completion, automatic progression, final completion screen, timer, best times, unlocked levels, completion state, and per-level death statistics
- Main menu, level select, pause menu, settings, abort confirmation, HUD, mobile controls, portrait rotation screen, and fullscreen toggle
- Synthesized WebAudio music and sound effects with independent toggles
- Optional haptics, screen shake, reduced motion, control opacity, and control scaling
- LocalStorage persistence with no server or account dependency
- Screen Wake Lock during the active game session, reacquired after returning to the tab

## Project Structure

```text
src/
  core/       Game orchestration, loop, input, audio, settings, saves
  player/     Player physics, state, and rendering
  world/      Dual-world simulation and configurable rule resolution
  hazards/    Reusable hazard and dynamic-platform components
  level/      Level schema, loader, and 30 level definitions
  render/     Main and floating world rendering
  ui/         Menus, HUD, settings, and touch controls
```

Level content is structured rather than encoded as screen-sized ASCII maps. Reality and Reflection are loaded into independent object graphs from their own canonical definitions. `npm test` validates all 30 definitions, compares repeated fresh loads, checks snapshot round trips, and verifies that player state is not shared across worlds.

In development, press the backquote key (`` ` ``) to toggle the runtime debug overlay showing world positions, velocities, checkpoint indices, rules, lives, timer, and viewport assignment.

## Known Limitations

- Audio is synthesized through WebAudio instead of external mastered assets.
- Automated browser screenshot/device testing is not included in this environment; production build and structural level checks are provided.
- Level balancing is jam-oriented and may need device-specific tuning after broader playtesting.
- Immersive fullscreen, orientation locking, and Wake Lock require browser support and HTTPS or localhost. iOS Safari may require launching the saved Home Screen web app to hide all browser chrome.

## Suggested Post-MVP Work

1. Playtest and tune individual jump distances, hazard phases, and checkpoint placement.
2. Extend the deterministic regression suite with recorded input-route playthroughs.
3. Replace or layer the procedural audio with mastered original music and effects.
4. Add optional control remapping and additional contrast modes.
5. Add Playwright coverage for desktop and mobile viewport flows in a browser-enabled CI environment.
