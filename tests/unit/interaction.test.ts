import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { pickTarget, type Interactable } from '../../src/interaction/Interactables';

const hotspot = (id: string, x: number, z: number, y = 1): Interactable =>
  ({ kind: 'hotspot', id, def: {} as never, pos: new THREE.Vector3(x, y, z), label: id, range: 2.3, done: false }) as Interactable;

describe('interaction targeting', () => {
  const eye = new THREE.Vector3(0, 1.62, 0);
  // yaw 0 faces -Z

  it('picks what the player faces', () => {
    const t = pickTarget(eye, 0, [hotspot('ahead', 0, -1.5), hotspot('behind', 0, 1.5)]);
    expect(t?.id).toBe('ahead');
  });

  it('ignores items outside range or the view cone', () => {
    expect(pickTarget(eye, 0, [hotspot('far', 0, -3)])).toBeNull();
    expect(pickTarget(eye, 0, [hotspot('side', 1.5, 0)])).toBeNull();
  });

  it('ignores height: floor-level clues are as easy to target as eye-level ones', () => {
    expect(pickTarget(eye, 0, [hotspot('floor', 0.2, -1.2, 0.1)])?.id).toBe('floor');
  });

  it('prefers the item closest to the centre of view', () => {
    const t = pickTarget(eye, 0, [hotspot('edge', 0.6, -1.5), hotspot('centre', 0.05, -1.8)]);
    expect(t?.id).toBe('centre');
  });

  it('turning changes the target', () => {
    const items = [hotspot('north', 0, -1.5), hotspot('west', -1.5, 0)];
    expect(pickTarget(eye, Math.PI / 2, items)?.id).toBe('west');
  });
});
