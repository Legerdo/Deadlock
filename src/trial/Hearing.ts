import * as THREE from 'three';
import { STORY } from '../data/story';
import { HEARING_OPENING, TRIAL } from '../data/trial';
import type { CharId, DebateRound, LineBeat, ReelRound, TrialGroup, TrialRound, TrialStage, TuneRound } from '../data/types';
import { MAX_FOCUS, type StoryMachine } from '../core/StoryMachine';
import type { Settings } from '../core/Settings';
import type { AudioEngine } from '../audio/Audio';
import { Director } from '../story/Director';
import type { DialogueUI } from '../ui/Dialogue';
import type { Overlays } from '../ui/Overlays';
import type { World } from '../world/World';
import { Billboard } from '../world/Billboard';
import { flat, outline, toon } from '../world/RoomBuilder';
import { C } from '../data/locations';
import { assets } from '../core/assets';
import { HearingCamera, SEAT_ORDER, seatPosition } from './HearingCamera';
import { HearingUI } from './HearingUI';
import { judgeDebate, judgeReel, judgeTune } from './judge';
import { sleep } from '../ui/dom';

export interface HearingDeps {
  world: World;
  machine: StoryMachine;
  dialogue: DialogueUI;
  overlays: Overlays;
  audio: AudioEngine;
  settings: () => Settings;
  save: () => void;
  openBoard: () => Promise<void>;
  uiRoot: HTMLElement;
}

/** Runs one trial group (hearing / reconstruction / verdict) inside the Round. */
export class Hearing {
  private cam: HearingCamera;
  private ui: HearingUI;
  private director: Director;
  private billboards = new Map<CharId, Billboard>();
  private ring: THREE.Group | null = null;
  private wrongIndex = 0;
  active = false;

  constructor(private d: HearingDeps) {
    this.cam = new HearingCamera(d.world.camera);
    this.ui = new HearingUI(d.uiRoot, d.audio, d.settings);
    this.director = new Director(d.machine);
  }

