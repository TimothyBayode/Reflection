export type Action = "left" | "right" | "jump" | "crouch" | "menu";

const KEYMAP: Record<string, Action> = {
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyW: "jump",
  ArrowUp: "jump",
  KeyS: "crouch",
  ArrowDown: "crouch",
  Space: "menu",
  Escape: "menu",
};

export class InputManager {
  private state: Record<Action, boolean> = {
    left: false,
    right: false,
    jump: false,
    crouch: false,
    menu: false,
  };

  private pressed: Set<Action> = new Set();
  private released: Set<Action> = new Set();
  private onMenuKey: (() => void) | null = null;

  private controlsPaused = false;

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clearAll);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clearAll);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
    if (e.repeat) return;
    if (action === "menu") {
      if (this.onMenuKey) this.onMenuKey();
      return;
    }
    if (this.controlsPaused) return;
    this.setState(action, true);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const action = KEYMAP[e.code];
    if (!action || action === "menu") return;
    this.setState(action, false);
  };

  private clearAll = (): void => {
    (Object.keys(this.state) as Action[]).forEach((a) => this.setState(a, false));
  };

  setMenuKeyHandler(handler: (() => void) | null): void {
    this.onMenuKey = handler;
  }

  setControlsPaused(paused: boolean): void {
    this.controlsPaused = paused;
    if (paused) this.clearAll();
  }

  setState(action: Action, down: boolean): void {
    if (this.state[action] === down) return;
    this.state[action] = down;
    if (down) this.pressed.add(action);
    else this.released.add(action);
  }

  setTouchState(action: Action, down: boolean): void {
    this.setState(action, down);
  }

  down(action: Action): boolean {
    return this.state[action];
  }

  pressEdge(action: Action): boolean {
    return this.pressed.has(action);
  }

  releaseEdge(action: Action): boolean {
    return this.released.has(action);
  }

  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }
}