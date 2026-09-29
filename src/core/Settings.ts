export interface Settings {
  textSpeed: number; // characters per second; 0 = instant
  autoAdvance: boolean;
  master: number;
  music: number;
  sfx: number;
  shake: number; // 0..1
  reduceMotion: boolean;
  sensitivity: number;
}

export const DEFAULT_SETTINGS: Settings = {
  textSpeed: 45,
  autoAdvance: false,
  master: 0.8,
  music: 0.6,
  sfx: 0.8,
  shake: 1,
  reduceMotion: false,
  sensitivity: 1,
};

const KEY = 'aftersignal.settings.v1';

export function loadSettings(storage: Pick<Storage, 'getItem'> | null = safeStorage()): Settings {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return sanitize({ ...DEFAULT_SETTINGS, ...parsed });
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings, storage: Pick<Storage, 'setItem'> | null = safeStorage()) {
  storage?.setItem(KEY, JSON.stringify(sanitize(s)));
}

function clamp(v: unknown, lo: number, hi: number, d: number) {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : d;
  return Math.min(hi, Math.max(lo, n));
}

export function sanitize(s: Settings): Settings {
  return {
    textSpeed: clamp(s.textSpeed, 0, 200, DEFAULT_SETTINGS.textSpeed),
    autoAdvance: !!s.autoAdvance,
    master: clamp(s.master, 0, 1, DEFAULT_SETTINGS.master),
    music: clamp(s.music, 0, 1, DEFAULT_SETTINGS.music),
    sfx: clamp(s.sfx, 0, 1, DEFAULT_SETTINGS.sfx),
    shake: clamp(s.shake, 0, 1, DEFAULT_SETTINGS.shake),
    reduceMotion: !!s.reduceMotion,
    sensitivity: clamp(s.sensitivity, 0.3, 2.5, DEFAULT_SETTINGS.sensitivity),
  };
}

export function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}
