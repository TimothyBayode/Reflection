export interface AudioOptions {
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

/**
 * Lightweight synthesized audio: no asset files, WebAudio only.
 * Safe to call before user gesture - context is created lazily on
 * first unlock() call (resume()).
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicTimer: number | null = null;
  private nextChordTime = 0;
  private musicPlaying = false;

  opts: AudioOptions = { musicEnabled: true, sfxEnabled: true };

  unlock(): void {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 20;
        comp.ratio.value = 8;
        comp.connect(this.ctx.destination);
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(comp);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.5;
        this.musicBus.connect(this.master);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 1;
        this.sfxBus.connect(this.master);
        this.setOptions(this.opts);
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    this.startMusic();
  }

  setOptions(opts: AudioOptions): void {
    this.opts = opts;
    if (this.musicBus) {
      this.musicBus.gain.value = opts.musicEnabled ? 0.5 : 0;
    }
    if (this.sfxBus) {
      this.sfxBus.gain.value = opts.sfxEnabled ? 1 : 0;
    }
  }

  /* ---------------- music ---------------- */

  startMusic(): void {
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;
    this.nextChordTime = this.ctx.currentTime + 0.1;
    this.scheduleChords();
    this.musicTimer = window.setInterval(() => this.scheduleChords(), 500);
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleChords(): void {
    if (!this.ctx || !this.musicPlaying) return;
    const chordLen = 3.2;
    while (this.nextChordTime < this.ctx.currentTime + 1.2) {
      this.playChord(this.nextChordTime, chordLen);
      this.nextChordTime += chordLen;
    }
  }

  private playChord(at: number, len: number): void {
    if (!this.ctx || !this.musicBus) return;
    const prog = [
      [110, 164.81, 220, 329.63],
      [87.31, 130.81, 174.61, 261.63],
      [98, 146.83, 196, 293.66],
      [82.41, 123.47, 164.81, 246.94],
    ];
    const step = Math.floor(this.nextChordTime / len) % prog.length;
    const freqs = prog[step];

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "triangle";
    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[0] * 2;
    osc2.detune.value = 6;

    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    lp.Q.value = 0.8;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.05, at + 1.4);
    g.gain.linearRampToValueAtTime(0.0001, at + len - 0.4);
    g.gain.setValueAtTime(0, at + len);

    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(g);
    g.connect(this.musicBus);

    freqs.slice(1).forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const og = this.ctx!.createGain();
      og.gain.setValueAtTime(0, at);
      og.gain.linearRampToValueAtTime(0.045, at + 1.2);
      og.gain.linearRampToValueAtTime(0.0001, at + len - 0.5);
      og.gain.setValueAtTime(0, at + len);
      o.connect(og);
      og.connect(this.musicBus!);
      o.start(at);
      o.stop(at + len + 0.05);
    });

    osc1.start(at);
    osc2.start(at);
    osc1.stop(at + len + 0.05);
    osc2.stop(at + len + 0.05);
  }

  /* ---------------- sfx helpers ---------------- */

  private beep(
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    delay = 0
  ): void {
    if (!this.ctx || !this.sfxBus) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, filterFreq: number, type: BiquadFilterType, delay = 0): void {
    if (!this.ctx || !this.sfxBus) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
  }

  private sfx(enabled: boolean, duration: number, play: () => void): void {
    if (!enabled || !this.ctx || !this.opts.sfxEnabled) return;
    play();
    void duration;
  }

  /* ---------------- game sfx ---------------- */

  jump(): void {
    this.sfx(true, 0.1, () => this.beep("triangle", 320, 620, 0.1, 0.12));
  }

  land(): void {
    this.sfx(true, 0.1, () => {
      this.beep("sine", 130, 55, 0.09, 0.16);
      this.noise(0.07, 0.06, 600, "lowpass");
    });
  }

  crouch(): void {
    this.sfx(true, 0.05, () => this.beep("square", 190, 110, 0.05, 0.05));
  }

  death(): void {
    this.sfx(true, 0.4, () => {
      this.beep("sawtooth", 460, 70, 0.3, 0.2);
      this.noise(0.28, 0.14, 900, "lowpass");
    });
  }

  swap(): void {
    this.sfx(true, 0.28, () => {
      this.noise(0.22, 0.12, 1400, "bandpass");
      this.beep("sine", 660, 880, 0.14, 0.07, 0.02);
      this.beep("sine", 990, 1320, 0.12, 0.05, 0.06);
    });
  }

  checkpoint(): void {
    this.sfx(true, 0.25, () => {
      this.beep("sine", 620, 620, 0.09, 0.09);
      this.beep("sine", 930, 930, 0.12, 0.09, 0.08);
    });
  }

  doorSlam(): void {
    this.sfx(true, 0.3, () => {
      this.beep("sine", 95, 50, 0.2, 0.28);
      this.noise(0.16, 0.12, 800, "bandpass");
    });
  }

  complete(): void {
    this.sfx(true, 0.7, () => {
      [523, 659, 784, 1047].forEach((f, i) =>
        this.beep("triangle", f, f, 0.14, 0.1, i * 0.09)
      );
      this.noise(0.35, 0.05, 2400, "highpass", 0.15);
    });
  }

  uiClick(): void {
    this.sfx(true, 0.05, () => this.beep("square", 880, 880, 0.05, 0.06));
  }

  uiError(): void {
    this.sfx(true, 0.1, () => this.beep("square", 220, 160, 0.1, 0.08));
  }

  laserCharge(): void {
    this.sfx(true, 0.2, () => this.beep("square", 500, 900, 0.14, 0.05));
  }

  laserFire(): void {
    this.sfx(true, 0.25, () => {
      this.beep("square", 2100, 1800, 0.16, 0.07);
      this.noise(0.14, 0.06, 3000, "highpass");
    });
  }

  crusherSlam(): void {
    this.sfx(true, 0.25, () => {
      this.beep("sine", 70, 38, 0.22, 0.3);
      this.noise(0.14, 0.16, 500, "lowpass");
    });
  }

  platformBreak(): void {
    this.sfx(true, 0.2, () => this.noise(0.18, 0.12, 900, "bandpass"));
  }

  bladeWhir(on: boolean, pitch = 1, vol = 0.03): void {
    if (!this.ctx || !this.sfxBus || !this.opts.sfxEnabled) return;
    if (on) {
      if (this.bladeOsc) return;
      const o = this.ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 90 * pitch;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 320 * pitch;
      f.Q.value = 4;
      o.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      o.start();
      this.bladeOsc = { o, g };
    } else if (this.bladeOsc) {
      this.bladeOsc.o.stop();
      this.bladeOsc.g.disconnect();
      this.bladeOsc = null;
    }
  }

  private bladeOsc: { o: OscillatorNode; g: GainNode } | null = null;

  dispose(): void {
    this.stopMusic();
    this.bladeWhir(false);
    if (this.ctx && this.ctx.state !== "closed") void this.ctx.close();
    this.ctx = null;
  }
}
