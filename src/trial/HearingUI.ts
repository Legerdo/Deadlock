import { CHARACTERS } from '../data/characters';
import { EVIDENCE } from '../data/evidence';
import type { DebateRound, ReelRound, TrialStage, TrialStatement, TuneRound } from '../data/types';
import type { Settings } from '../core/Settings';
import type { AudioEngine } from '../audio/Audio';
import { MAX_FOCUS } from '../core/StoryMachine';
import { el } from '../ui/dom';
import { icon } from '../ui/icons';

const VERB: Record<string, { label: string; glyph: string; ko: string }> = {
  cut: { label: 'CUT', glyph: '✂', ko: '모순을 잘라내라' },
  patch: { label: 'PATCH', glyph: '⎓', ko: '옳은 말을 이어 붙여라' },
  tune: { label: 'TUNE', glyph: '◍', ko: '빠진 것을 맞춰라' },
  reel: { label: 'REEL', glyph: '◎', ko: '순서를 이어 붙여라' },
};

export interface DebateHandlers {
  onStatement: (s: TrialStatement) => void;
  onAttempt: (statementId: string, evidenceId: string) => void;
  onBoard: () => void;
}

/** DOM side of the Crosswire Account: headers, focus, debate strip, dial, reel. */
export class HearingUI {
  readonly root: HTMLElement;
  private head: HTMLElement;
  private stageEl: HTMLElement;
  private roundEl: HTMLElement;
  private verbEl: HTMLElement;
  private focusEl: HTMLElement;
  private promptEl: HTMLElement;
  private stage: HTMLElement;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private cycleTimer: number | null = null;
  private manualUntil = 0;
  locked = false;

