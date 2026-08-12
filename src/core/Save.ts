export interface SaveData {
  unlocked: number;
  completed: number[];
  bestTimes: Record<string, number>;
  deaths: Record<string, number>;
}

const KEY = "reflection.save.v1";

export function emptySave(): SaveData {
  return {
    unlocked: 1,
    completed: [],
    bestTimes: {},
    deaths: {},
  };
}

export class SaveManager {
  private data: SaveData = emptySave();

  load(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...emptySave(), ...JSON.parse(raw) };
    } catch {
      this.data = emptySave();
    }
  }

  get(): SaveData {
    return this.data;
  }

  isUnlocked(level: number): boolean {
    return level <= this.data.unlocked;
  }

  isCompleted(level: number): boolean {
    return this.data.completed.includes(level);
  }

  bestTime(level: number): number | null {
    return this.data.bestTimes[level] ?? null;
  }

  deaths(level: number): number {
    return this.data.deaths[level] ?? 0;
  }

  recordDeath(level: number): void {
    this.data.deaths[level] = (this.data.deaths[level] ?? 0) + 1;
    this.persist();
  }

  recordCompletion(level: number, timeMs: number): { newBest: boolean; unlocked: boolean } {
    const prev = this.data.bestTimes[level];
    const newBest = prev === undefined || timeMs < prev;
    this.data.bestTimes[level] = newBest ? timeMs : prev;

    if (!this.data.completed.includes(level)) this.data.completed.push(level);
    this.data.completed.sort((a, b) => a - b);

    let unlocked = false;
    if (level === this.data.unlocked && level < 30) {
      this.data.unlocked = level + 1;
      unlocked = true;
    }
    this.persist();
    return { newBest, unlocked };
  }

  totalDeaths(): number {
    return Object.values(this.data.deaths).reduce((a, b) => a + b, 0);
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable */
    }
  }
}