import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";
import { TILE } from "../core/types";

const FADE_TIME = 0.32;
const GONE_TIME = 1.1;
const REAPPEAR_TIME = 0.3;

type State = "idle" | "fading" | "gone" | "reappearing";

/** Platform that vanishes shortly after being touched, then reappears. */
export class DisappearingPlatform extends Hazard {
  state: State = "idle";
  timer = 0;
  alpha = 1;
  touched = false;

  update(world: World, dt: number): void {
    const p = world.player;
    this.timer += dt;

    switch (this.state) {
      case "idle": {
        const rect = this.solidRect()!;
        if (
          p.x < rect.x + rect.w &&
          p.x + p.w > rect.x &&
          p.y < rect.y + rect.h &&
          p.y + p.h > rect.y
        ) {
          this.state = "fading";
          this.timer = 0;
          this.touched = true;
          world.events.onPlatformRumble?.();
        }
        break;
      }
      case "fading": {
        this.alpha = 1 - this.timer / FADE_TIME;
        if (this.timer >= FADE_TIME) {
          this.state = "gone";
          this.timer = 0;
          this.alpha = 0;
        }
        break;
      }
      case "gone": {
        if (this.timer >= GONE_TIME) {
          this.state = "reappearing";
          this.timer = 0;
        }
        break;
      }
      case "reappearing": {
        this.alpha = this.timer / REAPPEAR_TIME;
        if (this.timer >= REAPPEAR_TIME) {
          this.state = "idle";
          this.alpha = 1;
          this.timer = 0;
        }
        break;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, style: { platform: string; platformEdge: string; platformTop: string }): void {
    const w = TILE * 2;
    const h = 16;
    ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
    ctx.fillStyle = style.platformEdge;
    ctx.fillRect(this.x, this.y, w, h);
    ctx.fillStyle = style.platform;
    ctx.fillRect(this.x + 2, this.y, w - 4, h - 2);
    ctx.fillStyle = style.platformTop;
    ctx.fillRect(this.x + 2, this.y, w - 4, 4);
    ctx.globalAlpha = 1;
    if (this.state === "idle") {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(this.x + 4, this.y + 6, w - 8, 3);
    }
  }

  solidRect(): Rect | null {
    if (this.alpha > 0.45) return { x: this.x, y: this.y, w: TILE * 2, h: 16 };
    return null;
  }

  deadlyRect(): Rect | null {
    return null;
  }

  snap(): HazardSnap {
    return { t: 0, state: this.state, timer: this.timer, alpha: this.alpha, touched: this.touched };
  }

  load(snap: HazardSnap): void {
    this.state = snap.state as State;
    this.timer = snap.timer as number;
    this.alpha = snap.alpha as number;
    this.touched = snap.touched as boolean;
  }
}