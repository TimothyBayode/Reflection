import { LEVELS } from "../src/level/data/index.js";
import { validateLevels } from "../src/level/LevelValidator.js";
import { runDeterminismRegression } from "../src/level/LevelRegression.js";
import { InputManager } from "../src/core/Input.js";

const failures = [
  ...validateLevels(LEVELS).map((issue) => `L${issue.level} ${issue.world ?? ""}: ${issue.message}`),
  ...LEVELS.flatMap(runDeterminismRegression),
];

let inputTime = 1000;
const input = new InputManager(() => inputTime);
input.setTouchState("jump", true);
inputTime += 220;
input.setTouchState("jump", true);
if (input.doublePressEdge("jump")) failures.push("held jump incorrectly produced a double-click");
input.setTouchState("jump", false);
input.endFrame();
inputTime += 80;
input.setTouchState("jump", true);
if (!input.doublePressEdge("jump")) failures.push("press-release-press did not produce a double-click");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${LEVELS.length} deterministic, isolated levels.`);
}
