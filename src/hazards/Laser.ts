import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";
import { TILE } from "../core/types";

export interface LaserCfg {
  dir: "u" | "d" | "l" | "r";
}

const ON_TIME = 1.0;
const CHARGE_TIME = 0.28;
const OFF_TIME = 0.55;
const PERIOD = ON_TIME + CHARGE_TIME + OFF_TIME;

export const LASER_TIMING = { ON_TIME, CHARGE_TIME, OFF_TIME, PERIOD };

/** Toggling laser beam. Deadly only while fully on; blinks while charging. */
export class Laser extends Hazard {
  cfg: LaserCfg;
  beam: Rect | null = null;
  private lastCharge = -99;
  private lastFire = -99;

  constructor(x: number, y: number, cfg: LaserCfg) {
    super(x, y);
    this.cfg = cfg;
  }

  private phaseAt(world: World): number {
    let u = (world.time / PERIOD) % 1;
    if (u < 0) u += 1;
    return world.reversalMul < 0 ? 1 - u : u;
  }

  update(world: World): void {
    const u = this.phaseAt(world);
    const state = u < OFF_TIME ? "off" : u < OFF_TIME + CHARGE_TIME ? "charge" : "on";

    if (state === "off") {
      this.beam = null;
      return;
    }
    if (state === "charge") {
      this.beam = null;
      if (world.time - this.lastCharge > 0.3) {
        this.lastCharge = world.time;
        world.events.onLaserCharge?.();
      }
      return;
    }
    if (world.time - this.lastFire > 0.3) {
      this.lastFire = world.time;
      world.events.onLaserFire?.();
    }
    this.beam = world.laserBeamRect(this.x, this.y, this.cfg.dir);
  }

  private drawBeam(ctx: CanvasRenderingContext2D, color: string, inset: number): void {
    if (!this.beam) return;
    const b = this.beam;
    const r = { x: b.x + inset, y: b.y + inset, w: b.w - inset * 2, h: b.h - inset * 2 };
    if (r.w <= 0 || r.h <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    if (r.h <= r.w) ctx.fillRect(r.x, r.y + r.h / 2 - 1, r.w, 2);
    else ctx.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
  }

  draw(ctx: CanvasRenderingContext2D, style: { hazard: string; hazardEdge: string }): void {
    const r = TILE * 0.34;
    ctx.fillStyle = style.hazard;
    ctx.strokeStyle = style.hazardEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.x + r / 2, this.y + r / 2, TILE - r, TILE - r, 4);
    ctx.fill();
    ctx.stroke();

    if (!this.beam) return;
    ctx.fillStyle = "rgba(255,120,60,0.14)";
    ctx.fillRect(this.beam.x, this.beam.y, this.beam.w, this.beam.h);
    this.drawBeam(ctx, "rgba(255,160,60,0.55)", 8);
    this.drawBeam(ctx, "#ffd28a", 3);
    this.drawBeam(ctx, "#fff4da", 1);
  }

  deadlyRect(): Rect | null {
    return this.beam;
  }

  solidRect(): Rect | null {
    return null;
  }

  snap(): HazardSnap {
    return { t: 0 };
  }

  load(): void {
    /* t-driven */
  }
}