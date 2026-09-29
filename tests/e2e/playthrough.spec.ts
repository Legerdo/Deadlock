// Full playthrough: New Game → Credits using real keyboard/mouse input only.
// Captures the review screenshots into artifacts/screenshots/ and fails on any
// page error, console error, failed request, HTTP ≥ 400 or WebGL warning.
import { test, expect } from '@playwright/test';
import { Bot } from './bot';
import { SHOTS, playHearing, quietSettings, sweep, watch } from './flows';
import type { RoomId } from '../../src/data/types';

test('full playthrough from title to credits', async ({ page }) => {
  const problems = watch(page);
  const layout: string[] = [];
  const bot = new Bot(page);
  await quietSettings(page);

  // ── title
  await page.goto('/');
  await page.waitForSelector('.title-screen.on');
  await expect(page.locator('[data-action="continue"]')).toBeDisabled();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/01-title.png` });
  await sweep(page, 'title', layout);

  // ── prologue → arrival
  await page.click('[data-action="new"]');
  let p = await bot.untilExplore();
  expect(p.state).toBe('ARRIVAL');
  expect(p.room).toBe('atrium');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/02-exploration.png` });
  await sweep(page, 'explore', layout);
  const perf = await bot.view();
  console.log(`perf atrium: fps=${perf.fps.toFixed(1)} draw=${perf.drawCalls} tris=${perf.triangles}`);

  // NPC interaction prompt, then the VN dialogue
  await bot.approach('npc:lumi');
  await page.waitForTimeout(300);
  await expect(page.locator('.hud-prompt')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/03-npc-interaction.png` });
  await bot.press('KeyE');
  await page.waitForSelector('.vn.on .vn-portrait.show');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/04-dialogue.png` });
  await sweep(page, 'dialogue', layout);
  await bot.untilExplore();

  await bot.talk('canteen', 'oskar');
  await bot.talk('studio_b', 'theo');
  await bot.talk('studio_b', 'wren');
  await bot.talk('archive', 'helena');
  await bot.talk('workshop', 'bas');
  p = await bot.untilExplore();
  expect(p.state).toBe('DINNER');

  // ── save / continue round-trip
  const roomBefore = p.room;
  await page.reload();
  await page.waitForSelector('.title-screen.on');
  await expect(page.locator('[data-action="continue"]')).toBeEnabled();
  await page.click('[data-action="continue"]');
  p = await bot.untilExplore();
  expect(p.state).toBe('DINNER');
  expect(p.room).toBe(roomBefore);
  expect(p.flags).toEqual(expect.arrayContaining(['met_theo', 'met_wren']));

  // ── dinner → evening → night → incident
  await bot.talk('canteen', 'oskar');
  p = await bot.untilExplore();
  expect(p.state).toBe('EVENING');
  await bot.talk('canteen', 'lumi');
  await bot.examine('workshop', 'hs_station_evening');
  await bot.door('guest_wing', 'g_kai');
  p = await bot.untilExplore(120_000);
  expect(p.state).toBe('INCIDENT');

  await bot.talk('atrium', 'helena');
  p = await bot.untilExplore();
  expect(p.flags).toContain('gathered');
  await bot.door('archive', 'r_vault');
  p = await bot.untilExplore();
  expect(p.state).toBe('INVESTIGATION');

  // ── investigation
  const steps: [RoomId, string][] = [
    ['archive', 'hs:hs_vault_panel'],
    ['archive', 'hs:hs_keypad'],
    ['vault', 'crime-scene'],
    ['vault', 'hs:hs_body'],
    ['vault', 'hs:hs_pocket'],
    ['vault', 'hs:hs_inner_release'],
    ['vault', 'hs:hs_siren_box'],
    ['vault', 'hs:hs_d_shelf'],
    ['archive', 'hs:hs_office_desk'],
    ['archive', 'hs:hs_office_floor'],
    ['archive', 'npc:helena'],
    ['archive', 'board'],
    ['guest_wing', 'npc:wren'],
    ['atrium', 'npc:lumi'],
    ['studio_b', 'hs:hs_reel_machine'],
    ['studio_b', 'hs:hs_door_reader'],
    ['canteen', 'hs:hs_kettle'],
    ['canteen', 'npc:oskar'],
    ['workshop', 'npc:bas'],
    ['workshop', 'hs:hs_generator'],
    ['workshop', 'hs:hs_fire_panel'],
    ['workshop', 'hs:hs_release_station'],
    ['workshop', 'hs:hs_paint_tag'],
  ];
  for (const [room, what] of steps) {
    const v = await bot.untilExplore();
    if (v.state !== 'INVESTIGATION') break;
    await bot.goTo(room);
    if (what === 'crime-scene') {
      // step in from the vault door and tilt slightly toward the body
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(650);
      await page.keyboard.up('KeyW');
      await page.keyboard.down('ArrowDown');
      await page.waitForTimeout(140);
      await page.keyboard.up('ArrowDown');
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SHOTS}/05-crime-scene.png` });
      continue;
    }
    if (what === 'board') {
      await bot.press('Tab');
      await page.waitForSelector('.board.on');
      await page.locator('.board .ev-card[data-evidence="theo_headphones"]').click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHOTS}/06-evidence-board.png` });
      await sweep(page, 'board', layout);
      await bot.press('Tab');
      await expect(page.locator('.board.on')).toHaveCount(0);
      continue;
    }
    await bot.use(what);
  }
  p = await bot.untilExplore();
  expect(p.state, `still investigating; have ${p.evidence.join(',')}`).toBe('PRE_HEARING');

  // ── hearing, reconstruction, verdict
  await bot.door('atrium', 'a_round');
  const h = await playHearing(page, bot, layout);
  expect([...h.kinds].sort()).toEqual(['cut', 'patch', 'reel', 'tune']);
  expect(h.focusAfterWrong).toBe(4);
  expect([...h.shots]).toEqual(expect.arrayContaining(['07-debate-wide', '08-debate-puzzle', '09-major-reveal']));

  // ── epilogue → credits
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/10a-epilogue.png` });
  await bot.talk('atrium', 'wren');
  await bot.door('atrium', 'a_exit');
  await page.waitForSelector('.credits.on');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOTS}/10-ending.png` });
  expect((await bot.view()).state).toBe('CREDITS');
  expect(await page.evaluate(() => localStorage.getItem('aftersignal.save.v1'))).toBeNull();
  await page.click('[data-action="to-title"]');
  await page.waitForSelector('.title-screen.on');
  await expect(page.locator('[data-action="continue"]')).toBeDisabled();

  console.log(`${bot.log.length} interactions`);
  expect(layout, layout.join('\n')).toEqual([]);
  expect(problems, problems.join('\n')).toEqual([]);
});
