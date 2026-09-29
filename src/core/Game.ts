import { STORY } from '../data/story';
import { ROOMS } from '../data/locations';
import { CHAR_IDS, CHARACTERS } from '../data/characters';
import type { RoomId, Script, StoryStateId } from '../data/types';
import { StoryMachine } from './StoryMachine';
import { loadSettings, saveSettings, type Settings } from './Settings';
import { clearSave, hasSave, readSave, writeSave, type SaveData } from './Save';
import { Input } from './Input';
import { assets } from './assets';
import { AudioEngine } from '../audio/Audio';
import { World } from '../world/World';
import { Director } from '../story/Director';
import { DialogueUI } from '../ui/Dialogue';
import { Overlays } from '../ui/Overlays';
import { HUD } from '../ui/HUD';
import { EvidenceBoard } from '../ui/EvidenceBoard';
import { Credits, PauseMenu, SettingsPanel, TitleScreen } from '../ui/Menus';
import { Hearing } from '../trial/Hearing';
import type { Interactable } from '../interaction/Interactables';

type Mode = 'boot' | 'title' | 'explore' | 'dialogue' | 'board' | 'menu' | 'trial' | 'credits' | 'transition' | 'vn';

const MOOD: Record<StoryStateId, Parameters<AudioEngine['setMood']>[0]> = {
  PROLOGUE: 'calm',
  ARRIVAL: 'calm',
  DINNER: 'calm',
  EVENING: 'night',
  NIGHT: 'night',
  INCIDENT: 'tension',
  INVESTIGATION: 'tension',
  PRE_HEARING: 'tension',
  HEARING: 'hearing',
  RECONSTRUCTION: 'hearing',
  VERDICT: 'hearing',
  EPILOGUE: 'dawn',
  CREDITS: 'dawn',
};

export class Game {
  readonly machine = new StoryMachine();
  settings: Settings = loadSettings();
  readonly audio = new AudioEngine(this.settings);
  readonly world: World;
  readonly input: Input;
  private director = new Director(this.machine);
  private app: HTMLElement;
  private ui: HTMLElement;
  private overlays: Overlays;
  private dialogue: DialogueUI;
  private hud: HUD;
  private board: EvidenceBoard;
  private pause: PauseMenu;
  private settingsPanel: SettingsPanel;
  private title: TitleScreen;
  private credits: Credits;
  private hearing: Hearing;
  mode: Mode = 'boot';
  private prevMode: Mode = 'explore';
  private playSeconds = 0;
  private last = performance.now();
  private frameTimes: number[] = [];
  private intentionalUnlock = false;
  private stateToken = 0;

  constructor() {
    this.app = document.getElementById('app')!;
    this.ui = document.getElementById('ui')!;
    const canvas = document.getElementById('scene') as HTMLCanvasElement;
    this.world = new World(canvas);
    this.input = new Input(canvas);
    this.overlays = new Overlays(this.ui, this.audio, () => this.settings);
    this.hud = new HUD(this.ui);
    this.dialogue = new DialogueUI(this.ui, {
      audio: this.audio,
      settings: () => this.settings,
      overlays: this.overlays,
      shake: (p) => this.world.shake(p * this.settings.shake),
      setBackdrop: (k) => this.setBackdrop(k),
    });
    this.board = new EvidenceBoard(this.ui, this.machine);
    this.pause = new PauseMenu(this.ui);
    this.settingsPanel = new SettingsPanel(this.ui, () => this.settings, (s) => this.applySettings(s));
    this.title = new TitleScreen(this.ui);
    this.credits = new Credits(this.ui);
    this.hearing = new Hearing({
      world: this.world,
      machine: this.machine,
      dialogue: this.dialogue,
      overlays: this.overlays,
      audio: this.audio,
      settings: () => this.settings,
      save: () => this.save(),
      openBoard: () => this.openBoardAwait(),
      uiRoot: this.ui,
    });
    this.applySettings(this.settings);
    this.wire();
  }

  // ───────────────────────── boot / title ─────────────────────────
  async boot() {
    await assets.init();
    const envIds = assets.all().filter((e) => e.id.startsWith('env_') || e.id.startsWith('keyart')).map((e) => e.id);
    const small = CHAR_IDS.flatMap((c) => CHARACTERS[c].expressions.map((e) => assets.portraitId(c, e)));
    await Promise.all([assets.preloadTextures(envIds), assets.preloadTextures(small, true), document.fonts?.ready]);
    void assets.preloadImages(assets.all().filter((e) => e.character).map((e) => e.id));
    this.showTitle();
    requestAnimationFrame(this.loop);
  }

