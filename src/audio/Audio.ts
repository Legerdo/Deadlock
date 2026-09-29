import type { SfxId } from '../data/types';
import type { Settings } from '../core/Settings';

type Mood = 'off' | 'calm' | 'night' | 'tension' | 'hearing' | 'dawn';

/**
 * Procedural audio only (Web Audio API). No downloaded music.
 * Buses: master → { music, sfx }.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfxBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private drone: { stop: () => void } | null = null;
  private pulseTimer: number | null = null;
  private mood: Mood = 'off';
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.music = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();
    this.music.connect(this.master);
    this.sfxBus.connect(this.master);
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.apply(this.settings);
    const m = this.mood;
    this.mood = 'off';
    this.setMood(m);
  }

  apply(s: Settings) {
    this.settings = s;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.master, t, 0.05);
    this.music.gain.setTargetAtTime(s.music * 0.55, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(s.sfx, t, 0.05);
  }

  private env(g: GainNode, t: number, a: number, peak: number, dcy: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy);
  }

  private tone(freq: number, type: OscillatorType, dur: number, peak = 0.3, bus: GainNode = this.sfxBus, when = 0, glide?: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    this.env(g, t, 0.005, peak, dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, peak: number, filterFreq: number, type: BiquadFilterType = 'lowpass', when = 0, q = 0.7) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    this.env(g, t, 0.01, peak, dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.1);
  }

  /** Typewriter blip; pitch per character voice. */
  blip(pitch: number) {
    if (!this.ctx) return;
    this.tone(pitch * (0.96 + Math.random() * 0.08), 'square', 0.035, 0.035);
  }

  sfx(id: SfxId) {
    if (!this.ctx) return;
    switch (id) {
      case 'click':
        this.tone(1400, 'triangle', 0.04, 0.12);
        break;
      case 'blip':
        this.blip(300);
        break;
      case 'evidence':
        this.tone(660, 'triangle', 0.18, 0.25);
        this.tone(990, 'triangle', 0.22, 0.2, this.sfxBus, 0.08);
        this.tone(1320, 'sine', 0.35, 0.15, this.sfxBus, 0.16);
        this.noise(0.25, 0.08, 4000, 'highpass');
        break;
      case 'error':
        this.tone(110, 'sawtooth', 0.35, 0.3, this.sfxBus, 0, 70);
        this.noise(0.3, 0.2, 400);
        break;
      case 'correct':
        this.tone(523, 'square', 0.12, 0.15);
        this.tone(784, 'square', 0.14, 0.15, this.sfxBus, 0.07);
        this.tone(1046, 'triangle', 0.4, 0.2, this.sfxBus, 0.14);
        break;
      case 'door':
        this.noise(0.35, 0.25, 700);
        this.tone(90, 'sine', 0.3, 0.3);
        break;
      case 'squeak':
        this.tone(900, 'sawtooth', 0.5, 0.06, this.sfxBus, 0, 1400);
        this.noise(0.4, 0.12, 900);
        break;
      case 'thump':
        this.tone(55, 'sine', 0.9, 0.7, this.sfxBus, 0, 32);
        this.noise(0.6, 0.35, 180);
        break;
      case 'alarm':
        for (let i = 0; i < 4; i++) {
          this.tone(880, 'square', 0.22, 0.12, this.sfxBus, i * 0.5);
          this.tone(660, 'square', 0.22, 0.12, this.sfxBus, i * 0.5 + 0.25);
        }
        break;
      case 'whoosh':
        this.noise(0.25, 0.25, 1800, 'bandpass', 0, 1.5);
        break;
      case 'slam':
        this.tone(70, 'square', 0.18, 0.35, this.sfxBus, 0, 40);
        this.noise(0.18, 0.4, 2500);
        break;
      case 'static':
        this.noise(1.6, 0.18, 3000, 'bandpass', 0, 0.4);
        break;
      case 'cut':
        this.noise(0.12, 0.5, 6000, 'highpass');
        this.tone(1800, 'sawtooth', 0.08, 0.15, this.sfxBus, 0, 300);
        this.tone(60, 'sine', 0.4, 0.5, this.sfxBus, 0.05, 40);
        break;
      case 'patch':
        this.tone(220, 'square', 0.05, 0.2);
        this.tone(440, 'triangle', 0.3, 0.22, this.sfxBus, 0.05);
        this.tone(660, 'triangle', 0.4, 0.15, this.sfxBus, 0.12);
        break;
      case 'tune':
        this.tone(300, 'sine', 0.6, 0.2, this.sfxBus, 0, 1200);
        this.noise(0.4, 0.1, 2000, 'bandpass');
        break;
      case 'reveal':
        this.tone(98, 'sawtooth', 1.4, 0.18);
        this.tone(147, 'sawtooth', 1.4, 0.12);
        this.noise(1.2, 0.08, 800);
        break;
      case 'powerdown':
        this.tone(240, 'sawtooth', 0.8, 0.2, this.sfxBus, 0, 40);
        break;
    }
  }

  setMood(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    if (!this.ctx) return;
    this.drone?.stop();
    this.drone = null;
    if (this.pulseTimer !== null) window.clearInterval(this.pulseTimer);
    this.pulseTimer = null;
    if (mood === 'off') return;
    const base = { calm: 55, night: 49, tension: 46.25, hearing: 41.2, dawn: 65.4 }[mood];
    this.drone = this.makeDrone(base, mood === 'dawn' ? [1, 1.5, 2.5] : [1, 1.498, 2.01, 2.997]);
    if (mood === 'tension' || mood === 'hearing') {
      const period = mood === 'hearing' ? 860 : 1500;
      this.pulseTimer = window.setInterval(() => this.pulse(mood === 'hearing'), period);
    }
  }

  private makeDrone(freq: number, ratios: number[]) {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(0.18, ctx.currentTime, 1.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    out.connect(lp).connect(this.music);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    const oscs = ratios.map((r, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = freq * r;
      o.detune.value = (i - 1) * 6;
      const g = ctx.createGain();
      g.gain.value = 0.5 / (i + 1);
      o.connect(g).connect(out);
      o.start();
      return o;
    });
    // rain / tape hiss bed
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noiseBuf;
    hiss.loop = true;
    const hf = ctx.createBiquadFilter();
    hf.type = 'bandpass';
    hf.frequency.value = 1200;
    hf.Q.value = 0.3;
    const hg = ctx.createGain();
    hg.gain.value = 0.05;
    hiss.connect(hf).connect(hg).connect(this.music);
    hiss.start();
    return {
      stop: () => {
        const t = ctx.currentTime;
        out.gain.setTargetAtTime(0, t, 0.4);
        hg.gain.setTargetAtTime(0, t, 0.4);
        window.setTimeout(() => {
          oscs.forEach((o) => o.stop());
          lfo.stop();
          hiss.stop();
        }, 2000);
      },
    };
  }

  private pulse(strong: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(strong ? 62 : 55, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    this.env(g, t, 0.005, strong ? 0.35 : 0.22, 0.3);
    o.connect(g).connect(this.music);
    o.start(t);
    o.stop(t + 0.4);
    if (strong) {
      const h = this.ctx.createBufferSource();
      h.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 7000;
      const hg = this.ctx.createGain();
      this.env(hg, t + 0.43, 0.002, 0.05, 0.05);
      h.connect(f).connect(hg).connect(this.music);
      h.start(t + 0.43, Math.random());
      h.stop(t + 0.6);
    }
  }
}
