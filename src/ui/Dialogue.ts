import { CHARACTERS } from '../data/characters';
import { STATEMENT_BY_ID } from '../data/evidence';
import type { CharId, LineBeat, SfxId } from '../data/types';
import type { Presenter } from '../story/Director';
import type { AudioEngine } from '../audio/Audio';
import type { Settings } from '../core/Settings';
import { assets, url } from '../core/assets';
import type { Overlays } from './Overlays';
import { el, sleep } from './dom';

export interface DialogueDeps {
  audio: AudioEngine;
  settings: () => Settings;
  overlays: Overlays;
  shake: (p: number) => void;
  setBackdrop: (kind: 'black' | 'keyart' | 'room' | 'dawn') => void;
}

/**
 * VN layer: large portrait over the blurred 3D room, tape-label name plate,
 * typewriter text with per-character voice blips. Implements the script Presenter.
 */
export class DialogueUI implements Presenter {
  readonly root: HTMLElement;
  private portrait: HTMLElement;
  private img: HTMLImageElement;
  private radio: HTMLElement;
  private warden: HTMLElement;
  private box: HTMLElement;
  private nameTape: HTMLElement;
  private role: HTMLElement;
  private text: HTMLElement;
  private next: HTMLElement;
  private speaker: CharId | null = null;
  mode: 'vn' | 'hearing' = 'vn';
  /** hearing uses this to direct the camera / swap billboard expressions */
  onLine: ((b: LineBeat) => void) | null = null;
  lastLine: LineBeat | null = null;

  constructor(parent: HTMLElement, private deps: DialogueDeps) {
    this.root = el('div', 'vn', parent);
    this.root.setAttribute('aria-live', 'polite');
    this.portrait = el('div', 'vn-portrait', this.root);
    this.img = el('img', '', this.portrait);
    this.img.alt = '';
    this.radio = el('div', 'vn-radio', this.root);
    for (let i = 0; i < 28; i++) el('i', '', this.radio).style.animationDelay = `${(i * 37) % 600}ms`;
    this.warden = el('div', 'vn-warden', this.root);
    for (let i = 0; i < 4; i++) el('i', '', this.warden);
    this.box = el('div', 'vn-box', this.root);
    const name = el('div', 'vn-name', this.box);
    this.nameTape = el('span', 'tape', name);
    this.role = el('span', 'role', name);
    this.text = el('div', 'vn-text', this.box);
    this.next = el('div', 'vn-next', this.box, 'SPACE ▶');
  }

  open(mode: 'vn' | 'hearing') {
    this.mode = mode;
    this.root.classList.toggle('hearing', mode === 'hearing');
    this.root.classList.add('on');
    this.speaker = null;
    this.portrait.className = 'vn-portrait';
  }

  close() {
    this.root.classList.remove('on', 'radio-on', 'warden-on');
    this.portrait.className = 'vn-portrait';
    this.speaker = null;
  }

  private placePortrait(char: CharId, expr: string | undefined) {
    const entry = assets.portrait(char, expr);
    const src = url(entry.file);
    const changed = this.speaker !== char;
    if (!this.img.src.endsWith(entry.file)) this.img.src = src;
    if (changed) {
      const bbox = entry.bbox ?? [0.2, 0.05, 0.8, 0.95];
      const h = CHARACTERS[char].heightM;
      const figVh = 150 * (h / 1.8); // figure height in vh (shows head to thigh)
      const imgVh = figVh / (bbox[3] - bbox[1]);
      const headTop = 7 + (1.88 - h) * 40;
      this.img.style.height = `${imgVh}vh`;
      this.img.style.top = `${headTop - bbox[1] * imgVh}vh`;
      const cx = ((bbox[0] + bbox[2]) / 2) * imgVh * (2 / 3);
      this.portrait.style.setProperty('--cx', `${cx}vh`);
      this.portrait.classList.remove('in');
      void this.portrait.offsetWidth;
      this.portrait.classList.add('in');
      this.speaker = char;
      if (this.mode === 'vn') this.deps.audio.sfx('whoosh');
    }
    this.portrait.classList.add('show');
    this.portrait.classList.remove('dim');
  }

