import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";
import { TILE } from "../core/types";

const TRIGGER_DELAY = 0.16;
const FALL_ACC = 1700;
const RESPAWN_TIME = 1.6;

type State = "idle" | "shake" | "fall" | "gone";

/** Platform that falls away shortly after being stood on, then respawns. */
export class FallingPlatform extends Hazard {
  startY: number;
  state: State = "idle";
  timer = 0;
  vy = 0;
  broken = 0;

  constructor(x: number, y: number) {
    super(x, y);
    this.startY = y;
  }

  update(world: World, dt: number): void {
    this.timer += dt;
    const p = world.player;

    switch (this.state) {
      case "idle": {
        const rect = this.solidRect()!;
        const standing =
          p.bottom() >= rect.y - 1 && p.bottom() <= rect.y + 12 && p.x < rect.x + rect.w && p.x + p.w > rect.x;
        if (standing && p.grounded) {
          this.state = "shake";
          this.timer = 0;
          world.events.onPlatformRumble?.();
        }
        break;
      }
      case "shake": {
        this.broken = Math.min(1, this.timer / TRIGGER_DELAY);
        if (this.timer >= TRIGGER_DELAY) {
          this.state = "fall";
          this.vy = 0;
          world.events.onPlatformBreak?.();
        }
        break;
      }
      case "fall": {
        this.vy += FALL_ACC * dt;
        this.y += this.vy * dt;
        this.carryDY = this.vy * dt;
        if (this.y > world.levelH + 200) {
          this.state = "gone";
          this.timer = 0;
        }
        break;
      }
      case "gone": {
        if (this.timer >= RESPAWN_TIME) {
          this.state = "idle";
          this.y = this.startY;
          this.vy = 0;
          this.broken = 0;
          this.timer = 0;
        }
        break;
      }
    }
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
    if (this.broken > 0) {
      ctx.strokeStyle = "#ff7043";
      ctx.lineWidth = 1.5;
      const n = Math.floor(this.broken * 5);
      for (let i = 0; i < n; i++) {
        const cx = this.x + 8 + i * 12;
        ctx.beginPath();
        ctx.moveTo(cx, this.y + 2);
        ctx.lineTo(cx + 4, this.y + 2 + this.broken * 3);
        ctx.lineTo(cx + 9, this.y + 3 + this.broken * 4);
        ctx.stroke();
      }
    }
  }

  solidRect(): Rect | null {
    if (this.state === "fall" || this.state === "shake") return { x: this.x, y: this.y, w: TILE * 2, h: 16 };
    if (this.state === "idle") return { x: this.x, y: this.y, w: TILE * 2, h: 16 };
    return null;
  }

  deadlyRect(): Rect | null {
    return null;
  }

  snap(): HazardSnap {
    return { t: 0, state: this.state, y: this.y, vy: this.vy, timer: this.timer };
  }

  load(snap: HazardSnap): void {
    this.state = snap.state as State;
    this.y = snap.y as number;
    this.vy = snap.vy as number;
    this.timer = snap.timer as number;
    this.broken = this.state === "shake" ? 1 : 0;
  }
}