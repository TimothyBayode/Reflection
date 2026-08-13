import { GameLoop } from "./GameLoop";
import { InputManager } from "./Input";
import { AudioManager } from "./Audio";
import { SaveManager } from "./Save";
import { SettingsManager } from "./Settings";
import type { SettingsData } from "./Settings";
import { circleRectOverlap, rectsOverlap } from "./types";
import { Renderer } from "../render/Renderer";
import { UI } from "../ui/UI";
import type { World, WorldSnapshot } from "../world/World";
import type { WorldRole } from "../world/Rules";
import { constructWorld, type CheckpointZone } from "../level/LevelLoader";
import { getLevel, worldName } from "../level/data";
import { LEVELS } from "../level/data";
import { validateLevels } from "../level/LevelValidator";
import { DebugOverlay } from "./DebugOverlay";
import { DEATH_TIME } from "../player/Player";
import { ImmersiveManager } from "./Immersive";

type Phase = "menu" | "levels" | "playing" | "paused" | "settings" | "dying" | "completing" | "end";

interface SnapshotPair {
  reality: WorldSnapshot;
  reflection: WorldSnapshot;
}

export class Game {
  private loop = new GameLoop();
  private input = new InputManager();
  private audio = new AudioManager();
  private save = new SaveManager();
  private settings = new SettingsManager();
  private renderer: Renderer;
  private ui: UI;
  private immersive: ImmersiveManager;
  private debug = new DebugOverlay();

