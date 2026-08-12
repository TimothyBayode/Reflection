import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";

export interface CrusherCfg {
  axis: "y" | "x";
  range: number;
  block: number;
  period: number;
  phase: number;
  dir: 1 | -1;
}

/**
 * Heavy piston that periodically slams along an axis.
 * Component of the piston anchored at the tile cell; it extends `range`
 * pixels from the anchor and kills on contact.
 */
export class Crusher extends Hazard {
  cfg: CrusherCfg;
  baseX: number;
  baseY: number;
  private lastSlam = -99;

  constructor(x: number, y: number, cfg: CrusherCfg) {
    super(x, y);
    this.cfg = cfg;
    this.baseX = x;
    this.baseY = y;
  }

  private easeIn(t: number): number {
    return t * t;
  }

  private easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  private extent(world: World): number {
    const { period, phase, range } = this.cfg;
    let u = ((world.time + phase) / period) % 1;
    if (u < 0) u += 1;
    u = world.reversalMul < 0 ? 1 - u : u;
    /* slam (0-0.32), hold (0.32-0.62), retract (0.62-1) */
    if (u < 0.32) return this.easeIn(u / 0.32) * range;
    if (u < 0.62) return range;
    return range - this.easeOut((u - 0.62) / 0.38) * range;
  }

  update(world: World, dt: number): void {
    const ext = this.extent(world) * world.rules.hazardMul;
    const { axis, dir } = this.cfg;
    this.x = this.baseX + (axis === "x" ? ext * dir : 0);
    this.y = this.baseY + (axis === "y" ? ext * dir : 0);

    const { period, phase } = this.cfg;
    let u = ((world.time + phase) / period) % 1;
    if (u < 0) u += 1;
    u = world.reversalMul < 0 ? 1 - u : u;
    if (u >= 0.3 && u < 0.34 && world.time - this.lastSlam > 0.2) {
      this.lastSlam = world.time;
      world.events.onCrusherSlam?.();
    }
    void dt;
  }

  draw(ctx: CanvasRenderingContext2D, style: { hazard: string; hazardEdge: string }): void {
    const b = this.cfg.block;
    ctx.fillStyle = style.hazard;
    ctx.strokeStyle = style.hazardEdge;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, b, b, 4);
    ctx.fill();
    ctx.stroke();
    /* bottom plate marking */
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(this.x + 4, this.y + b - 10, b - 8, 6);
    /* warning stripes */
    ctx.strokeStyle = style.hazardEdge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x + b / 2, this.y + b - 6);
    ctx.lineTo(this.x + b / 2, this.y + b);
    ctx.stroke();
  }

  deadlyRect(): Rect {
    return { ...this.rect() };
  }

  rect(): Rect {
    const b = this.cfg.block;
    return { x: this.x, y: this.y, w: b, h: b };
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