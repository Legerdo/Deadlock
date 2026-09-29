import * as THREE from 'three';
import { CHARACTERS } from '../data/characters';
import type { CharId } from '../data/types';

export const SEAT_ORDER: CharId[] = ['kai', 'lumi', 'bas', 'wren', 'theo', 'helena', 'oskar'];
export const SEAT_RADIUS = 4.7;

export function seatPosition(char: CharId): THREE.Vector3 {
  const k = SEAT_ORDER.indexOf(char);
  const a = (k / SEAT_ORDER.length) * Math.PI * 2;
  return new THREE.Vector3(Math.sin(a) * SEAT_RADIUS, 0, Math.cos(a) * SEAT_RADIUS);
}

type Shot = 'speaker' | 'two' | 'wide' | 'orbit' | 'warden' | 'memorial';

/**
 * Camera director for the hearing: speaker framing, two-shots, wide / orbit,
 * push-ins and whip moves. Motion scales down with the reduce-motion setting.
 */
export class HearingCamera {
  private pos = new THREE.Vector3(0, 4, 8);
  private look = new THREE.Vector3(0, 1.4, 0);
  private toPos = this.pos.clone();
  private toLook = this.look.clone();
  private moveT = 1;
  private moveDur = 0.25;
  private fromPos = this.pos.clone();
  private fromLook = this.look.clone();
  private shot: Shot = 'wide';
  private push = 0;
  private pushTarget = 0;
  private t = 0;
  private side = 1;
  /** lens per shot: tight on speakers, wide on the ring */
  private fov = 52;
  private toFov = 52;
  private readonly exploreFov: number;
  motion = 1;

  constructor(private camera: THREE.PerspectiveCamera) {
    this.exploreFov = camera.fov;
  }

  /** Hand the camera back to exploration with its original lens. */
  release() {
    this.camera.fov = this.exploreFov;
    this.camera.updateProjectionMatrix();
    this.fov = this.toFov = 52;
  }

  private set(pos: THREE.Vector3, look: THREE.Vector3, dur: number) {
    this.fromPos.copy(this.pos);
    this.fromLook.copy(this.look);
    this.toPos.copy(pos);
    this.toLook.copy(look);
    this.moveDur = Math.max(0.001, dur * (this.motion < 0.5 ? 1.6 : 1));
    this.moveT = dur <= 0 ? 1 : 0;
    if (dur <= 0) {
      this.pos.copy(pos);
      this.look.copy(look);
    }
    this.push = 0;
    this.pushTarget = 0;
  }

  speaker(char: CharId, dur = 0.24) {
    this.shot = 'speaker';
    this.toFov = 33;
    this.side *= -1;
    const s = seatPosition(char);
    const h = CHARACTERS[char].heightM;
    const inward = s.clone().multiplyScalar(-1).setY(0).normalize();
    const perp = new THREE.Vector3(-inward.z, 0, inward.x).multiplyScalar(0.42 * this.side);
    const pos = s.clone().add(inward.clone().multiplyScalar(2.3)).add(perp).setY(h * 0.9);
    const look = s.clone().setY(h * 0.8);
    this.set(pos, look, dur);
  }

  memorial(dur = 0.6) {
    this.shot = 'memorial';
    this.toFov = 40;
    const s = seatPosition('theo');
    const inward = s.clone().multiplyScalar(-1).normalize();
    this.set(s.clone().add(inward.multiplyScalar(2.4)).setY(1.55), s.clone().setY(1.7), dur);
  }

  two(a: CharId, b: CharId, dur = 0.3) {
    this.shot = 'two';
    this.toFov = 46;
    const pa = seatPosition(a);
    const pb = seatPosition(b);
    const mid = pa.clone().add(pb).multiplyScalar(0.5);
    const line = pb.clone().sub(pa).setY(0);
    const perp = new THREE.Vector3(-line.z, 0, line.x).normalize();
    if (perp.dot(mid) > 0) perp.multiplyScalar(-1);
    const dist = Math.max(3.2, line.length() * 0.85);
    const pos = mid.clone().add(perp.multiplyScalar(dist)).setY(1.75);
    this.set(pos, mid.clone().setY(1.35), dur);
  }

  wide(dur = 0.5) {
    this.shot = 'wide';
    this.toFov = 56;
    this.set(new THREE.Vector3(0, 4.6, 8.2), new THREE.Vector3(0, 1.1, -0.6), dur);
  }

  orbit() {
    this.shot = 'orbit';
    this.toFov = 52;
    this.moveT = 1;
  }

  warden(dur = 0.4) {
    this.shot = 'warden';
    this.toFov = 50;
    this.set(new THREE.Vector3(1.2, 1.5, 3.6), new THREE.Vector3(0, 3.0, 0), dur);
  }

  pushIn(amount = 0.8) {
    // speaker shots are already tight on a long lens; push less so heads stay in frame
    this.pushTarget = amount * this.motion * (this.shot === 'speaker' ? 0.45 : 1);
  }

  update(dt: number) {
    this.t += dt;
    if (this.shot === 'orbit') {
      const a = this.t * 0.12 * Math.max(0.3, this.motion);
      this.pos.set(Math.sin(a) * 7.4, 3.9, Math.cos(a) * 7.4);
      this.look.set(0, 1.4, 0);
    } else if (this.moveT < 1) {
      this.moveT = Math.min(1, this.moveT + dt / this.moveDur);
      const e = 1 - Math.pow(1 - this.moveT, 3);
      this.pos.lerpVectors(this.fromPos, this.toPos, e);
      this.look.lerpVectors(this.fromLook, this.toLook, e);
    }
    this.push += (this.pushTarget - this.push) * Math.min(1, dt * 6);
    this.fov += (this.toFov - this.fov) * Math.min(1, dt * 12);
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    const dir = this.look.clone().sub(this.pos).normalize();
    const drift = this.motion * 0.03;
    this.camera.position.copy(this.pos).addScaledVector(dir, this.push);
    this.camera.position.x += Math.sin(this.t * 0.7) * drift;
    this.camera.position.y += Math.sin(this.t * 0.9 + 1) * drift * 0.6;
    this.camera.lookAt(this.look);
  }
}
