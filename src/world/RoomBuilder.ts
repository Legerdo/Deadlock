import * as THREE from 'three';
import { C } from '../data/locations';
import type { DecalDef, DoorDef, PropDef, RoomDef, StoryStateDef, Wall } from '../data/types';
import { assets } from '../core/assets';
import { blobShadow, floorTexture, posterTexture, signTexture, toonGradient, wallTexture } from './textures';

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface DoorInstance {
  def: DoorDef;
  /** interaction point (room coords) */
  point: THREE.Vector3;
  normal: THREE.Vector3;
  lamp: THREE.Mesh;
}

export interface BuiltRoom {
  group: THREE.Group;
  colliders: AABB[];
  doors: DoorInstance[];
  bounds: AABB;
  animated: ((t: number) => void)[];
  dispose: () => void;
}

const matCache = new Map<string, THREE.Material>();
export function toon(color: string): THREE.MeshToonMaterial {
  const key = 'toon:' + color;
  let m = matCache.get(key) as THREE.MeshToonMaterial | undefined;
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonGradient() });
    matCache.set(key, m);
  }
  return m;
}
export function flat(color: string, opts: THREE.MeshBasicMaterialParameters = {}): THREE.MeshBasicMaterial {
  const key = 'flat:' + color + JSON.stringify(opts);
  let m = matCache.get(key) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, ...opts });
    matCache.set(key, m);
  }
  return m;
}
const INK_LINE = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide });

/** Inverted-hull ink outline for the graphic-novel look. */
export function outline<T extends THREE.Mesh>(mesh: T, thickness = 0.035): T {
  const o = new THREE.Mesh(mesh.geometry, INK_LINE);
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox!;
  const sx = bb.max.x - bb.min.x || 1;
  const sy = bb.max.y - bb.min.y || 1;
  const sz = bb.max.z - bb.min.z || 1;
  o.scale.set(1 + (thickness * 2) / sx, 1 + (thickness * 2) / sy, 1 + (thickness * 2) / sz);
  o.raycast = () => undefined;
  mesh.add(o);
  return mesh;
}

function box(w: number, h: number, d: number, color: string, line = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(color));
  return line ? outline(m) : m;
}
function cyl(rt: number, rb: number, h: number, color: string, seg = 16, line = true) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color));
  return line ? outline(m, 0.025) : m;
}

function wallFrame(wall: Wall, w: number, d: number, offset: number) {
  // returns position on the wall plane + inward normal + rotation Y for objects facing into the room
  switch (wall) {
    case 'n':
      return { pos: new THREE.Vector3(offset, 0, -d / 2), normal: new THREE.Vector3(0, 0, 1), rotY: 0 };
    case 's':
      return { pos: new THREE.Vector3(offset, 0, d / 2), normal: new THREE.Vector3(0, 0, -1), rotY: Math.PI };
    case 'e':
      return { pos: new THREE.Vector3(w / 2, 0, offset), normal: new THREE.Vector3(-1, 0, 0), rotY: -Math.PI / 2 };
    case 'w':
      return { pos: new THREE.Vector3(-w / 2, 0, offset), normal: new THREE.Vector3(1, 0, 0), rotY: Math.PI / 2 };
  }
}

export const LIGHTING: Record<StoryStateDef['lighting'], { amb: string; ambI: number; sky: string; ground: string; hemiI: number; dir: string; dirI: number; tint: string; fog: string }> = {
  evening: { amb: '#FFE1C0', ambI: 0.55, sky: '#FFE9C4', ground: '#3B2F4F', hemiI: 0.9, dir: '#FFD7A0', dirI: 0.9, tint: '#FFF6EA', fog: '#1C1824' },
  night: { amb: '#9DA8E0', ambI: 0.35, sky: '#8E9AD8', ground: '#1B1528', hemiI: 0.6, dir: '#C6CCFF', dirI: 0.5, tint: '#E3E3F2', fog: '#0F0D16' },
  morning: { amb: '#CFE9EA', ambI: 0.6, sky: '#D9F2F2', ground: '#2A3340', hemiI: 0.9, dir: '#E8FBFF', dirI: 0.9, tint: '#F0F6F6', fog: '#1A2228' },
  noon: { amb: '#FFFFFF', ambI: 0.65, sky: '#FFFFFF', ground: '#35303F', hemiI: 0.9, dir: '#FFFFFF', dirI: 0.9, tint: '#FFFFFF', fog: '#1A1820' },
  dawn: { amb: '#FFE2B8', ambI: 0.7, sky: '#FFF0C8', ground: '#4A3A50', hemiI: 1.0, dir: '#FFE2A8', dirI: 1.1, tint: '#FFF8EC', fog: '#2A2230' },
};

