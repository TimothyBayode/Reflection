import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";
import { TAU } from "../core/types";

export interface BladeCfg {
  toX: number;
  toY: number;
  speed: number;
  radius: number;
  phase: number;
}

export class Blade extends Hazard {
  private readonly baseX: number;
  private readonly baseY: number;

  constructor(x: number, y: number, readonly cfg: BladeCfg) {
    super(x, y);
    this.baseX = x;
    this.baseY = y;
  }

  update(world: World): void {
    const distance = Math.hypot(this.cfg.toX - this.baseX, this.cfg.toY - this.baseY);
    const period = (2 * distance) / Math.max(1, this.cfg.speed);
    let u = period > 0 ? (world.time / period + this.cfg.phase) % 1 : 0;
    if (u < 0) u += 1;
    const triangle = u < 0.5 ? u * 2 : 2 - u * 2;
    const eased = triangle * triangle * (3 - 2 * triangle);
    this.x = this.baseX + (this.cfg.toX - this.baseX) * eased;
    this.y = this.baseY + (this.cfg.toY - this.baseY) * eased;
  }

  draw(ctx: CanvasRenderingContext2D, style: { hazard: string; hazardEdge: string }, time: number): void {
    const r = this.cfg.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = style.hazard;
    ctx.strokeStyle = style.hazardEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = time * 9 + (i * TAU) / 8;
      ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
      ctx.lineTo(Math.cos(a + TAU / 16) * r, Math.sin(a + TAU / 16) * r);
      ctx.lineTo(Math.cos(a + TAU / 8) * r * 0.55, Math.sin(a + TAU / 8) * r * 0.55);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#eaf2ff";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  deadlyRect(): Rect | null { return null; }
  deadlyCircle(): { cx: number; cy: number; r: number } { return { cx: this.x, cy: this.y, r: this.cfg.radius * 0.86 }; }
  solidRect(): Rect | null { return null; }
  snap(): HazardSnap { return { t: 0, x: this.x, y: this.y }; }
  load(s: HazardSnap): void { this.x = s.x as number; this.y = s.y as number; }
}