  async line(b: LineBeat): Promise<void> {
    this.lastLine = b;
    this.onLine?.(b);
    const who = b.who;
    this.root.classList.toggle('radio-on', !!b.radio);
    this.root.classList.toggle('warden-on', who === 'warden');
    this.box.dataset.who = who;
    this.box.classList.toggle('narr', who === 'narr');
    let voice = 260;
    if (who === 'narr') {
      this.nameTape.textContent = '';
      this.role.textContent = '';
      this.portrait.classList.add('dim');
      voice = 0;
    } else if (who === 'warden') {
      this.nameTape.textContent = 'WARDEN';
      this.role.textContent = '케스트럴 보안 관리 체계';
      this.portrait.classList.remove('show');
      voice = 180;
    } else {
      const c = CHARACTERS[who];
      this.nameTape.textContent = b.radio ? `${c.name} · ON AIR` : c.name;
      this.role.textContent = c.nameEn;
      this.box.style.setProperty('--accent', c.color);
      voice = c.voice;
      if (this.mode === 'vn' && !b.radio) {
        if (who === 'kai') this.portrait.classList.add('dim');
        else this.placePortrait(who, b.e);
      }
      if (b.radio) this.portrait.classList.remove('show');
    }
    await this.type(b.t, voice);
  }

  private type(full: string, voice: number): Promise<void> {
    const s = this.deps.settings();
    this.text.textContent = '';
    this.next.classList.remove('on');
    const chars = [...full];
    let i = 0;
    let finished = false;
    return new Promise<void>((resolve) => {
      let timer: number | null = null;
      let autoTimer: number | null = null;
      const finish = () => {
        if (timer !== null) window.clearInterval(timer);
        timer = null;
        this.text.textContent = full;
        finished = true;
        this.next.classList.add('on');
        if (s.autoAdvance) autoTimer = window.setTimeout(done, Math.max(1400, chars.length * 55));
      };
      const done = () => {
        window.removeEventListener('keydown', onKey, true);
        this.root.removeEventListener('click', onClick);
        if (autoTimer !== null) window.clearTimeout(autoTimer);
        resolve();
      };
      const advance = () => (finished ? done() : finish());
      const onKey = (e: KeyboardEvent) => {
        if (e.repeat) return;
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
          e.preventDefault();
          e.stopPropagation();
          this.deps.audio.sfx('click');
          advance();
        }
      };
      const onClick = () => advance();
      window.addEventListener('keydown', onKey, true);
      this.root.addEventListener('click', onClick);
      if (s.textSpeed === 0) {
        finish();
        return;
      }
      const interval = 1000 / s.textSpeed;
      timer = window.setInterval(() => {
        i++;
        this.text.textContent = chars.slice(0, i).join('');
        if (voice && i % 2 === 0 && chars[i - 1] !== ' ') this.deps.audio.blip(voice);
        if (i >= chars.length) finish();
      }, interval);
    });
  }

  /** read-only snapshot for the debug view */
  debugState() {
    return {
      open: this.root.classList.contains('on'),
      who: this.lastLine?.who ?? null,
      text: this.text.textContent ?? '',
      ready: this.next.classList.contains('on'),
    };
  }

  // ── Presenter plumbing
  cutin(id: string, caption?: string) {
    return this.deps.overlays.cutin(id, caption);
  }
  title(text: string, sub?: string) {
    return this.deps.overlays.title(text, sub);
  }
  evidence(id: string) {
    return this.deps.overlays.evidence(id);
  }
  statement(id: string) {
    const s = STATEMENT_BY_ID.get(id);
    if (s) this.deps.overlays.toast(`진술 기록 · ${CHARACTERS[s.who].name}: "${s.text}"`, 'statement');
  }
  sfx(id: SfxId) {
    this.deps.audio.sfx(id);
  }
  shake(p: number) {
    this.deps.shake(p);
  }
  bg(kind: 'black' | 'keyart' | 'room' | 'dawn') {
    this.deps.setBackdrop(kind);
  }
  wait(ms: number) {
    return sleep(ms);
  }
}
