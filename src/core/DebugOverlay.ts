import type { World } from "../world/World";
import type { WorldRole } from "../world/Rules";

export class DebugOverlay {
  private enabled = false;
  private element: HTMLPreElement | null = null;

  constructor() {
    if (!import.meta.env.DEV) return;
    window.addEventListener("keydown", (event) => {
      if (event.code !== "Backquote") return;
      this.enabled = !this.enabled;
      if (!this.enabled) this.element?.remove();
    });
  }

  update(level: number, active: WorldRole, reality: World, reflection: World, lives: number, timer: number): void {
    if (!import.meta.env.DEV || !this.enabled) return;
    if (!this.element?.isConnected) {
      this.element = document.createElement("pre");
      Object.assign(this.element.style, {
        position: "fixed", left: "8px", bottom: "8px", zIndex: "100", margin: "0", padding: "8px",
        color: "#dff7ff", background: "rgba(2,5,15,.82)", font: "11px monospace", pointerEvents: "none",
      });
      document.body.append(this.element);
    }
    const line = (world: World) => `${world.role}: pos ${world.player.x.toFixed(1)},${world.player.y.toFixed(1)}  vel ${world.player.vx.toFixed(1)},${world.player.vy.toFixed(1)}  cp ${world.checkpointIndex}`;
    this.element.textContent = `L${level}  main=${active}  floating=${active === "reality" ? "reflection" : "reality"}\n${line(reality)}\n${line(reflection)}\nlives=${lives} timer=${(timer / 1000).toFixed(2)}\nrules=${JSON.stringify(reflection.levelRules)}`;
  }
}
