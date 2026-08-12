import { World } from "../world/World";
import type { Solid } from "../world/World";
import { Spike } from "../hazards/Spike";
import { Blade } from "../hazards/Blade";
import { Crusher } from "../hazards/Crusher";
import { Laser } from "../hazards/Laser";
import { MovingPlatform } from "../hazards/MovingPlatform";
import { FallingPlatform } from "../hazards/FallingPlatform";
import { DisappearingPlatform } from "../hazards/DisappearingPlatform";
import type { WorldRole } from "../world/Rules";
import type { LevelRules } from "../world/Rules";
import { TILE, LEVEL_H } from "../core/types";

export interface CheckpointZone {
  x: number;
  y: number;
  w: number;
  h: number;
  index: number;
}

export interface LoadedLevel {
  world: World;
  checkpointZones: CheckpointZone[];
}

export const PLAYER_STAND_H = 44;

/**
 * Builds a fully independent World (hazard object graphs etc.) from a
 * LevelDef. Both worlds are constructed separately so their simulations
 * never share mutable state.
 */
export function constructWorld(
  tiles: string[],
  tweaks: Record<string, { range?: number; speed?: number; period?: number; phase?: number }>,
  levelId: number,
  levelRules: LevelRules,
  role: WorldRole,
  windDef: { x: number; y: number }
): LoadedLevel {
  const world = new World(role, levelId, levelRules);
  world.wind = {
    x: windDef.x * world.rules.windMul,
    y: windDef.y * world.rules.windMul,
  };

  const width = Math.max(...tiles.map((r) => r.length));
  world.levelW = width * TILE;
  world.levelH = LEVEL_H;

  let spawnFeet: { x: number; y: number } | null = null;
  const checkpointTiles: { x: number; y: number }[] = [];
  const portalTiles: { x: number; y: number }[] = [];
  const doorTiles: { x: number; y: number }[] = [];

  for (let ry = 0; ry < tiles.length; ry++) {
    const row = tiles[ry].padEnd(width, ".");
    for (let cx = 0; cx < width; cx++) {
      const ch = row[cx];
      const x = cx * TILE;
      const y = ry * TILE;
      switch (ch) {
        case "#":
          world.solids.push({ x, y, w: TILE, h: TILE, oneway: false });
          break;
        case "^":
          world.solids.push({ x, y, w: TILE, h: TILE * 0.4, oneway: true });
          break;
        case "S":
          world.hazards.push(new Spike(x, y, false));
          break;
        case "T":
          world.hazards.push(new Spike(x, y, true));
          break;
        case "B":
          world.hazards.push(
            new Blade(x, y, {
              axis: "x",
              range: tweaks.B?.range ?? 160,
              speed: tweaks.B?.speed ?? 220,
              radius: 26,
              phase: ((cx * 7 + ry * 11) % 5) * 0.09,
            })
          );
          break;
        case "b":
          world.hazards.push(
            new Blade(x, y, {
              axis: "y",
              range: tweaks.b?.range ?? 160,
              speed: tweaks.b?.speed ?? 210,
              radius: 26,
              phase: ((cx * 11 + ry * 7) % 5) * 0.09,
            })
          );
          break;
        case "C":
          world.hazards.push(
            new Crusher(x - TILE / 2, y, {
              axis: "y",
              range: tweaks.C?.range ?? 96,
              block: TILE * 2,
              period: tweaks.C?.period ?? 1.6,
              phase: tweaks.C?.phase ?? ((cx * 7 + ry * 13) % 9) * 0.11,
              dir: 1,
            })
          );
          break;
        case "c":
          world.hazards.push(
            new Crusher(x - TILE / 2, y - TILE / 2, {
              axis: "y",
              range: tweaks.c?.range ?? 96,
              block: TILE * 2,
              period: tweaks.c?.period ?? 1.9,
              phase: tweaks.c?.phase ?? ((cx * 11 + ry * 5) % 9) * 0.13,
              dir: -1,
            })
          );
          break;
        case "L":
          world.hazards.push(new Laser(x, y, { dir: "r" }));
          break;
        case "l":
          world.hazards.push(new Laser(x, y, { dir: "l" }));
          break;
        case "V":
          world.hazards.push(new Laser(x, y, { dir: "d" }));
          break;
        case "U":
          world.hazards.push(new Laser(x, y, { dir: "u" }));
          break;
        case "M":
          world.hazards.push(
            new MovingPlatform(x, y, {
              axis: "x",
              range: tweaks.M?.range ?? 160,
              speed: tweaks.M?.speed ?? 150,
              phase: ((cx * 3) % 7) * 0.07,
            })
          );
          break;
        case "m":
          world.hazards.push(
            new MovingPlatform(x, y, {
              axis: "y",
              range: tweaks.m?.range ?? 160,
              speed: tweaks.m?.speed ?? 150,
              phase: ((cx * 5) % 7) * 0.09,
            })
          );
          break;
        case "F":
          world.hazards.push(new FallingPlatform(x, y));
          break;
        case "E":
          world.hazards.push(new DisappearingPlatform(x, y + TILE - 16));
          break;
        case "O":
          portalTiles.push({ x, y });
          break;
        case "K":
          checkpointTiles.push({ x, y });
          break;
        case "G":
          doorTiles.push({ x, y });
          break;
        case "P":
          spawnFeet = { x: x + TILE / 2, y: y + TILE };
          break;
        default:
          break;
      }
    }
  }

  /* door */
  if (doorTiles.length) {
    const minX = Math.min(...doorTiles.map((t) => t.x));
    const minY = Math.min(...doorTiles.map((t) => t.y));
    const maxX = Math.max(...doorTiles.map((t) => t.x + TILE));
    const maxY = Math.max(...doorTiles.map((t) => t.y + TILE));
    let doorRect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    if (world.solids.length) {
      const surf = findSurface(world.solids, doorRect.x + doorRect.w / 2, doorRect.y + doorRect.h, 1, 3 * TILE);
      if (surf !== null) doorRect.y = surf - doorRect.h;
    }
    world.doorRect = doorRect;
  }

  /* portals */
  if (portalTiles.length) {
    const minX = Math.min(...portalTiles.map((t) => t.x));
    const minY = Math.min(...portalTiles.map((t) => t.y));
    const maxX = Math.max(...portalTiles.map((t) => t.x + TILE));
    const maxY = Math.max(...portalTiles.map((t) => t.y + TILE));
    world.portals = [{ x: minX, y: minY, w: maxX - minX, h: maxY - minY }];
  }

  /* checkpoints */
  const checkpointZones: CheckpointZone[] = [];
  if (checkpointTiles.length) {
    const sorted = [...checkpointTiles].sort((a, b) => a.y - b.y || a.x - b.x);
    let pending: { x: number; y: number }[] = [sorted[0]];
    for (let i = 1; i <= sorted.length; i++) {
      const cur = sorted[i];
      const last = pending[pending.length - 1];
      const adjacent =
        !!cur && Math.abs(cur.x - last.x) <= TILE && Math.abs(cur.y - last.y) <= TILE;
      if (cur && adjacent) {
        pending.push(cur);
      } else {
        const minX = Math.min(...pending.map((t) => t.x));
        const minY = Math.min(...pending.map((t) => t.y));
        const maxX = Math.max(...pending.map((t) => t.x + TILE));
        const maxY = Math.max(...pending.map((t) => t.y + TILE));
        checkpointZones.push({
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          index: checkpointZones.length + 1,
        });
        pending = cur ? [cur] : [];
      }
    }
  }

  /* spawn */
  if (spawnFeet) {
    let feetY = spawnFeet.y;
    const surf = findSurface(
      world.solids,
      spawnFeet.x,
      feetY,
      world.rules.gravMul,
      6 * TILE
    );
    if (surf !== null) feetY = surf;
    world.setSpawn(spawnFeet.x - PLAYER_STAND_H / 2, feetY - PLAYER_STAND_H);
  }

  return { world, checkpointZones };
}

/** Nearest solid surface below (gravDir 1) or above (gravDir -1) the probe. */
function findSurface(
  solids: Solid[],
  probeX: number,
  probeY: number,
  gravDir: 1 | -1,
  maxRange: number
): number | null {
  let bestDist = Infinity;
  let best: number | null = null;
  for (const s of solids) {
    if (s.oneway) continue;
    const withinX = probeX > s.x - 12 && probeX < s.x + s.w + 12;
    if (!withinX) continue;
    if (gravDir > 0) {
      const dist = s.y - probeY;
      if (dist <= maxRange && dist >= -1.5 * TILE && Math.abs(dist) < bestDist) {
        bestDist = Math.abs(dist);
        best = s.y;
      }
    } else {
      const dist = probeY - (s.y + s.h);
      if (dist <= maxRange && dist >= -1.5 * TILE && Math.abs(dist) < bestDist) {
        bestDist = Math.abs(dist);
        best = s.y + s.h;
      }
    }
  }
  return best;
}