export function buildRoom(room: RoomDef, state: StoryStateDef): BuiltRoom {
  const group = new THREE.Group();
  group.name = `room:${room.id}`;
  const [w, h, d] = room.size;
  const colliders: AABB[] = [];
  const doors: DoorInstance[] = [];
  const animated: ((t: number) => void)[] = [];
  const disposables: { dispose: () => void }[] = [];
  const L = LIGHTING[state.lighting];

  // ── lights
  group.add(new THREE.AmbientLight(L.amb, L.ambI));
  group.add(new THREE.HemisphereLight(L.sky, L.ground, L.hemiI));
  const dir = new THREE.DirectionalLight(L.dir, L.dirI);
  dir.position.set(w * 0.3, h * 1.5, d * 0.4);
  group.add(dir);
  const lampCount = room.round ? 1 : Math.min(3, Math.max(1, Math.round((w * d) / 60)));
  for (let i = 0; i < lampCount; i++) {
    const p = new THREE.PointLight(room.light, room.round ? 2.2 : 1.4, Math.max(w, d) * 1.2, 1.4);
    p.position.set(((i + 0.5) / lampCount - 0.5) * w * 0.7, h - 0.6, 0);
    group.add(p);
  }

  // ── shell
  if (room.round) {
    const r = w / 2;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshToonMaterial({ map: rep(floorTexture(room.floor.pattern, room.floor.a, room.floor.b), r / 2, r / 2), gradientMap: toonGradient() }));
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);
    const wallMat = new THREE.MeshToonMaterial({ map: rep(wallTexture(room.wall.a, room.wall.band, room.wall.pattern), 12, 1), gradientMap: toonGradient(), side: THREE.BackSide });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true), wallMat);
    wall.position.y = h / 2;
    group.add(wall);
    const ceil = new THREE.Mesh(new THREE.CircleGeometry(r, 64), flat(room.ceiling));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = h;
    group.add(ceil);
    // concentric floor rings + hanging tape strips
    for (const [rr, col] of [
      [2.2, C.cyan],
      [3.4, C.signal],
      [6.2, C.coral],
    ] as const) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 0.08, 96), flat(col));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01;
      group.add(ring);
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3 + (i % 3)), flat(i % 2 ? C.ink : '#2B2733', { side: THREE.DoubleSide }));
      strip.position.set(Math.sin(a) * (r - 1.2), h - 1.6 - (i % 3) * 0.5, Math.cos(a) * (r - 1.2));
      strip.rotation.y = a;
      group.add(strip);
    }
  } else {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshToonMaterial({ map: rep(floorTexture(room.floor.pattern, room.floor.a, room.floor.b), w / 2, d / 2), gradientMap: toonGradient() }));
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), flat(room.ceiling));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = h;
    group.add(ceil);
    const wt = wallTexture(room.wall.a, room.wall.band, room.wall.pattern);
    for (const wall of ['n', 's', 'e', 'w'] as Wall[]) {
      const len = wall === 'n' || wall === 's' ? w : d;
      const f = wallFrame(wall, w, d, 0);
      const mat = new THREE.MeshToonMaterial({ map: rep(wt, len / 4, 1), gradientMap: toonGradient() });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(len, h), mat);
      plane.position.copy(f.pos).setY(h / 2);
      plane.rotation.y = f.rotY;
      group.add(plane);
      disposables.push(mat);
      // ink corner lines
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.06), flat(C.ink));
      edge.position.set(wall === 'e' || wall === 'n' ? w / 2 : -w / 2, h / 2, wall === 'n' || wall === 'w' ? -d / 2 : d / 2);
      group.add(edge);
    }
    // ceiling beams give the stage-set rhythm
    for (let x = -w / 2 + 2; x < w / 2; x += 3) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, d), toon(C.concreteDark));
      beam.position.set(x, h - 0.15, 0);
      group.add(beam);
    }
  }

  // ── doors
  for (const def of room.doors) {
    const inst = buildDoor(def, room, state);
    group.add(inst.object);
    doors.push(inst.door);
    animated.push(inst.tick);
  }

  // ── props
  for (const p of room.props) {
    if (p.states && !p.states.includes(state.id)) continue;
    const obj = buildProp(p, animated);
    group.add(obj);
    if (p.solid) colliders.push(propAABB(p));
  }

  // ── decals
  for (const dcl of room.decals) {
    const obj = buildDecal(dcl, room, state);
    if (obj) group.add(obj);
  }

  const bounds: AABB = { minX: -w / 2, maxX: w / 2, minZ: -d / 2, maxZ: d / 2 };
  return {
    group,
    colliders,
    doors,
    bounds,
    animated,
    dispose: () => {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      disposables.forEach((x) => x.dispose());
    },
  };
}