  private phase: Phase = "menu";
  private settingsReturn: "menu" | "pause" = "menu";
  private reality: World | null = null;
  private reflection: World | null = null;
  private checkpointZones: Record<WorldRole, CheckpointZone[]> = { reality: [], reflection: [] };
  private active: WorldRole = "reality";
  private levelId = 1;
  private lives = 3;
  private elapsedMs = 0;
  private checkpointSnapshot: SnapshotPair | null = null;
  private deathElapsed = 0;
  private completeElapsed = 0;
  private doorClose = 0;
  private swapElapsed = 1;
  private shake = 0;
  private portalCooldown = 0;
  private pausedByRotation = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.ui = new UI(this.input);
    this.immersive = new ImmersiveManager(document.querySelector<HTMLElement>("#game-wrap")!);
  }

  start(): void {
    if (import.meta.env.DEV) {
      const issues = validateLevels(LEVELS);
      if (issues.length) throw new Error(`Invalid level data:\n${issues.map((issue) => `L${issue.level} ${issue.world ?? ""}: ${issue.message}`).join("\n")}`);
    }
    this.settings.load();
    this.save.load();
    this.ui.applySettings(this.settings.get());
    this.syncAudioSettings(this.settings.get());
    this.input.attach();
    this.input.setMenuKeyHandler(() => this.togglePause());
    this.ui.setMenuHandler(() => this.togglePause());
    this.ui.setSwapHandler(() => this.swapWorlds());
    this.loop.onUpdate = (dt) => this.update(dt);
    this.loop.onRender = () => this.render();
    this.loop.start();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("orientationchange", this.onResize);
    window.addEventListener("pointerdown", () => this.audio.unlock(), { once: true });
    window.addEventListener("keydown", (e) => {
      this.audio.unlock();
      if (e.code === "KeyR" && (this.phase === "playing" || this.phase === "paused")) this.restartLevel();
    }, { once: false });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.phase === "playing") this.pause();
    });
    this.onResize();
    this.showMain();
  }

  private showMain(): void {
    this.immersive.deactivate();
    this.phase = "menu";
    this.input.setControlsPaused(true);
    this.audio.bladeWhir(false);
    this.ui.showMain({
      play: () => this.startLevel(this.save.get().unlocked),
      levels: () => this.showLevels(),
      settings: () => this.showSettings("menu"),
    });
  }

  private showLevels(): void {
    this.immersive.deactivate();
    this.phase = "levels";
    this.ui.showLevels(this.save, (id) => this.startLevel(id), () => this.showMain());
  }

  private showSettings(from: "menu" | "pause"): void {
    this.settingsReturn = from;
    this.phase = "settings";
    this.input.setControlsPaused(true);
    this.ui.showSettings(this.settings, (data) => this.syncAudioSettings(data), () => this.immersive.toggleFullscreen(), () => {
      if (this.settingsReturn === "pause") this.showPauseMenu();
      else this.showMain();
    });
  }

  private startLevel(id: number): void {
    this.immersive.activate();
    this.levelId = Math.max(1, Math.min(30, id));
    this.lives = 3;
    this.elapsedMs = 0;
    this.active = "reality";
    this.input.reset();
    this.buildLevel();
    this.phase = "playing";
    this.input.setControlsPaused(false);
    this.ui.showGameplay();
    this.ui.showBanner(this.levelId, `${getLevel(this.levelId).world} · ${worldName(getLevel(this.levelId).world)}`);
    this.refreshHUD();
  }

  private buildLevel(): void {
    const def = getLevel(this.levelId);
    const reality = constructWorld(def, "reality");
    const reflection = constructWorld(def, "reflection");
    this.reality = reality.world;
    this.reflection = reflection.world;
    this.checkpointZones = { reality: reality.checkpointZones, reflection: reflection.checkpointZones };
    this.audio.bladeWhir(this.reality.bladeCircles().length > 0, 1, 0.022);
    this.bindWorldAudio(this.reality);
    this.bindWorldAudio(this.reflection);
    this.checkpointSnapshot = this.snapBoth();
    this.doorClose = 0;
    this.completeElapsed = 0;
    this.deathElapsed = 0;
    this.portalCooldown = 0;
    this.shake = 0;
    this.swapElapsed = 1;
    this.renderer.resetCameras(this.reality, this.reflection);
  }

  private bindWorldAudio(world: World): void {
    world.events.onJump = () => this.audio.jump();
    world.events.onLand = () => this.audio.land();
    world.events.onCrouch = () => this.audio.crouch();
    world.events.onLaserCharge = () => this.audio.laserCharge();
    world.events.onLaserFire = () => this.audio.laserFire();
    world.events.onCrusherSlam = () => {
      this.audio.crusherSlam();
      this.shakeImpact(5);
      this.settings.haptic(35);
    };
    world.events.onPlatformBreak = () => this.audio.platformBreak();
    world.events.onBoost = () => {
      this.audio.boost();
      this.settings.haptic(24);
      this.shakeImpact(3);
    };
    world.events.onPowerup = () => {
      this.audio.powerup();
      this.settings.haptic([18, 20, 30]);
    };
  }

  private update(dt: number): void {
    if (!this.reality || !this.reflection) {
      this.input.endFrame();
      return;
    }

    this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    this.swapElapsed = Math.min(1, this.swapElapsed + dt / 0.2);
    this.shake = Math.max(0, this.shake - dt * 24);

    if (this.phase === "playing") {
      this.elapsedMs += dt * 1000;
      this.reality.update(dt * this.reality.timeScale, this.input);
      this.reflection.update(dt * this.reflection.timeScale, this.input);
      this.renderer.updateCameras(this.renderState(), dt);
      this.checkGameplayEvents();
      this.refreshHUD();
      this.debug.update(this.levelId, this.active, this.reality, this.reflection, this.lives, this.elapsedMs);
    } else if (this.phase === "dying") {
      this.deathElapsed += dt;
      this.reality.update(dt * this.reality.timeScale, this.input);
      this.reflection.update(dt * this.reflection.timeScale, this.input);
      this.renderer.updateCameras(this.renderState(), dt);
      if (this.deathElapsed >= DEATH_TIME) this.finishDeath();
    } else if (this.phase === "completing") {
      this.completeElapsed += dt;
      this.doorClose = Math.min(1, this.completeElapsed / 0.34);
      if (this.completeElapsed >= 0.58) this.advanceLevel();
    }
    this.input.endFrame();
  }

  private checkGameplayEvents(): void {
    const worlds = [this.reality!, this.reflection!];
    for (const world of worlds) {
      const p = world.player;
      if (p.isDead()) continue;
      if (world.outOfBounds(p)) {
        this.beginDeath();
        return;
      }
      for (const hit of world.deadlyTests()) {
        if (rectsOverlap(p.rect(), hit.rect)) {
          this.beginDeath();
          return;
        }
      }
      for (const blade of world.bladeCircles()) {
        if (circleRectOverlap(blade.cx, blade.cy, blade.r, p.rect())) {
          this.beginDeath();
          return;
        }
      }
      if (rectsOverlap(p.rect(), world.doorRect)) {
        this.completeLevel();
        return;
      }
      if (this.portalCooldown <= 0 && world.portals.some((portal) => rectsOverlap(p.rect(), portal))) {
        this.portalCooldown = 0.75;
        this.swapWorlds();
      }
      for (const zone of this.checkpointZones[world.role]) {
        if (zone.index > world.checkpointIndex && rectsOverlap(p.rect(), zone)) {
          this.activateCheckpoint(zone);
          break;
        }
      }
    }
  }

  private activateCheckpoint(zone: CheckpointZone): void {
    this.reality!.setCheckpoint(this.reality!.player.x, this.reality!.player.y, zone.index);
    this.reflection!.setCheckpoint(this.reflection!.player.x, this.reflection!.player.y, zone.index);
    this.checkpointSnapshot = this.snapBoth();
    this.audio.checkpoint();
    this.settings.haptic(20);
  }

  private beginDeath(): void {
    if (this.phase !== "playing") return;
    this.phase = "dying";
    this.deathElapsed = 0;
    this.reality!.player.kill();
    this.reflection!.player.kill();
    this.save.recordDeath(this.levelId);
    this.audio.death();
    this.settings.haptic(120);
    this.shakeImpact(11);
  }

  private finishDeath(): void {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 3;
      this.elapsedMs = 0;
      this.active = "reality";
      this.input.reset();
      this.buildLevel();
    } else if (this.checkpointSnapshot) {
      this.reality!.restore(this.checkpointSnapshot.reality);
      this.reflection!.restore(this.checkpointSnapshot.reflection);
    }
    this.phase = "playing";
    this.input.setControlsPaused(false);
    this.refreshHUD();
  }

  private completeLevel(): void {
    if (this.phase !== "playing") return;
    this.phase = "completing";
    this.completeElapsed = 0;
    this.input.setControlsPaused(true);
    this.save.recordCompletion(this.levelId, this.elapsedMs);
    this.audio.doorSlam();
    window.setTimeout(() => this.audio.complete(), 120);
    this.settings.haptic([55, 35, 65]);
    this.shakeImpact(7);
  }

  private advanceLevel(): void {
    if (this.levelId >= 30) {
      this.immersive.deactivate();
      this.phase = "end";
      this.ui.showEnd(this.save.totalDeaths(), () => this.showMain(), () => this.startLevel(1));
      return;
    }
    this.startLevel(this.levelId + 1);
  }

  private pause(): void {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.input.setControlsPaused(true);
    this.showPauseMenu();
  }

  private showPauseMenu(): void {
    this.phase = "paused";
    this.ui.showPause(
      () => this.resume(),
      () => this.restartLevel(),
      () => this.showSettings("pause"),
      () => this.ui.showConfirm(() => this.abortLevel())
    );
  }

  private resume(): void {
    if (this.phase !== "paused") return;
    this.immersive.activate();
    this.phase = "playing";
    this.input.setControlsPaused(false);
    this.ui.showGameplay();
  }

  private togglePause(): void {
    if (this.phase === "playing") this.pause();
    else if (this.phase === "paused") this.resume();
  }

  private restartLevel(): void {
    if (!this.reality) return;
    this.lives = 3;
    this.elapsedMs = 0;
    this.active = "reality";
    this.input.reset();
    this.buildLevel();
    this.phase = "playing";
    this.input.setControlsPaused(false);
    this.ui.showGameplay();
    this.ui.showBanner(this.levelId, `${getLevel(this.levelId).world} · ${worldName(getLevel(this.levelId).world)}`);
  }

  private abortLevel(): void {
    this.showLevels();
  }

  private swapWorlds(): void {
    if (!this.reality || !this.reflection || !["playing", "dying"].includes(this.phase)) return;
    this.active = this.active === "reality" ? "reflection" : "reality";
    this.swapElapsed = this.settings.get().reducedMotion ? 1 : 0;
    this.audio.swap();
    this.settings.haptic(18);
    this.refreshHUD();
  }

  private render(): void {
    if (!this.reality || !this.reflection) {
      const ctx = this.renderer.ctx;
      ctx.fillStyle = "#070912";
      ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
      return;
    }
    this.renderer.render(this.renderState());
  }

  private renderState() {
    return {
      reality: this.reality!,
      reflection: this.reflection!,
      active: this.active,
      doorClose: this.doorClose,
      swapT: this.swapElapsed < 1 ? this.swapElapsed : 0,
      shake: this.settings.get().screenShake && !this.settings.get().reducedMotion ? this.shake : 0,
    };
  }

  private snapBoth(): SnapshotPair {
    return { reality: this.reality!.snap(), reflection: this.reflection!.snap() };
  }

  private refreshHUD(): void {
    this.ui.setHUD(this.lives, this.elapsedMs, this.active === "reality" ? "REFLECTION" : "REALITY");
  }

  private syncAudioSettings(data: SettingsData): void {
    this.audio.setOptions({ musicEnabled: data.music, sfxEnabled: data.sfx });
    this.ui.applySettings(data);
  }

  private shakeImpact(amount: number): void {
    if (this.settings.get().screenShake && !this.settings.get().reducedMotion) this.shake = Math.max(this.shake, amount);
  }

  private onResize = (): void => {
    this.renderer.resize();
    this.ui.setFloatRect(this.renderer.floatRect);
    const portrait = this.ui.updateOrientation();
    if (portrait && this.phase === "playing") {
      this.pausedByRotation = true;
      this.pause();
    } else if (!portrait && this.pausedByRotation && this.phase === "paused") {
      this.pausedByRotation = false;
      this.resume();
    }
  };
}
