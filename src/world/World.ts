import { Player } from "../player/Player";
import { Hazard } from "../hazards/Hazard";
import type { LevelRules, WorldRules } from "./Rules";
import { resolveRules } from "./Rules";
import type { WorldRole } from "./Rules";
import type { InputManager } from "../core/Input";
import { TILE, LEVEL_H, FALL_MARGIN } from "../core/types";
import type { Rect } from "../core/types";

export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
  oneway: boolean;
}

export interface WorldEvents {
  onJump?: () => void;
  onLand?: (impactSpeed: number) => void;
  onCrouch?: () => void;
  onLaserCharge?: () => void;
  onLaserFire?: () => void;
  onCrusherSlam?: () => void;
  onPlatformBreak?: () => void;
  onPlatformRumble?: () => void;
}

export interface WorldSnapshot {
  time: number;
  checkpointIndex: number;
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    crouching: boolean;
    face: number;
  };
  hazards: ReturnType<Hazard["snap"]>[];
}

const GAP_EPS = 0.6;

export class World {
  role: WorldRole;
  levelId: number;
  levelRules: LevelRules;
  rules: WorldRules;
  solids: Solid[] = [];
  hazards: Hazard[] = [];
  portals: Rect[] = [];
  player!: Player;
  wind = { x: 0, y: 0 };
  time = 0;
  reversalMul = 1;
  levelW = 0;
  levelH = LEVEL_H;
  doorRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  spawnX = 0;
  spawnY = 0;
  checkpointIndex = 0;
  checkpointX = 0;
  checkpointY = 0;
  events: WorldEvents = {};

  constructor(role: WorldRole, levelId: number, levelRules: LevelRules) {
    this.role = role;
    this.levelId = levelId;
    this.levelRules = levelRules;
    this.rules = resolveRules(levelRules, role);
  }

  setSpawn(x: number, y: number): void {
    this.spawnX = x;
    this.spawnY = y;
    this.player = new Player(x, y);
    this.checkpointX = x;
    this.checkpointY = y;
  }

  setCheckpoint(x: number, y: number, index: number): void {
    if (index <= this.checkpointIndex) return;
    this.checkpointIndex = index;
    this.checkpointX = x;
    this.checkpointY = y;
  }

  update(dt: number, input: InputManager): void {
    this.time += dt;

    const rev = this.levelRules.reversal;
    this.reversalMul = rev > 0 && Math.floor(this.time / rev) % 2 === 1 ? -1 : 1;

    for (const h of this.hazards) h.update(this, dt);
    this.player.update(dt, input, this);
  }

  movePlayer(p: Player, dt: number): void {
    /* carry from standing platform */
    if (p.standingOn && "carryDX" in p.standingOn) {
      const hp = p.standingOn as unknown as { carryDX: number; carryDY: number };
      p.x += hp.carryDX;
      p.y += hp.carryDY;
    }

    const gravDir = this.rules.gravMul;

    /* ---- horizontal ---- */
    p.x += p.vx * dt;
    const sl = this.solidsAt();
    for (const s of sl) {
      if (s.oneway) continue;
      if (p.y + p.h > s.y + GAP_EPS && p.y < s.y + s.h - GAP_EPS) {
        if (p.vx > 0 && p.x + p.w > s.x && p.x + p.w - p.vx * dt <= s.x) {
          p.x = s.x - p.w;
          p.vx = 0;
        } else if (p.vx < 0 && p.x < s.x + s.w && p.x - p.vx * dt >= s.x + s.w) {
          p.x = s.x + s.w;
          p.vx = 0;
        }
      }
    }
    p.x = Math.max(0, Math.min(this.levelW - p.w, p.x));

    /* ---- vertical ---- */
    const prevTop = p.y;
    const prevBottom = p.y + p.h;
    p.y += p.vy * dt;

    const moveTowardSupport = p.vy * gravDir >= 0;
    for (const s of sl) {
      const horizOverlap = p.x + p.w > s.x + GAP_EPS && p.x < s.x + s.w - GAP_EPS;
      if (!horizOverlap) continue;
      const fromSupportSide = gravDir > 0 ? prevBottom <= s.y + GAP_EPS : prevTop >= s.y + s.h - GAP_EPS;
      if (s.oneway && !(moveTowardSupport && fromSupportSide)) continue;
      if (p.vy * gravDir > 0) {
        if (gravDir > 0 && p.bottom() > s.y && prevBottom <= s.y) {
          p.y = s.y - p.h;
          p.vy = 0;
        } else if (gravDir < 0 && p.y < s.y + s.h && prevTop >= s.y + s.h) {
          p.y = s.y + s.h;
          p.vy = 0;
        }
      } else {
        /* moving against gravity - could hit the other side */
        const ceiling = gravDir > 0;
        if (ceiling && p.y < s.y + s.h && prevTop >= s.y + s.h && !s.oneway) {
          p.y = s.y + s.h;
          p.vy = 0;
        } else if (!ceiling && p.bottom() > s.y && prevBottom <= s.y && !s.oneway) {
          p.y = s.y - p.h;
          p.vy = 0;
        }
      }
    }

    /* ---- grounded / standing detection ---- */
    p.grounded = false;
    p.standingOn = null;
    for (const h of this.hazards) {
      const r = h.solidRect();
      if (!r) continue;
      if (gravDir > 0) {
        if (Math.abs(p.bottom() - r.y) <= 5 && p.x + p.w > r.x + 2 && p.x < r.x + r.w - 2 && p.vy >= 0) {
          p.grounded = true;
          p.standingOn = h as Player["standingOn"];
        }
      } else {
        if (Math.abs(p.y - (r.y + r.h)) <= 5 && p.x + p.w > r.x + 2 && p.x < r.x + r.w - 2 && p.vy <= 0) {
          p.grounded = true;
          p.standingOn = h as Player["standingOn"];
        }
      }
    }
    for (const s of sl) {
      if (gravDir > 0) {
        if (Math.abs(p.bottom() - s.y) <= 5 && p.x + p.w > s.x + 2 && p.x < s.x + s.w - 2) {
          p.grounded = true;
        }
      } else if (Math.abs(p.y - (s.y + s.h)) <= 5 && p.x + p.w > s.x + 2 && p.x < s.x + s.w - 2) {
        p.grounded = true;
      }
    }
  }

