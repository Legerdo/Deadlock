import { REQUIRED_EVIDENCE, EVIDENCE_BY_ID, STATEMENT_BY_ID } from '../data/evidence';
import { INITIAL_STATE, STORY } from '../data/story';
import type { StoryContext, StoryStateDef, StoryStateId } from '../data/types';

export interface TrialProgress {
  stage: number;
  round: number;
  focus: number;
}

export interface MachineSnapshot {
  state: StoryStateId;
  flags: string[];
  evidence: string[];
  statements: string[];
  examined: string[];
  talked: string[];
  trial: TrialProgress;
}

type Listener = (kind: 'state' | 'flag' | 'evidence' | 'statement' | 'trial', id: string) => void;

export const MAX_FOCUS = 5;

/**
 * The single owner of story progress. Nothing else changes the story state.
 * Transitions follow the `exit` definitions in src/data/story.ts only.
 */
export class StoryMachine {
  state: StoryStateId = INITIAL_STATE;
  readonly flags = new Set<string>();
  readonly evidence = new Set<string>();
  readonly statements = new Set<string>();
  readonly examined = new Set<string>();
  readonly talked = new Set<string>();
  trial: TrialProgress = { stage: 0, round: 0, focus: MAX_FOCUS };
  private listeners: Listener[] = [];

  get def(): StoryStateDef {
    return STORY[this.state];
  }

  on(fn: Listener) {
    this.listeners.push(fn);
    return () => (this.listeners = this.listeners.filter((l) => l !== fn));
  }

  private emit(kind: Parameters<Listener>[0], id: string) {
    for (const l of this.listeners) l(kind, id);
  }

  ctx(): StoryContext {
    return { flags: this.flags, evidence: this.evidence };
  }

  objective(): string {
    return this.def.objective(this.ctx());
  }

  setFlag(id: string) {
    if (this.flags.has(id)) return;
    this.flags.add(id);
    this.emit('flag', id);
  }

  /** Returns true when the item is new. */
  addEvidence(id: string): boolean {
    if (!EVIDENCE_BY_ID.has(id)) throw new Error(`unknown evidence ${id}`);
    if (this.evidence.has(id)) return false;
    this.evidence.add(id);
    this.emit('evidence', id);
    return true;
  }

  addStatement(id: string): boolean {
    if (!STATEMENT_BY_ID.has(id)) throw new Error(`unknown statement ${id}`);
    if (this.statements.has(id)) return false;
    this.statements.add(id);
    this.emit('statement', id);
    return true;
  }

  hasAllRequiredEvidence(): boolean {
    return REQUIRED_EVIDENCE.every((id) => this.evidence.has(id));
  }

  /** Evaluate `if` conditions used by scripts: flag id or "ev:<id>". */
  test(cond: string): boolean {
    if (cond.startsWith('ev:')) return this.evidence.has(cond.slice(3));
    return this.flags.has(cond);
  }

  /** Condition-driven exits (flags / evidence). Returns the new state or null. */
  checkAuto(): StoryStateId | null {
    const exit = this.def.exit;
    if (!exit) return null;
    if (exit.kind === 'flags' && exit.flags.every((f) => this.flags.has(f))) return this.go(exit.to);
    if (exit.kind === 'evidence' && this.hasAllRequiredEvidence()) return this.go(exit.to);
    return null;
  }

  /** Script- or trial-driven exits. */
  advance(): StoryStateId {
    const exit = this.def.exit;
    if (!exit) throw new Error(`state ${this.state} is final`);
    if (exit.kind === 'flags' || exit.kind === 'evidence') {
      throw new Error(`state ${this.state} advances by condition, not by script`);
    }
    return this.go(exit.to);
  }

  private go(to: StoryStateId): StoryStateId {
    const keepFocus = this.def.mode === 'trial' && STORY[to].mode === 'trial';
    this.state = to;
    this.trial = { stage: 0, round: 0, focus: keepFocus ? this.trial.focus : MAX_FOCUS };
    this.emit('state', to);
    return to;
  }

  setTrial(p: Partial<TrialProgress>) {
    this.trial = { ...this.trial, ...p };
    this.emit('trial', `${this.trial.stage}:${this.trial.round}`);
  }

  snapshot(): MachineSnapshot {
    return {
      state: this.state,
      flags: [...this.flags],
      evidence: [...this.evidence],
      statements: [...this.statements],
      examined: [...this.examined],
      talked: [...this.talked],
      trial: { ...this.trial },
    };
  }

  restore(s: MachineSnapshot) {
    if (!STORY[s.state]) throw new Error(`bad save state ${s.state}`);
    this.state = s.state;
    for (const set of [this.flags, this.evidence, this.statements, this.examined, this.talked]) set.clear();
    s.flags.forEach((f) => this.flags.add(f));
    s.evidence.filter((e) => EVIDENCE_BY_ID.has(e)).forEach((e) => this.evidence.add(e));
    s.statements.filter((e) => STATEMENT_BY_ID.has(e)).forEach((e) => this.statements.add(e));
    s.examined.forEach((e) => this.examined.add(e));
    s.talked.forEach((e) => this.talked.add(e));
    this.trial = { stage: s.trial?.stage ?? 0, round: s.trial?.round ?? 0, focus: s.trial?.focus ?? MAX_FOCUS };
  }

  reset() {
    this.restore({ state: INITIAL_STATE, flags: [], evidence: [], statements: [], examined: [], talked: [], trial: { stage: 0, round: 0, focus: MAX_FOCUS } });
  }
}
