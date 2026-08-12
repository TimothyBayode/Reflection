import { Hazard, type HazardSnap } from "./Hazard";
import type { World } from "../world/World";
import type { Rect } from "../core/types";
import { TILE } from "../core/types";

/** Static upward or downward spikes. Downward variant used for ceilings/traps. */
export class Spike extends Hazard {
  down: boolean;
  hurtW: number;
  hurtH: number;

  constructor(x: number, y: number, down = false) {
    super(x, y);
    this.down = down;
    this.hurtW = TILE - 8;
    this.hurtH = TILE - 12;
  }

  update(): void {
    /* static */
  }

  draw(ctx: CanvasRenderingContext2D, style: { hazard: string; hazardEdge: string }): void {
    const n = 4;
    const tw = TILE / n;
    ctx.fillStyle = style.hazard;
    ctx.strokeStyle = style.hazardEdge;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < n; i++) {
      const px = this.x + i * tw;
      const p1x = px + 1;
      const p2x = px + tw - 1;
      const baseY = this.down ? this.y + TILE : this.y;
      const tipY = this.down ? this.y : this.y + TILE - 1;
      ctx.beginPath();
      ctx.moveTo(p1x, baseY);
      ctx.lineTo(px + tw / 2, tipY);
      ctx.lineTo(p2x, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    /* warning sheen */
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    for (let i = 0; i < n; i++) {
      const px = this.x + i * tw;
      const mid = this.down ? this.y + TILE : this.y;
      ctx.fillRect(px + tw * 0.45, Math.min(mid, this.y + 3), 2, 6);
    }
  }

  deadlyRect(): Rect {
    if (this.down) {
      return { x: this.x + (TILE - this.hurtW) / 2, y: this.y, w: this.hurtW, h: this.hurtH };
    }
    return {
      x: this.x + (TILE - this.hurtW) / 2,
      y: this.y + TILE - this.hurtH,
      w: this.hurtW,
      h: this.hurtH,
    };
  }

  solidRect(): Rect | null {
    return null;
  }

  snap(): HazardSnap {
    return { t: 0 };
  }

  load(): void {
    /* static */
  }
}