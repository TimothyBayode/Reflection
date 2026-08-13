import type { World } from "../world/World";
import type { WorldRole } from "../world/Rules";
import type { Rect } from "../core/types";
import { clamp, TAU, TILE } from "../core/types";
import { makeStyles } from "../hazards/Hazard";

interface Camera {
  x: number;
  y: number;
}

export interface RenderState {
  reality: World;
  reflection: World;
  active: WorldRole;
  doorClose: number;
  swapT: number;
  shake: number;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  width = 1;
  height = 1;
  floatRect: Rect = { x: 12, y: 12, w: 240, h: 135 };

  private styles = makeStyles();
  private cameras: Record<WorldRole, Camera> = {
    reality: { x: 480, y: 288 },
    reflection: { x: 480, y: 288 },
  };

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D is unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = Math.max(1, window.innerWidth);
    this.height = Math.max(1, window.innerHeight);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fw = clamp(this.width * 0.28, 180, 350);
    this.floatRect = {
      x: 10,
      y: 38,
      w: fw,
      h: fw * 0.5625,
    };
  }

  resetCameras(reality: World, reflection: World): void {
    this.cameras.reality = { x: reality.player.centerX(), y: reality.player.centerY() };
    this.cameras.reflection = { x: reflection.player.centerX(), y: reflection.player.centerY() };
  }

  updateCameras(state: RenderState, dt: number): void {
    for (const role of ["reality", "reflection"] as const) {
      const world = state[role];
      const cam = this.cameras[role];
      const targetX = world.player.centerX();
      const targetY = world.player.centerY();
      const follow = 1 - Math.exp(-dt * 8);
      cam.x += (targetX - cam.x) * follow;
      cam.y += (targetY - cam.y) * follow;
      cam.x = clamp(cam.x, 0, world.levelW);
      cam.y = clamp(cam.y, 0, world.levelH);
    }
  }

  render(state: RenderState): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(ctx.getTransform());
    ctx.clearRect(0, 0, this.width, this.height);

    const inactive: WorldRole = state.active === "reality" ? "reflection" : "reality";
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    this.drawViewport(state[state.active], { x: shakeX, y: shakeY, w: this.width, h: this.height }, false, state.doorClose);
    this.drawViewport(state[inactive], this.floatRect, true, state.doorClose);

    ctx.strokeStyle = inactive === "reflection" ? "rgba(89,224,255,.9)" : "rgba(255,179,92,.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.floatRect.x, this.floatRect.y, this.floatRect.w, this.floatRect.h);

    if (state.swapT > 0) {
      const t = state.swapT;
      const cx = this.floatRect.x + this.floatRect.w / 2;
      const cy = this.floatRect.y + this.floatRect.h / 2;
      ctx.strokeStyle = `rgba(150,235,255,${1 - t})`;
      ctx.lineWidth = 4 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 40 + t * Math.max(this.width, this.height), 0, TAU);
      ctx.stroke();
      ctx.fillStyle = `rgba(190,240,255,${0.12 * (1 - t)})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.restore();
  }

  private drawViewport(world: World, rect: Rect, floating: boolean, doorClose: number): void {
    const ctx = this.ctx;
    const style = this.styles[world.role];
    const zoom = floating
      ? Math.min(rect.w / 630, rect.h / 370)
      : Math.max(rect.h / 700, Math.min(rect.w / 1180, 1.55));
    const visibleW = rect.w / zoom;
    const visibleH = rect.h / zoom;
    const cam = this.cameras[world.role];
    const cx = clamp(cam.x, visibleW / 2, Math.max(visibleW / 2, world.levelW - visibleW / 2));
    const cy = clamp(cam.y, visibleH / 2, Math.max(visibleH / 2, world.levelH - visibleH / 2));

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    const bg = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    if (world.role === "reality") {
      bg.addColorStop(0, "#9fb8d8");
      bg.addColorStop(0.62, "#dce2e7");
      bg.addColorStop(1, "#b9aa91");
    } else {
      bg.addColorStop(0, "#080b22");
      bg.addColorStop(0.62, "#12183d");
      bg.addColorStop(1, "#24123a");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    this.drawGrid(ctx, world, cx, cy, visibleW, visibleH);
    for (const solid of world.solids) this.drawSolid(ctx, solid, style);
    this.drawZones(ctx, world);
    for (const portal of world.portals) this.drawPortal(ctx, portal, world.time, style.accent);
    for (const hazard of world.hazards) hazard.draw(ctx, style, world.time);
    this.drawDoor(ctx, world.doorRect, world.role, doorClose);
    world.player.draw(
      ctx,
      world.role === "reality"
        ? { body: "#e4574e", glow: "#fff0df", dark: "#37262b" }
        : { body: "#58dff7", glow: "#d6fbff", dark: "#152052" },
      world.time
    );
    ctx.restore();

    if (world.rules.darkness) this.drawDarkness(rect, world, cx, cy, zoom);
    if (world.role === "reflection") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      ctx.fillStyle = "rgba(70,55,150,.07)";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D, world: World, cx: number, cy: number, vw: number, vh: number): void {
    const left = Math.floor((cx - vw / 2) / 96) * 96;
    const top = Math.floor((cy - vh / 2) / 96) * 96;
    ctx.strokeStyle = world.role === "reality" ? "rgba(50,65,85,.09)" : "rgba(100,140,255,.09)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = left; x < cx + vw / 2 + 96; x += 96) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + vh + 192);
    }
    for (let y = top; y < cy + vh / 2 + 96; y += 96) {
      ctx.moveTo(left, y);
      ctx.lineTo(left + vw + 192, y);
    }
    ctx.stroke();
  }

  private drawSolid(ctx: CanvasRenderingContext2D, solid: { x: number; y: number; w: number; h: number; oneway: boolean }, style: ReturnType<typeof makeStyles>[WorldRole]): void {
    if (solid.oneway) {
      ctx.fillStyle = style.platformEdge;
      ctx.fillRect(solid.x + 2, solid.y, solid.w - 4, solid.h);
      ctx.fillStyle = style.platformTop;
      ctx.fillRect(solid.x + 2, solid.y, solid.w - 4, 3);
      return;
    }
    ctx.fillStyle = style.platform;
    ctx.fillRect(solid.x + 1, solid.y + 1, solid.w - 2, solid.h - 2);
    ctx.strokeStyle = style.platformEdge;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(solid.x + 1, solid.y + 1, solid.w - 2, solid.h - 2);
    ctx.fillStyle = style.platformTop;
    ctx.fillRect(solid.x + 2, solid.y + 2, solid.w - 4, 4);
  }

  private drawDoor(ctx: CanvasRenderingContext2D, door: Rect, role: WorldRole, close: number): void {
    if (door.w <= 0 || door.h <= 0) return;
    const frame = role === "reality" ? "#655849" : "#557ee7";
    const fill = role === "reality" ? "#f1b463" : "#4de2ff";
    ctx.fillStyle = frame;
    ctx.fillRect(door.x - 5, door.y - 5, door.w + 10, door.h + 5);
    ctx.fillStyle = "rgba(5,8,20,.85)";
    ctx.fillRect(door.x + 4, door.y + 4, door.w - 8, door.h - 4);
    ctx.fillStyle = fill;
    const panelH = Math.max(5, door.h * close);
    ctx.fillRect(door.x + 7, door.y + 5, door.w - 14, panelH);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(door.x + door.w * 0.72, door.y + door.h * 0.56, 4, 0, TAU);
    ctx.fill();
  }

  private drawPortal(ctx: CanvasRenderingContext2D, portal: Rect, time: number, accent: string): void {
    const cx = portal.x + portal.w / 2;
    const cy = portal.y + portal.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 1.4);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, portal.w * 0.38, portal.h * 0.48, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.rotate(-time * 2.7);
    ctx.strokeRect(-portal.w * 0.25, -portal.h * 0.25, portal.w * 0.5, portal.h * 0.5);
    ctx.restore();
  }

  private drawZones(ctx: CanvasRenderingContext2D, world: World): void {
    for (const zone of world.windZones) {
      ctx.fillStyle = world.role === "reality" ? "rgba(80,140,190,.07)" : "rgba(110,110,255,.09)";
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.strokeStyle = world.role === "reality" ? "rgba(60,110,160,.28)" : "rgba(130,150,255,.32)";
      ctx.lineWidth = 2;
      const direction = Math.sign(zone.forceX) || 1;
      for (let y = zone.y + 28; y < zone.y + zone.h; y += 54) {
        for (let x = zone.x + 20; x < zone.x + zone.w; x += 82) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + direction * 26, y);
          ctx.lineTo(x + direction * 18, y - 6);
          ctx.moveTo(x + direction * 26, y);
          ctx.lineTo(x + direction * 18, y + 6);
          ctx.stroke();
        }
      }
    }
    for (const zone of world.boosterZones) {
      const index = world.boosterZones.indexOf(zone);
      if (zone.kind === "boosterJump" && world.collectedBoosterZones.has(index)) continue;
      const vertical = zone.kind === "boosterJump";
      ctx.fillStyle = vertical ? "rgba(86,235,255,.2)" : "rgba(255,180,75,.2)";
      ctx.strokeStyle = vertical ? "#59e0ff" : "#ffb35c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(zone.x + TILE / 2, zone.y + TILE / 2, 12, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(vertical ? "BJ" : "HB", zone.x + TILE / 2, zone.y + TILE / 2 + 4);
    }

    if (world.superJumpReady) {
      const x = world.player.centerX();
      const y = world.player.y - 12;
      ctx.strokeStyle = "#8ff5ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 7 + Math.sin(world.time * 7) * 2, 0, TAU);
      ctx.stroke();
    }
  }

  private drawDarkness(rect: Rect, world: World, cx: number, cy: number, zoom: number): void {
    const px = rect.x + rect.w / 2 + (world.player.centerX() - cx) * zoom;
    const py = rect.y + rect.h / 2 + (world.player.centerY() - cy) * zoom;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const g = ctx.createRadialGradient(px, py, 45, px, py, Math.min(260, rect.w * 0.45));
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.55, "rgba(1,2,10,.18)");
    g.addColorStop(1, "rgba(1,2,10,.94)");
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}
