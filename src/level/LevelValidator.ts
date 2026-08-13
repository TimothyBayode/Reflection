import type { LevelDef, WorldLevelDef } from "./LevelData";
import { GRID_HEIGHT, GRID_WIDTH } from "./LevelData";

export interface ValidationIssue { level: number; world?: "reality" | "reflection"; message: string }

export function validateLevel(level: LevelDef): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (level.id < 1 || level.id > 30) issues.push({ level: level.id, message: "id must be 1..30" });
  validateWorld(level, "reality", level.reality, issues);
  validateWorld(level, "reflection", level.reflection, issues);
  return issues;
}

function validateWorld(level: LevelDef, role: "reality" | "reflection", world: WorldLevelDef, issues: ValidationIssue[]): void {
  const point = (x: number, y: number, name: string) => {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) issues.push({ level: level.id, world: role, message: `${name} out of bounds` });
  };
  point(world.spawn.x, world.spawn.y, "spawn");
  point(world.door.x, world.door.y, "door");
  if (!world.platforms.length) issues.push({ level: level.id, world: role, message: "world has no platforms" });
  for (const [index, platform] of world.platforms.entries()) {
    if (platform.w <= 0 || platform.h <= 0 || platform.x < 0 || platform.y < 0 || platform.x + platform.w > GRID_WIDTH || platform.y + platform.h > GRID_HEIGHT) {
      issues.push({ level: level.id, world: role, message: `platform ${index} invalid` });
    }
  }
  for (const [index, checkpoint] of (world.checkpoints ?? []).entries()) point(checkpoint.x, checkpoint.y, `checkpoint ${index}`);
}

export function validateLevels(levels: LevelDef[]): ValidationIssue[] {
  const issues = levels.flatMap(validateLevel);
  const ids = new Set(levels.map((level) => level.id));
  for (let id = 1; id <= 30; id++) if (!ids.has(id)) issues.push({ level: id, message: "missing level" });
  if (levels.length !== 30) issues.push({ level: 0, message: `expected 30 levels, received ${levels.length}` });
  return issues;
}
