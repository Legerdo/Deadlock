import * as THREE from 'three';
import type { Input } from '../core/Input';
import type { AABB } from './RoomBuilder';

const EYE = 1.62;
const RADIUS = 0.32;

export class Player {
  pos = new THREE.Vector2(0, 0); // x, z
  yaw = 0;
  pitch = -0.05;
  private bob = 0;
  speed = 3.1;

  constructor(private camera: THREE.PerspectiveCamera) {}

  place(x: number, z: number, yaw: number) {
    this.pos.set(x, z);
    this.yaw = yaw;
    this.pitch = -0.05;
    this.apply(0);
  }

  forward() {
    return new THREE.Vector2(-Math.sin(this.yaw), -Math.cos(this.yaw));
  }

  update(dt: number, input: Input, bounds: AABB, colliders: AABB[], circles: { x: number; z: number; r: number }[], sensitivity: number, reduceMotion: boolean) {
    const look = 0.0022 * sensitivity;
    this.yaw -= input.lookDX * look;
    this.pitch -= input.lookDY * look;
    const turn = 2.1 * dt * sensitivity;
    if (input.isDown('ArrowLeft') || input.isDown('KeyQ')) this.yaw += turn;
    if (input.isDown('ArrowRight')) this.yaw -= turn;
    if (input.isDown('ArrowUp')) this.pitch += turn * 0.6;
    if (input.isDown('ArrowDown')) this.pitch -= turn * 0.6;
    this.pitch = Math.max(-1.1, Math.min(1.0, this.pitch));

    let mx = 0;
    let mz = 0;
    if (input.isDown('KeyW')) mz += 1;
    if (input.isDown('KeyS')) mz -= 1;
    if (input.isDown('KeyA')) mx -= 1;
    if (input.isDown('KeyD')) mx += 1;
    const len = Math.hypot(mx, mz);
    const moving = len > 0;
    if (moving) {
      const sp = (input.isDown('ShiftLeft') || input.isDown('ShiftRight') ? 1.6 : 1) * this.speed * dt;
      const f = this.forward();
      const r = new THREE.Vector2(-f.y, f.x); // right = forward rotated -90°
      const dx = ((f.x * mz + r.x * mx) / len) * sp;
      const dz = ((f.y * mz + r.y * mx) / len) * sp;
      this.moveAxis(dx, 0, bounds, colliders, circles);
      this.moveAxis(0, dz, bounds, colliders, circles);
      this.bob += dt * 9;
    }
    this.apply(moving && !reduceMotion ? Math.sin(this.bob) * 0.025 : 0);
  }

  private moveAxis(dx: number, dz: number, bounds: AABB, colliders: AABB[], circles: { x: number; z: number; r: number }[]) {
    let x = this.pos.x + dx;
    let z = this.pos.y + dz;
    x = Math.max(bounds.minX + RADIUS + 0.15, Math.min(bounds.maxX - RADIUS - 0.15, x));
    z = Math.max(bounds.minZ + RADIUS + 0.15, Math.min(bounds.maxZ - RADIUS - 0.15, z));
    for (const b of colliders) {
      const cx = Math.max(b.minX, Math.min(x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
      const ddx = x - cx;
      const ddz = z - cz;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 < RADIUS * RADIUS) {
        if (d2 < 1e-8) {
          // centre inside the box: undo this axis
          x = this.pos.x;
          z = this.pos.y;
        } else {
          const d = Math.sqrt(d2);
          x = cx + (ddx / d) * RADIUS;
          z = cz + (ddz / d) * RADIUS;
        }
      }
    }
    for (const c of circles) {
      const ddx = x - c.x;
      const ddz = z - c.z;
      const d = Math.hypot(ddx, ddz);
      const min = c.r + RADIUS;
      if (d < min && d > 1e-6) {
        x = c.x + (ddx / d) * min;
        z = c.z + (ddz / d) * min;
      }
    }
    if (Number.isFinite(x) && Number.isFinite(z)) this.pos.set(x, z);
  }

  apply(bobY: number) {
    this.camera.position.set(this.pos.x, EYE + bobY, this.pos.y);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
