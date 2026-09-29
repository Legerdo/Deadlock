import { describe, expect, it } from 'vitest';
import { validate } from '../../tools/validate-case';

describe('case validator', () => {
  it('finds no errors in the shipped case, story graph and hearing', () => {
    const r = validate();
    expect(r.errors).toEqual([]);
    expect(r.stats.states).toBe(13);
    expect(r.stats.requiredEvidence).toBeGreaterThanOrEqual(12);
    expect(r.stats.rounds).toBeGreaterThanOrEqual(8);
  });
});
