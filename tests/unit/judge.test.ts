import { describe, expect, it } from 'vitest';
import { TRIAL } from '../../src/data/trial';
import { EVIDENCE } from '../../src/data/evidence';
import { judgeDebate, judgeReel, judgeTune, isTargetable } from '../../src/trial/judge';
import type { DebateRound, ReelRound, TuneRound } from '../../src/data/types';

const rounds = TRIAL.flatMap((s) => s.rounds);
const debates = rounds.filter((r): r is DebateRound => r.kind === 'cut' || r.kind === 'patch');
const tunes = rounds.filter((r): r is TuneRound => r.kind === 'tune');
const reels = rounds.filter((r): r is ReelRound => r.kind === 'reel');

describe('hearing judge', () => {
  it('uses all four debate verbs', () => {
    expect(new Set(rounds.map((r) => r.kind))).toEqual(new Set(['cut', 'patch', 'tune', 'reel']));
  });

  it.each(debates.map((r) => [r.id, r] as const))('%s: answer is correct, partials explain, everything else is wrong', (_id, r) => {
    for (const e of r.answer.evidence) expect(judgeDebate(r, r.answer.statement, e).result).toBe('correct');
    expect(isTargetable(r, r.answer.statement)).toBe(true);
    for (const p of r.partial ?? []) expect(judgeDebate(r, p.statement, p.evidence)).toEqual({ result: 'partial', reply: p.reply });
    const partialKeys = new Set((r.partial ?? []).map((p) => `${p.statement}|${p.evidence}`));
    for (const s of r.statements) {
      for (const e of EVIDENCE) {
        const isAnswer = s.id === r.answer.statement && r.answer.evidence.includes(e.id);
        if (isAnswer || partialKeys.has(`${s.id}|${e.id}`)) continue;
        expect(judgeDebate(r, s.id, e.id).result).toBe('wrong');
      }
    }
  });

  it.each(tunes.map((r) => [r.id, r] as const))('%s: exactly one option tunes in', (_id, r) => {
    expect(r.options.filter((o) => judgeTune(r, o.id))).toHaveLength(1);
  });

  it.each(reels.map((r) => [r.id, r] as const))('%s: only the chronological order splices', (_id, r) => {
    expect(judgeReel(r, r.answerOrder)).toEqual({ correct: true, matches: r.answerOrder.length });
    const start = judgeReel(r, r.initialOrder);
    expect(start.correct).toBe(false);
    expect(start.matches).toBeLessThan(r.answerOrder.length);
    expect(judgeReel(r, r.answerOrder.slice(1)).correct).toBe(false);
  });
});
