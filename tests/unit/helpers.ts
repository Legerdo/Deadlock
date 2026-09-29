import type { Presenter } from '../../src/story/Director';

/** Presenter that records what a script showed, without any DOM. */
export function recorder() {
  const seen = { lines: [] as string[], cutins: [] as string[], evidence: [] as string[], statements: [] as string[] };
  const p: Presenter = {
    line: async (b) => void seen.lines.push(`${b.who}: ${b.t}`),
    cutin: async (id) => void seen.cutins.push(id),
    title: async () => undefined,
    evidence: async (id) => void seen.evidence.push(id),
    statement: (id) => void seen.statements.push(id),
    sfx: () => undefined,
    shake: () => undefined,
    bg: () => undefined,
    wait: async () => undefined,
  };
  return { p, seen };
}

/** In-memory Storage double. */
export function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}
