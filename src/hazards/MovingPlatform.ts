import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";

export interface MoveCfg {
  toX: number;
  toY: number;
  w: number;
  h: number;
  speed: number;
  phase: number;
}

export class MovingPlatform extends Hazard {
  private readonly baseX: number;
  private readonly baseY: number;

  constructor(x: number, y: number, readonly cfg: MoveCfg) {
    super(x, y);
    this.baseX = x;
    this.baseY = y;
  }

  update(world: World): void {
    const previousX = this.x;
    const previousY = this.y;
    const distance = Math.hypot(this.cfg.toX - this.baseX, this.cfg.toY - this.baseY);
    const period = (2 * distance) / Math.max(1, this.cfg.speed);
    let u = period > 0 ? ((world.time + this.cfg.phase) / period) % 1 : 0;
    if (u < 0) u += 1;
    const triangle = u < 0.5 ? u * 2 : 2 - u * 2;
    const eased = triangle * triangle * (3 - 2 * triangle);
    this.x = this.baseX + (this.cfg.toX - this.baseX) * eased;
    this.y = this.baseY + (this.cfg.toY - this.baseY) * eased;
    this.carryDX = this.x - previousX;
    this.carryDY = this.y - previousY;
  }

  draw(ctx: CanvasRenderingContext2D, style: { platform: string; platformEdge: string; platformTop: string }): void {
    ctx.fillStyle = style.platformEdge;
    ctx.fillRect(this.x, this.y, this.cfg.w, this.cfg.h);
    ctx.fillStyle = style.platform;
    ctx.fillRect(this.x + 2, this.y + 2, this.cfg.w - 4, Math.max(1, this.cfg.h - 4));
    ctx.fillStyle = style.platformTop;
    ctx.fillRect(this.x + 2, this.y + 2, this.cfg.w - 4, Math.min(4, this.cfg.h));
  }

  solidRect(): Rect { return { x: this.x, y: this.y, w: this.cfg.w, h: this.cfg.h }; }
  deadlyRect(): Rect | null { return null; }
  snap(): HazardSnap { return { t: 0, x: this.x, y: this.y, carryDX: this.carryDX, carryDY: this.carryDY }; }
  load(s: HazardSnap): void {
    this.x = s.x as number;
    this.y = s.y as number;
    this.carryDX = s.carryDX as number;
    this.carryDY = s.carryDY as number;
  }
}