function rep(t: THREE.Texture, u: number, v: number) {
  const c = t.clone();
  c.repeat.set(u, v);
  c.needsUpdate = true;
  return c;
}

export function propAABB(p: PropDef): AABB {
  const [sw, , sd] = p.size ?? [1, 1, 1];
  const quarter = Math.abs(Math.round(((p.rotY ?? 0) / (Math.PI / 2)) % 2)) === 1;
  const hw = (quarter ? sd : sw) / 2;
  const hd = (quarter ? sw : sd) / 2;
  if (p.kind === 'cyl' || p.kind === 'plant') {
    const r = sw / 2;
    return { minX: p.pos[0] - r, maxX: p.pos[0] + r, minZ: p.pos[2] - r, maxZ: p.pos[2] + r };
  }
  return { minX: p.pos[0] - hw, maxX: p.pos[0] + hw, minZ: p.pos[2] - hd, maxZ: p.pos[2] + hd };
}

// ───────────────────────────── doors ─────────────────────────────
function buildDoor(def: DoorDef, room: RoomDef, state: StoryStateDef) {
  const [w, , d] = room.size;
  const f = wallFrame(def.wall, w, d, def.offset);
  const g = new THREE.Group();
  g.position.copy(f.pos);
  g.rotation.y = f.rotY;
  const dw = def.width ?? (def.style === 'vault' ? 2.6 : 1.5);
  const dh = def.height ?? (def.style === 'vault' ? 2.6 : 2.5);
  const locked = !!def.locked?.[state.id] && !def.script?.[state.id];
  const style = def.style ?? 'plain';

  if (style === 'vault') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(dw / 2, 0.16, 12, 48), toon(C.steel));
    ring.position.set(0, dh / 2 + 0.05, 0.08);
    g.add(outline(ring, 0.02));
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(dw / 2 - 0.08, dw / 2 - 0.08, 0.18, 48), toon('#6F7C84'));
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, dh / 2 + 0.05, 0.1);
    g.add(outline(disc, 0.02));
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 24), toon(C.signal));
    wheel.position.set(0, dh / 2 + 0.05, 0.24);
    g.add(wheel);
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), toon(C.signal));
      spoke.position.copy(wheel.position);
      spoke.rotation.z = (i * Math.PI) / 3;
      g.add(spoke);
    }
  } else {
    const frame = box(dw + 0.24, dh + 0.14, 0.12, C.ink, false);
    frame.position.set(0, (dh + 0.14) / 2, 0.03);
    g.add(frame);
    const leafColor = style === 'exit' ? '#3A3F46' : style === 'double' ? C.violet : style === 'stair' ? '#4A4F57' : '#6A5F7A';
    if (style === 'double') {
      for (const s of [-1, 1]) {
        const leaf = box(dw / 2 - 0.04, dh - 0.02, 0.08, leafColor);
        leaf.position.set((s * dw) / 4, dh / 2, 0.1);
        g.add(leaf);
        const bar = box(0.06, 0.6, 0.06, C.signal, false);
        bar.position.set(s * 0.12, dh / 2, 0.17);
        g.add(bar);
      }
    } else {
      const leaf = box(dw - 0.06, dh - 0.03, 0.08, leafColor);
      leaf.position.set(0, dh / 2, 0.1);
      g.add(leaf);
      if (style === 'exit') {
        for (let i = 0; i < 9; i++) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(dw - 0.1, 0.04, 0.02), flat(C.ink));
          slat.position.set(0, 0.2 + i * (dh / 9), 0.15);
          g.add(slat);
        }
      } else if (style === 'stair') {
        const hazard = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.1, 0.25), flat(C.signal));
        hazard.position.set(0, dh - 0.3, 0.15);
        g.add(hazard);
      }
      const handle = box(0.08, 0.3, 0.08, C.paper, false);
      handle.position.set(dw / 2 - 0.25, 1.1, 0.18);
      g.add(handle);
    }
  }
  // sign above door (typeset)
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(1.2, dw), 0.34), new THREE.MeshBasicMaterial({ map: signTexture(def.label) }));
  sign.position.set(0, dh + 0.42, 0.06);
  g.add(sign);
  // status lamp (shape + colour: open = ring, locked = bar)
  const lamp = new THREE.Mesh(locked ? new THREE.BoxGeometry(0.22, 0.07, 0.04) : new THREE.TorusGeometry(0.07, 0.025, 8, 16), flat(locked ? C.coral : C.signal));
  lamp.position.set(Math.max(0.7, dw / 2) + 0.2, dh + 0.42, 0.08);
  g.add(lamp);

  const point = f.pos.clone().add(f.normal.clone().multiplyScalar(0.25)).setY(1.2);
  return {
    object: g,
    door: { def, point, normal: f.normal.clone(), lamp },
    tick: (t: number) => {
      lamp.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
    },
  };
}

