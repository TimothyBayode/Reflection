export interface SettingsData {
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  screenShake: boolean;
  reducedMotion: boolean;
  btnOpacity: number;
  btnScale: number;
}

export const DEFAULT_SETTINGS: SettingsData = {
  music: true,
  sfx: true,
  haptics: true,
  screenShake: true,
  reducedMotion: false,
  btnOpacity: 0.75,
  btnScale: 1,
};

const KEY = "reflection.settings.v1";

export class SettingsManager {
  private data: SettingsData = { ...DEFAULT_SETTINGS };

  load(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      this.data = { ...DEFAULT_SETTINGS };
    }
    this.applyToBody();
  }

  get(): SettingsData {
    return this.data;
  }

  set(patch: Partial<SettingsData>): void {
    this.data = { ...this.data, ...patch };
    this.persist();
    this.applyToBody();
  }

  toggle(key: "music" | "sfx" | "haptics" | "screenShake" | "reducedMotion"): void {
    this.set({ [key]: !this.data[key] } as Partial<SettingsData>);
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable */
    }
  }

  applyToBody(): void {
    document.body.classList.toggle("reduce-motion", this.data.reducedMotion);
  }

  haptic(pattern: number | number[]): void {
    if (!this.data.haptics) return;
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {
      /* not supported */
    }
  }
}