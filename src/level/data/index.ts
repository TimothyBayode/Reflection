import type { LevelDef } from "../LevelData";
import { WORLD1 } from "./levels1";
import { WORLD2 } from "./levels1";
import { WORLD3 } from "./levels2";
import { WORLD4 } from "./levels2";
import { WORLD5 } from "./levels3";

export const LEVELS: LevelDef[] = [
  ...WORLD1,
  ...WORLD2,
  ...WORLD3,
  ...WORLD4,
  ...WORLD5,
];

export const WORLD_NAMES = [
  "Mirror",
  "Physics",
  "Hazards",
  "Reality",
  "Paradox",
];

export function worldName(world: number): string {
  return WORLD_NAMES[world - 1] ?? "Unknown";
}

export function getLevel(id: number): LevelDef {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Level ${id} not found`);
  return level;
}