  /** Build podiums + billboards in the Round (called after World.loadRoom('round')). */
  setupRing() {
    const w = this.d.world;
    this.ring?.removeFromParent();
    this.ring = new THREE.Group();
    this.billboards.clear();
    for (const id of SEAT_ORDER) {
      const p = seatPosition(id);
      const inward = p.clone().multiplyScalar(-1).normalize();
      const podium = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.5), toon(id === 'kai' ? C.cyan : '#2E2A38'));
      body.position.y = 0.5;
      podium.add(outline(body, 0.03));
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.62), toon(id === 'theo' ? C.violet : C.signal));
      top.position.y = 1.02;
      podium.add(top);
      // gooseneck mic at the podium's edge, leaning toward the speaker, clear of the face
      const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), toon(C.steel));
      mic.position.set(0.46, 1.19, 0.02);
      mic.rotation.set(-0.35, 0, 0.35);
      podium.add(mic);
      podium.position.copy(p.clone().add(inward.clone().multiplyScalar(0.55)));
      podium.lookAt(0, 0, 0);
      this.ring.add(podium);
      if (id === 'theo') {
        // memorial stand: framed portrait + his headphones on the podium
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.06), toon(C.ink));
        const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshBasicMaterial({ map: assets.texture(assets.portraitId('theo', 'happy'), true), transparent: true, color: '#B9B4C4' }));
        pic.position.z = 0.035;
        const matte = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), flat('#3A3448'));
        matte.position.z = 0.032;
        frame.add(matte, pic);
        frame.position.copy(p).setY(1.85);
        frame.lookAt(0, 1.85, 0);
        this.ring.add(frame);
        const hp = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20, Math.PI), toon(C.ink));
        hp.position.copy(podium.position).setY(1.1);
        hp.lookAt(0, 1.1, 0);
        this.ring.add(hp);
        continue;
      }
      const b = new Billboard(id);
      b.root.position.copy(p);
      this.ring.add(b.root);
      this.billboards.set(id, b);
    }
    w.scene.add(this.ring);
  }

  private tick = (dt: number) => {
    this.cam.motion = this.d.settings().reduceMotion ? 0.25 : 1;
    this.cam.update(dt);
    const t = performance.now() / 1000;
    for (const b of this.billboards.values()) b.update(this.d.world.camera, t, this.d.settings().reduceMotion);
  };

  update(dt: number) {
    if (this.active) this.tick(dt);
  }

  private onLine = (b: LineBeat) => {
    if (b.who === 'warden') {
      this.cam.warden();
      return;
    }
    if (b.who === 'narr') {
      this.cam.wide(0.8);
      return;
    }
    if (b.radio && b.who === 'theo') {
      this.cam.memorial();
      this.cam.pushIn(0.5);
      return;
    }
    const bb = this.billboards.get(b.who);
    bb?.setExpr(b.e);
    const prev = this.d.dialogue.lastLine;
    const fast = prev && prev !== b && prev.who !== b.who;
    if (fast) this.d.overlays.whip();
    this.cam.speaker(b.who, fast ? 0.22 : 0.4);
    if (b.e === 'angry' || b.e === 'surprised') this.cam.pushIn(0.45);
  };

  private async say(script: TrialRound['success']) {
    this.ui.headerVisible(false);
    this.d.dialogue.open('hearing');
    this.d.dialogue.onLine = this.onLine;
    await this.director.run(script, this.d.dialogue);
    this.d.dialogue.close();
    this.d.dialogue.onLine = null;
  }

  private async retort(beat: LineBeat) {
    await this.say([beat]);
  }

  /** Play every stage of `group`, resuming from machine.trial. Resolves when the group is done. */
  async run(group: TrialGroup) {
    this.active = true;
    this.d.world.cameraOwned = true;
    const stages = TRIAL.filter((s) => s.group === group);
    const m = this.d.machine;
    this.d.audio.setMood('hearing');
    this.ui.setFocus(m.trial.focus);
    this.ui.show(true);
    this.cam.orbit();
    if (group === 'hearing' && m.trial.stage === 0 && m.trial.round === 0) {
      await this.say(HEARING_OPENING);
    }
    for (let si = m.trial.stage; si < stages.length; si++) {
      const stage = stages[si];
      if (m.trial.round === 0) {
        this.cam.wide(0.6);
        await this.d.overlays.title(`STAGE ${stage.numeral}`, `${stage.title} — ${stage.titleEn}`);
        await this.say(stage.intro);
      }
      for (let ri = m.trial.round; ri < stage.rounds.length; ri++) {
        await this.playRound(stage, stage.rounds[ri]);
        m.setTrial({ stage: si, round: ri + 1 });
        this.d.save();
      }
      if (stage.outro) await this.say(stage.outro);
      m.setTrial({ stage: si + 1, round: 0 });
      this.d.save();
    }
    this.ui.show(false);
    this.ui.clear();
    this.active = false;
    this.d.world.cameraOwned = false;
    this.cam.release();
    void STORY;
  }

  private async playRound(stage: TrialStage, round: TrialRound) {
    this.ui.setHeader(stage, round.title, round.kind, round.prompt);
    if (round.intro) await this.say(round.intro);
    this.ui.headerVisible(true);
    this.wrongIndex = 0;
    if (round.kind === 'tune') await this.tuneRound(round);
    else if (round.kind === 'reel') await this.reelRound(round);
    else await this.debate(round);
    this.ui.clear();
    await this.say(round.success);
  }

  private async penalize(round: TrialRound): Promise<'retry' | 'restart'> {
    const m = this.d.machine;
    const focus = m.trial.focus - 1;
    m.setTrial({ focus: Math.max(0, focus) });
    this.ui.setFocus(Math.max(0, focus), true);
    this.d.audio.sfx('error');
    this.d.overlays.stamp('NO SIGNAL', 'wrong');
    this.d.world.shake(0.9 * this.d.settings().shake);
    document.body.classList.add('glitch');
    setTimeout(() => document.body.classList.remove('glitch'), 320);
    const line = round.wrong[this.wrongIndex++ % round.wrong.length];
    await this.retort(line);
    if (focus <= 0) {
      await this.ui.signalLost();
      m.setTrial({ focus: 3 });
      this.ui.setFocus(3);
      this.d.save();
      return 'restart';
    }
    this.d.save();
    return 'retry';
  }

  private debate(round: DebateRound): Promise<void> {
    return new Promise((resolve) => {
      let busy = false;
      const ctl = this.ui.debate(round, [...this.d.machine.evidence], {
        onStatement: (s) => {
          if (busy) return;
          this.billboards.get(s.who)?.setExpr(s.e);
          this.d.overlays.whip();
          this.d.audio.sfx('whoosh');
          this.cam.speaker(s.who, 0.22);
        },
        onBoard: async () => {
          ctl.hold();
          await this.d.openBoard();
          ctl.resume();
        },
        onAttempt: async (sid, eid) => {
          if (busy) return;
          busy = true;
          ctl.hold();
          const v = judgeDebate(round, sid, eid);
          if (v.result === 'correct') {
            const kind = round.kind;
            ctl.splitCurrent(kind);
            this.d.audio.sfx(kind === 'cut' ? 'cut' : 'patch');
            this.d.overlays.stamp(kind === 'cut' ? 'CUT' : 'PATCH', kind);
            this.d.overlays.flash(kind === 'cut' ? 'white' : 'signal');
            this.cam.speaker('kai', 0.18);
            this.cam.pushIn(0.9);
            this.d.world.shake(0.5 * this.d.settings().shake);
            await sleep(this.d.settings().textSpeed === 0 ? 300 : 900);
            this.d.audio.sfx('correct');
            resolve();
            return;
          }
          if (v.result === 'partial') {
            this.d.audio.sfx('static');
            await this.retort(v.reply);
            this.ui.headerVisible(true);
            busy = false;
            ctl.resume();
            return;
          }
          const r = await this.penalize(round);
          this.ui.headerVisible(true);
          busy = false;
          if (r === 'restart') ctl.restart();
          else ctl.resume();
        },
      });
    });
  }

  private tuneRound(round: TuneRound): Promise<void> {
    this.cam.orbit();
    return new Promise((resolve) => {
      const ctl = this.ui.tune(round, async (opt) => {
        ctl.hold();
        if (judgeTune(round, opt)) {
          ctl.lockIn();
          this.d.audio.sfx('tune');
          this.d.overlays.stamp('TUNED', 'tune');
          this.d.overlays.flash('signal');
          await sleep(this.d.settings().textSpeed === 0 ? 300 : 900);
          resolve();
          return;
        }
        await this.penalize(round);
        this.ui.headerVisible(true);
        this.cam.orbit();
        ctl.resume();
      });
    });
  }

  private reelRound(round: ReelRound): Promise<void> {
    this.cam.orbit();
    return new Promise((resolve) => {
      const ctl = this.ui.reel(round, async (order) => {
        ctl.hold();
        const r = judgeReel(round, order);
        if (r.correct) {
          ctl.reveal();
          this.d.audio.sfx('correct');
          this.d.overlays.stamp('SPLICED', 'reel');
          this.d.overlays.flash('signal');
          await sleep(this.d.settings().textSpeed === 0 ? 500 : 1600);
          resolve();
          return;
        }
        ctl.status(`${r.matches}/${round.answerOrder.length} 조각이 제자리에 있다.`);
        await this.penalize(round);
        this.ui.headerVisible(true);
        this.cam.orbit();
        ctl.resume();
      });
    });
  }

  dispose() {
    this.ring?.removeFromParent();
    this.ring = null;
    this.billboards.clear();
    this.ui.show(false);
    this.ui.clear();
    this.active = false;
    this.d.world.cameraOwned = false;
    this.cam.release();
  }

  static focusMax = MAX_FOCUS;
}
