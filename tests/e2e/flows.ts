// Shared E2E helpers: problem capture, layout checks, resolution sweeps, hearing play.
import { expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import type { Bot, Probe } from './bot';
import type { DebateRound, ReelRound, TuneRound } from '../../src/data/types';

export const SHOTS = 'artifacts/screenshots';
export const SIZES = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
];
export const BASE = { width: 1600, height: 900 };
mkdirSync(SHOTS, { recursive: true });

/** Collect page errors, console errors, failed requests, HTTP ≥ 400 and WebGL warnings. */
export function watch(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') problems.push(`console.error: ${t}`);
    else if (/webgl|GL_INVALID|GL ERROR/i.test(t)) problems.push(`webgl: ${t}`);
  });
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ''}`));
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`);
  });
  return problems;
}

/** Instant text and muted audio — ordinary player settings, set before the first load. */
export async function quietSettings(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('aftersignal.settings.v1')) localStorage.setItem('aftersignal.settings.v1', JSON.stringify({ textSpeed: 0, master: 0 }));
  });
}

/** Visible UI blocks must sit fully inside the viewport and clipped text must not overflow. */
export async function layoutIssues(page: Page) {
  return page.evaluate(() => {
    // text boxes whose content must never be clipped
    const textSel = new Set(['.hud-objective', '.hud-prompt', '.vn-text', '.hr-prompt', '.hr-strip', '.tn-q', '.hr-card', '.rl-seg']);
    const sel = [
      '.hud-top', '.hud-objective', '.hud-prompt', '.hud-help', '.hr-card', '.rl-seg',
      '.vn-box', '.vn-name', '.vn-text',
      '.hr-head', '.hr-focus', '.hr-verb', '.hr-prompt', '.hr-strip', '.hr-controls', '.hr-dots',
      '.tn-q', '.tn-dial', '.tn-bar', '.rl-grid',
      '.board', '.ts-menu', '.ts-brand', '.pause', '.settings',
    ];
    const out: string[] = [];
    const W = window.innerWidth;
    const H = window.innerHeight;
    const shown = (n: Element) => {
      for (let p: Element | null = n; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false;
      }
      return true;
    };
    for (const s of sel) {
      for (const node of document.querySelectorAll<HTMLElement>(s)) {
        if (!shown(node)) continue;
        const r = node.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1)
          out.push(`${s} out of viewport ${W}x${H}: ${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}`);
        if (!textSel.has(s)) continue;
        if (node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2)
          out.push(`${s} text overflow (${node.scrollWidth}x${node.scrollHeight} in ${node.clientWidth}x${node.clientHeight})`);
      }
    }
    return out;
  });
}

/** Screenshot the current view at every target resolution and record layout issues. */
export async function sweep(page: Page, name: string, issues: string[]) {
  for (const s of SIZES) {
    await page.setViewportSize(s);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${SHOTS}/res-${s.width}x${s.height}-${name}.png` });
    for (const i of await layoutIssues(page)) issues.push(`[${name} ${s.width}x${s.height}] ${i}`);
  }
  await page.setViewportSize(BASE);
  await page.waitForTimeout(300);
}

export interface HearingResult {
  kinds: Set<string>;
  focusAfterWrong: number | null;
  shots: Set<string>;
}

/**
 * Play HEARING → RECONSTRUCTION → VERDICT with mouse clicks, starting anywhere
 * before or inside the hearing. Resolves once the epilogue is explorable.
 * One deliberate wrong CUT checks the Focus penalty.
 */
export async function playHearing(page: Page, bot: Bot, layout: string[], shoot = true): Promise<HearingResult> {
  const res: HearingResult = { kinds: new Set(), focusAfterWrong: null, shots: new Set() };
  const shot = async (name: string, delay = 700) => {
    if (res.shots.has(name)) return;
    res.shots.add(name);
    if (!shoot) return;
    await page.waitForTimeout(delay);
    await page.screenshot({ path: `${SHOTS}/${name}.png` });
  };
  const swept = new Set<string>();
  let wrongTried = false;
  const onTick = async (q: Probe) => {
    if (q.mode !== 'trial') return;
    if (q.dialogue.open && q.dialogue.who === 'narr') await shot('07-debate-wide', 900);
    if (q.cutin?.includes('lever')) await shot('09-major-reveal');
    if (res.shots.has('09-major-reveal') && q.dialogue.open && q.dialogue.who === 'wren' && !q.overlay) await shot('09b-confession');
    const h = q.hearing;
    if (!h.on || !h.kind || h.hold || h.done || q.dialogue.open || q.overlay) return;
    const round = bot.findRound(h.round);
    res.kinds.add(round.kind);
    if (shoot && !swept.has(h.kind)) {
      swept.add(h.kind);
      await page.waitForTimeout(500);
      await sweep(page, `hearing-${h.kind}`, layout);
    }
    if (round.kind === 'cut' || round.kind === 'patch') {
      const r = round as DebateRound;
      if (!wrongTried) {
        wrongTried = true;
        const before = q.trial.focus;
        await bot.wrongDebate(r, q.evidence);
        await page.waitForSelector('.hr-stage-area.hold', { state: 'attached', timeout: 10_000 });
        res.focusAfterWrong = Number(await page.locator('.hr-focus').getAttribute('data-focus'));
        expect(res.focusAfterWrong).toBe(before - 1);
        return;
      }
      if (!res.shots.has('08-debate-puzzle')) {
        await page.click(`.hr-dot[data-statement="${r.answer.statement}"]`);
        await page.click(`.hr-card[data-evidence="${r.answer.evidence.find((e) => q.evidence.includes(e))}"]`);
        await shot('08-debate-puzzle', 500);
        await page.click('[data-action="apply"]');
      } else {
        await bot.solveDebate(r, q.evidence);
      }
    } else if (round.kind === 'tune') {
      await bot.solveTune(round as TuneRound);
    } else {
      await bot.solveReel(round as ReelRound);
    }
    await page.waitForFunction(
      () => {
        const a = document.querySelector('.hearing-ui .hr-stage-area');
        return !a || a.classList.contains('hold') || !/(debate|tune|reel)/.test(a.className);
      },
      undefined,
      { timeout: 15_000 },
    );
  };
  await bot.drain((q) => q.state === 'EPILOGUE' && q.mode === 'explore' && !q.dialogue.open && !q.overlay, 20 * 60_000, onTick);
  return res;
}
