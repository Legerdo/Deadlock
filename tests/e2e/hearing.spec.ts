// Resume from a save made right before the hearing and play to the credits.
// The save is written the same way the game writes it (localStorage), then the
// player uses the title screen's Continue button.
import { test, expect } from '@playwright/test';
import { Bot } from './bot';
import { playHearing, quietSettings, watch } from './flows';
import { REQUIRED_EVIDENCE } from '../../src/data/evidence';
import { ROOMS } from '../../src/data/locations';

test('continue a pre-hearing save and finish the case', async ({ page }) => {
  const problems = watch(page);
  const layout: string[] = [];
  const bot = new Bot(page);
  await quietSettings(page);
  const spawn = ROOMS.atrium.spawns.start;
  await page.addInitScript(
    ([evidence, pos, yaw]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(
        'aftersignal.save.v1',
        JSON.stringify({
          version: 1,
          savedAt: Date.now(),
          playSeconds: 1500,
          machine: { state: 'PRE_HEARING', flags: ['entered:PRE_HEARING'], evidence, statements: [], examined: [], talked: [], trial: { stage: 0, round: 0, focus: 5 } },
          room: 'atrium',
          pos,
          yaw,
        }),
      );
    },
    [REQUIRED_EVIDENCE, spawn.pos, spawn.yaw] as const,
  );
  await page.goto('/');
  await page.waitForSelector('.title-screen.on');
  await page.click('[data-action="continue"]');
  const p = await bot.untilExplore();
  expect(p.state).toBe('PRE_HEARING');
  await bot.door('atrium', 'a_round');
  const h = await playHearing(page, bot, layout, !!process.env.HEARING_SHOTS);
  expect([...h.kinds].sort()).toEqual(['cut', 'patch', 'reel', 'tune']);
  expect(h.focusAfterWrong).toBe(4);
  await bot.door('atrium', 'a_exit');
  await page.waitForSelector('.credits.on');
  expect(layout, layout.join('\n')).toEqual([]);
  expect(problems, problems.join('\n')).toEqual([]);
});
