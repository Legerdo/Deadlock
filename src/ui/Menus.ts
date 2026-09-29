import { CHARACTERS, CHAR_IDS } from '../data/characters';
import { assets, url } from '../core/assets';
import type { Settings } from '../core/Settings';
import { el } from './dom';

type SettingsChange = (s: Settings) => void;

/** Settings panel (shared by title screen and pause menu). */
export class SettingsPanel {
  readonly root: HTMLElement;
  onClose: (() => void) | null = null;

  constructor(parent: HTMLElement, private get: () => Settings, private set: SettingsChange) {
    this.root = el('div', 'panel settings', parent);
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', '설정');
  }

  open() {
    this.render();
    this.root.classList.add('on');
  }

  close() {
    this.root.classList.remove('on');
    this.onClose?.();
  }

  get isOpen() {
    return this.root.classList.contains('on');
  }

  private render() {
    const s = this.get();
    this.root.innerHTML = '';
    el('div', 'panel-title', this.root, 'SETTINGS · 설정');
    const grid = el('div', 'set-grid', this.root);
    const slider = (label: string, key: keyof Settings, min: number, max: number, step: number, fmt: (v: number) => string) => {
      const row = el('label', 'set-row', grid);
      el('span', 'set-label', row, label);
      const input = el('input', '', row) as HTMLInputElement;
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(s[key]);
      input.dataset.setting = key;
      const out = el('span', 'set-val', row, fmt(Number(input.value)));
      input.addEventListener('input', () => {
        out.textContent = fmt(Number(input.value));
        this.set({ ...this.get(), [key]: Number(input.value) });
      });
    };
    const toggle = (label: string, key: keyof Settings) => {
      const row = el('label', 'set-row', grid);
      el('span', 'set-label', row, label);
      const input = el('input', '', row) as HTMLInputElement;
      input.type = 'checkbox';
      input.checked = !!s[key];
      input.dataset.setting = key;
      const out = el('span', 'set-val', row, input.checked ? '켜짐' : '꺼짐');
      input.addEventListener('change', () => {
        out.textContent = input.checked ? '켜짐' : '꺼짐';
        this.set({ ...this.get(), [key]: input.checked });
      });
    };
    slider('텍스트 속도', 'textSpeed', 0, 120, 5, (v) => (v === 0 ? '즉시' : `${v} 자/초`));
    toggle('자동 진행', 'autoAdvance');
    slider('마스터 볼륨', 'master', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`);
    slider('음악 볼륨', 'music', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`);
    slider('효과음 볼륨', 'sfx', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`);
    slider('화면 흔들림', 'shake', 0, 1, 0.1, (v) => (v === 0 ? '끔' : `${Math.round(v * 100)}%`));
    toggle('모션 줄이기', 'reduceMotion');
    slider('시점 감도', 'sensitivity', 0.3, 2.5, 0.1, (v) => v.toFixed(1));
    const row = el('div', 'set-row', grid);
    el('span', 'set-label', row, '전체 화면');
    const fs = el('button', 'btn small', row, document.fullscreenElement ? '창 모드로' : '전체 화면');
    fs.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        /* not allowed */
      }
      fs.textContent = document.fullscreenElement ? '창 모드로' : '전체 화면';
    });
    const close = el('button', 'btn', this.root, '닫기');
    close.addEventListener('click', () => this.close());
  }
}

export class PauseMenu {
  readonly root: HTMLElement;
  onResume: (() => void) | null = null;
  onSettings: (() => void) | null = null;
  onBoard: (() => void) | null = null;
  onTitle: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'panel pause', parent);
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', '일시 정지');
    el('div', 'panel-title', this.root, 'PAUSED · 일시 정지');
    const b = (label: string, fn: () => void) => {
      const btn = el('button', 'btn', this.root, label);
      btn.addEventListener('click', fn);
      return btn;
    };
    b('계속하기', () => this.onResume?.());
    b('증거 보드', () => this.onBoard?.());
    b('설정', () => this.onSettings?.());
    b('저장하고 타이틀로', () => this.onTitle?.());
    el('div', 'panel-note', this.root, '진행 상황은 방을 옮기거나 단서를 얻을 때마다 자동 저장됩니다.');
  }

  get isOpen() {
    return this.root.classList.contains('on');
  }
  open() {
    this.root.classList.add('on');
    (this.root.querySelector('button') as HTMLButtonElement | null)?.focus();
  }
  close() {
    this.root.classList.remove('on');
    releaseFocus(this.root);
  }
}

export class TitleScreen {
  readonly root: HTMLElement;
  private cont: HTMLButtonElement;
  private art: HTMLElement;
  onNew: (() => void) | null = null;
  onContinue: (() => void) | null = null;
  onSettings: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'title-screen', parent);
    this.art = el('div', 'ts-art', this.root);
    el('div', 'ts-rain', this.root);
    const brand = el('div', 'ts-brand', this.root);
    el('div', 'ts-kicker', brand, 'KESTREL TOWER · 97.3 MHz · FINAL NIGHT');
    const logo = el('h1', 'ts-logo', brand);
    logo.innerHTML = '<span>AFTER</span><span>SIGNAL</span>';
    el('div', 'ts-sub', brand, '케스트럴 타워의 마지막 밤');
    const menu = el('div', 'ts-menu', this.root);
    const newBtn = el('button', 'ts-btn', menu, '새 게임');
    newBtn.dataset.action = 'new';
    this.cont = el('button', 'ts-btn', menu, '이어하기');
    this.cont.dataset.action = 'continue';
    const set = el('button', 'ts-btn', menu, '설정');
    set.dataset.action = 'settings';
    newBtn.addEventListener('click', () => this.onNew?.());
    this.cont.addEventListener('click', () => this.onContinue?.());
    set.addEventListener('click', () => this.onSettings?.());
    el('div', 'ts-foot', this.root, '2.5D 미스터리 · 조사 · 논쟁 — 헤드폰 권장 · 약 30–40분');
  }

  show(hasSave: boolean) {
    // the manifest is loaded after construction, so resolve the key art here
    const e = assets.get('keyart_title');
    if (e && !this.art.style.backgroundImage) this.art.style.backgroundImage = `url(${url(e.file)})`;
    this.cont.disabled = !hasSave;
    this.cont.title = hasSave ? '' : '저장된 진행이 없습니다';
    this.root.classList.add('on');
  }
  hide() {
    this.root.classList.remove('on');
    releaseFocus(this.root);
  }
}

/** Drop keyboard focus from a hidden panel so Space/Enter can't re-trigger its buttons. */
function releaseFocus(root: HTMLElement) {
  const a = document.activeElement;
  if (a instanceof HTMLElement && root.contains(a)) a.blur();
}

export class Credits {
  readonly root: HTMLElement;
  onDone: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'credits', parent);
  }

  show(playSeconds: number) {
    this.root.innerHTML = '';
    this.root.classList.add('on');
    const roll = el('div', 'cr-roll', this.root);
    el('div', 'cr-logo', roll, 'AFTERSIGNAL');
    el('div', 'cr-sub', roll, '케스트럴 타워의 마지막 밤 — 끝');
    const cast = el('div', 'cr-cast', roll);
    for (const id of CHAR_IDS) {
      const c = CHARACTERS[id];
      const card = el('div', 'cr-card', cast);
      const img = el('img', '', card);
      img.src = url(assets.portrait(id, id === 'theo' ? 'happy' : 'neutral').smallFile ?? assets.portrait(id).file);
      img.alt = c.name;
      el('div', 'cr-name', card, c.name);
      el('div', 'cr-role', card, c.role);
    }
    const lines = [
      ['사건', '23:47 · 금고실 · 수동 CO₂ 방출 · 렌 홀리스'],
      ['플레이 시간', `${Math.floor(playSeconds / 60)}분 ${Math.floor(playSeconds % 60)}초`],
      ['엔진', 'TypeScript · Three.js · Web Audio (절차적 사운드)'],
      ['아트', 'Codex CLI 내장 이미지 생성 — AFTERSIGNAL 비주얼 바이블 기반'],
      ['개발', 'Kiro + Claude Opus 5.5'],
    ];
    const dl = el('dl', 'cr-lines', roll);
    for (const [k, v] of lines) {
      el('dt', '', dl, k);
      el('dd', '', dl, v);
    }
    el('div', 'cr-thanks', roll, '들어 주셔서 고맙습니다. — 97.3');
    const btn = el('button', 'btn', this.root, '타이틀로');
    btn.dataset.action = 'to-title';
    btn.addEventListener('click', () => this.onDone?.());
  }

  hide() {
    this.root.classList.remove('on');
  }
}
