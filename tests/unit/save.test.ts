import { describe, expect, it } from 'vitest';
import { clearSave, hasSave, readSave, writeSave } from '../../src/core/Save';
import { DEFAULT_SETTINGS, loadSettings, sanitize, saveSettings } from '../../src/core/Settings';
import { StoryMachine } from '../../src/core/StoryMachine';
import { memoryStorage } from './helpers';

describe('save data', () => {
  it('round-trips through storage', () => {
    const s = memoryStorage();
    const m = new StoryMachine();
    m.advance();
    m.setFlag('met_bas');
    writeSave({ playSeconds: 42, machine: m.snapshot(), room: 'workshop', pos: [1.5, -2], yaw: 0.7 }, s);
    const back = readSave(s)!;
    expect(back.version).toBe(1);
    expect(back.machine).toEqual(m.snapshot());
    expect(back.room).toBe('workshop');
    expect(back.pos).toEqual([1.5, -2]);
    expect(hasSave(s)).toBe(true);
    clearSave(s);
    expect(readSave(s)).toBeNull();
  });

  it('ignores corrupt or foreign saves', () => {
    const s = memoryStorage();
    s.setItem('aftersignal.save.v1', '{not json');
    expect(readSave(s)).toBeNull();
    s.setItem('aftersignal.save.v1', JSON.stringify({ version: 2, machine: { state: 'ARRIVAL' } }));
    expect(readSave(s)).toBeNull();
    s.setItem('aftersignal.save.v1', JSON.stringify({ version: 1 }));
    expect(readSave(s)).toBeNull();
  });

  it('sanitises non-finite positions', () => {
    const s = memoryStorage();
    const m = new StoryMachine();
    s.setItem('aftersignal.save.v1', JSON.stringify({ version: 1, savedAt: 0, playSeconds: 0, machine: m.snapshot(), room: 'atrium', pos: [null, 2], yaw: 'x' }));
    const d = readSave(s)!;
    expect(d.pos).toBeNull();
    expect(d.yaw).toBe(0);
  });

  it('works without storage', () => {
    expect(readSave(null)).toBeNull();
    expect(() => writeSave({ playSeconds: 0, machine: new StoryMachine().snapshot(), room: null, pos: null, yaw: 0 }, null)).not.toThrow();
  });
});

describe('settings', () => {
  it('merges partial settings over defaults and clamps values', () => {
    const s = memoryStorage();
    s.setItem('aftersignal.settings.v1', JSON.stringify({ textSpeed: 999, master: -1, sensitivity: 'fast', reduceMotion: 1 }));
    const got = loadSettings(s);
    expect(got.textSpeed).toBe(200);
    expect(got.master).toBe(0);
    expect(got.sensitivity).toBe(DEFAULT_SETTINGS.sensitivity);
    expect(got.reduceMotion).toBe(true);
    expect(got.music).toBe(DEFAULT_SETTINGS.music);
  });

  it('saves sanitised values', () => {
    const s = memoryStorage();
    saveSettings({ ...DEFAULT_SETTINGS, shake: 5 }, s);
    expect(JSON.parse(s.getItem('aftersignal.settings.v1')!).shake).toBe(1);
    expect(sanitize(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    s.setItem('aftersignal.settings.v1', 'garbage');
    expect(loadSettings(s)).toEqual(DEFAULT_SETTINGS);
  });
});
