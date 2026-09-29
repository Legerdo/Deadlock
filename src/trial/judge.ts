import type { DebateRound, LineBeat, ReelRound, TuneRound } from '../data/types';

export type DebateVerdict = { result: 'correct' } | { result: 'partial'; reply: LineBeat } | { result: 'wrong' };

/** CUT / PATCH: the (statement, evidence) pair must match the round's answer. */
export function judgeDebate(round: DebateRound, statementId: string, evidenceId: string): DebateVerdict {
  if (round.answer.statement === statementId && round.answer.evidence.includes(evidenceId)) return { result: 'correct' };
  const p = round.partial?.find((x) => x.statement === statementId && x.evidence === evidenceId);
  if (p) return { result: 'partial', reply: p.reply };
  return { result: 'wrong' };
}

export function judgeTune(round: TuneRound, optionId: string): boolean {
  return round.answer === optionId;
}

export function judgeReel(round: ReelRound, order: string[]): { correct: boolean; matches: number } {
  let matches = 0;
  round.answerOrder.forEach((id, i) => {
    if (order[i] === id) matches++;
  });
  return { correct: matches === round.answerOrder.length && order.length === round.answerOrder.length, matches };
}

/** Statement is targetable only when it has a marked phrase. */
export function isTargetable(round: DebateRound, statementId: string) {
  return !!round.statements.find((s) => s.id === statementId)?.mark;
}
