import * as THREE from 'three';
import { CHARACTERS } from '../data/characters';
import { HOTSPOT_BY_ID } from '../data/evidence';
import { ROOMS, C } from '../data/locations';
import type { CharId, NpcPlacement, RoomId, StoryStateDef } from '../data/types';
import type { StoryMachine } from '../core/StoryMachine';
import { assets } from '../core/assets';
import { Billboard } from './Billboard';
import { buildRoom, LIGHTING, type BuiltRoom } from './RoomBuilder';
import { Player } from './Player';
import { markerTexture } from './textures';
import { pickTarget, type Interactable } from '../interaction/Interactables';
import type { Input } from '../core/Input';

interface Actor {
  placement: NpcPlacement;
  billboard: Billboard;
  talkMarker: THREE.Sprite;
}

export function activePlacements(def: StoryStateDef, machine: StoryMachine, room: RoomId): NpcPlacement[] {
  return def.npcs.filter((n) => n.room === room && (!n.when || machine.test(n.when)) && (!n.unless || !machine.test(n.unless)));
}

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.05, 90);
  readonly player: Player;
  roomId: RoomId | null = null;
  built: BuiltRoom | null = null;
  actors: Actor[] = [];
  private markers: { id: string; sprite: THREE.Sprite; base: THREE.Vector3 }[] = [];
  target: Interactable | null = null;
  interactables: Interactable[] = [];
  private time = 0;
  reduceMotion = false;
  shakeAmt = 0;
  shakeScale = 1;
  /** when set, an external controller (hearing) owns the camera */
  cameraOwned = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(C.ink);
    assets.maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.player = new Player(this.camera);
    this.scene.add(this.camera);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, this.reduceMotion ? 1.25 : 1.5);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  loadRoom(id: RoomId, def: StoryStateDef, machine: StoryMachine) {
    this.clearRoom();
    const room = ROOMS[id];
    this.roomId = id;
    this.built = buildRoom(room, def);
    this.scene.add(this.built.group);
    const L = LIGHTING[def.lighting];
    this.scene.fog = new THREE.Fog(L.fog, 14, room.round ? 40 : 34);
    this.camera.fov = 62;
    this.camera.updateProjectionMatrix();
    this.syncActors(def, machine);
  }

  clearRoom() {
    if (this.built) {
      this.scene.remove(this.built.group);
      this.built.dispose();
    }
    for (const a of this.actors) this.scene.remove(a.billboard.root);
    for (const m of this.markers) this.scene.remove(m.sprite);
    this.actors = [];
    this.markers = [];
    this.built = null;
    this.interactables = [];
    this.target = null;
  }

  /** (Re)place NPCs and hotspot markers for the current state and flags. */
  syncActors(def: StoryStateDef, machine: StoryMachine) {
    if (!this.roomId || !this.built) return;
    const room = this.roomId;
    for (const a of this.actors) this.scene.remove(a.billboard.root);
    for (const m of this.markers) this.scene.remove(m.sprite);
    this.actors = [];
    this.markers = [];
    const tint = LIGHTING[def.lighting].tint;
    for (const p of activePlacements(def, machine, room)) {
      const b = new Billboard(p.char, tint);
      b.root.position.set(p.pos[0], 0, p.pos[1]);
      b.setExpr(p.expr);
      this.scene.add(b.root);
      const talk = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture('talk'), depthTest: false, transparent: true }));
      talk.scale.setScalar(0.34);
      talk.position.set(0, CHARACTERS[p.char].heightM + 0.32, 0);
      talk.renderOrder = 5;
      b.root.add(talk);
      this.actors.push({ placement: p, billboard: b, talkMarker: talk });
    }
    for (const hid of def.hotspots) {
      const h = HOTSPOT_BY_ID.get(hid);
      if (!h || h.room !== room) continue;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture(machine.examined.has(h.id) ? 'done' : 'hotspot'), depthTest: false, transparent: true }));
      sprite.scale.setScalar(0.24);
      const base = new THREE.Vector3(h.pos[0], h.pos[1] + 0.3, h.pos[2]);
      sprite.position.copy(base);
      sprite.renderOrder = 6;
      this.scene.add(sprite);
      this.markers.push({ id: h.id, sprite, base });
    }
    this.rebuildInteractables(def, machine);
  }

  rebuildInteractables(def: StoryStateDef, machine: StoryMachine) {
    const list: Interactable[] = [];
    for (const a of this.actors) {
      list.push({
        kind: 'npc',
        id: `npc:${a.placement.char}`,
        char: a.placement.char,
        placement: a.placement,
        pos: new THREE.Vector3(a.placement.pos[0], 1.3, a.placement.pos[1]),
        label: CHARACTERS[a.placement.char].name,
        range: 2.6,
      });
      a.talkMarker.visible = !machine.talked.has(`${def.id}:${a.placement.char}`);
    }
    for (const m of this.markers) {
      const h = HOTSPOT_BY_ID.get(m.id)!;
      const done = machine.examined.has(h.id);
      (m.sprite.material as THREE.SpriteMaterial).map = markerTexture(done ? 'done' : 'hotspot');
      list.push({ kind: 'hotspot', id: `hs:${h.id}`, def: h, pos: new THREE.Vector3(...h.pos), label: h.label, range: 2.3, done });
    }
    for (const d of this.built?.doors ?? []) {
      const locked = !!d.def.locked?.[def.id] && !d.def.script?.[def.id];
      list.push({ kind: 'door', id: `door:${d.def.id}`, door: d, pos: d.point, label: d.def.label, range: 2.5, locked });
    }
    this.interactables = list;
  }

  npcCircles() {
    return this.actors.map((a) => ({ x: a.placement.pos[0], z: a.placement.pos[1], r: 0.3 }));
  }

  billboard(char: CharId) {
    return this.actors.find((a) => a.placement.char === char)?.billboard;
  }

  shake(power: number) {
    this.shakeAmt = Math.max(this.shakeAmt, power * this.shakeScale);
  }

  update(dt: number, input: Input | null, sensitivity: number) {
    this.time += dt;
    const t = this.time;
    if (input && this.built && !this.cameraOwned) {
      this.player.update(dt, input, this.built.bounds, this.built.colliders, this.npcCircles(), sensitivity, this.reduceMotion);
    }
    for (const a of this.actors) a.billboard.update(this.camera, t, this.reduceMotion);
    this.built?.animated.forEach((fn) => fn(t));
    const eye = this.camera.position;
    for (const m of this.markers) {
      const dist = eye.distanceTo(m.base);
      const mat = m.sprite.material as THREE.SpriteMaterial;
      mat.opacity = dist < 7 ? Math.min(1, (7 - dist) / 2.5) : 0;
      const targeted = this.target?.id === `hs:${m.id}`;
      m.sprite.scale.setScalar(targeted ? 0.34 + Math.sin(t * 8) * 0.02 : 0.22);
      m.sprite.position.y = m.base.y + (this.reduceMotion ? 0 : Math.sin(t * 2.4 + m.base.x) * 0.04);
    }
    this.target = input && !this.cameraOwned ? pickTarget(eye, this.player.yaw, this.interactables) : null;
    if (this.shakeAmt > 0.001) {
      const s = this.shakeAmt * 0.05;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.shakeAmt *= Math.pow(0.001, dt * 3.5);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
