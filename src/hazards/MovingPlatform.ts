import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";
import { TILE } from "../core/types";

export interface MoveCfg {
  axis: "x" | "y";
  range: number;
  speed: number;
  phase: number;
}

/** Solid platform gliding along a line segment; carries the player. */
export class MovingPlatform extends Hazard {
  cfg: MoveCfg;
  baseX: number;
  baseY: number;

  constructor(x: number, y: number, cfg: MoveCfg) {
    super(x, y);
    this.cfg = cfg;
    this.baseX = x;
    this.baseY = y;
  }

  private ease(t: number): number {
    return t * t * (3 - 2 * t);
  }

  private offset(world: World): number {
    const { range, speed, phase } = this.cfg;
    const period = (2 * range) / Math.max(1, speed);
    let u = ((world.time + phase) / period) % 1;
    if (u < 0) u += 1;
    u = world.reversalMul < 0 ? 1 - u : u;
    const tri = u < 0.5 ? this.ease(u * 2) : 1 - this.ease((u - 0.5) * 2);
    return tri * range;
  }

  update(world: World, dt: number): void {
    const px = this.x;
    const py = this.y;
    const off = this.offset(world);
    this.x = this.baseX + (this.cfg.axis === "x" ? off : 0);
    this.y = this.baseY + (this.cfg.axis === "y" ? off : 0);
    this.carryDX = this.x - px;
    this.carryDY = this.y - py;
    void dt;
  }

  draw(ctx: CanvasRenderingContext2D, style: { platform: string; platformEdge: string; platformTop: string }): void {
    const w = TILE * 2;
    const h = 16;
    ctx.fillStyle = style.platformEdge;
    ctx.fillRect(this.x, this.y, w, h);
    ctx.fillStyle = style.platform;
    ctx.fillRect(this.x + 2, this.y, w - 4, h - 2);
    ctx.fillStyle = style.platformTop;
    ctx.fillRect(this.x + 2, this.y, w - 4, 4);
    /* glider nubs */
    ctx.fillStyle = style.platformEdge;
    ctx.fillRect(this.x + 6, this.y + h - 3, 6, 3);
    ctx.fillRect(this.x + w - 12, this.y + h - 3, 6, 3);
  }

  solidRect(): Rect {
    return { x: this.x, y: this.y, w: TILE * 2, h: 16 };
  }

  deadlyRect(): Rect | null {
    return null;
  }

  snap(): HazardSnap {
    return { t: 0 };
  }

  load(): void {
    /* t-driven */
  }
}