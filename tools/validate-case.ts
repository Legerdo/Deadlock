// Data-driven validation of the case, story graph and hearing.
// Run: npm run validate  (also part of npm run build)
import { pathToFileURL } from 'node:url';
import { SCRIPTS } from '../src/data/dialogue';
import { EVIDENCE, EVIDENCE_BY_ID, HOTSPOTS, HOTSPOT_BY_ID, REQUIRED_EVIDENCE, STATEMENT_BY_ID } from '../src/data/evidence';
import { ROOMS, roomGraph } from '../src/data/locations';
import { STORY, STORY_ORDER, INITIAL_STATE } from '../src/data/story';
import { TRIAL, HEARING_OPENING } from '../src/data/trial';
import { CASE, toMinutes } from '../src/data/case';
import { CHARACTERS } from '../src/data/characters';
import type { Beat, RoomId, Script, StoryStateId } from '../src/data/types';

export interface Report {
  errors: string[];
  warnings: string[];
  stats: Record<string, number>;
}

function walk(script: Script, fn: (b: Beat) => void) {
  for (const b of script) {
    fn(b);
    if ('if' in b) {
      walk(b.then, fn);
      if (b.else) walk(b.else, fn);
    }
  }
}

function scriptsOfState(id: StoryStateId): string[] {
  const s = STORY[id];
  const out = new Set<string>();
  if (s.onEnter) out.add(s.onEnter);
  for (const n of s.npcs) {
    if (!s.rooms.includes(n.room)) continue;
    out.add(n.talk);
    if (n.again) out.add(n.again);
  }
  for (const h of s.hotspots) {
    const hs = HOTSPOT_BY_ID.get(h);
    if (hs && s.rooms.includes(hs.room)) out.add(hs.script);
  }
  for (const r of s.rooms) for (const d of ROOMS[r].doors) if (d.script?.[id]) out.add(d.script[id]!);
  return [...out];
}

function grantsOf(scriptId: string, kind: 'evidence' | 'flag' | 'advance'): string[] {
  const s = SCRIPTS[scriptId];
  if (!s) return [];
  const out: string[] = [];
  walk(s, (b) => {
    if ('cmd' in b) {
      if (kind === 'evidence' && b.cmd === 'evidence') out.push(b.id);
      if (kind === 'flag' && b.cmd === 'flag') out.push(b.id);
      if (kind === 'advance' && b.cmd === 'advance') out.push('advance');
    }
  });
  return out;
}