  private showTitle() {
    this.mode = 'title';
    this.hud.show(false);
    this.world.clearRoom();
    this.hearing.dispose();
    this.credits.hide();
    this.setBackdrop('black');
    this.title.show(hasSave());
    this.audio.setMood('calm');
  }

  private wire() {
    const gesture = () => this.audio.unlock();
    window.addEventListener('pointerdown', gesture);
    window.addEventListener('keydown', gesture);
    this.title.onNew = () => void this.newGame();
    this.title.onContinue = () => void this.continueGame();
    this.title.onSettings = () => {
      this.settingsPanel.onClose = null;
      this.settingsPanel.open();
    };
    this.pause.onResume = () => this.closePause();
    this.pause.onBoard = () => {
      this.pause.close();
      this.mode = 'board';
      this.board.open();
    };
    this.pause.onSettings = () => {
      this.pause.close();
      this.settingsPanel.onClose = () => this.pause.open();
      this.settingsPanel.open();
    };
    this.pause.onTitle = () => {
      this.save();
      this.pause.close();
      this.showTitle();
    };
    this.board.onClose = () => {
      this.input.clear();
      if (this.mode === 'board') this.mode = this.prevMode === 'board' ? 'explore' : this.prevMode;
    };
    this.credits.onDone = () => this.showTitle();
    this.world.renderer.domElement.addEventListener('click', () => {
      if (this.mode === 'explore') this.input.requestLock();
    });
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this.mode === 'explore' && !this.intentionalUnlock) this.openPause();
      this.intentionalUnlock = false;
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') e.preventDefault();
      if (this.settingsPanel.isOpen && e.code === 'Escape') this.settingsPanel.close();
      else if (this.mode === 'board') {
        if (e.code === 'Tab' || e.code === 'Escape') this.board.close();
        else this.board.key(e.code);
      } else if (this.mode === 'menu' && e.code === 'Escape') this.closePause();
    });
    document.addEventListener('visibilitychange', () => document.hidden && this.save());
  }

  private applySettings(s: Settings) {
    this.settings = s;
    saveSettings(s);
    this.audio.apply(s);
    this.world.reduceMotion = s.reduceMotion;
    this.world.shakeScale = s.shake;
    document.body.classList.toggle('reduce-motion', s.reduceMotion);
    this.world.resize();
  }

  async newGame() {
    this.audio.unlock();
    clearSave();
    this.machine.reset();
    this.playSeconds = 0;
    this.title.hide();
    await this.enterState(this.machine.state, null);
  }

  async continueGame() {
    const s = readSave();
    if (!s) return;
    this.audio.unlock();
    this.machine.restore(s.machine);
    this.playSeconds = s.playSeconds;
    this.title.hide();
    await this.enterState(this.machine.state, s);
  }

  // ───────────────────────── states ─────────────────────────
  private setBackdrop(kind: 'black' | 'keyart' | 'room' | 'dawn') {
    this.overlays.setBg(kind === 'room' ? 'none' : kind);
    this.app.classList.toggle('no-scene', kind !== 'room');
  }

  async enterState(id: StoryStateId, resume: SaveData | null) {
    const token = ++this.stateToken;
    const def = STORY[id];
    this.hud.setState(def.clock, def.chapter);
    this.audio.setMood(MOOD[id]);
    this.overlays.clear();
    if (def.mode === 'vn') {
      this.hud.show(false);
      this.world.clearRoom();
      this.setBackdrop('black');
      this.save();
      await this.runScript(def.onEnter!, 'vn');
      return;
    }
    if (def.mode === 'explore') {
      let room: RoomId = def.start?.room ?? this.world.roomId ?? def.rooms[0];
      let pos: [number, number] | null = null;
      let yaw = 0;
      if (resume?.room && def.rooms.includes(resume.room)) {
        room = resume.room;
        pos = resume.pos;
        yaw = resume.yaw;
      } else if (!def.rooms.includes(room)) room = def.rooms[0];
      const keepPlace = !resume && !def.start && this.world.roomId === room;
      if (!keepPlace) {
        this.world.loadRoom(room, def, this.machine);
        if (pos) this.world.player.place(pos[0], pos[1], yaw);
        else this.placeAtSpawn(room, def.start?.spawn);
      } else {
        this.world.loadRoom(room, def, this.machine);
        const p = this.world.player;
        p.place(p.pos.x, p.pos.y, p.yaw);
      }
      this.hud.setRoom(room);
      this.setBackdrop('room');
      this.hud.show(true);
      this.hud.setObjective(this.machine.objective());
      this.mode = 'explore';
      this.save();
      if (def.onEnter && !this.machine.flags.has(`entered:${id}`)) {
        await this.runScript(def.onEnter, 'vn', `entered:${id}`);
      }
      return;
    }
    if (def.mode === 'trial') {
      this.hud.show(false);
      this.mode = 'trial';
      this.intentionalUnlock = true;
      this.input.releaseLock();
      this.world.loadRoom('round', def, this.machine);
      this.setBackdrop('room');
      this.hearing.setupRing();
      this.save();
      const exit = def.exit;
      if (!exit || exit.kind !== 'trial') throw new Error('trial state without trial exit');
      await this.hearing.run(exit.group);
      if (token !== this.stateToken) return;
      this.machine.advance();
      this.hearing.dispose();
      await this.enterState(this.machine.state, null);
      return;
    }
    if (def.mode === 'credits') {
      this.hud.show(false);
      this.world.clearRoom();
      this.setBackdrop('dawn');
      this.mode = 'credits';
      clearSave();
      this.credits.show(this.playSeconds);
    }
  }

  private placeAtSpawn(room: RoomId, spawn?: string) {
    const r = ROOMS[room];
    const sp = (spawn && r.spawns[spawn]) || Object.values(r.spawns)[0];
    this.world.player.place(sp.pos[0], sp.pos[1], sp.yaw);
  }

  /** Run a script in the VN layer, then let the story machine react. */
  async runScript(script: string | Script, layer: 'vn', flagOnDone?: string) {
    const before = this.machine.state;
    const prevMode = this.mode;
    this.mode = 'dialogue';
    this.intentionalUnlock = !!document.pointerLockElement;
    this.input.releaseLock();
    this.input.clear();
    this.hud.show(false);
    this.app.classList.add('talking');
    this.dialogue.open(layer);
    await this.director.run(script, this.dialogue);
    this.dialogue.close();
    this.app.classList.remove('talking');
    if (flagOnDone) this.machine.setFlag(flagOnDone);
    this.input.clear();
    if (this.machine.state === before) this.machine.checkAuto();
    if (this.machine.state !== before) {
      await this.enterState(this.machine.state, null);
      return;
    }
    this.mode = prevMode === 'dialogue' || prevMode === 'boot' ? 'explore' : prevMode;
    if (STORY[this.machine.state].mode === 'explore') {
      this.mode = 'explore';
      this.setBackdrop('room');
      this.world.syncActors(STORY[this.machine.state], this.machine);
      this.hud.show(true);
      this.hud.setObjective(this.machine.objective());
    }
    this.save();
  }

  // ───────────────────────── interaction ─────────────────────────
  private async interact(t: Interactable) {
    const def = STORY[this.machine.state];
    this.audio.sfx('click');
    if (t.kind === 'npc') {
      const key = `${def.id}:${t.char}`;
      const first = !this.machine.talked.has(key);
      this.machine.talked.add(key);
      await this.runScript(first ? t.placement.talk : t.placement.again ?? t.placement.talk, 'vn');
      return;
    }
    if (t.kind === 'hotspot') {
      this.machine.examined.add(t.def.id);
      await this.runScript(t.def.script, 'vn');
      return;
    }
    const door = t.door.def;
    const scripted = door.script?.[def.id];
    if (scripted) {
      await this.runScript(scripted, 'vn');
      return;
    }
    const locked = door.locked?.[def.id];
    if (locked) {
      this.audio.sfx('error');
      await this.runScript([{ who: 'narr', t: locked }], 'vn');
      return;
    }
    if (!door.to || !def.rooms.includes(door.to)) {
      this.audio.sfx('error');
      await this.runScript([{ who: 'narr', t: '지금은 그쪽으로 갈 수 없다.' }], 'vn');
      return;
    }
    await this.moveTo(door.to, door.spawn, door.style === 'stair');
  }

  private async moveTo(room: RoomId, spawn: string | undefined, squeak: boolean) {
    this.mode = 'transition';
    this.audio.sfx(squeak ? 'squeak' : 'door');
    const def = STORY[this.machine.state];
    await this.overlays.wipe(`${ROOMS[room].nameEn} · ${ROOMS[room].name}`, () => {
      this.world.loadRoom(room, def, this.machine);
      this.placeAtSpawn(room, spawn);
      this.hud.setRoom(room);
    });
    this.mode = 'explore';
    this.save();
  }

  private openPause() {
    if (this.mode !== 'explore') return;
    this.mode = 'menu';
    this.pause.open();
  }

  private closePause() {
    this.pause.close();
    this.input.clear();
    this.mode = 'explore';
  }

  private openBoardAwait(): Promise<void> {
    return new Promise((resolve) => {
      this.prevMode = this.mode;
      this.mode = 'board';
      const prev = this.board.onClose;
      this.board.onClose = () => {
        this.board.onClose = prev;
        this.input.clear();
        this.mode = this.prevMode;
        resolve();
      };
      this.board.open();
    });
  }

  save() {
    const st = STORY[this.machine.state];
    if (st.mode === 'credits') return;
    writeSave({
      playSeconds: this.playSeconds,
      machine: this.machine.snapshot(),
      room: st.mode === 'explore' ? this.world.roomId : null,
      pos: st.mode === 'explore' ? [this.world.player.pos.x, this.world.player.pos.y] : null,
      yaw: this.world.player.yaw,
    });
  }

  // ───────────────────────── loop ─────────────────────────
  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 120) this.frameTimes.shift();
    if (this.mode !== 'title' && this.mode !== 'credits' && this.mode !== 'menu') this.playSeconds += dt;

    const exploring = this.mode === 'explore';
    this.world.update(dt, exploring ? this.input : null, this.settings.sensitivity);
    this.hearing.update(dt);
    if (exploring) {
      this.hud.setTarget(this.world.target);
      this.hud.hint(this.machine.state === 'ARRIVAL');
      if (this.input.consume('KeyE') || this.input.consume('Enter')) {
        const t = this.world.target;
        if (t) void this.interact(t);
      } else if (this.input.consume('Tab')) {
        this.prevMode = 'explore';
        this.mode = 'board';
        this.intentionalUnlock = !!document.pointerLockElement;
        this.input.releaseLock();
        this.board.open();
      } else if (this.input.consume('Escape')) {
        this.intentionalUnlock = !!document.pointerLockElement;
        this.input.releaseLock();
        this.openPause();
      }
    } else if (this.mode === 'trial' && this.input.consume('Escape')) {
      /* no pause mid-hearing: progress is saved per round */
    }
    if (this.world.roomId) this.world.render();
    this.input.endFrame();
    requestAnimationFrame(this.loop);
  };

  // ───────────────────────── read-only debug view (E2E / perf) ─────────────────────────
  debugView() {
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, this.frameTimes.length);
    const cam = this.world.camera;
    return {
      mode: this.mode,
      state: this.machine.state,
      room: this.world.roomId,
      player: { x: this.world.player.pos.x, z: this.world.player.pos.y, yaw: this.world.player.yaw },
      camera: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
      target: this.world.target ? this.world.target.id : null,
      interactables: this.world.interactables.map((i) => ({ id: i.id, x: i.pos.x, z: i.pos.z, kind: i.kind, range: i.range, locked: i.kind === 'door' ? i.locked : false })),
      /** walkable area snapshot so automated playthroughs can path-plan; purely informational */
      nav: this.world.built
        ? {
            bounds: { ...this.world.built.bounds },
            colliders: this.world.built.colliders.map((b) => ({ ...b })),
            circles: this.world.npcCircles(),
          }
        : null,
      dialogue: this.dialogue.debugState(),
      evidence: [...this.machine.evidence],
      flags: [...this.machine.flags],
      trial: { ...this.machine.trial },
      fps: avg > 0 ? 1 / avg : 0,
      drawCalls: this.world.renderer.info.render.calls,
      triangles: this.world.renderer.info.render.triangles,
      pixelRatio: this.world.renderer.getPixelRatio(),
    };
  }
}
