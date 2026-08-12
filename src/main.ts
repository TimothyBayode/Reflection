import "./styles.css";
import { Game } from "./core/Game";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing game canvas");

const game = new Game(canvas);
game.start();
