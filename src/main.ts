import "./styles.css";
import "./landing.css";

const isPlayRoute = window.location.pathname === "/play" || window.location.pathname.startsWith("/play/");
const app = document.querySelector<HTMLElement>("#app");
const landing = document.querySelector<HTMLElement>("#landing-root");

if (isPlayRoute) {
  if (landing) landing.hidden = true;
  if (app) app.hidden = false;
  void import("./core/Game").then(({ Game }) => {
    const canvas = document.querySelector<HTMLCanvasElement>("#game");
    if (!canvas) throw new Error("Missing game canvas");
    new Game(canvas).start();
  });
} else {
  if (app) app.hidden = true;
  if (landing) landing.hidden = false;
  void import("./landing").then(({ renderLandingPage }) => renderLandingPage(landing!));
}
