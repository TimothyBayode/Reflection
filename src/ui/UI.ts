import type { InputManager, Action } from "../core/Input";
import type { SaveManager } from "../core/Save";
import type { SettingsManager, SettingsData } from "../core/Settings";
import { formatTime } from "../core/types";
import { LEVELS, WORLD_NAMES } from "../level/data";

export interface MainCallbacks {
  play: () => void;
  levels: () => void;
  settings: () => void;
}

export class UI {
  private screens = document.querySelector<HTMLDivElement>("#screens")!;
  private hud = document.querySelector<HTMLDivElement>("#hud")!;
  private controls = document.querySelector<HTMLDivElement>("#mobile-controls")!;
  private lives = document.querySelector<HTMLDivElement>("#lives")!;
  private timer = document.querySelector<HTMLDivElement>("#timer")!;
  private banner = document.querySelector<HTMLDivElement>("#banner")!;
  private floatHit = document.querySelector<HTMLDivElement>("#float-hit")!;
  private floatTag = document.querySelector<HTMLDivElement>("#float-tag")!;
  private menuBtn = document.querySelector<HTMLDivElement>("#menu-btn")!;
  private confirm = document.querySelector<HTMLDivElement>("#confirm-overlay")!;
  private bannerTimer: number | null = null;
  private controlOpacity = 0.75;

  constructor(private input: InputManager) {
    this.bindTouch("btn-left", "left");
    this.bindTouch("btn-right", "right");
    this.bindTouch("btn-jump", "jump");
    this.bindTouch("btn-crouch", "crouch");
    if (matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0) {
      document.body.classList.add("touch");
    }
  }

  showMain(cb: MainCallbacks): void {
    this.setGameplayVisible(false);
    this.screens.innerHTML = `
      <section class="screen">
        <div class="menu-panel startup-panel">
          <div class="title">REFLECTION</div>
          <div class="title-sub">Two worlds. One input.</div>
          <div class="menu-btns">
            <button class="btn btn-primary" data-id="play">PLAY</button>
            <button class="btn" data-id="levels">LEVELS</button>
            <button class="btn" data-id="settings">SETTINGS</button>
          </div>
        </div>
        <div class="menu-footer"><b>A/D or arrows</b> move &nbsp; <b>W/up</b> jump &nbsp; <b>S/down</b> crouch<br><b>Space</b> pauses</div>
      </section>`;
    this.click("play", cb.play);
    this.click("levels", cb.levels);
    this.click("settings", cb.settings);
  }

  showLevels(save: SaveManager, start: (id: number) => void, back: () => void): void {
    this.setGameplayVisible(false);
    const groups = WORLD_NAMES.map((name, wi) => {
      const levels = LEVELS.filter((l) => l.world === wi + 1);
      return `<div class="world-group"><div class="world-name">WORLD ${wi + 1} · ${name}</div><div class="level-grid">${levels.map((l) => {
        const unlocked = save.isUnlocked(l.id);
        const completed = save.isCompleted(l.id);
        const best = save.bestTime(l.id);
        return `<button class="level-cell ${unlocked ? "" : "locked"} ${completed ? "completed" : ""}" data-level="${l.id}" ${unlocked ? "" : "disabled"}>
          ${completed ? '<span class="check">✓</span>' : ""}${unlocked ? String(l.id).padStart(2, "0") : "×"}${best ? `<span class="time">${(best / 1000).toFixed(1)}</span>` : ""}
        </button>`;
      }).join("")}</div></div>`;
    }).join("");
    this.screens.innerHTML = `<section class="screen"><div class="panel"><div class="panel-title">LEVELS<small>REACH THE DOOR</small></div>${groups}<button class="btn btn-small" data-id="back">BACK</button></div></section>`;
    this.screens.querySelectorAll<HTMLButtonElement>("[data-level]").forEach((b) => b.addEventListener("click", () => start(Number(b.dataset.level))));
    this.click("back", back);
  }

  showSettings(
    settings: SettingsManager,
    onChange: (data: SettingsData) => void,
    toggleFullscreen: () => void,
    back: () => void
  ): void {
    const d = settings.get();
    const row = (key: keyof SettingsData, label: string, desc: string) => `<div class="setting-row"><div><div class="setting-label">${label}</div><div class="setting-desc">${desc}</div></div><button class="toggle ${d[key] ? "on" : ""}" data-setting="${key}"></button></div>`;
    this.screens.innerHTML = `<section class="screen"><div class="panel settings-panel"><button class="btn btn-small settings-back" data-id="back" aria-label="Back">← BACK</button><div class="panel-title">SETTINGS</div>
      ${row("music", "Music", "Ambient soundtrack")}${row("sfx", "Sound Effects", "Gameplay and UI sounds")}
      ${row("haptics", "Haptic Feedback", "Supported mobile devices")}${row("screenShake", "Screen Shake", "Impacts and deaths")}${row("reducedMotion", "Reduced Motion", "Minimize transitions and shake")}
      <div class="setting-row"><div class="setting-label">Button Opacity</div><input data-range="btnOpacity" type="range" min="0.4" max="1" step="0.05" value="${d.btnOpacity}"></div>
      <div class="setting-row"><div class="setting-label">Button Size</div><input data-range="btnScale" type="range" min="0.75" max="1.35" step="0.05" value="${d.btnScale}"></div>
      <div class="setting-row"><div class="setting-label">Fullscreen</div><button class="btn btn-small" data-id="fullscreen">TOGGLE</button></div>
    </div></section>`;
    this.screens.querySelectorAll<HTMLButtonElement>("[data-setting]").forEach((b) => b.addEventListener("click", () => {
      const key = b.dataset.setting as "music" | "sfx" | "haptics" | "screenShake" | "reducedMotion";
      settings.toggle(key);
      b.classList.toggle("on", settings.get()[key]);
      this.applySettings(settings.get());
      onChange(settings.get());
    }));
    this.screens.querySelectorAll<HTMLInputElement>("[data-range]").forEach((r) => r.addEventListener("input", () => {
      const key = r.dataset.range as "btnOpacity" | "btnScale";
      settings.set({ [key]: Number(r.value) });
      this.applySettings(settings.get());
      onChange(settings.get());
    }));
    this.click("fullscreen", toggleFullscreen);
    this.click("back", back);
  }

