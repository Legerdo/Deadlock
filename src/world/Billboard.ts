import * as THREE from 'three';
import { CHARACTERS } from '../data/characters';
import type { CharId } from '../data/types';
import { assets } from '../core/assets';
import { shadowBlob } from './RoomBuilder';

/**
 * A 2D character standing in 3D: a bottom-anchored plane that only yaws toward
 * the camera (never tilts), so the illustration stays upright from any angle.
 */
export class Billboard {
  readonly root = new THREE.Group();
  private plane: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private expr = 'neutral';
  private phase = Math.random() * 10;
  heightM: number;

  constructor(
    readonly char: CharId,
    tint = '#FFFFFF',
  ) {
    const def = CHARACTERS[char];
    this.heightM = def.heightM;
    const entry = assets.portrait(char, 'neutral');
    const bbox = entry.bbox ?? [0.2, 0.05, 0.8, 0.95];
    const figH = bbox[3] - bbox[1];
    // Plane covers the full 2:3 canvas; scale so the drawn figure is heightM tall.
    const planeH = def.heightM / figH;
    const planeW = planeH * (2 / 3);
    const geo = new THREE.PlaneGeometry(planeW, planeH);
    // anchor: the figure's feet (bbox bottom) at y = 0, figure centre at x = 0
    const cx = (bbox[0] + bbox[2]) / 2;
    geo.translate(-(cx - 0.5) * planeW, planeH / 2 - (1 - bbox[3]) * planeH, 0);
    const mat = new THREE.MeshBasicMaterial({
      map: assets.texture(entry.id, true),
      transparent: true,
      alphaTest: 0.08,
      color: tint,
      side: THREE.DoubleSide,
    });
    this.plane = new THREE.Mesh(geo, mat);
    this.plane.renderOrder = 2;
    this.root.add(this.plane);
    const blob = shadowBlob(0.45 + (def.heightM - 1.5) * 0.3);
    this.root.add(blob);
    this.root.userData.char = char;
  }

  setExpr(expr: string | undefined) {
    const id = assets.portraitId(this.char, expr);
    if (id === this.expr) return;
    this.expr = id;
    this.plane.material.map = assets.texture(id, true);
    this.plane.material.needsUpdate = true;
  }

  setTint(color: string) {
    this.plane.material.color.set(color);
  }

  /** Yaw-only facing + subtle breathing. */
  update(camera: THREE.Camera, t: number, reduceMotion: boolean) {
    const p = this.root.getWorldPosition(tmp);
    const c = camera.getWorldPosition(tmp2);
    this.plane.rotation.y = Math.atan2(c.x - p.x, c.z - p.z) - this.root.rotation.y;
    const breath = reduceMotion ? 0 : Math.sin(t * 1.6 + this.phase) * 0.006;
    this.plane.scale.set(1 - breath * 0.5, 1 + breath, 1);
  }

  /** Head height in world units (for camera framing). */
  headY() {
    return this.heightM - 0.12;
  }
}

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