export function validate(): Report {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);

  // ── evidence / hotspots / statements
  const ids = new Set<string>();
  for (const e of EVIDENCE) {
    if (ids.has(e.id)) err(`duplicate evidence id ${e.id}`);
    ids.add(e.id);
    if (!ROOMS[e.obtainedAt]) err(`evidence ${e.id} obtainedAt unknown room ${e.obtainedAt}`);
    if (!e.facts.length) err(`evidence ${e.id} has no facts`);
  }
  for (const h of HOTSPOTS) {
    if (!SCRIPTS[h.script]) err(`hotspot ${h.id} script ${h.script} missing`);
    if (h.grants && !EVIDENCE_BY_ID.has(h.grants)) err(`hotspot ${h.id} grants unknown evidence ${h.grants}`);
    if (h.grants && !grantsOf(h.script, 'evidence').includes(h.grants)) err(`hotspot ${h.id} script does not grant ${h.grants}`);
    const [w, , d] = ROOMS[h.room].size;
    if (Math.abs(h.pos[0]) > w / 2 || Math.abs(h.pos[2]) > d / 2) err(`hotspot ${h.id} outside room ${h.room}`);
  }

  // ── scripts: references
  for (const [sid, s] of Object.entries(SCRIPTS)) {
    walk(s, (b) => {
      if ('cmd' in b) {
        if (b.cmd === 'evidence' && !EVIDENCE_BY_ID.has(b.id)) err(`script ${sid}: unknown evidence ${b.id}`);
        if (b.cmd === 'statement' && !STATEMENT_BY_ID.has(b.id)) err(`script ${sid}: unknown statement ${b.id}`);
      }
      if ('who' in b && b.who !== 'narr' && b.who !== 'warden' && !CHARACTERS[b.who]) err(`script ${sid}: unknown speaker ${b.who}`);
      if ('if' in b && b.if.startsWith('ev:') && !EVIDENCE_BY_ID.has(b.if.slice(3))) err(`script ${sid}: if on unknown evidence ${b.if}`);
    });
  }

  // ── story graph
  const graph = roomGraph();
  for (const id of STORY_ORDER) {
    const s = STORY[id];
    if (s.id !== id) err(`story state key ${id} != id ${s.id}`);
    for (const r of s.rooms) if (!ROOMS[r]) err(`${id}: unknown room ${r}`);
    if (s.start && !s.rooms.includes(s.start.room)) err(`${id}: start room ${s.start.room} not accessible`);
    if (s.start && !ROOMS[s.start.room].spawns[s.start.spawn]) err(`${id}: start spawn ${s.start.spawn} missing`);
    if (s.onEnter && !SCRIPTS[s.onEnter]) err(`${id}: onEnter ${s.onEnter} missing`);
    if (s.mode === 'explore' && !s.rooms.length) err(`${id}: explore state without rooms`);
    for (const n of s.npcs) {
      if (!s.rooms.includes(n.room)) err(`${id}: npc ${n.char} in inaccessible room ${n.room}`);
      if (!SCRIPTS[n.talk]) err(`${id}: npc ${n.char} talk ${n.talk} missing`);
      if (n.again && !SCRIPTS[n.again]) err(`${id}: npc ${n.char} again ${n.again} missing`);
      const [w, , d] = ROOMS[n.room].size;
      if (Math.abs(n.pos[0]) > w / 2 - 0.4 || Math.abs(n.pos[1]) > d / 2 - 0.4) err(`${id}: npc ${n.char} outside ${n.room}`);
    }
    for (const h of s.hotspots) {
      const hs = HOTSPOT_BY_ID.get(h);
      if (!hs) err(`${id}: unknown hotspot ${h}`);
      else if (!s.rooms.includes(hs.room)) err(`${id}: hotspot ${h} in inaccessible room ${hs.room}`);
      else if (!hs.states.includes(id)) err(`${id}: hotspot ${h} not declared for this state`);
    }
    const scripts = scriptsOfState(id);
    const exit = s.exit;
    if (!exit) {
      if (id !== STORY_ORDER[STORY_ORDER.length - 1]) err(`${id}: non-final state without exit`);
      continue;
    }
    if (!STORY[exit.to]) err(`${id}: exit to unknown ${exit.to}`);
    if (exit.kind === 'script' && !scripts.some((sc) => grantsOf(sc, 'advance').length)) err(`${id}: exit by script but no reachable script advances`);
    if (exit.kind === 'flags') {
      const settable = new Set(scripts.flatMap((sc) => grantsOf(sc, 'flag')));
      for (const f of exit.flags) if (!settable.has(f)) err(`${id}: exit flag ${f} is never set in this state`);
    }
    if (exit.kind === 'trial' && !TRIAL.some((t) => t.group === exit.group)) err(`${id}: trial group ${exit.group} has no stages`);
    if (s.mode === 'trial' && exit.kind !== 'trial') err(`${id}: trial state must exit by trial`);
    // doors in accessible rooms: targets exist, spawns exist
    for (const r of s.rooms)
      for (const d of ROOMS[r].doors) {
        if (d.to && !ROOMS[d.to]) err(`door ${d.id}: unknown target ${d.to}`);
        if (d.to && d.spawn && !ROOMS[d.to].spawns[d.spawn]) err(`door ${d.id}: spawn ${d.spawn} missing in ${d.to}`);
        if (d.script?.[id] && !SCRIPTS[d.script[id]!]) err(`door ${d.id}: script ${d.script[id]} missing`);
      }
  }
  // reachability from the initial state
  const reached = new Set<StoryStateId>();
  let cur: StoryStateId | undefined = INITIAL_STATE;
  while (cur && !reached.has(cur)) {
    reached.add(cur);
    cur = STORY[cur].exit?.to;
  }
  for (const id of STORY_ORDER) if (STORY[id].mandatory && !reached.has(id)) err(`mandatory state ${id} unreachable`);
  // explore states: every accessible room reachable from start through doors within accessible rooms
  for (const id of STORY_ORDER) {
    const s = STORY[id];
    if (s.mode !== 'explore') continue;
    const start = s.start?.room ?? s.rooms[0];
    const seen = new Set<RoomId>([start]);
    const q = [start];
    while (q.length) {
      const r = q.shift()!;
      for (const d of ROOMS[r].doors) {
        if (!d.to || d.locked?.[id] || d.script?.[id]) continue;
        if (s.rooms.includes(d.to) && !seen.has(d.to)) {
          seen.add(d.to);
          q.push(d.to);
        }
      }
    }
    for (const r of s.rooms) {
      // the vault opens mid-INCIDENT by script; rooms only reachable by script are fine if a script moves there
      if (!seen.has(r) && !(id === 'INCIDENT' && r === 'vault')) err(`${id}: room ${r} unreachable through open doors`);
    }
  }

  // ── required evidence obtainable before the hearing
  const hearingIdx = STORY_ORDER.indexOf('HEARING');
  const obtainable = new Set<string>();
  for (const id of STORY_ORDER.slice(0, hearingIdx)) for (const sc of scriptsOfState(id)) grantsOf(sc, 'evidence').forEach((e) => obtainable.add(e));
  for (const e of REQUIRED_EVIDENCE) if (!obtainable.has(e)) err(`required evidence ${e} not obtainable before the hearing`);
  const investigation = new Set(scriptsOfState('INVESTIGATION').flatMap((sc) => grantsOf(sc, 'evidence')));
  for (const e of REQUIRED_EVIDENCE) if (!investigation.has(e)) err(`required evidence ${e} not obtainable during INVESTIGATION`);
  if (STORY.INVESTIGATION.exit?.kind !== 'evidence') err('INVESTIGATION must exit on required evidence');

  // ── trial
  const roundIds = new Set<string>();
  const trialEvidence = new Set<string>();
  const kinds = new Set<string>();
  const allTrialScripts: Script[] = [HEARING_OPENING];
  for (const st of TRIAL) {
    allTrialScripts.push(st.intro, ...(st.outro ? [st.outro] : []));
    for (const r of st.rounds) {
      if (roundIds.has(r.id)) err(`duplicate round ${r.id}`);
      roundIds.add(r.id);
      kinds.add(r.kind);
      allTrialScripts.push(r.success, ...(r.intro ? [r.intro] : []));
      if (!r.wrong.length) err(`${r.id}: no wrong-answer retort`);
      if (r.kind === 'cut' || r.kind === 'patch') {
        const sids = new Set(r.statements.map((s) => s.id));
        for (const s of r.statements) if (s.mark && !s.t.includes(s.mark)) err(`${r.id}/${s.id}: mark not in text`);
        const ans = r.statements.find((s) => s.id === r.answer.statement);
        if (!ans) err(`${r.id}: answer statement missing`);
        else if (!ans.mark) err(`${r.id}: answer statement has no mark`);
        if (!r.answer.evidence.length) err(`${r.id}: no answer evidence`);
        for (const e of r.answer.evidence) {
          if (!EVIDENCE_BY_ID.has(e)) err(`${r.id}: unknown answer evidence ${e}`);
          if (!obtainable.has(e)) err(`${r.id}: answer evidence ${e} not obtainable before hearing`);
          trialEvidence.add(e);
        }
        if (!r.answer.evidence.some((e) => REQUIRED_EVIDENCE.includes(e))) err(`${r.id}: no answer evidence is required (player might not have it)`);
        for (const p of r.partial ?? []) {
          if (!sids.has(p.statement)) err(`${r.id}: partial on unknown statement ${p.statement}`);
          if (!EVIDENCE_BY_ID.has(p.evidence)) err(`${r.id}: partial on unknown evidence ${p.evidence}`);
          if (p.statement === r.answer.statement && r.answer.evidence.includes(p.evidence)) err(`${r.id}: partial overlaps answer`);
        }
      } else if (r.kind === 'tune') {
        if (!r.options.some((o) => o.id === r.answer)) err(`${r.id}: answer not among options`);
        if (new Set(r.options.map((o) => o.id)).size !== r.options.length) err(`${r.id}: duplicate options`);
      } else if (r.kind === 'reel') {
        const panels = new Set(r.panels.map((p) => p.id));
        const perm = (o: string[]) => o.length === panels.size && o.every((x) => panels.has(x)) && new Set(o).size === o.length;
        if (!perm(r.answerOrder)) err(`${r.id}: answerOrder is not a permutation of panels`);
        if (!perm(r.initialOrder)) err(`${r.id}: initialOrder is not a permutation of panels`);
        if (r.initialOrder.join() === r.answerOrder.join()) err(`${r.id}: initial order already solved`);
        const times = r.answerOrder.map((id) => toMinutes(r.panels.find((p) => p.id === id)!.time));
        for (let i = 1; i < times.length; i++) if (times[i] < times[i - 1]) err(`${r.id}: answer order not chronological at ${r.answerOrder[i]}`);
      }
    }
  }
  for (const k of ['cut', 'patch', 'tune', 'reel']) if (!kinds.has(k)) err(`hearing lacks a ${k} round`);
  for (const s of allTrialScripts)
    walk(s, (b) => {
      if ('cmd' in b && b.cmd === 'evidence') err('trial scripts must not hand out evidence');
      if ('if' in b && b.if.startsWith('ev:') && !EVIDENCE_BY_ID.has(b.if.slice(3))) err(`trial if on unknown evidence ${b.if}`);
    });
  for (const g of ['hearing', 'reconstruction', 'verdict'] as const) if (!TRIAL.some((t) => t.group === g)) err(`no trial stage for group ${g}`);

  // ── case truth graph
  for (const c of CASE.contradictions) {
    if (!roundIds.has(c.round)) err(`contradiction ${c.id}: round ${c.round} missing`);
    for (const e of c.brokenBy) if (!EVIDENCE_BY_ID.has(e)) err(`contradiction ${c.id}: unknown evidence ${e}`);
  }
  for (const ev of CASE.events) for (const t of ev.traces) if (!EVIDENCE_BY_ID.has(t)) err(`event ${ev.id}: unknown trace ${t}`);
  for (const h of CASE.hiddenFacts) if (!roundIds.has(h.revealedIn) && !SCRIPTS[h.revealedIn]) err(`hidden fact of ${h.who}: reveal ${h.revealedIn} missing`);
  // every required evidence item is used by the truth graph or the hearing
  const used = new Set<string>([...trialEvidence, ...CASE.events.flatMap((e) => e.traces), ...CASE.contradictions.flatMap((c) => c.brokenBy)]);
  for (const e of REQUIRED_EVIDENCE) if (!used.has(e)) warnings.push(`required evidence ${e} is not referenced by the case graph or hearing`);
  // movement feasibility: consecutive whereabouts need ≥ 1 minute per room hop
  const hops = (a: RoomId, b: RoomId) => {
    if (a === b) return 0;
    const seen = new Map<RoomId, number>([[a, 0]]);
    const q: RoomId[] = [a];
    while (q.length) {
      const r = q.shift()!;
      for (const n of graph.get(r) ?? []) {
        if (seen.has(n)) continue;
        seen.set(n, seen.get(r)! + 1);
        if (n === b) return seen.get(n)!;
        q.push(n);
      }
    }
    return Infinity;
  };
  const byChar = new Map<string, typeof CASE.whereabouts>();
  for (const w of CASE.whereabouts) byChar.set(w.char, [...(byChar.get(w.char) ?? []), w]);
  for (const [char, list] of byChar) {
    const sorted = [...list].sort((a, b) => toMinutes(a.from) - toMinutes(b.from));
    for (let i = 0; i < sorted.length; i++) {
      const w = sorted[i];
      if (toMinutes(w.to) < toMinutes(w.from)) err(`${char}: interval ${w.from}-${w.to} reversed`);
      if (i === 0) continue;
      const prev = sorted[i - 1];
      const gap = toMinutes(w.from) - toMinutes(prev.to);
      if (gap < 0) err(`${char}: overlapping whereabouts at ${w.from}`);
      const need = hops(prev.room, w.room);
      if (need === Infinity) err(`${char}: no route ${prev.room} → ${w.room}`);
      else if (need - 1 > gap) err(`${char}: impossible move ${prev.room}@${prev.to} → ${w.room}@${w.from} (${need} hops)`);
    }
  }
  const culpritAt = CASE.whereabouts.find((w) => w.char === CASE.culprit && toMinutes(w.from) <= toMinutes(CASE.timeOfDeath) && toMinutes(w.to) >= toMinutes(CASE.timeOfDeath));
  if (culpritAt?.room !== CASE.actionRoom) err(`culprit is not in the action room at the time of death`);
  const victimAt = CASE.whereabouts.find((w) => w.char === CASE.victim && toMinutes(w.to) === toMinutes(CASE.timeOfDeath));
  if (victimAt?.room !== CASE.deathRoom) err(`victim is not in the death room at the time of death`);
  // the final tune answers must match the truth
  const person = TRIAL.flatMap((s) => s.rounds).find((r) => r.kind === 'tune' && r.axis === 'person');
  if (!person || (person.kind === 'tune' && person.answer !== CASE.culprit)) err('person round answer is not the culprit');
  const time = TRIAL.flatMap((s) => s.rounds).find((r) => r.kind === 'tune' && r.axis === 'time');
  if (!time || (time.kind === 'tune' && time.options.find((o) => o.id === time.answer)?.label !== CASE.timeOfDeath)) err('time round answer is not the time of death');

  return {
    errors,
    warnings,
    stats: {
      states: STORY_ORDER.length,
      rooms: Object.keys(ROOMS).length,
      evidence: EVIDENCE.length,
      requiredEvidence: REQUIRED_EVIDENCE.length,
      hotspots: HOTSPOTS.length,
      scripts: Object.keys(SCRIPTS).length,
      rounds: roundIds.size,
      contradictions: CASE.contradictions.length,
    },
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const r = validate();
  console.log('AFTERSIGNAL case validator');
  console.log(Object.entries(r.stats).map(([k, v]) => `  ${k}: ${v}`).join('\n'));
  r.warnings.forEach((w) => console.log('  warn:', w));
  if (r.errors.length) {
    r.errors.forEach((e) => console.error('  ERROR:', e));
    console.error(`FAILED with ${r.errors.length} error(s)`);
    process.exit(1);
  }
  console.log('OK — case, story graph and hearing are consistent.');
}
