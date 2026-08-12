import type { World } from "../world/World";
import type { Rect } from "../core/types";

/**
 * Base class for all dynamic world entities (hazards and dynamic solids).
 */
export abstract class Hazard {
  x: number;
  y: number;

  /* world-space movement applied this frame (used for player carry) */
  carryDX = 0;
  carryDY = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  abstract update(world: World, dt: number): void;

  abstract draw(ctx: CanvasRenderingContext2D, style: WorldStyle, time: number): void;

  /** Lethal zone, or null when harmless. */
  abstract deadlyRect(): Rect | null;

  /** Lethal circle (blades), or null. */
  deadlyCircle(): { cx: number; cy: number; r: number } | null {
    return null;
  }

  /** Collision rect when the hazard acts as a solid platform, or null. */
  abstract solidRect(): Rect | null;

  abstract snap(): HazardSnap;

  abstract load(snap: HazardSnap): void;
}

export interface HazardSnap {
  t: number;
  [k: string]: unknown;
}

export interface WorldStyle {
  role: "reality" | "reflection";
  platform: string;
  platformEdge: string;
  platformTop: string;
  hazard: string;
  hazardEdge: string;
  accent: string;
}

export interface StyleSet {
  reality: WorldStyle;
  reflection: WorldStyle;
}

export function makeStyles(): StyleSet {
  return {
    reality: {
      role: "reality",
      platform: "#d9d2c0",
      platformEdge: "#8a8371",
      platformTop: "#f5efe0",
      hazard: "#93a0b1",
      hazardEdge: "#5c6675",
      accent: "#e2574c",
    },
    reflection: {
      role: "reflection",
      platform: "#131c42",
      platformEdge: "#5d7fd6",
      platformTop: "#2b3f86",
      hazard: "#8f2f7e",
      hazardEdge: "#ff56e4",
      accent: "#59e0ff",
    },
  };
}