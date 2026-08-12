import { InputManager } from "../core/Input";
import type { World } from "../world/World";
import type { Hazard } from "../hazards/Hazard";
import type { Rect } from "../core/types";
import { TAU } from "../core/types";

export const GRAVITY = 2350;
export const JUMP_V = 880;
export const MAX_VX = 330;
export const CROUCH_MAX_VX = 115;
export const ACC_GROUND = 2950;
export const ACC_AIR = 2000;
export const FRIC_GROUND = 2800;
export const FRIC_AIR = 300;
export const COYOTE = 0.09;
export const JUMP_BUFFER = 0.12;
export const STAND_W = 26;
export const STAND_H = 44;
export const CROUCH_H = 24;
export const DEATH_TIME = 0.24;

export type PlayerState = "alive" | "dead";

export class Player {
  x = 0;
  y = 0;
  w = STAND_W;
  h = STAND_H;
  vx = 0;
  vy = 0;
  face = 1;

  state: PlayerState = "alive";
  deathT = 0;

  grounded = false;
  crouching = false;
  coyote = 0;
  jumpBuffer = 0;
  jumpCutUsed = false;

  standingOn: Hazard | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  bottom(): number {
    return this.y + this.h;
  }

  centerX(): number {
    return this.x + this.w / 2;
  }

  centerY(): number {
    return this.y + this.h / 2;
  }

  kill(): void {
    if (this.state !== "alive") return;
    this.state = "dead";
    this.deathT = 0;
    this.standingOn = null;
  }

  isDead(): boolean {
    return this.state === "dead";
  }

  update(dt: number, input: InputManager, world: World): void {
    if (this.state === "dead") {
      this.deathT += dt;
      return;
    }

    const rules = world.rules;
    const gravDir = rules.gravMul;
    const crouchHeld = input.down("crouch");

    /* --- crouch state (hold-based) --- */
    if (crouchHeld && this.grounded && !this.crouching) {
      this.crouching = true;
      this.h = CROUCH_H;
      world.events.onCrouch?.();
    } else if (!crouchHeld && this.crouching) {
      const standBottom = this.bottom();
      if (world.rectFree(this.x, standBottom - STAND_H, STAND_W, STAND_H)) {
        this.crouching = false;
        this.h = STAND_H;
        this.y = standBottom - STAND_H;
        world.events.onCrouch?.();
      }
    }

    /* --- horizontal movement --- */
    const rawDir = (input.down("right") ? 1 : 0) - (input.down("left") ? 1 : 0);
    const dir = rawDir * rules.moveMul;
    if (dir !== 0) this.face = dir;

    const maxSpeed = this.crouching ? CROUCH_MAX_VX : MAX_VX;
    const target = dir * maxSpeed;
    const accel = (this.grounded ? ACC_GROUND : ACC_AIR) * rules.momentum;

    if (dir !== 0) {
      const diff = target - this.vx;
      const step = accel * dt;
      this.vx += Math.max(-step, Math.min(step, diff));
      if (this.crouching && !this.grounded) this.vx *= 0.92;
    } else {
      const fric = (this.grounded ? FRIC_GROUND : FRIC_AIR) * rules.friction;
      if (Math.abs(this.vx) <= fric * dt) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * fric * dt;
    }

    /* --- wind (already rule-resolved) --- */
    this.vx += world.wind.x * dt;
    this.vy += world.wind.y * dt;

    /* --- coyote / jump buffer --- */
    if (this.grounded) this.coyote = COYOTE;
    else this.coyote -= dt;

    if (input.pressEdge("jump")) this.jumpBuffer = JUMP_BUFFER;
    else this.jumpBuffer -= dt;

    if (this.crouching && this.grounded) this.jumpBuffer = 0;

    if (this.jumpBuffer > 0 && (this.grounded || this.coyote > 0)) {
      this.vy = -gravDir * JUMP_V;
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.grounded = false;
      this.jumpCutUsed = false;
      world.events.onJump?.();
    }

    if (input.releaseEdge("jump") && !this.jumpCutUsed) {
      if (this.vy * gravDir < 0) {
        this.vy *= 0.52;
        this.jumpCutUsed = true;
      }
    }

    /* --- gravity --- */
    this.vy += GRAVITY * gravDir * dt;
    const maxFall = 1600;
    if (this.vy > maxFall) this.vy = maxFall;
    if (this.vy < -maxFall) this.vy = -maxFall;

    /* --- integrate + collide --- */
    const wasGrounded = this.grounded;
    const prevGravSpeed = this.vy * gravDir;
    world.movePlayer(this, dt);
    if (!wasGrounded && this.grounded && prevGravSpeed > 420) {
      world.events.onLand?.(prevGravSpeed);
    }
  }

  draw(ctx: CanvasRenderingContext2D, style: { body: string; glow: string; dark: string }, time: number): void {
    if (this.state === "alive") {
      const cx = this.centerX();
      const bottom = this.bottom();
      const squash = this.grounded ? 1 : 0.94;
      const bh = this.h * squash;
      const bw = this.w * (this.grounded && this.vx !== 0 ? 1.05 : 1);
      const by = bottom - bh;

      const blink = 0.55 + 0.45 * Math.sin(time * 4);
      ctx.fillStyle = style.body;
      ctx.strokeStyle = style.glow;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, by, bw, bh, 7);
      ctx.fill();
      ctx.globalAlpha = 0.5 + 0.5 * blink;
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* visor */
      const eyeY = by + bh * 0.34;
      const eyeX = cx + this.face * (bw * 0.2);
      ctx.fillStyle = style.dark;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 4.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = style.glow;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 4.5, 0, TAU);
      ctx.stroke();
    } else {
      /* collapse into a dot */
      const t = this.deathT / DEATH_TIME;
      const cx = this.centerX();
      const cy = this.centerY();
      const r = Math.max(0.5, 9 * (1 - t));
      ctx.globalAlpha = Math.max(0, 1 - t * 1.2);
      ctx.fillStyle = style.body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}