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
  private score: { stop: () => void } | null = null;
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
    this.music.gain.setTargetAtTime(s.music * 0.4, t, 0.05);
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
    this.score?.stop();
    this.score = mood === 'off' ? null : this.makeScore(mood);
  }

  /** Quiet, sparse keys over slowly changing chords; no hiss or percussion. */
  private makeScore(mood: Exclude<Mood, 'off'>) {
    const ctx = this.ctx!;
    const themes = {
      calm: { beat: 1.05, chords: [[57, 60, 64, 71], [53, 57, 60, 67], [48, 55, 59, 64], [55, 59, 62, 69]] },
      night: { beat: 1.25, chords: [[57, 60, 64, 71], [53, 57, 60, 64], [50, 57, 60, 65], [52, 59, 62, 67]] },
      tension: { beat: 0.95, chords: [[50, 57, 60, 64], [46, 53, 57, 60], [48, 55, 58, 62], [45, 52, 55, 59]] },
      hearing: { beat: 0.8, chords: [[52, 55, 59, 66], [48, 55, 59, 62], [50, 57, 60, 64], [47, 54, 57, 62]] },
      dawn: { beat: 1.15, chords: [[60, 64, 67, 71], [55, 59, 62, 69], [57, 60, 64, 67], [53, 57, 60, 67]] },
    };
    const theme = themes[mood];
    const out = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.5;
    out.connect(filter).connect(this.music);
    const started = ctx.currentTime;
    out.gain.setValueAtTime(0, started);
    out.gain.linearRampToValueAtTime(1, started + 1.5);
    const voices = new Set<OscillatorNode>();

    const note = (midi: number, at: number, duration: number, level: number, pad: boolean) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(level, at + (pad ? 0.9 : 0.035));
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      gain.gain.linearRampToValueAtTime(0, at + duration + 0.1);
      oscillator.connect(gain).connect(out);
      voices.add(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        voices.delete(oscillator);
      };
      oscillator.start(at);
      oscillator.stop(at + duration + 0.15);
    };

    let step = 0;
    let next = started + 0.05;
    const schedule = () => {
      // Skip elapsed beats after suspension instead of producing a burst of notes.
      if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
      while (next < ctx.currentTime + 0.3) {
        const bar = Math.floor(step / 8);
        const position = step % 8;
        const chord = theme.chords[bar % theme.chords.length]!;
        if (position === 0) {
          chord.slice(0, 3).forEach((pitch) => note(pitch, next, theme.beat * 7.5, 0.024, true));
        }
        // Leave alternate beats empty so dialogue has room to breathe.
        if (position % 2 === 0) {
          const pattern = bar % 2 === 0 ? [0, 2, 3, 1] : [2, 1, 3, 2];
          note(chord[pattern[position / 2]!]! + 12, next, theme.beat * 2.8, 0.065, false);
        }
        step++;
        next += theme.beat;
      }
    };
    schedule();
    const timer = window.setInterval(schedule, 100);
    return {
      stop: () => {
        window.clearInterval(timer);
        const now = ctx.currentTime;
        out.gain.cancelAndHoldAtTime(now);
        out.gain.linearRampToValueAtTime(0, now + 1.2);
        // Audio-clock stops also work while the tab's JS timers are throttled.
        voices.forEach((voice) => voice.stop(now + 1.25));
        window.setTimeout(() => {
          out.disconnect();
          filter.disconnect();
        }, 1500);
      },
    };
  }
}
