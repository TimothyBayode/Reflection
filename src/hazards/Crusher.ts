import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";

export interface CrusherCfg {
  toY: number;
  w: number;
  h: number;
  period: number;
  phase: number;
}

export class Crusher extends Hazard {
  private readonly baseY: number;
  private lastSlam = -99;

  constructor(x: number, y: number, readonly cfg: CrusherCfg) {
    super(x, y);
    this.baseY = y;
  }

  update(world: World): void {
    let u = ((world.time + this.cfg.phase) / this.cfg.period) % 1;
    if (u < 0) u += 1;
    let extent: number;
    if (u < 0.32) extent = (u / 0.32) ** 2;
    else if (u < 0.62) extent = 1;
    else extent = 1 - (1 - (1 - (u - 0.62) / 0.38)) ** 2;
    this.y = this.baseY + (this.cfg.toY - this.baseY) * extent;
    if (u >= 0.3 && u < 0.34 && world.time - this.lastSlam > 0.2) {
      this.lastSlam = world.time;
      world.events.onCrusherSlam?.();
    }
  }

  draw(ctx: CanvasRenderingContext2D, style: { hazard: string; hazardEdge: string }): void {
    ctx.fillStyle = style.hazard;
    ctx.strokeStyle = style.hazardEdge;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.cfg.w, this.cfg.h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.fillRect(this.x + 4, this.y + this.cfg.h - 8, this.cfg.w - 8, 5);
  }

  deadlyRect(): Rect { return { x: this.x, y: this.y, w: this.cfg.w, h: this.cfg.h }; }
  solidRect(): Rect | null { return null; }
  snap(): HazardSnap { return { t: 0, x: this.x, y: this.y, lastSlam: this.lastSlam }; }
  load(s: HazardSnap): void { this.x = s.x as number; this.y = s.y as number; this.lastSlam = s.lastSlam as number; }
}