// ───────────────────────────── decals ─────────────────────────────
function buildDecal(dcl: DecalDef, room: RoomDef, state: StoryStateDef): THREE.Object3D | null {
  const [w, , d] = room.size;
  const f = wallFrame(dcl.wall, w, d, dcl.offset);
  const g = new THREE.Group();
  g.position.copy(f.pos).add(f.normal.clone().multiplyScalar(0.03)).setY(dcl.y);
  g.rotation.y = f.rotY;
  let map: THREE.Texture;
  if (dcl.art.startsWith('sign:')) {
    map = signTexture(dcl.art.slice(5));
  } else {
    const artId = dcl.artIn?.[state.id] ?? dcl.art;
    if (!assets.has(artId)) return null;
    const tex = assets.texture(artId);
    map = dcl.caption && tex.image ? posterTexture(tex.image as HTMLImageElement, dcl.caption) : tex;
  }
  const L = LIGHTING[state.lighting];
  const tint = dcl.kind === 'window' ? (state.lighting === 'night' ? '#9A9AB8' : '#FFFFFF') : L.tint;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(dcl.w, dcl.h), new THREE.MeshBasicMaterial({ map, color: tint }));
  if (dcl.kind === 'window') {
    // show a centred crop of the landscape art so the window never stretches it
    const img = (map.image as { width?: number; height?: number }) ?? {};
    const aspectArt = (img.width ?? 3) / (img.height ?? 2);
    const aspectWin = dcl.w / dcl.h;
    const m = (plane.material as THREE.MeshBasicMaterial).map!.clone();
    if (aspectWin < aspectArt) {
      m.repeat.set(aspectWin / aspectArt, 1);
      m.offset.set((1 - aspectWin / aspectArt) / 2, 0);
    } else {
      m.repeat.set(1, aspectArt / aspectWin);
      m.offset.set(0, (1 - aspectArt / aspectWin) / 2);
    }
    m.needsUpdate = true;
    (plane.material as THREE.MeshBasicMaterial).map = m;
  }
  g.add(plane);
  if (dcl.kind !== 'sign' && dcl.kind !== 'mural') {
    const border = dcl.kind === 'photo' ? 0.1 : 0.08;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(dcl.w + border * 2, dcl.h + border * 2, 0.04), toon(dcl.kind === 'photo' ? C.paper : C.ink));
    frame.position.z = -0.025;
    g.add(frame);
    if (dcl.kind === 'window') {
      const mull = new THREE.Mesh(new THREE.BoxGeometry(0.07, dcl.h, 0.06), flat(C.ink));
      mull.position.z = 0.02;
      g.add(mull);
      const tran = new THREE.Mesh(new THREE.BoxGeometry(dcl.w, 0.07, 0.06), flat(C.ink));
      tran.position.set(0, dcl.h * 0.18, 0.02);
      g.add(tran);
    }
  }
  return g;
}

// ───────────────────────────── props ─────────────────────────────
let reelGeo: THREE.CylinderGeometry | null = null;

