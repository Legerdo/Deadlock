// A keyboard-and-mouse "player" for end-to-end tests.
//
// It reads the game's read-only debug view (position, yaw, nearby interactables,
// walkable-area snapshot) and then plays with real input only: WASD / arrow keys
// to walk and turn, E to interact, Space to advance text, mouse clicks for the
// hearing UI. It never calls into game code or mutates state.
import type { Page } from '@playwright/test';
import { ROOMS } from '../../src/data/locations';
import { STORY } from '../../src/data/story';
import { TRIAL } from '../../src/data/trial';
import type { DebateRound, ReelRound, RoomId, StoryStateId, TrialRound, TuneRound } from '../../src/data/types';

interface Box {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface View {
  mode: string;
  state: StoryStateId;
  room: RoomId | null;
  player: { x: number; z: number; yaw: number };
  target: string | null;
  interactables: { id: string; x: number; z: number; kind: string; range: number; locked: boolean }[];
  evidence: string[];
  flags: string[];
  trial: { stage: number; round: number; focus: number };
  fps: number;
  drawCalls: number;
  triangles: number;
  nav: { bounds: Box; colliders: Box[]; circles: { x: number; z: number; r: number }[] } | null;
  dialogue: { open: boolean; who: string | null; text: string; ready: boolean };
}

export interface Probe extends View {
  overlay: boolean;
  cutin: string | null;
  board: boolean;
  hearing: { on: boolean; kind: string | null; hold: boolean; done: boolean; round: string | null; focus: number | null };
}

const PLAYER_R = 0.32;
const CELL = 0.2;

export class Bot {
  private held = new Set<string>();
  log: string[] = [];

  constructor(readonly page: Page) {}

  async view(): Promise<View> {
    return this.page.evaluate(() => window.__AFTERSIGNAL__!.view() as never);
  }

  async probe(): Promise<Probe> {
    return this.page.evaluate(() => {
      const v = window.__AFTERSIGNAL__!.view() as unknown as Record<string, unknown>;
      const area = document.querySelector('.hearing-ui .hr-stage-area');
      const kind = area ? (['debate', 'tune', 'reel'].find((k) => area.classList.contains(k)) ?? null) : null;
      const cut = document.querySelector('.cutin img') as HTMLImageElement | null;
      const focus = document.querySelector('.hr-focus') as HTMLElement | null;
      return {
        ...v,
        overlay: !!document.querySelector('.cutin, .title-card, .ev-acquire'),
        cutin: cut ? cut.getAttribute('src') : null,
        board: !!document.querySelector('.board.on'),
        hearing: {
          on: !!document.querySelector('.hearing-ui.on'),
          kind,
          hold: !!area?.classList.contains('hold'),
          done: !!area && (area.classList.contains('locked-in') || !!area.querySelector('.rl-seg.ok') || !!area.querySelector('.hr-line.split, .hr-line.patched')),
          round: document.querySelector('.hearing-ui .hr-round')?.textContent ?? null,
          focus: focus?.dataset.focus ? Number(focus.dataset.focus) : null,
        },
      } as never;
    });
  }

  // ───────────────────────── keys ─────────────────────────
  private async key(code: string, on: boolean) {
    if (on === this.held.has(code)) return;
    if (on) {
      this.held.add(code);
      await this.page.keyboard.down(code);
    } else {
      this.held.delete(code);
      await this.page.keyboard.up(code);
    }
  }

  async releaseAll() {
    for (const k of [...this.held]) await this.key(k, false);
  }

  async press(code: string) {
    await this.page.keyboard.press(code);
  }

  // ───────────────────────── text / cut-ins ─────────────────────────
  /** Advance dialogue, cut-ins and title cards until `done(probe)` holds. */
  async drain(done: (p: Probe) => boolean, timeoutMs = 90_000, onTick?: (p: Probe) => Promise<void>) {
    const t0 = Date.now();
    for (;;) {
      const p = await this.probe();
      if (done(p)) return p;
      if (onTick) await onTick(p);
      if (Date.now() - t0 > timeoutMs) throw new Error(`drain timeout in ${p.state}/${p.mode} (dialogue: ${p.dialogue.text})`);
      if (p.overlay || (p.dialogue.open && p.dialogue.ready)) await this.press('Space');
      await this.page.waitForTimeout(70);
    }
  }

