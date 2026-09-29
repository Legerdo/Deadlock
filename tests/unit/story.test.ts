import { describe, expect, it } from 'vitest';
import { MAX_FOCUS, StoryMachine } from '../../src/core/StoryMachine';
import { Director } from '../../src/story/Director';
import { STORY, STORY_ORDER } from '../../src/data/story';
import { HOTSPOTS, REQUIRED_EVIDENCE } from '../../src/data/evidence';
import { ROOMS } from '../../src/data/locations';
import { recorder } from './helpers';

const MET = ['met_theo', 'met_helena', 'met_bas', 'met_lumi', 'met_oskar', 'met_wren'];

describe('StoryMachine transitions', () => {
  it('starts in the prologue and only advances along declared exits', () => {
    const m = new StoryMachine();
    expect(m.state).toBe('PROLOGUE');
    expect(m.advance()).toBe('ARRIVAL');
    // ARRIVAL exits on flags, never by script
    expect(() => m.advance()).toThrow(/by condition/);
    for (const f of MET.slice(0, 5)) m.setFlag(f);
    expect(m.checkAuto()).toBeNull();
    m.setFlag(MET[5]);
    expect(m.checkAuto()).toBe('DINNER');
  });

  it('follows STORY_ORDER exactly', () => {
    for (let i = 0; i < STORY_ORDER.length - 1; i++) {
      expect(STORY[STORY_ORDER[i]].exit?.to).toBe(STORY_ORDER[i + 1]);
    }
    expect(STORY.CREDITS.exit).toBeNull();
  });

  it('INVESTIGATION exits only when every required item is held', () => {
    const m = new StoryMachine();
    m.restore({ ...m.snapshot(), state: 'INVESTIGATION' });
    for (const e of REQUIRED_EVIDENCE.slice(0, -1)) m.addEvidence(e);
    expect(m.checkAuto()).toBeNull();
    m.addEvidence(REQUIRED_EVIDENCE.at(-1)!);
    expect(m.checkAuto()).toBe('PRE_HEARING');
  });

  it('keeps Focus between hearing phases and resets it afterwards', () => {
    const m = new StoryMachine();
    m.restore({ ...m.snapshot(), state: 'HEARING' });
    m.setTrial({ focus: 2, stage: 3, round: 1 });
    m.advance();
    expect(m.state).toBe('RECONSTRUCTION');
    expect(m.trial).toEqual({ stage: 0, round: 0, focus: 2 });
    m.advance();
    m.advance();
    expect(m.state).toBe('EPILOGUE');
    expect(m.trial.focus).toBe(MAX_FOCUS);
  });

  it('rejects unknown evidence and does not double-count', () => {
    const m = new StoryMachine();
    expect(() => m.addEvidence('nope')).toThrow();
    expect(m.addEvidence(REQUIRED_EVIDENCE[0])).toBe(true);
    expect(m.addEvidence(REQUIRED_EVIDENCE[0])).toBe(false);
  });

  it('snapshot → restore round-trips and drops unknown ids', () => {
    const a = new StoryMachine();
    a.advance();
    a.setFlag('met_lumi');
    a.addEvidence(REQUIRED_EVIDENCE[1]);
    a.talked.add('ARRIVAL:lumi');
    const snap = a.snapshot();
    const b = new StoryMachine();
    b.restore({ ...snap, evidence: [...snap.evidence, 'forged_item'] });
    expect(b.snapshot()).toEqual(snap);
    expect(() => b.restore({ ...snap, state: 'NOWHERE' as never })).toThrow();
  });
});

describe('scripted playthrough (no DOM)', () => {
  it('reaches the hearing by playing the real scripts in order', async () => {
    const m = new StoryMachine();
    const d = new Director(m);
    const { p, seen } = recorder();
    const run = async (id: string) => {
      await d.run(id, p);
      m.checkAuto();
    };
    await run('prologue');
    expect(m.state).toBe('ARRIVAL');
    for (const n of STORY.ARRIVAL.npcs) await run(n.talk);
    expect(m.state).toBe('DINNER');
    await run('dinner');
    expect(m.state).toBe('EVENING');
    await run(ROOMS.guest_wing.doors.find((x) => x.id === 'g_kai')!.script!.EVENING!);
    expect(m.state).toBe('NIGHT');
    await run('night');
    expect(m.state).toBe('INCIDENT');
    // the vault will not open before everyone has gathered
    await run('vault_door_incident');
    expect(m.state).toBe('INCIDENT');
    await run('incident_gather');
    await run('vault_door_incident');
    expect(m.state).toBe('INVESTIGATION');
    expect(seen.cutins).toContain('cutin_discovery');

    const inv = STORY.INVESTIGATION;
    for (const n of inv.npcs) await run(n.talk);
    for (const h of HOTSPOTS.filter((x) => inv.hotspots.includes(x.id))) {
      if (m.state !== 'INVESTIGATION') break;
      await run(h.script);
    }
    expect(REQUIRED_EVIDENCE.filter((e) => !m.evidence.has(e))).toEqual([]);
    expect(m.state).toBe('PRE_HEARING');
    await run(ROOMS.atrium.doors.find((x) => x.id === 'a_round')!.script!.PRE_HEARING!);
    expect(m.state).toBe('HEARING');
  });

  it('hotspot grants match what their scripts hand out', async () => {
    for (const h of HOTSPOTS.filter((x) => x.grants)) {
      const m = new StoryMachine();
      m.restore({ ...m.snapshot(), state: 'INVESTIGATION' });
      const { p, seen } = recorder();
      await new Director(m).run(h.script, p);
      expect(seen.evidence, h.id).toContain(h.grants);
    }
  });
});