function buildProp(p: PropDef, animated: ((t: number) => void)[]): THREE.Object3D {
  const g = new THREE.Group();
  g.position.set(...p.pos);
  g.rotation.y = p.rotY ?? 0;
  const [sw, sh, sd] = p.size ?? [1, 1, 1];
  const col = p.color ?? C.concrete;
  const col2 = p.color2 ?? C.ink;
  switch (p.kind) {
    case 'box':
    case 'column': {
      g.add(box(sw, sh, sd, col));
      break;
    }
    case 'cyl': {
      const c = cyl(sw / 2, sw / 2, sh, col, 24);
      g.add(c);
      if (p.color2) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(sw / 2 + 0.01, sw / 2 + 0.01, sh * 0.2, 24), toon(col2));
        band.position.y = sh * 0.3;
        g.add(band);
      }
      break;
    }
    case 'bench': {
      g.add(box(sw, sh, sd, col));
      break;
    }
    case 'table': {
      const top = box(sw, 0.07, sd, col);
      top.position.y = sh;
      g.add(top);
      for (const [x, z] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, sh, 0.07), toon(col2));
        leg.position.set((x * (sw - 0.2)) / 2, sh / 2, (z * (sd - 0.2)) / 2);
        g.add(leg);
      }
      break;
    }
    case 'counter': {
      const b = box(sw, sh, sd, col);
      b.position.y = sh / 2;
      g.add(b);
      const top = box(sw + 0.1, 0.06, sd + 0.1, col2);
      top.position.y = sh;
      g.add(top);
      break;
    }
    case 'shelf': {
      const alongZ = sd > sw;
      const len = alongZ ? sd : sw;
      const depth = alongZ ? sw : sd;
      const frame = new THREE.Group();
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(alongZ ? depth : 0.06, sh, alongZ ? 0.06 : depth), toon(C.ink));
        post.position.set(alongZ ? 0 : (s * len) / 2, sh / 2, alongZ ? (s * len) / 2 : 0);
        frame.add(post);
      }
      const levels = 4;
      const spines: THREE.Matrix4[] = [];
      const colors: THREE.Color[] = [];
      const palette = [C.paper, col2, C.ink, '#B8AE9C', col2, C.paper];
      let k = 0;
      for (let i = 0; i < levels; i++) {
        const y = 0.12 + (i * (sh - 0.2)) / levels;
        const board = new THREE.Mesh(new THREE.BoxGeometry(alongZ ? depth : len, 0.05, alongZ ? len : depth), toon(col));
        board.position.set(0, y, 0);
        frame.add(board);
        const n = Math.floor(len / 0.13);
        for (let j = 0; j < n; j++) {
          if ((j * 7 + i * 3) % 11 === 0) continue;
          const hgt = 0.3 + ((j * 13 + i) % 5) * 0.02;
          const m = new THREE.Matrix4();
          const along = -len / 2 + 0.08 + j * 0.13;
          m.compose(new THREE.Vector3(alongZ ? 0 : along, y + 0.025 + hgt / 2, alongZ ? along : 0), new THREE.Quaternion(), new THREE.Vector3(1, hgt / 0.32, 1));
          spines.push(m);
          colors.push(new THREE.Color(palette[k++ % palette.length]));
        }
      }
      const spineGeo = new THREE.BoxGeometry(alongZ ? depth * 0.85 : 0.1, 0.32, alongZ ? 0.1 : depth * 0.85);
      const inst = new THREE.InstancedMesh(spineGeo, new THREE.MeshToonMaterial({ gradientMap: toonGradient() }), spines.length);
      spines.forEach((m, i) => {
        inst.setMatrixAt(i, m);
        inst.setColorAt(i, colors[i]);
      });
      frame.add(inst);
      g.add(frame);
      break;
    }
    case 'console': {
      const desk = box(sw, sh * 0.75, sd, col);
      desk.position.y = (sh * 0.75) / 2;
      g.add(desk);
      const slope = box(sw, 0.08, sd * 0.8, '#2B2733');
      slope.position.set(0, sh * 0.78, -0.05);
      slope.rotation.x = -0.25;
      g.add(slope);
      for (let i = 0; i < 16; i++) {
        const fader = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.12), flat(i % 5 === 0 ? C.coral : i % 3 === 0 ? C.signal : col2));
        fader.position.set(-sw / 2 + 0.3 + i * ((sw - 0.6) / 15), sh * 0.84, 0.05 - (i % 2) * 0.1);
        g.add(fader);
      }
      const meters = new THREE.Mesh(new THREE.BoxGeometry(sw * 0.5, 0.35, 0.06), flat(C.ink));
      meters.position.set(0, sh * 1.05, -sd / 2 + 0.1);
      g.add(meters);
      const needleL = new THREE.Mesh(new THREE.PlaneGeometry(sw * 0.2, 0.25), flat(C.signal));
      needleL.position.set(-sw * 0.12, sh * 1.05, -sd / 2 + 0.14);
      g.add(needleL);
      const needleR = needleL.clone();
      needleR.position.x = sw * 0.12;
      g.add(needleR);
      break;
    }
    case 'reelDeck': {
      const base = p.pos[1] > 0 ? 0 : 0;
      const body = box(sw, sh, sd, col);
      body.position.y = base + sh / 2;
      g.add(body);
      if (!reelGeo) reelGeo = new THREE.CylinderGeometry(1, 1, 0.04, 28);
      const reels: THREE.Mesh[] = [];
      const r = Math.min(sw, sh) * 0.22;
      for (const s of [-1, 1]) {
        const reel = new THREE.Mesh(reelGeo, toon(C.paper));
        reel.scale.set(r, 1, r);
        reel.rotation.x = Math.PI / 2;
        reel.position.set((s * sw) / 4, base + sh * 0.72, sd / 2 + 0.03);
        g.add(outline(reel, 0.01));
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.05, 12), toon(C.ink));
        hub.rotation.x = Math.PI / 2;
        hub.position.copy(reel.position).setZ(sd / 2 + 0.06);
        g.add(hub);
        reels.push(reel);
      }
      const tape = new THREE.Mesh(new THREE.BoxGeometry(sw * 0.5, 0.015, 0.01), flat('#5B3D2E'));
      tape.position.set(0, base + sh * 0.72 - r, sd / 2 + 0.04);
      g.add(tape);
      animated.push((t) => reels.forEach((rl) => (rl.rotation.y = t * 0.8)));
      break;
    }
    case 'generator': {
      const body = box(sw, sh, sd, col);
      body.position.y = sh / 2;
      g.add(body);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(sw + 0.02, 0.2, sd + 0.02), toon(col2));
      stripe.position.y = sh * 0.8;
      g.add(stripe);
      const stack = cyl(0.18, 0.18, 1.6, C.steel);
      stack.position.set(sw / 2 - 0.4, sh + 0.8, 0);
      g.add(stack);
      const panel = box(0.9, 0.7, 0.06, C.ink, false);
      panel.position.set(0, sh * 0.55, -sd / 2 - 0.03);
      g.add(panel);
      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), flat(C.signal));
      dial.position.set(-0.2, sh * 0.6, -sd / 2 - 0.07);
      dial.rotation.y = Math.PI;
      g.add(dial);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), flat(C.paper));
      label.position.set(0.22, sh * 0.52, -sd / 2 - 0.07);
      label.rotation.y = Math.PI;
      g.add(label);
      break;
    }
    case 'cylinders': {
      const n = Math.max(2, Math.round(sd / 0.45));
      for (let i = 0; i < n; i++) {
        const c = cyl(sw * 0.28, sw * 0.28, sh, col, 16);
        c.position.set(0, sh / 2, -sd / 2 + 0.25 + i * ((sd - 0.5) / (n - 1)));
        g.add(c);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(sw * 0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(col));
        cap.position.copy(c.position).setY(sh);
        g.add(cap);
        const valve = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), toon(C.steel));
        valve.position.copy(c.position).setY(sh + sw * 0.3);
        g.add(valve);
      }
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, sd), toon(C.steel));
      pipe.position.set(0, sh + sw * 0.35, 0);
      g.add(pipe);
      break;
    }
    case 'releaseStation': {
      const b = box(sw, sh, sd, col);
      g.add(b);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(sw * 0.8, sh * 0.25), flat(C.ink));
      plate.position.set(0, sh * 0.28, sd / 2 + 0.005);
      g.add(plate);
      const lever = box(0.06, sh * 0.5, 0.06, C.coral);
      lever.position.set(sw * 0.15, -sh * 0.05, sd / 2 + 0.06);
      lever.rotation.z = 0.25;
      g.add(lever);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), toon(C.coral));
      knob.position.set(sw * 0.15 + 0.06, sh * 0.18, sd / 2 + 0.06);
      g.add(knob);
      const pin = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 16), toon(C.paper));
      pin.position.set(-sw * 0.25, -sh * 0.1, sd / 2 + 0.04);
      g.add(pin);
      break;
    }
    case 'firePanel': {
      g.add(box(sw, sh, sd, col));
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw * 0.7, sh * 0.3), flat(C.cyan));
      screen.position.set(0, sh * 0.2, sd / 2 + 0.005);
      g.add(screen);
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(sw * 0.5, sh * 0.9), flat(C.paper, { side: THREE.DoubleSide }));
      paper.position.set(0, -sh * 0.62, sd / 2 + 0.03);
      paper.rotation.x = -0.15;
      g.add(paper);
      for (let i = 0; i < 4; i++) {
        const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.03, 10), flat(i === 2 ? C.coral : '#6C7A80'));
        lamp.position.set(-sw * 0.3 + i * 0.12, -sh * 0.2, sd / 2 + 0.006);
        g.add(lamp);
      }
      break;
    }
    case 'plant': {
      const pot = cyl(sw * 0.35, sw * 0.28, sh * 0.3, C.coral, 12);
      pot.position.y = sh * 0.15;
      g.add(pot);
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(sw * 0.22, sh * 0.7, 5), toon(i % 2 ? C.cyan : '#1F5C5F'));
        leaf.position.set(Math.cos(i * 1.3) * sw * 0.15, sh * 0.62, Math.sin(i * 1.3) * sw * 0.15);
        leaf.rotation.set(Math.cos(i) * 0.35, i, Math.sin(i) * 0.35);
        g.add(outline(leaf, 0.02));
      }
      break;
    }
    case 'dial': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(sw, 0.16, 12, 96), toon(C.paper));
      ring.rotation.x = Math.PI / 2;
      g.add(outline(ring, 0.03));
      const inner = new THREE.Mesh(new THREE.TorusGeometry(sw * 0.82, 0.05, 8, 96), toon(C.signal));
      inner.rotation.x = Math.PI / 2;
      g.add(inner);
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, i % 4 ? 0.25 : 0.5), flat(C.ink));
        tick.position.set(Math.cos(a) * sw * 0.9, -0.1, Math.sin(a) * sw * 0.9);
        tick.rotation.y = -a + Math.PI / 2;
        g.add(tick);
      }
      const needle = new THREE.Mesh(new THREE.BoxGeometry(sw * 1.8, 0.08, 0.12), toon(C.coral));
      needle.position.y = -0.25;
      g.add(outline(needle, 0.02));
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3, 4), flat(C.ink));
        cable.position.set(Math.cos(a) * sw, 1.5, Math.sin(a) * sw);
        g.add(cable);
      }
      animated.push((t) => {
        g.rotation.y = Math.sin(t * 0.15) * 0.25;
        needle.rotation.y = Math.sin(t * 0.4) * 0.05;
      });
      break;
    }
    case 'vending': {
      const b = box(sw, sh, sd, col);
      b.position.y = sh / 2;
      g.add(b);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(sw * 0.62, sh * 0.62), flat('#FFF4C2'));
      glass.position.set(-sw * 0.1, sh * 0.58, sd / 2 + 0.005);
      g.add(glass);
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++) {
          const can = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.02), flat([C.coral, C.cyan, C.signal, C.violet][(r + c) % 4]));
          can.position.set(-sw * 0.36 + c * 0.17, sh * 0.35 + r * 0.26, sd / 2 + 0.015);
          g.add(can);
        }
      break;
    }
    case 'glass': {
      if (p.color === 'grate') {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 64;
        const cx = cv.getContext('2d')!;
        cx.strokeStyle = '#16131D';
        cx.lineWidth = 4;
        cx.beginPath();
        cx.moveTo(0, 0);
        cx.lineTo(64, 64);
        cx.moveTo(64, 0);
        cx.lineTo(0, 64);
        cx.stroke();
        const t = new THREE.CanvasTexture(cv);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(sd * 3, sh * 3);
        const fence = new THREE.Mesh(new THREE.PlaneGeometry(sd, sh), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
        fence.rotation.y = Math.PI / 2;
        g.add(fence);
      } else {
        const pane = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), new THREE.MeshBasicMaterial({ color: '#9FD8DC', transparent: true, opacity: 0.16, depthWrite: false }));
        g.add(pane);
      }
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sw, sh, sd)), new THREE.LineBasicMaterial({ color: C.ink }));
      g.add(edges);
      break;
    }
    case 'lamp': {
      const shade = new THREE.Mesh(new THREE.ConeGeometry(sw / 2, sh, 16, 1, true), toon(C.ink));
      shade.material = toon(C.ink);
      g.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(sw * 0.22, 12, 8), flat(col));
      bulb.position.y = -sh * 0.4;
      g.add(bulb);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), flat(C.ink));
      cord.position.y = sh / 2 + 0.6;
      g.add(cord);
      if (col === C.coral) animated.push((t) => bulb.scale.setScalar(0.9 + Math.sin(t * 4) * 0.1));
      break;
    }
    case 'mic': {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, sh, 6), toon(C.steel));
      stand.position.y = sh / 2;
      g.add(stand);
      const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.12, 4, 8), toon(C.ink));
      head.position.set(0, sh, 0.05);
      head.rotation.x = 0.6;
      g.add(outline(head, 0.01));
      break;
    }
    case 'chair': {
      const seat = box(sw, 0.08, sd, col);
      seat.position.y = 0.46;
      g.add(seat);
      const back = box(sw, 0.5, 0.06, col);
      back.position.set(0, 0.75, sd / 2);
      g.add(back);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), toon(C.ink));
      leg.position.y = 0.22;
      g.add(leg);
      break;
    }
    case 'blanket': {
      const geo = new THREE.SphereGeometry(0.5, 14, 10);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        pos.setY(i, Math.max(y, -0.05) + Math.sin(pos.getX(i) * 9) * 0.02);
      }
      geo.computeVertexNormals();
      const lump = new THREE.Mesh(geo, toon(col));
      lump.scale.set(sw, sh, sd);
      lump.position.y = sh * 0.05;
      g.add(outline(lump, 0.02));
      const hp = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 16, Math.PI), toon(C.ink));
      hp.position.set(-0.05, sh * 0.48, -sd * 0.35);
      g.add(hp);
      break;
    }
    case 'stairs': {
      const steps = 14;
      for (let i = 0; i < steps; i++) {
        const stepH = sh / steps;
        const s = box(sw, stepH, sd / steps + 0.02, i % 2 ? col : C.concrete, i % 3 === 0);
        s.position.set(0, stepH * (i + 0.5), sd / 2 - (i + 0.5) * (sd / steps));
        g.add(s);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, Math.hypot(sd, sh)), flat(C.signal));
      rail.position.set(sw / 2, sh / 2 + 0.9, 0);
      rail.rotation.x = Math.atan2(sh, sd);
      g.add(rail);
      break;
    }
    case 'warden': {
      const colm = cyl(sw * 0.45, sw * 0.55, sh, '#232A33', 24);
      colm.position.y = sh / 2;
      g.add(colm);
      const eye = new THREE.Mesh(new THREE.TorusGeometry(sw * 0.62, 0.07, 8, 48), flat(C.cyan));
      eye.rotation.x = Math.PI / 2;
      eye.position.y = sh * 0.72;
      g.add(eye);
      const eye2 = eye.clone();
      eye2.position.y = sh * 0.38;
      g.add(eye2);
      const core = new THREE.Mesh(new THREE.SphereGeometry(sw * 0.3, 16, 12), flat('#7FE3EA'));
      core.position.y = sh + 0.2;
      g.add(core);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 20), toon(C.paper));
        reel.rotation.z = Math.PI / 2;
        reel.rotation.y = a;
        reel.position.set(Math.cos(a) * sw * 0.56, sh * 0.55, Math.sin(a) * sw * 0.56);
        g.add(outline(reel, 0.01));
      }
      g.userData.core = core;
      g.userData.rings = [eye, eye2];
      animated.push((t) => {
        eye.rotation.z = t * 0.3;
        eye2.rotation.z = -t * 0.25;
        core.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
      });
      break;
    }
    default:
      g.add(box(sw, sh, sd, col));
  }
  return g;
}

export function shadowBlob(radius: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: blobShadow(), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.renderOrder = 1;
  return m;
}
