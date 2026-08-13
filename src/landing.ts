const avatar = "/reflection-char.png";

const character = (className = "", alt = "Reflection, the fighting red warrior character") =>
  `<img src="${avatar}" alt="${alt}" class="lp-character ${className}" draggable="false">`;

const arrow = `<span class="lp-arrow" aria-hidden="true">→</span>`;
const nav = [
  ["Home", "#home"],
  ["About", "#about"],
  ["Game", "/play"],
  ["Documentation", "https://github.com/TimothyBayode/Reflection"],
];

function navLinks(): string {
  return nav.map(([label, href]) => `<a href="${href}">${label}</a>`).join("");
}

const socials = `<div class="lp-socials"><a href="#" aria-label="Instagram">◎</a><a href="#" aria-label="Twitch">▣</a><a href="#" aria-label="YouTube">▶</a></div>`;
const navPlayButton = `<a class="lp-pill lp-nav-play" href="/play">Play Now ${arrow}</a>`;

export function renderLandingPage(root: HTMLElement): void {
  document.documentElement.classList.add("landing-active");
  document.body.classList.add("landing-active");
  root.innerHTML = `
    <main class="landing-page">
      <section id="home" class="lp-shell lp-hero-shell">
        <div class="lp-dark-panel lp-hero">
          <div class="lp-ambient lp-ambient-left"></div><div class="lp-ambient lp-ambient-right"></div>
          <header class="lp-navbar">
            <a href="#home" class="lp-brand" aria-label="Reflection home"><img src="/logo.svg" alt="Reflection"></a>
            <nav>${navLinks()}</nav>${navPlayButton}
          </header>
          <div class="lp-backdrop-word" aria-hidden="true">Reflection</div>
          <div class="lp-hero-grid">
            <div class="lp-hero-copy">
              <h1><span>Reflection</span><span>The <b>Fighting</b></span><span class="lp-title-last">Reflection ${character("lp-title-char", "")}</span></h1>
              <a class="lp-pill lp-play-cta" href="/play">Play Now ${arrow}</a>
            </div>
            <div class="lp-hero-character">${character("lp-char-glow lp-float")}</div>
            <div class="lp-hero-side">
              <p class="lp-eyebrow">One input. Two worlds. Different outcomes.</p>
              <article class="lp-card lp-card-light"><div class="lp-card-row">${character("lp-card-char", "")}<div><h2>Reality <b>Meets</b> Reflection</h2><p>Control two versions of the same player, adapt to altered rules, and reach the door in both worlds.</p></div></div><a href="/play" class="lp-outline-button">Enter The Game ${arrow}</a></article>
            </div>
          </div>
          <p class="lp-community">A Two-World Puzzle Platformer</p>
        </div>
      </section>

      <section id="about" class="lp-section lp-about">
        <div class="lp-char-trio"><span>${character("lp-trio-small", "")}</span>${character("lp-trio-large lp-char-glow", "Three Reflection characters of different sizes")}<span>${character("lp-trio-tiny", "")}</span></div>
        <div class="lp-about-copy"><h2><b>what is</b><br>reflection?</h2><p><strong>REFLECTION</strong> is a precision puzzle-platformer where every action controls two players in two connected worlds.</p><article class="lp-card lp-card-dark">Reality follows familiar rules. Reflection changes movement, gravity, wind, momentum, and time. Watch both worlds, learn the pattern, and adapt.</article></div>
        <div class="lp-about-cards"><p class="lp-eyebrow dark">Same Input. Different Outcome.</p><article class="lp-card lp-card-dark"><b>Thirty levels</b> across five worlds build from simple mirrored movement to a final mastery challenge.</article><article class="lp-card lp-card-orange">Every hazard is <b>deterministic and learnable</b>. Each failure reveals the rule, and every retry begins almost instantly.</article><p class="lp-small-copy">Difficult by design.<br>Fair in hindsight.</p></div>
      </section>

      <section id="gallery" class="lp-shell">
        <div class="lp-dark-panel lp-action">
          <div class="lp-action-grid">
            <div><h2>reflection<br><b>in action</b></h2><article class="lp-card lp-card-orange lp-narrow">Move once and watch the same action unfold differently in each world.</article><article class="lp-card lp-card-light"><strong>Reality and Reflection are always active.</strong><p>Track moving blades, crushers, lasers, wind, and platforms through the live floating viewport, then swap worlds without pausing the simulation.</p></article></div>
            <div class="lp-action-character">${character("lp-char-glow lp-float-slow")}</div>
            <div class="lp-action-side"><article class="lp-card lp-card-light"><p>Responsive movement, fast checkpoint retries, and predictable hazards turn every level into a test of observation, timing, and control.</p><a href="/play" class="lp-outline-button">Play Game ${arrow}</a></article><p class="lp-eyebrow">Observe. Adapt. Survive.</p></div>
          </div>
          <div class="lp-collection"><h2><b>reflection</b><br><span>30 LEVEL</span><br>challenge</h2><div class="lp-nft-grid"><div class="lp-nft-card">${character("", "Reality player avatar")}</div><div class="lp-nft-card">${character("", "Reflection player avatar")}</div><div class="lp-nft-center">${character("lp-char-glow lp-float")}<a href="/play" class="lp-white-button">Play Now ${arrow}</a></div><div class="lp-nft-card">${character("", "Reality world player")}</div><div class="lp-nft-card">${character("", "Reflection world player")}</div></div></div>
        </div>
      </section>

      <section id="roadmap" class="lp-section lp-roadmap">
        <div class="lp-kanji" aria-hidden="true">反射</div>
        <div class="lp-road-left"><div class="lp-road-heading"><h2>game<br><b>worlds</b></h2><p>Five worlds introduce, demonstrate, challenge, combine, and finally test every rule.</p></div><article class="lp-road-card outlined"><b>Mirror &amp; Physics</b><p>Learn inverted movement, gravity, wind, friction, and the relationship between both worlds.</p></article><article class="lp-road-card dark"><b>Hazards</b><p>Master deterministic blades, crushers, lasers, moving platforms, and falling platforms.</p></article></div>
        <div class="lp-road-center">${character("lp-char-glow lp-float")}<div class="lp-platform"></div></div>
        <div class="lp-road-right"><article class="lp-road-card dark">${character("lp-road-mini", "")}<b>Reality</b><p>Momentum and time behave differently while the live viewport keeps both outcomes visible.</p></article><article class="lp-road-card orange"><b>Paradox</b><p>Combine gravity, wind, hazards, and booster power-ups in the final mastery levels.</p></article></div>
      </section>

      <footer id="contact" class="lp-shell lp-footer-shell"><div class="lp-dark-panel lp-footer">
        <div class="lp-footer-nav">${socials}<nav>${navLinks()}</nav></div>
        <div class="lp-footer-main"><h2><span>two worlds</span><span>one <b>way out</b></span></h2>${character("lp-char-glow lp-float-slow")}<article class="lp-card lp-card-light"><div class="lp-card-row">${character("lp-card-char", "")}<div><strong class="lp-stat">30</strong><p>Deterministic levels across five increasingly difficult worlds.</p></div></div><a href="/play" class="lp-outline-button">Play Now ${arrow}</a></article></div>
        <div class="lp-footer-bottom"><p>© 2026 Reflection. All rights reserved.</p><div><a href="#">Privacy Policy</a><a href="#">Terms & Conditions</a><a href="#">Cookie Settings</a></div></div>
      </div></footer>
    </main>`;
}
