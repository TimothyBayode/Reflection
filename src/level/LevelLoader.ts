import { World } from "../world/World";
import { Spike } from "../hazards/Spike";
import { Blade } from "../hazards/Blade";
import { Crusher } from "../hazards/Crusher";
import { Laser } from "../hazards/Laser";
import { MovingPlatform } from "../hazards/MovingPlatform";
import { FallingPlatform } from "../hazards/FallingPlatform";
import type { WorldRole } from "../world/Rules";
import type { LevelDef, WorldLevelDef } from "./LevelData";
import { finalRules, GRID_HEIGHT, GRID_WIDTH } from "./LevelData";
import { TILE } from "../core/types";

export interface CheckpointZone { x: number; y: number; w: number; h: number; index: number }
export interface LoadedLevel { world: World; checkpointZones: CheckpointZone[] }

const unit = (value: number): number => value * TILE;

export function constructWorld(level: LevelDef, role: WorldRole): LoadedLevel {
  const rules = finalRules(level);
  const data: WorldLevelDef = role === "reality" ? level.reality : level.reflection;
  const world = new World(role, level.id, rules);
  world.levelW = unit(GRID_WIDTH);
  world.levelH = unit(GRID_HEIGHT);
  world.timeScale = data.timeScale ?? 1;
  if (data.gravity) world.rules.gravMul = data.gravity;
  world.rules.momentum = data.momentum ?? world.rules.momentum;

  for (const platform of data.platforms) {
    if (platform.kind === "moving") {
      world.hazards.push(new MovingPlatform(unit(platform.x), unit(platform.y), {
        toX: unit(platform.to.x), toY: unit(platform.to.y), w: unit(platform.w), h: unit(platform.h),
        speed: platform.speed * TILE, phase: platform.phase ?? 0,
      }));
    } else if (platform.kind === "falling") {
      world.hazards.push(new FallingPlatform(unit(platform.x), unit(platform.y), unit(platform.w), unit(platform.h), platform.delay, platform.reset));
    } else {
      world.solids.push({ x: unit(platform.x), y: unit(platform.y), w: unit(platform.w), h: unit(platform.h), oneway: platform.kind === "oneway" });
    }
  }

  for (const hazard of data.hazards ?? []) {
    if (hazard.kind === "spike") {
      for (let x = hazard.x; x < hazard.x + hazard.w; x++) world.hazards.push(new Spike(unit(x), unit(hazard.y), !!hazard.down));
    } else if (hazard.kind === "blade") {
      world.hazards.push(new Blade(unit(hazard.x), unit(hazard.y), {
        toX: unit(hazard.to.x), toY: unit(hazard.to.y), speed: hazard.speed * TILE,
        radius: unit(hazard.radius ?? 0.7), phase: hazard.phase ?? 0,
      }));
    } else if (hazard.kind === "crusher") {
      world.hazards.push(new Crusher(unit(hazard.x), unit(hazard.y), {
        toY: unit(hazard.toY), w: unit(hazard.w), h: unit(hazard.h), period: hazard.period ?? 2, phase: hazard.phase ?? 0,
      }));
    } else {
      world.hazards.push(new Laser(unit(hazard.x), unit(hazard.y), {
        w: unit(hazard.w), h: unit(hazard.h), on: hazard.on, off: hazard.off, phase: hazard.phase ?? 0,
      }));
    }
  }

  world.windZones = (data.windZones ?? []).map((zone) => ({
    x: unit(zone.x), y: unit(zone.y), w: unit(zone.w), h: unit(zone.h),
    forceX: zone.forceX * 120 * world.rules.windMul,
    forceY: (zone.forceY ?? 0) * 120 * world.rules.windMul,
  }));
  world.boosterZones = (data.boosterZones ?? []).map((zone) => ({ x: unit(zone.x), y: unit(zone.y), kind: zone.kind }));
  world.doorRect = { x: unit(data.door.x), y: unit(data.door.y), w: TILE, h: TILE * 2 };
  world.setSpawn(unit(data.spawn.x) + 3, unit(data.spawn.y));

  const checkpointZones = (data.checkpoints ?? []).map((checkpoint, index) => ({
    x: unit(checkpoint.x), y: unit(checkpoint.y), w: TILE, h: TILE * 2, index: index + 1,
  }));
  return { world, checkpointZones };
}