  /** Wait until the player has free control in an explore state. */
  async untilExplore(timeoutMs = 90_000) {
    return this.drain((p) => p.mode === 'explore' && !p.overlay && !p.dialogue.open, timeoutMs);
  }

  // ───────────────────────── navigation ─────────────────────────
  private free(nav: NonNullable<View['nav']>, x: number, z: number, margin: number) {
    const b = nav.bounds;
    const edge = PLAYER_R + 0.15 + 0.02;
    if (x < b.minX + edge || x > b.maxX - edge || z < b.minZ + edge || z > b.maxZ - edge) return false;
    for (const c of nav.colliders) {
      const cx = Math.max(c.minX, Math.min(x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      if (Math.hypot(x - cx, z - cz) < PLAYER_R + margin) return false;
    }
    for (const c of nav.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + PLAYER_R + margin) return false;
    return true;
  }

  private lineFree(nav: NonNullable<View['nav']>, ax: number, az: number, bx: number, bz: number) {
    const d = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(d / 0.06));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (!this.free(nav, ax + (bx - ax) * t, az + (bz - az) * t, 0.05)) return false;
    }
    return true;
  }

  /** Grid Dijkstra from the player to any free cell within `reach` of (gx, gz). */
  plan(v: View, gx: number, gz: number, reach: number): { x: number; z: number }[] | null {
    const nav = v.nav!;
    const b = nav.bounds;
    const nx = Math.ceil((b.maxX - b.minX) / CELL);
    const nz = Math.ceil((b.maxZ - b.minZ) / CELL);
    const cx = (i: number) => b.minX + (i + 0.5) * CELL;
    const cz = (j: number) => b.minZ + (j + 0.5) * CELL;
    const ok = new Uint8Array(nx * nz);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) ok[j * nx + i] = this.free(nav, cx(i), cz(j), 0.1) ? 1 : 0;
    // start: nearest free cell to the player
    let start = -1;
    let bestD = Infinity;
    for (let k = 0; k < ok.length; k++) {
      if (!ok[k]) continue;
      const d = Math.hypot(cx(k % nx) - v.player.x, cz(Math.floor(k / nx)) - v.player.z);
      if (d < bestD) {
        bestD = d;
        start = k;
      }
    }
    if (start < 0) return null;
    const dist = new Float64Array(nx * nz).fill(Infinity);
    const prev = new Int32Array(nx * nz).fill(-1);
    const done = new Uint8Array(nx * nz);
    dist[start] = 0;
    const open: number[] = [start];
    const isGoal = (k: number) => Math.hypot(cx(k % nx) - gx, cz(Math.floor(k / nx)) - gz) <= reach;
    let goal = -1;
    while (open.length) {
      let bi = 0;
      for (let q = 1; q < open.length; q++) if (dist[open[q]] < dist[open[bi]]) bi = q;
      const k = open.splice(bi, 1)[0];
      if (done[k]) continue;
      done[k] = 1;
      if (isGoal(k)) {
        goal = k;
        break;
      }
      const i = k % nx;
      const j = Math.floor(k / nx);
      for (let di = -1; di <= 1; di++)
        for (let dj = -1; dj <= 1; dj++) {
          if (!di && !dj) continue;
          const ni = i + di;
          const nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
          const nk = nj * nx + ni;
          if (!ok[nk] || done[nk]) continue;
          if (di && dj && (!ok[j * nx + ni] || !ok[nj * nx + i])) continue;
          const nd = dist[k] + (di && dj ? Math.SQRT2 : 1);
          if (nd < dist[nk]) {
            dist[nk] = nd;
            prev[nk] = k;
            open.push(nk);
          }
        }
    }
    if (goal < 0) return null;
    const cells: { x: number; z: number }[] = [];
    for (let k = goal; k >= 0; k = prev[k]) cells.unshift({ x: cx(k % nx), z: cz(Math.floor(k / nx)) });
    // string-pull
    const out: { x: number; z: number }[] = [];
    let from = { x: v.player.x, z: v.player.z };
    let idx = 0;
    while (idx < cells.length) {
      let far = idx;
      for (let q = cells.length - 1; q > idx; q--) {
        if (this.lineFree(nav, from.x, from.z, cells[q].x, cells[q].z)) {
          far = q;
          break;
        }
      }
      out.push(cells[far]);
      from = cells[far];
      idx = far + 1;
    }
    return out;
  }

