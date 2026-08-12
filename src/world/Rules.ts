export type WorldRole = "reality" | "reflection";

export interface LevelRules {
  invertedMovement: boolean;
  invertedGravity: boolean;
  invertedWind: boolean;
  invertedHazards: boolean;
  friction: number;
  momentum: number;
  timeScale: number;
  reversal: number;
  darkness: boolean;
}

export function defaultRules(): LevelRules {
  return {
    invertedMovement: false,
    invertedGravity: false,
    invertedWind: false,
    invertedHazards: false,
    friction: 1,
    momentum: 1,
    timeScale: 1,
    reversal: 0,
    darkness: false,
  };
}

/** World-executable rules (per active world), resolved from level rules. */
export interface WorldRules {
  moveMul: 1 | -1;
  gravMul: 1 | -1;
  windMul: 1 | -1;
  hazardMul: 1 | -1;
  friction: number;
  momentum: number;
  darkness: boolean;
}

export function resolveRules(level: LevelRules, role: WorldRole): WorldRules {
  const isRef = role === "reflection";
  return {
    moveMul: isRef && level.invertedMovement ? -1 : 1,
    gravMul: isRef && level.invertedGravity ? -1 : 1,
    windMul: isRef && level.invertedWind ? -1 : 1,
    hazardMul: isRef && level.invertedHazards ? -1 : 1,
    friction: level.friction,
    momentum: level.momentum,
    darkness: isRef && level.darkness,
  };
}