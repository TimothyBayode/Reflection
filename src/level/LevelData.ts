import type { LevelRules } from "../world/Rules";
import { defaultRules } from "../world/Rules";

/**
 * Structured level definition. Maps use one character per 32px tile.
 *
 *   . empty        # solid block     ^ one-way platform
 *   S spike (up)   T spike (down)
 *   B blade (hor)  b blade (vert)
 *   C crusher (down, ceiling)   c crusher (up, floor)
 *   L laser (right)  l laser (left)  V laser (down)  U laser (up)
 *   M moving platform (hor)  m moving platform (vert)
 *   F falling platform       E vanishing platform
 *   O portal     K checkpoint     P player spawn     G door
 */
export interface LevelDef {
  id: number;
  world: number;
  name: string;
  rules?: Partial<LevelRules>;
  wind?: { x: number; y: number };
  tweaks?: Record<string, { range?: number; speed?: number; period?: number; phase?: number }>;
  map: string[];
}

export function finalRules(def: LevelDef): LevelRules {
  return { ...defaultRules(), ...(def.rules ?? {}) };
}

export function finalWind(def: LevelDef): { x: number; y: number } {
  return { x: def.wind?.x ?? 0, y: def.wind?.y ?? 0 };
}