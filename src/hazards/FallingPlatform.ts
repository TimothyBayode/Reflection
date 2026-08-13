import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";

type State = "idle" | "shake" | "fall" | "gone";

export class FallingPlatform extends Hazard {
  private readonly startY: number;
  private state: State = "idle";
  private timer = 0;
  private vy = 0;

  constructor(x: number, y: number, private w: number, private h: number, private delay: number, private reset: number) {
    super(x, y);
    this.startY = y;
  }

  update(world: World, dt: number): void {
    this.carryDX = 0;
    this.carryDY = 0;
    this.timer += dt;
    const p = world.player;
    if (this.state === "idle") {
      const standing = Math.abs(p.bottom() - this.y) <= 8 && p.x + p.w > this.x && p.x < this.x + this.w;
      if (standing && p.grounded) { this.state = "shake"; this.timer = 0; world.events.onPlatformRumble?.(); }
    } else if (this.state === "shake" && this.timer >= this.delay) {
      this.state = "fall";
      this.timer = 0;
      world.events.onPlatformBreak?.();
    } else if (this.state === "fall") {
      const oldY = this.y;
      this.vy += 1700 * dt;
      this.y += this.vy * dt;
      this.carryDY = this.y - oldY;
      if (this.y > world.levelH + 150) { this.state = "gone"; this.timer = 0; }
    } else if (this.state === "gone" && this.timer >= this.reset) {
      this.state = "idle";
      this.timer = 0;
      this.y = this.startY;
      this.vy = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, style: { platform: string; platformEdge: string; platformTop: string }): void {
    if (this.state === "gone") return;
    ctx.fillStyle = style.platformEdge;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = style.platform;
    ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, Math.max(1, this.h - 4));
    ctx.fillStyle = style.platformTop;
    ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, Math.min(4, this.h));
  }

  solidRect(): Rect | null { return this.state === "gone" ? null : { x: this.x, y: this.y, w: this.w, h: this.h }; }
  deadlyRect(): Rect | null { return null; }
  snap(): HazardSnap { return { t: 0, state: this.state, timer: this.timer, y: this.y, vy: this.vy, carryDY: this.carryDY }; }
  load(s: HazardSnap): void {
    this.state = s.state as State;
    this.timer = s.timer as number;
    this.y = s.y as number;
    this.vy = s.vy as number;
    this.carryDY = s.carryDY as number;
  }
}
