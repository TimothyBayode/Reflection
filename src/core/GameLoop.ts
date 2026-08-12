export const FIXED_DT = 1 / 60;
const MAX_FRAME = 0.1;

export class GameLoop {
  private rafId: number | null = null;
  private lastTime = 0;
  private acc = 0;
  private running = false;

  onUpdate: ((dt: number) => void) | null = null;
  onRender: (() => void) | null = null;

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.acc = 0;
    const tick = (now: number): void => {
      if (!this.running) return;
      let frame = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (frame > MAX_FRAME) frame = MAX_FRAME;
      this.acc += frame;
      while (this.acc >= FIXED_DT) {
        this.onUpdate?.(FIXED_DT);
        this.acc -= FIXED_DT;
      }
      this.onRender?.();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}