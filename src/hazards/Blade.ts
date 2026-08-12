import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";
import { TAU, clamp } from "../core/types";

export interface BladeCfg {
  axis: "x" | "y";
  range: number;
  speed: number;
  radius: number;
  phase: number;
}

/** Rolling / sweeping blade patrolling a line segment. */
export class Blade extends Hazard {
  cfg: BladeCfg;
  baseX: number;
  baseY: number;

  constructor(x: number, y: number, cfg: BladeCfg) {
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
    let u = (world.time / period + phase) % 1;
    if (u < 0) u += 1;
    u = world.reversalMul < 0 ? 1 - u : u;
    const tri = u < 0.5 ? this.ease(u * 2) : 1 - this.ease((u - 0.5) * 2);
    return tri * range;
  }

  update(world: World, dt: number): void {
    const off = this.offset(world);
    const dx = world.rules.hazardMul * (this.cfg.axis === "x" ? off : 0);
    const dy = world.rules.hazardMul * (this.cfg.axis === "y" ? off : 0);
    this.x = this.baseX + dx;
    this.y = this.baseY + dy;
    void dt;
  }

  draw(ctx: CanvasRenderingContext2D, style: { hazard: string; hazardEdge: string }): void {
    const r = this.cfg.radius;
    const cx = this.x;
    const cy = this.y;
    const spin = performance.now() / 1000 * 9;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = style.hazard;
    ctx.strokeStyle = style.hazardEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    /* teeth */
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = spin + (i * TAU) / 8;
      ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
      ctx.lineTo(Math.cos(a + TAU / 16) * r, Math.sin(a + TAU / 16) * r);
      ctx.lineTo(Math.cos(a + TAU / 8) * r * 0.55, Math.sin(a + TAU / 8) * r * 0.55);
    }
    ctx.fill();
    ctx.stroke();
    /* hub */
    ctx.fillStyle = "#eaf2ff";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  deadlyRect(): Rect | null {
    return null;
  }

  deadlyCircle(): { cx: number; cy: number; r: number } | null {
    return { cx: this.x, cy: this.y, r: this.cfg.radius * 0.86 };
  }

  solidRect(): Rect | null {
    return null;
  }

  snap(): HazardSnap {
    return { t: 0 };
  }

  load(): void {
    void clamp;
  }
}
