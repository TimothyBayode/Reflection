import type { LevelRules } from "../world/Rules";
import { defaultRules } from "../world/Rules";

export const GRID_WIDTH = 32;
export const GRID_HEIGHT = 18;

export interface GridPoint { x: number; y: number }
export interface GridRect extends GridPoint { w: number; h: number }

export interface StaticPlatformDef extends GridRect { kind?: "solid" | "oneway" }
export interface MovingPlatformDef extends GridRect {
  kind: "moving";
  to: GridPoint;
  speed: number;
  phase?: number;
}
export interface FallingPlatformDef extends GridRect {
  kind: "falling";
  delay: number;
  reset: number;
}
export type PlatformDef = StaticPlatformDef | MovingPlatformDef | FallingPlatformDef;

export interface SpikeDef extends GridRect { kind: "spike"; down?: boolean }
export interface BladeDef extends GridPoint {
  kind: "blade";
  to: GridPoint;
  speed: number;
  radius?: number;
  phase?: number;
}
export interface CrusherDef extends GridRect {
  kind: "crusher";
  toY: number;
  period?: number;
  phase?: number;
}
export interface LaserDef extends GridRect {
  kind: "laser";
  on: number;
  off: number;
  phase?: number;
}
export type HazardDef = SpikeDef | BladeDef | CrusherDef | LaserDef;

export interface WindZoneDef extends GridRect { forceX: number; forceY?: number }
export interface BoosterZoneDef extends GridPoint { kind: "boosterJump" | "horizontalBoost" }

export interface WorldLevelDef {
  spawn: GridPoint;
  platforms: PlatformDef[];
  hazards?: HazardDef[];
  checkpoints?: GridPoint[];
  door: GridPoint;
  windZones?: WindZoneDef[];
  boosterZones?: BoosterZoneDef[];
  gravity?: 1 | -1;
  timeScale?: number;
  momentum?: number;
}

export interface LevelDef {
  id: number;
  world: number;
  name: string;
  difficulty: number;
  rules: Partial<LevelRules>;
  reality: WorldLevelDef;
  reflection: WorldLevelDef;
  intendedRoute: string;
  requiredMechanics: string[];
  switchPoints: string[];
}

export function finalRules(def: LevelDef): LevelRules {
  return { ...defaultRules(), ...def.rules };
}
