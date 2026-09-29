import { CHARACTERS } from '../data/characters';
import { EVIDENCE, EVIDENCE_BY_ID, STATEMENTS } from '../data/evidence';
import { ROOMS } from '../data/locations';
import type { StoryMachine } from '../core/StoryMachine';
import { el } from './dom';
import { icon } from './icons';

/** Tab board: evidence cards + recorded statements. Shows facts, never conclusions. */
export class EvidenceBoard {
  readonly root: HTMLElement;
  private list: HTMLElement;
  private detail: HTMLElement;
  private tabs: HTMLButtonElement[] = [];
  private tab: 'evidence' | 'statements' = 'evidence';
  private selected: string | null = null;
  isOpen = false;
  onClose: (() => void) | null = null;

  constructor(parent: HTMLElement, private machine: StoryMachine) {
    this.root = el('div', 'board', parent);
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', '증거 보드');
    const head = el('div', 'board-head', this.root);
    el('div', 'board-title', head, 'EVIDENCE BOARD');
    el('div', 'board-sub', head, '증거 보드 · 사실만 기록된다');
    const tabs = el('div', 'board-tabs', head);
    for (const [id, label] of [
      ['evidence', '증거'],
      ['statements', '진술'],
    ] as const) {
      const b = el('button', 'board-tab', tabs, label);
      b.addEventListener('click', () => {
        this.tab = id;
        this.render();
      });
      b.dataset.tab = id;
      this.tabs.push(b);
    }
    const close = el('button', 'board-close', head, '닫기 (Tab)');
    close.addEventListener('click', () => this.close());
    const body = el('div', 'board-body', this.root);
    this.list = el('div', 'board-list', body);
    this.detail = el('div', 'board-detail', body);
  }

  open() {
    this.isOpen = true;
    this.root.classList.add('on');
    if (!this.selected) this.selected = [...this.machine.evidence][0] ?? null;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.root.classList.remove('on');
    const a = document.activeElement;
    if (a instanceof HTMLElement && this.root.contains(a)) a.blur();
    this.onClose?.();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  /** keyboard navigation inside the board */
  key(code: string) {
    if (this.tab !== 'evidence') return;
    const owned = EVIDENCE.filter((e) => this.machine.evidence.has(e.id)).map((e) => e.id);
    if (!owned.length) return;
    const i = Math.max(0, owned.indexOf(this.selected ?? ''));
    if (code === 'ArrowRight' || code === 'ArrowDown') this.selected = owned[(i + 1) % owned.length];
    if (code === 'ArrowLeft' || code === 'ArrowUp') this.selected = owned[(i - 1 + owned.length) % owned.length];
    this.render();
  }

  render() {
    this.tabs.forEach((b) => b.classList.toggle('on', b.dataset.tab === this.tab));
    this.list.innerHTML = '';
    this.detail.innerHTML = '';
    if (this.tab === 'evidence') {
      const owned = EVIDENCE.filter((e) => this.machine.evidence.has(e.id));
      el('div', 'board-count', this.list, `${owned.length} 건`);
      if (!owned.length) el('div', 'board-empty', this.list, '아직 확보한 증거가 없다.');
      for (const e of owned) {
        const card = el('button', 'ev-card', this.list);
        card.classList.toggle('on', e.id === this.selected);
        card.dataset.evidence = e.id;
        const ic = el('span', 'ev-icon', card);
        ic.innerHTML = icon(e.icon);
        el('span', 'ev-name', card, e.title);
        el('span', 'ev-kind', card, e.kind === 'testimony' ? '진술' : e.kind === 'record' ? '기록' : '물증');
        card.addEventListener('click', () => {
          this.selected = e.id;
          this.render();
        });
      }
      const sel = this.selected ? EVIDENCE_BY_ID.get(this.selected) : null;
      if (sel && this.machine.evidence.has(sel.id)) {
        const big = el('div', 'bd-icon', this.detail);
        big.innerHTML = icon(sel.icon);
        el('div', 'bd-title', this.detail, sel.title);
        el('div', 'bd-where', this.detail, `발견 장소 — ${ROOMS[sel.obtainedAt].name} · ${ROOMS[sel.obtainedAt].nameEn}`);
        el('p', 'bd-desc', this.detail, sel.description);
        el('div', 'bd-facts-h', this.detail, '확정된 사실');
        const ul = el('ul', 'bd-facts', this.detail);
        sel.facts.forEach((f) => el('li', '', ul, f));
      }
    } else {
      const owned = STATEMENTS.filter((s) => this.machine.statements.has(s.id));
      el('div', 'board-count', this.list, `${owned.length} 건`);
      if (!owned.length) el('div', 'board-empty', this.list, '아직 기록한 진술이 없다.');
      for (const s of owned) {
        const row = el('div', 'st-row', this.list);
        row.style.setProperty('--accent', CHARACTERS[s.who].color);
        el('span', 'st-who', row, CHARACTERS[s.who].name);
        el('span', 'st-text', row, `“${s.text}”`);
      }
      el('p', 'bd-desc', this.detail, '진술은 사실이 아닐 수도 있다. 증거와 맞춰 보라.');
    }
  }
}
