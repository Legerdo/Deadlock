import * as THREE from 'three';
import type { CharId, HotspotDef, NpcPlacement } from '../data/types';
import type { DoorInstance } from '../world/RoomBuilder';

export type Interactable =
  | { kind: 'npc'; id: string; char: CharId; placement: NpcPlacement; pos: THREE.Vector3; label: string; range: number }
  | { kind: 'hotspot'; id: string; def: HotspotDef; pos: THREE.Vector3; label: string; range: number; done: boolean }
  | { kind: 'door'; id: string; door: DoorInstance; pos: THREE.Vector3; label: string; range: number; locked: boolean };

const MAX_ANGLE = (30 * Math.PI) / 180;

/**
 * Pick what the player is facing. Horizontal angle only (pitch ignored) so floor
 * and ceiling-height clues are equally easy to target; closest-to-centre wins.
 */
export function pickTarget(eye: THREE.Vector3, yaw: number, items: Interactable[]): Interactable | null {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  let best: Interactable | null = null;
  let bestScore = Infinity;
  for (const it of items) {
    const dx = it.pos.x - eye.x;
    const dz = it.pos.z - eye.z;
    const dist = Math.hypot(dx, dz);
    if (dist > it.range) continue;
    const cos = dist < 1e-4 ? 1 : (dx * fx + dz * fz) / dist;
    const ang = Math.acos(Math.max(-1, Math.min(1, cos)));
    const tolerance = Math.max(MAX_ANGLE, Math.atan2(0.45, Math.max(dist, 0.01)));
    if (ang > tolerance) continue;
    const score = ang * 2 + dist * 0.25;
    if (score < bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return best;
}

export function promptVerb(it: Interactable): string {
  switch (it.kind) {
    case 'npc':
      return '대화';
    case 'hotspot':
      return it.done ? '다시 보기' : '조사';
    case 'door':
      return it.locked ? '확인' : '이동';
  }
}