  showPause(resume: () => void, restart: () => void, settings: () => void, abort: () => void): void {
    this.screens.innerHTML = `<section class="screen"><div class="panel pause-panel"><div class="pause-title">PAUSED</div><div class="pause-sub">BOTH WORLDS FROZEN</div><div class="menu-btns">
      <button class="btn btn-primary" data-id="resume">▶ RESUME</button><button class="btn" data-id="restart">↻ RESTART LEVEL</button><button class="btn" data-id="settings">⚙ SETTINGS</button><button class="btn btn-danger" data-id="abort">× ABORT</button>
    </div></div></section>`;
    this.click("resume", resume); this.click("restart", restart); this.click("settings", settings); this.click("abort", abort);
  }

  showEnd(totalDeaths: number, menu: () => void, replay: () => void): void {
    this.setGameplayVisible(false);
    this.screens.innerHTML = `<section class="screen"><div class="panel"><div class="panel-title">REFLECTION<small>MVP COMPLETE</small></div><div class="stats-grid"><div class="stat"><div class="num">30</div><div class="lbl">Levels</div></div><div class="stat"><div class="num">5</div><div class="lbl">Worlds</div></div><div class="stat"><div class="num">${totalDeaths}</div><div class="lbl">Deaths</div></div></div><div class="menu-btns"><button class="btn btn-primary" data-id="replay">PLAY AGAIN</button><button class="btn" data-id="menu">MAIN MENU</button></div></div></section>`;
    this.click("replay", replay); this.click("menu", menu);
  }

  showGameplay(): void { this.screens.innerHTML = ""; this.setGameplayVisible(true); }
  showConfirm(yes: () => void): void {
    this.confirm.classList.add("show");
    const no = document.querySelector<HTMLButtonElement>("#confirm-no")!;
    const y = document.querySelector<HTMLButtonElement>("#confirm-yes")!;
    no.onclick = () => this.confirm.classList.remove("show");
    y.onclick = () => { this.confirm.classList.remove("show"); yes(); };
  }

  setHUD(lives: number, timeMs: number, floating: string): void {
    this.lives.innerHTML = [0, 1, 2].map((i) => `<span class="heart ${i < lives ? "" : "lost"}">♥</span>`).join("");
    this.timer.textContent = (timeMs / 1000).toFixed(2);
    this.floatTag.textContent = floating;
  }

  setFloatRect(r: { x: number; y: number; w: number; h: number }): void {
    Object.assign(this.floatHit.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
    Object.assign(this.floatTag.style, { left: `${r.x + 3}px`, top: `${r.y + 3}px` });
    Object.assign(this.lives.style, { left: `${r.x + 5}px`, top: `${r.y + r.h + 7}px` });
  }

  setSwapHandler(handler: () => void): void { this.floatHit.onclick = handler; }
  setMenuHandler(handler: () => void): void { this.menuBtn.onclick = handler; }

  showBanner(level: number, world: string): void {
    if (this.bannerTimer !== null) clearTimeout(this.bannerTimer);
    this.banner.className = "show";
    this.banner.innerHTML = `<div class="banner-level">LEVEL ${String(level).padStart(2, "0")}</div><div class="banner-world">WORLD ${world}</div><div class="banner-sub">REACH THE DOOR</div>`;
    this.bannerTimer = window.setTimeout(() => { this.banner.className = "hide"; }, 2200);
  }

  applySettings(d: SettingsData): void {
    this.controlOpacity = d.btnOpacity;
    document.querySelectorAll<HTMLElement>(".ctrl-btn").forEach((b) => {
      b.style.opacity = String(d.btnOpacity);
      b.style.transform = `scale(${d.btnScale})`;
    });
  }

  updateOrientation(): boolean {
    const portrait = innerHeight > innerWidth && (navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches);
    document.querySelector("#rotate-msg")?.classList.toggle("show", portrait);
    return portrait;
  }

  private setGameplayVisible(show: boolean): void {
    this.hud.style.display = show ? "block" : "none";
    this.controls.style.display = show && document.body.classList.contains("touch") ? "block" : "none";
  }

  private click(id: string, fn: () => void): void {
    this.screens.querySelector<HTMLElement>(`[data-id="${id}"]`)?.addEventListener("click", fn);
  }

  private bindTouch(id: string, action: Action): void {
    const btn = document.getElementById(id)!;
    const set = (down: boolean) => {
      this.input.setTouchState(action, down);
      btn.classList.toggle("pressed", down);
      btn.style.opacity = String(down ? 1 : this.controlOpacity);
    };
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); set(true); });
    btn.addEventListener("pointerup", () => set(false));
    btn.addEventListener("pointercancel", () => set(false));
  }
}
