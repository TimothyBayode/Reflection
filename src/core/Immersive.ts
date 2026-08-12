interface WebkitFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface WebkitFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

/** Owns browser-level immersive APIs for the lifetime of a play session. */
export class ImmersiveManager {
  private wakeLock: WakeLockSentinel | null = null;
  private sessionActive = false;

  constructor(private root: HTMLElement) {
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  /** Call directly from a user gesture so mobile fullscreen is permitted. */
  activate(): void {
    this.sessionActive = true;
    void this.requestFullscreen();
    void this.requestWakeLock();
  }

  deactivate(): void {
    this.sessionActive = false;
    const wakeLock = this.wakeLock;
    this.wakeLock = null;
    if (wakeLock && !wakeLock.released) void wakeLock.release();
  }

  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      const doc = document as WebkitFullscreenDocument;
      if (document.exitFullscreen) await document.exitFullscreen();
      else await doc.webkitExitFullscreen?.();
      return;
    }
    this.sessionActive = true;
    await this.requestFullscreen();
    await this.requestWakeLock();
  }

  private async requestFullscreen(): Promise<void> {
    if (this.isFullscreen()) return;
    try {
      if (this.root.requestFullscreen) {
        await this.root.requestFullscreen({ navigationUI: "hide" });
      } else {
        await (this.root as WebkitFullscreenElement).webkitRequestFullscreen?.();
      }
      await this.lockLandscape();
    } catch {
      // Unsupported browsers retain the standalone/PWA display fallback.
    }
  }

  private async requestWakeLock(): Promise<void> {
    if (!this.sessionActive || document.visibilityState !== "visible" || this.wakeLock) return;
    try {
      if (!("wakeLock" in navigator)) return;
      const wakeLock = await navigator.wakeLock.request("screen");
      this.wakeLock = wakeLock;
      wakeLock.addEventListener("release", () => {
        if (this.wakeLock === wakeLock) this.wakeLock = null;
      });
    } catch {
      // Wake Lock requires HTTPS/localhost and may be denied by battery policy.
    }
  }

  private async lockLandscape(): Promise<void> {
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: "landscape") => Promise<void>;
      };
      await orientation.lock?.("landscape");
    } catch {
      // Orientation locking is not available on every mobile browser.
    }
  }

  private isFullscreen(): boolean {
    const doc = document as WebkitFullscreenDocument;
    return !!(document.fullscreenElement ?? doc.webkitFullscreenElement);
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === "visible") void this.requestWakeLock();
  };
}
