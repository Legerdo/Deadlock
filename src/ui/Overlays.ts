import { assets, url } from '../core/assets';
import { EVIDENCE_BY_ID } from '../data/evidence';
import { ROOMS } from '../data/locations';
import type { AudioEngine } from '../audio/Audio';
import type { Settings } from '../core/Settings';
import { el, sleep, waitForAdvance } from './dom';
import { icon } from './icons';

/** Full-screen presentation layers: chapter titles, cut-ins, evidence cards, wipes, flashes. */
export class Overlays {
  private layer: HTMLElement;
  private bgEl: HTMLElement;

  constructor(
    root: HTMLElement,
    private audio: AudioEngine,
    private settings: () => Settings,
  ) {
    this.bgEl = el('div', 'bg-layer', root);
    this.layer = el('div', 'overlay-layer', root);
  }

  setBg(kind: 'black' | 'keyart' | 'room' | 'dawn' | 'none') {
    this.bgEl.className = 'bg-layer';
    this.bgEl.style.backgroundImage = '';
    if (kind === 'black') this.bgEl.classList.add('on', 'black');
    if (kind === 'keyart' || kind === 'dawn') {
      const id = kind === 'keyart' ? 'keyart_title' : 'cutin_dawn';
      const e = assets.get(id);
      if (e) this.bgEl.style.backgroundImage = `url(${url(e.file)})`;
      this.bgEl.classList.add('on', 'image');
    }
  }

  async title(text: string, sub?: string) {
    const card = el('div', 'title-card', this.layer);
    el('div', 'tc-rule', card);
    el('div', 'tc-text', card, text);
    if (sub) el('div', 'tc-sub', card, sub);
    this.audio.sfx('whoosh');
    await sleep(40);
    card.classList.add('in');
    await Promise.race([sleep(this.settings().textSpeed === 0 ? 500 : 2100), waitForAdvance({ minMs: 350 })]);
    card.classList.add('out');
    await sleep(260);
    card.remove();
  }

  async cutin(id: string, caption?: string) {
    const e = assets.get(id);
    if (!e) return;
    const wrap = el('div', 'cutin', this.layer);
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', caption ?? '컷인');
    const img = el('img', 'cutin-img', wrap);
    img.src = url(e.file);
    img.alt = '';
    el('div', 'cutin-bar top', wrap);
    el('div', 'cutin-bar bottom', wrap);
    if (caption) el('div', 'cutin-caption', wrap, caption);
    el('div', 'cutin-hint', wrap, 'SPACE ▶');
    this.audio.sfx('reveal');
    this.flash('ink');
    await sleep(30);
    wrap.classList.add('in');
    if (this.settings().reduceMotion) wrap.classList.add('still');
    await waitForAdvance({ minMs: this.settings().textSpeed === 0 ? 150 : 900 });
    wrap.classList.add('out');
    await sleep(240);
    wrap.remove();
  }

  async evidence(id: string) {
    const ev = EVIDENCE_BY_ID.get(id);
    if (!ev) return;
    const card = el('div', 'ev-acquire', this.layer);
    card.setAttribute('role', 'status');
    el('div', 'eva-kicker', card, ev.kind === 'testimony' ? 'TESTIMONY FILED · 진술 확보' : 'EVIDENCE ACQUIRED · 증거 획득');
    const body = el('div', 'eva-body', card);
    const ic = el('div', 'eva-icon', body);
    ic.innerHTML = icon(ev.icon);
    const txt = el('div', 'eva-text', body);
    el('div', 'eva-title', txt, ev.title);
    el('div', 'eva-where', txt, `발견 장소 · ${ROOMS[ev.obtainedAt].name}`);
    el('div', 'eva-hint', card, 'Tab — 증거 보드');
    this.audio.sfx('evidence');
    this.flash('signal');
    await sleep(30);
    card.classList.add('in');
    await Promise.race([sleep(this.settings().textSpeed === 0 ? 400 : 1700), waitForAdvance({ minMs: 250 })]);
    card.classList.add('out');
    await sleep(250);
    card.remove();
  }

  toast(text: string, kind: 'info' | 'statement' = 'info') {
    const t = el('div', `toast ${kind}`, this.layer, text);
    t.setAttribute('role', 'status');
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  flash(kind: 'white' | 'signal' | 'coral' | 'ink' = 'white') {
    if (this.settings().reduceMotion && kind === 'white') kind = 'ink';
    const f = el('div', `flash ${kind}`, this.layer);
    requestAnimationFrame(() => f.classList.add('go'));
    setTimeout(() => f.remove(), 450);
  }

  /** Editorial panel wipe used for room changes. */
  async wipe(label: string, mid: () => void | Promise<void>) {
    const w = el('div', 'wipe', this.layer);
    el('div', 'wipe-label', w, label);
    await sleep(16);
    w.classList.add('in');
    await sleep(this.settings().reduceMotion ? 120 : 230);
    await mid();
    w.classList.add('out');
    await sleep(this.settings().reduceMotion ? 120 : 260);
    w.remove();
  }

  stamp(text: string, kind: 'cut' | 'patch' | 'tune' | 'reel' | 'wrong') {
    const s = el('div', `stamp ${kind}`, this.layer);
    el('span', 'stamp-a', s, text);
    el('span', 'stamp-b', s, text);
    requestAnimationFrame(() => s.classList.add('go'));
    setTimeout(() => s.remove(), 900);
  }

  whip() {
    if (this.settings().reduceMotion) return;
    const w = el('div', 'whip', this.layer);
    requestAnimationFrame(() => w.classList.add('go'));
    setTimeout(() => w.remove(), 320);
  }

  clear() {
    this.layer.innerHTML = '';
  }
}