  rectFree(x: number, y: number, w: number, h: number): boolean {
    for (const s of this.solidsAt()) {
      if (s.oneway) continue;
      if (x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y) return false;
    }
    return true;
  }

  outOfBounds(p: Player): boolean {
    return p.y > this.levelH + FALL_MARGIN || p.y < -FALL_MARGIN;
  }

  laserBeamRect(ex: number, ey: number, dir: "u" | "d" | "l" | "r"): Rect | null {
    const cx = ex + TILE / 2;
    const cy = ey + TILE / 2;
    const step = 4;
    let x = cx;
    let y = cy;

    while (true) {
      if (dir === "r") x += step;
      else if (dir === "l") x -= step;
      else if (dir === "d") y += step;
      else y -= step;

      if (x < 0 || x > this.levelW || y < 0 || y > this.levelH) break;
      const probe = { x: x - 4, y: y - 4, w: 8, h: 8 };
      if (this.blocks(probe)) break;

      const doorBlock = this.coversDoor(x, y);
      if (doorBlock) break;
    }

    const thickness = 10;
    if (dir === "r") return { x: cx + TILE / 2 - 2, y: cy - thickness / 2, w: x - (cx + TILE / 2) + 2, h: thickness };
    if (dir === "l") return { x: x, y: cy - thickness / 2, w: cx - TILE / 2 - x + 2, h: thickness };
    if (dir === "d") return { x: cx - thickness / 2, y: cy + TILE / 2 - 2, w: thickness, h: y - (cy + TILE / 2) + 2 };
    return { x: cx - thickness / 2, y, w: thickness, h: cy - TILE / 2 - y + 2 };
  }

  private coversDoor(x: number, y: number): boolean {
    if (this.doorRect.w <= 0) return false;
    return x > this.doorRect.x - 4 && x < this.doorRect.x + this.doorRect.w + 4 && y > this.doorRect.y - 4 && y < this.doorRect.y + this.doorRect.h + 4;
  }

  private blocks(probe: { x: number; y: number; w: number; h: number }): boolean {
    for (const s of this.solidsAt()) {
      if (s.oneway) continue;
      if (
        probe.x < s.x + s.w &&
        probe.x + probe.w > s.x &&
        probe.y < s.y + s.h &&
        probe.y + probe.h > s.y
      ) {
        return true;
      }
    }
    return false;
  }

  private solidsAt(): Solid[] {
    const list = [...this.solids];
    for (const h of this.hazards) {
      const r = h.solidRect();
      if (r) list.push({ x: r.x, y: r.y, w: r.w, h: r.h, oneway: false });
    }
    return list;
  }

  deadlyTests(): { rect: Rect }[] {
    return this.hazards
      .map((h) => h.deadlyRect())
      .filter((r): r is Rect => r !== null)
      .map((rect) => ({ rect }));
  }

  bladeCircles(): { cx: number; cy: number; r: number }[] {
    const out: { cx: number; cy: number; r: number }[] = [];
    for (const h of this.hazards) {
      const c = h.deadlyCircle();
      if (c) out.push(c);
    }
    return out;
  }

  snap(): WorldSnapshot {
    return {
      time: this.time,
      checkpointIndex: this.checkpointIndex,
      player: {
        x: this.player.x,
        y: this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        crouching: this.player.crouching,
        face: this.player.face,
      },
      hazards: this.hazards.map((h) => h.snap()),
    };
  }

  restore(s: WorldSnapshot): void {
    this.time = s.time;
    this.checkpointIndex = s.checkpointIndex;
    const p = this.player;
    p.x = s.player.x;
    p.y = s.player.y;
    p.vx = s.player.vx;
    p.vy = s.player.vy;
    p.crouching = s.player.crouching;
    p.h = p.crouching ? 24 : 44;
    p.face = s.player.face;
    p.state = "alive";
    p.grounded = false;
    p.standingOn = null;
    this.hazards.forEach((h, i) => h.load(s.hazards[i] ?? { t: 0 }));
  }
}