  private static wrap(a: number) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  private static heading(fromX: number, fromZ: number, toX: number, toZ: number) {
    return Math.atan2(-(toX - fromX), -(toZ - fromZ));
  }

  /** Follow waypoints with W + arrow-key steering. Returns false if interrupted or stuck. */
  private async follow(points: { x: number; z: number }[]) {
    for (let n = 0; n < points.length; n++) {
      const p = points[n];
      const last = n === points.length - 1;
      let best = Infinity;
      let lastGain = Date.now();
      for (;;) {
        const v = await this.view();
        if (v.mode !== 'explore') {
          await this.releaseAll();
          return false;
        }
        const d = Math.hypot(p.x - v.player.x, p.z - v.player.z);
        if (d < (last ? 0.18 : 0.3)) break;
        const err = Bot.wrap(Bot.heading(v.player.x, v.player.z, p.x, p.z) - v.player.yaw);
        const walk = Math.abs(err) < 0.35 || (d > 2 && Math.abs(err) < 0.6);
        await this.key('ArrowLeft', err > 0.09);
        await this.key('ArrowRight', err < -0.09);
        await this.key('KeyW', walk);
        if (d < best - 0.04) {
          best = d;
          lastGain = Date.now();
        } else if (Date.now() - lastGain > 1800) {
          await this.releaseAll();
          return false;
        }
        await this.page.waitForTimeout(25);
      }
    }
    await this.releaseAll();
    return true;
  }

  async face(x: number, z: number) {
    for (let i = 0; i < 60; i++) {
      const v = await this.view();
      const err = Bot.wrap(Bot.heading(v.player.x, v.player.z, x, z) - v.player.yaw);
      if (Math.abs(err) < 0.1) break;
      const code = err > 0 ? 'ArrowLeft' : 'ArrowRight';
      await this.page.keyboard.down(code);
      await this.page.waitForTimeout(Math.max(16, Math.min(320, (Math.abs(err) / 2.1) * 1000 * 0.7)));
      await this.page.keyboard.up(code);
      await this.page.waitForTimeout(40);
    }
  }

