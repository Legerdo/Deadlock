import type { MachineSnapshot } from './StoryMachine';
import type { RoomId } from '../data/types';
import { safeStorage } from './Settings';

export interface SaveData {
  version: 1;
  savedAt: number;
  playSeconds: number;
  machine: MachineSnapshot;
  room: RoomId | null;
  pos: [number, number] | null;
  yaw: number;
}

const KEY = 'aftersignal.save.v1';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function writeSave(data: Omit<SaveData, 'version' | 'savedAt'>, storage: Store | null = safeStorage()) {
  const full: SaveData = { version: 1, savedAt: Date.now(), ...data };
  storage?.setItem(KEY, JSON.stringify(full));
  return full;
}

export function readSave(storage: Store | null = safeStorage()): SaveData | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData;
    if (d.version !== 1 || !d.machine || typeof d.machine.state !== 'string') return null;
    if (d.pos && !d.pos.every((n) => Number.isFinite(n))) d.pos = null;
    if (!Number.isFinite(d.yaw)) d.yaw = 0;
    return d;
  } catch {
    return null;
  }
}

export function hasSave(storage: Store | null = safeStorage()) {
  return readSave(storage) !== null;
}

export function clearSave(storage: Store | null = safeStorage()) {
  storage?.removeItem(KEY);
}