  constructor(parent: HTMLElement, private audio: AudioEngine, readonly settings: () => Settings) {
    this.root = el('div', 'hearing-ui', parent);
    this.head = el('div', 'hr-head', this.root);
    this.stageEl = el('div', 'hr-stage', this.head);
    this.roundEl = el('div', 'hr-round', this.head);
    this.verbEl = el('div', 'hr-verb', this.root);
    this.focusEl = el('div', 'hr-focus', this.root);
    this.focusEl.setAttribute('role', 'meter');
    this.focusEl.setAttribute('aria-label', 'Focus');
    this.promptEl = el('div', 'hr-prompt', this.root);
    this.stage = el('div', 'hr-stage-area', this.root);
    // Mouse clicks must not leave a button focused: Space/Enter drive the hearing
    // keyboard controls and would otherwise also "click" the focused button.
    this.root.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('button')) e.preventDefault();
    });
  }

  show(on: boolean) {
    this.root.classList.toggle('on', on);
  }

  setFocus(n: number, hit = false) {
    this.focusEl.innerHTML = '';
    el('span', 'hr-focus-label', this.focusEl, 'FOCUS');
    const pips = el('span', 'hr-pips', this.focusEl);
    for (let i = 0; i < MAX_FOCUS; i++) el('i', i < n ? 'on' : 'off', pips);
    el('span', 'hr-focus-num', this.focusEl, `${n}/${MAX_FOCUS}`);
    this.focusEl.setAttribute('aria-valuenow', String(n));
    this.focusEl.dataset.focus = String(n);
    if (hit) {
      this.focusEl.classList.remove('hit');
      void this.focusEl.offsetWidth;
      this.focusEl.classList.add('hit');
    }
  }

  setHeader(stage: TrialStage, title: string, kind: string, prompt: string) {
    this.stageEl.innerHTML = `<b>STAGE ${stage.numeral}</b> ${stage.title} <em>${stage.titleEn}</em>`;
    this.roundEl.textContent = title;
    const v = VERB[kind];
    this.verbEl.innerHTML = `<span class="g">${v.glyph}</span><span class="l">${v.label}</span><span class="k">${v.ko}</span>`;
    this.verbEl.dataset.verb = kind;
    this.promptEl.textContent = prompt;
    this.root.dataset.kind = kind;
  }

  headerVisible(on: boolean) {
    this.root.classList.toggle('chrome', on);
  }

  clear() {
    this.stopCycle();
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler, true);
    this.keyHandler = null;
    const a = document.activeElement;
    if (a instanceof HTMLElement && this.root.contains(a)) a.blur();
    this.stage.innerHTML = '';
    this.stage.className = 'hr-stage-area';
  }

  private stopCycle() {
    if (this.cycleTimer !== null) window.clearTimeout(this.cycleTimer);
    this.cycleTimer = null;
  }

  // ───────────────────────── CUT / PATCH ─────────────────────────
  debate(round: DebateRound, owned: string[], h: DebateHandlers) {
    this.clear();
    this.stage.classList.add('debate');
    const dots = el('div', 'hr-dots', this.stage);
    const strip = el('div', 'hr-strip', this.stage);
    const speaker = el('div', 'hr-speaker', strip);
    const line = el('div', 'hr-line', strip);
    const controls = el('div', 'hr-controls', this.stage);
    const tray = el('div', 'hr-tray', controls);
    const actions = el('div', 'hr-actions', controls);
    const loaded = el('div', 'hr-loaded', actions, '증거를 고르세요');
    const act = el('button', 'hr-act', actions);
    act.dataset.action = 'apply';
    const v = VERB[round.kind];
    act.innerHTML = `<span>${v.glyph}</span> ${v.label}`;
    const help = el('div', 'hr-help', actions, '←/→ 진술 · ↑/↓ 증거 · Enter 실행 · Tab 증거 상세');
    void help;

    const evidence = EVIDENCE.filter((e) => owned.includes(e.id));
    let cur = 0;
    let sel: string | null = null;
    const cards: HTMLButtonElement[] = [];
    evidence.forEach((e, i) => {
      const c = el('button', 'hr-card', tray);
      c.dataset.evidence = e.id;
      c.innerHTML = `<span class="n">${i < 9 ? i + 1 : ''}</span><span class="ic">${icon(e.icon)}</span><span class="t">${e.title}</span>`;
      c.addEventListener('click', () => pick(e.id));
      cards.push(c);
    });
    const dotEls = round.statements.map((s, i) => {
      const d = el('button', 'hr-dot', dots, String(i + 1));
      d.dataset.statement = s.id;
      d.classList.toggle('marked', !!s.mark);
      d.setAttribute('aria-label', `진술 ${i + 1}: ${CHARACTERS[s.who].name}`);
      d.addEventListener('click', () => {
        this.manualUntil = performance.now() + 14000;
        showStatement(i);
      });
      return d;
    });

    const refreshAct = () => {
      const st = round.statements[cur];
      act.disabled = !sel || !st.mark || this.locked;
      act.classList.toggle('ready', !act.disabled);
    };
    const pick = (id: string) => {
      sel = id;
      this.manualUntil = performance.now() + 14000;
      cards.forEach((c) => c.classList.toggle('on', c.dataset.evidence === id));
      const e = evidence.find((x) => x.id === id)!;
      loaded.innerHTML = `<b>장전</b> ${e.title}`;
      this.audio.sfx('click');
      cards.find((c) => c.dataset.evidence === id)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      refreshAct();
    };
    const attempt = () => {
      if (this.locked || !sel) return;
      const st = round.statements[cur];
      if (!st.mark) return;
      h.onAttempt(st.id, sel);
    };
    act.addEventListener('click', attempt);

    const showStatement = (i: number) => {
      cur = (i + round.statements.length) % round.statements.length;
      const st = round.statements[cur];
      dotEls.forEach((d, k) => d.classList.toggle('on', k === cur));
      const c = CHARACTERS[st.who];
      speaker.innerHTML = `<span class="tape">${c.name}</span><span class="en">${c.nameEn}</span>`;
      strip.style.setProperty('--accent', c.color);
      line.innerHTML = '';
      line.dataset.statement = st.id;
      if (st.mark) {
        const at = st.t.indexOf(st.mark);
        line.append(document.createTextNode(st.t.slice(0, at)));
        const m = el('mark', 'weak', line, st.mark);
        m.setAttribute('role', 'button');
        m.tabIndex = 0;
        m.addEventListener('click', attempt);
        line.append(document.createTextNode(st.t.slice(at + st.mark.length)));
      } else {
        line.textContent = st.t;
      }
      strip.classList.remove('in');
      void strip.offsetWidth;
      strip.classList.add('in');
      h.onStatement(st);
      refreshAct();
      this.stopCycle();
      const delay = Math.max(3200, st.t.length * 95);
      const tick = () => {
        if (this.locked) return;
        if (performance.now() < this.manualUntil) {
          this.cycleTimer = window.setTimeout(tick, 600);
          return;
        }
        showStatement(cur + 1);
      };
      this.cycleTimer = window.setTimeout(tick, delay);
    };

    this.keyHandler = (e: KeyboardEvent) => {
      if (this.locked || e.repeat) return;
      const k = e.code;
      if (k === 'ArrowRight' || k === 'KeyD') {
        this.manualUntil = performance.now() + 14000;
        showStatement(cur + 1);
      } else if (k === 'ArrowLeft' || k === 'KeyA') {
        this.manualUntil = performance.now() + 14000;
        showStatement(cur - 1);
      } else if (k === 'ArrowDown' || k === 'ArrowUp') {
        if (!evidence.length) return;
        const i = sel ? evidence.findIndex((x) => x.id === sel) : -1;
        const n = (i + (k === 'ArrowDown' ? 1 : -1) + evidence.length) % evidence.length;
        pick(evidence[n].id);
      } else if (/^Digit[1-9]$/.test(k)) {
        const n = Number(k.slice(5)) - 1;
        if (evidence[n]) pick(evidence[n].id);
      } else if (k === 'Enter' || k === 'KeyF') {
        attempt();
      } else if (k === 'Tab') {
        e.preventDefault();
        h.onBoard();
      } else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', this.keyHandler, true);
    this.locked = false;
    showStatement(0);
    return {
      resume: () => {
        this.locked = false;
        this.stage.classList.remove('hold');
        showStatement(cur);
      },
      hold: () => {
        this.locked = true;
        this.stopCycle();
        this.stage.classList.add('hold');
        refreshAct();
      },
      splitCurrent: (kind: 'cut' | 'patch') => {
        line.classList.add(kind === 'cut' ? 'split' : 'patched');
      },
      restart: () => {
        this.locked = false;
        this.stage.classList.remove('hold');
        showStatement(0);
      },
    };
  }

  // ───────────────────────── TUNE ─────────────────────────
  tune(round: TuneRound, onSubmit: (optionId: string) => void) {
    this.clear();
    this.stage.classList.add('tune');
    el('div', 'tn-q', this.stage, round.question);
    const dial = el('div', 'tn-dial', this.stage);
    const face = el('div', 'tn-face', dial);
    const needle = el('div', 'tn-needle', face);
    const n = round.options.length;
    const optEls = round.options.map((o, i) => {
      const a = -70 + (140 * i) / Math.max(1, n - 1);
      const b = el('button', 'tn-opt', face);
      b.style.setProperty('--a', `${a}deg`);
      b.dataset.option = o.id;
      b.innerHTML = `<span class="lbl">${o.label}</span>${o.sub ? `<span class="sub">${o.sub}</span>` : ''}`;
      b.addEventListener('click', () => {
        if (cur === i) submit();
        else set(i);
      });
      return { b, a };
    });
    const bar = el('div', 'tn-bar', this.stage);
    const meter = el('div', 'tn-meter', bar);
    for (let i = 0; i < 16; i++) el('i', '', meter);
    const go = el('button', 'hr-act ready tn-go', bar);
    go.dataset.action = 'tune';
    go.innerHTML = '<span>◍</span> TUNE IN';
    el('div', 'hr-help', bar, '←/→ 다이얼 · Enter 확정');
    let cur = Math.floor(n / 2);
    const set = (i: number) => {
      cur = (i + n) % n;
      needle.style.setProperty('--a', `${optEls[cur].a}deg`);
      optEls.forEach((o, k) => o.b.classList.toggle('on', k === cur));
      [...meter.children].forEach((c) => ((c as HTMLElement).style.height = `${20 + Math.random() * 80}%`));
      this.audio.sfx('static');
    };
    const submit = () => {
      if (this.locked) return;
      onSubmit(round.options[cur].id);
    };
    go.addEventListener('click', submit);
    this.keyHandler = (e: KeyboardEvent) => {
      if (this.locked || e.repeat) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') set(cur - 1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') set(cur + 1);
      else if (e.code === 'Enter' || e.code === 'Space') submit();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', this.keyHandler, true);
    this.locked = false;
    needle.style.setProperty('--a', `${optEls[cur].a}deg`);
    optEls[cur].b.classList.add('on');
    return {
      hold: () => {
        this.locked = true;
        this.stage.classList.add('hold');
      },
      resume: () => {
        this.locked = false;
        this.stage.classList.remove('hold');
      },
      lockIn: () => {
        this.stage.classList.remove('hold');
        this.stage.classList.add('locked-in');
      },
    };
  }

  // ───────────────────────── REEL ─────────────────────────
  reel(round: ReelRound, onSubmit: (order: string[]) => void) {
    this.clear();
    this.stage.classList.add('reel');
    const order = [...round.initialOrder];
    const grid = el('div', 'rl-grid', this.stage);
    const bar = el('div', 'tn-bar', this.stage);
    const status = el('div', 'rl-status', bar, '두 조각을 차례로 눌러 자리를 바꾼다.');
    const go = el('button', 'hr-act ready', bar);
    go.dataset.action = 'splice';
    go.innerHTML = '<span>◎</span> SPLICE';
    el('div', 'hr-help', bar, '방향키 이동 · Space 선택/교환 · Enter 확정');
    let cursor = 0;
    let picked: number | null = null;
    const render = () => {
      grid.innerHTML = '';
      order.forEach((id, i) => {
        const p = round.panels.find((x) => x.id === id)!;
        const seg = el('button', 'rl-seg', grid);
        seg.dataset.panel = id;
        seg.dataset.slot = String(i);
        seg.classList.toggle('cursor', i === cursor);
        seg.classList.toggle('picked', i === picked);
        el('span', 'rl-slot', seg, String(i + 1).padStart(2, '0'));
        el('span', 'rl-time', seg, '--:--');
        el('span', 'rl-text', seg, p.text);
        seg.addEventListener('click', () => choose(i));
      });
    };
    const choose = (i: number) => {
      if (this.locked) return;
      cursor = i;
      if (picked === null) picked = i;
      else if (picked === i) picked = null;
      else {
        [order[picked], order[i]] = [order[i], order[picked]];
        picked = null;
        this.audio.sfx('patch');
      }
      this.audio.sfx('click');
      render();
    };
    const submit = () => {
      if (this.locked) return;
      onSubmit([...order]);
    };
    go.addEventListener('click', submit);
    this.keyHandler = (e: KeyboardEvent) => {
      if (this.locked || e.repeat) return;
      const cols = 4;
      if (e.code === 'ArrowRight') cursor = Math.min(order.length - 1, cursor + 1);
      else if (e.code === 'ArrowLeft') cursor = Math.max(0, cursor - 1);
      else if (e.code === 'ArrowDown') cursor = Math.min(order.length - 1, cursor + cols);
      else if (e.code === 'ArrowUp') cursor = Math.max(0, cursor - cols);
      else if (e.code === 'Space') return (e.preventDefault(), choose(cursor));
      else if (e.code === 'Enter') submit();
      else return;
      e.preventDefault();
      e.stopPropagation();
      render();
    };
    window.addEventListener('keydown', this.keyHandler, true);
    this.locked = false;
    render();
    return {
      hold: () => {
        this.locked = true;
        this.stage.classList.add('hold');
      },
      resume: () => {
        this.locked = false;
        this.stage.classList.remove('hold');
      },
      status: (t: string) => (status.textContent = t),
      reveal: () => {
        this.stage.classList.remove('hold');
        order.forEach((id, i) => {
          const seg = grid.children[i] as HTMLElement;
          const p = round.panels.find((x) => x.id === id)!;
          (seg.querySelector('.rl-time') as HTMLElement).textContent = p.time;
          seg.classList.add('ok');
          seg.style.transitionDelay = `${i * 70}ms`;
        });
      },
    };
  }

  signalLost() {
    const s = el('div', 'signal-lost', this.root);
    s.innerHTML = '<b>SIGNAL LOST</b><span>집중이 끊겼다. 처음부터 다시 듣는다.</span>';
    requestAnimationFrame(() => s.classList.add('go'));
    return new Promise<void>((r) =>
      setTimeout(() => {
        s.remove();
        r();
      }, 1600),
    );
  }
}
