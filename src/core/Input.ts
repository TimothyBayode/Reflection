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
  private doublePressed: Set<Action> = new Set();
  private lastPress: Record<Action, number> = {
    left: 0,
    right: 0,
    jump: 0,
    crouch: 0,
    menu: 0,
  };
  private releasedSincePress: Record<Action, boolean> = {
    left: true,
    right: true,
    jump: true,
    crouch: true,
    menu: true,
  };
  private onMenuKey: (() => void) | null = null;
  private sources: Record<Action, Set<string>> = {
    left: new Set(), right: new Set(), jump: new Set(), crouch: new Set(), menu: new Set(),
  };

  private controlsPaused = false;

  constructor(private readonly now: () => number = () => performance.now()) {}

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
    this.setSource(action, e.code, true);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const action = KEYMAP[e.code];
    if (!action || action === "menu") return;
    this.setSource(action, e.code, false);
  };

  private clearAll = (): void => {
    (Object.keys(this.state) as Action[]).forEach((action) => {
      this.sources[action].clear();
      this.setState(action, false);
    });
  };

  setMenuKeyHandler(handler: (() => void) | null): void {
    this.onMenuKey = handler;
  }

  setControlsPaused(paused: boolean): void {
    this.controlsPaused = paused;
    if (paused) {
      this.clearAll();
      (Object.keys(this.lastPress) as Action[]).forEach((action) => {
        this.lastPress[action] = 0;
        this.releasedSincePress[action] = true;
      });
    }
  }

  setState(action: Action, down: boolean): void {
    if (this.state[action] === down) return;
    this.state[action] = down;
    if (down) {
      const now = this.now();
      const sinceLastPress = now - this.lastPress[action];
      if (this.releasedSincePress[action] && sinceLastPress >= 45 && sinceLastPress <= 300) {
        this.doublePressed.add(action);
      }
      this.lastPress[action] = now;
      this.releasedSincePress[action] = false;
      this.pressed.add(action);
    }
    else {
      this.releasedSincePress[action] = true;
      this.released.add(action);
    }
  }

  setTouchState(action: Action, down: boolean): void {
    if (this.controlsPaused && down) return;
    this.setSource(action, `touch:${action}`, down);
  }

  reset(): void {
    this.clearAll();
    this.pressed.clear();
    this.released.clear();
    this.doublePressed.clear();
    (Object.keys(this.lastPress) as Action[]).forEach((action) => {
      this.lastPress[action] = 0;
      this.releasedSincePress[action] = true;
    });
  }

  private setSource(action: Action, source: string, down: boolean): void {
    if (down) this.sources[action].add(source);
    else this.sources[action].delete(source);
    this.setState(action, this.sources[action].size > 0);
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

  doublePressEdge(action: Action): boolean {
    return this.doublePressed.has(action);
  }

  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
    this.doublePressed.clear();
  }
}