  /** Walk up to interactable `id` in the current room and make it the target. */
  async approach(id: string) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const v = await this.view();
      if (v.mode !== 'explore') throw new Error(`approach(${id}) outside explore: ${v.mode}`);
      const it = v.interactables.find((i) => i.id === id);
      if (!it) throw new Error(`interactable ${id} not in room ${v.room} (${v.state})`);
      const reach = Math.max(0.9, it.range - 0.35 - attempt * 0.3);
      const d = Math.hypot(it.x - v.player.x, it.z - v.player.z);
      if (d > reach) {
        const path = this.plan(v, it.x, it.z, reach);
        if (!path) throw new Error(`no path to ${id} in ${v.room}`);
        const ok = await this.follow(path);
        if (!ok) {
          // back off a little and replan
          await this.key('KeyS', true);
          await this.page.waitForTimeout(250);
          await this.releaseAll();
          continue;
        }
      }
      await this.face(it.x, it.z);
      const after = await this.view();
      if (after.target === id) return;
    }
    const v = await this.view();
    throw new Error(`could not target ${id} (target=${v.target}) in ${v.room}`);
  }

  /** Approach and press E; resolves once the resulting dialogue/transition is fully drained. */
  async use(id: string, done?: (p: Probe) => boolean) {
    await this.approach(id);
    const before = await this.view();
    await this.press('KeyE');
    this.log.push(`${before.state}@${before.room}: ${id}`);
    await this.page.waitForTimeout(120);
    await this.drain(done ?? ((p) => (p.mode === 'explore' || p.mode === 'trial' || p.mode === 'credits') && !p.overlay && !p.dialogue.open));
  }

  /** Walk room to room through open doors. */
  async goTo(room: RoomId) {
    for (let hop = 0; hop < 8; hop++) {
      const v = await this.untilExplore();
      if (v.room === room) return;
      const route = routeTo(v.state, v.room!, room);
      if (!route) throw new Error(`no route ${v.room} → ${room} in ${v.state}`);
      const door = route[0];
      await this.use(`door:${door}`, (p) => p.mode === 'explore' && p.room !== v.room && !p.overlay && !p.dialogue.open);
    }
    throw new Error(`goTo(${room}) did not arrive`);
  }

  async talk(room: RoomId, char: string) {
    await this.goTo(room);
    await this.use(`npc:${char}`);
  }

  async examine(room: RoomId, hotspot: string) {
    await this.goTo(room);
    await this.use(`hs:${hotspot}`);
  }

  async door(room: RoomId, doorId: string) {
    await this.goTo(room);
    await this.use(`door:${doorId}`);
  }

  // ───────────────────────── hearing ─────────────────────────
  findRound(title: string | null): TrialRound {
    const r = TRIAL.flatMap((s) => s.rounds).find((x) => x.title === title);
    if (!r) throw new Error(`unknown hearing round "${title}"`);
    return r;
  }

  async solveDebate(r: DebateRound, owned: string[]) {
    const ev = r.answer.evidence.find((e) => owned.includes(e));
    if (!ev) throw new Error(`${r.id}: no answer evidence held`);
    await this.page.click(`.hr-dot[data-statement="${r.answer.statement}"]`);
    await this.page.click(`.hr-card[data-evidence="${ev}"]`);
    await this.page.click('[data-action="apply"]');
  }

  /** A deliberately wrong CUT/PATCH (marked statement + unrelated evidence). */
  async wrongDebate(r: DebateRound, owned: string[]) {
    const st = r.statements.find((s) => s.mark && s.id !== r.answer.statement)!;
    const partial = new Set((r.partial ?? []).filter((p) => p.statement === st.id).map((p) => p.evidence));
    const ev = owned.find((e) => !r.answer.evidence.includes(e) && !partial.has(e))!;
    await this.page.click(`.hr-dot[data-statement="${st.id}"]`);
    await this.page.click(`.hr-card[data-evidence="${ev}"]`);
    await this.page.click('[data-action="apply"]');
  }

  async solveTune(r: TuneRound) {
    await this.page.click(`.tn-opt[data-option="${r.answer}"]`);
    await this.page.click('[data-action="tune"]');
  }

  async solveReel(r: ReelRound) {
    for (let i = 0; i < r.answerOrder.length; i++) {
      const order = await this.page.$$eval('.rl-seg', (els) => els.map((e) => (e as HTMLElement).dataset.panel!));
      if (order[i] === r.answerOrder[i]) continue;
      const j = order.indexOf(r.answerOrder[i]);
      await this.page.click(`.rl-seg[data-slot="${i}"]`);
      await this.page.click(`.rl-seg[data-slot="${j}"]`);
    }
    await this.page.click('[data-action="splice"]');
  }
}

/** Door sequence from `from` to `to` using doors that are open in `state`. */
export function routeTo(state: StoryStateId, from: RoomId, to: RoomId): string[] | null {
  const def = STORY[state];
  const prev = new Map<RoomId, { room: RoomId; door: string }>();
  const q: RoomId[] = [from];
  const seen = new Set<RoomId>([from]);
  while (q.length) {
    const r = q.shift()!;
    if (r === to) break;
    for (const d of ROOMS[r].doors) {
      if (!d.to || d.locked?.[state] || d.script?.[state] || !def.rooms.includes(d.to) || seen.has(d.to)) continue;
      seen.add(d.to);
      prev.set(d.to, { room: r, door: d.id });
      q.push(d.to);
    }
  }
  if (!seen.has(to)) return null;
  const doors: string[] = [];
  for (let r = to; r !== from; ) {
    const p = prev.get(r)!;
    doors.unshift(p.door);
    r = p.room;
  }
  return doors;
}
