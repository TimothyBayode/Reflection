import { InputManager } from "../core/Input";
import { constructWorld } from "./LevelLoader";
import type { LevelDef } from "./LevelData";

export function normalizedState(level: LevelDef): string {
  const reality = constructWorld(level, "reality").world;
  const reflection = constructWorld(level, "reflection").world;
  return JSON.stringify({ reality: reality.snap(), reflection: reflection.snap() });
}

export function runDeterminismRegression(level: LevelDef): string[] {
  const failures: string[] = [];
  const initial = normalizedState(level);
  if (initial !== normalizedState(level)) failures.push(`L${level.id}: fresh loads differ`);

  const reality = constructWorld(level, "reality").world;
  const reflection = constructWorld(level, "reflection").world;
  const input = new InputManager();
  for (let i = 0; i < 300; i++) {
    reality.update(1 / 60, input);
    reflection.update(1 / 60, input);
    input.endFrame();
  }
  if (initial !== normalizedState(level)) failures.push(`L${level.id}: fresh state depends on prior simulation`);

  const realitySnapshot = reality.snap();
  reflection.player.x += 100;
  if (reality.snap().player.x !== realitySnapshot.player.x) failures.push(`L${level.id}: mutable player state shared across worlds`);

  reality.restore(realitySnapshot);
  if (JSON.stringify(reality.snap()) !== JSON.stringify(realitySnapshot)) failures.push(`L${level.id}: snapshot round trip differs`);
  return failures;
}
