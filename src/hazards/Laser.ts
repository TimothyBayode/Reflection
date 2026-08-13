import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";

export interface LaserCfg { w: number; h: number; on: number; off: number; phase: number }

export class Laser extends Hazard {
  private active = false;
  private charging = false;
  private lastState = "off";

  constructor(x: number, y: number, readonly cfg: LaserCfg) { super(x, y); }

  update(world: World): void {
    const charge = Math.min(0.3, this.cfg.off * 0.35);
    const period = this.cfg.on + this.cfg.off;
    const t = (world.time + this.cfg.phase) % period;
    this.active = t >= this.cfg.off;
    this.charging = !this.active && t >= this.cfg.off - charge;
    const state = this.active ? "on" : this.charging ? "charge" : "off";
    if (state !== this.lastState) {
      if (state === "charge") world.events.onLaserCharge?.();
      if (state === "on") world.events.onLaserFire?.();
      this.lastState = state;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active && !this.charging) return;
    ctx.fillStyle = this.active ? "rgba(255,92,62,.35)" : "rgba(255,188,80,.22)";
    ctx.fillRect(this.x, this.y, this.cfg.w, this.cfg.h);
    ctx.fillStyle = this.active ? "#fff1db" : "rgba(255,210,120,.75)";
    if (this.cfg.w <= this.cfg.h) ctx.fillRect(this.x + this.cfg.w / 2 - 2, this.y, 4, this.cfg.h);
    else ctx.fillRect(this.x, this.y + this.cfg.h / 2 - 2, this.cfg.w, 4);
  }

  deadlyRect(): Rect | null { return this.active ? { x: this.x, y: this.y, w: this.cfg.w, h: this.cfg.h } : null; }
  solidRect(): Rect | null { return null; }
  snap(): HazardSnap { return { t: 0, active: this.active, charging: this.charging, lastState: this.lastState }; }
  load(s: HazardSnap): void {
    this.active = s.active as boolean;
    this.charging = s.charging as boolean;
    this.lastState = s.lastState as string;
  }
}
