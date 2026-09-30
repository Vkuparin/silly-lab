import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({
  server: { host: '127.0.0.1', port: 1430, strictPort: true },
  logLevel: 'error',
});
await server.listen();
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 860 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('docs/screenshots', { recursive: true });
await page.goto('http://127.0.0.1:1430');
await page.locator('[data-action="language"]').click();
await page.screenshot({ path: 'docs/screenshots/home.png', fullPage: true });
await page.locator('[data-action="setup"]').click();
await page.locator('[data-action="briefing"]').click();
await page.keyboard.press('f');
await page.keyboard.press('j');
await page.screenshot({ path: 'docs/screenshots/rehearsal.png', fullPage: true });
// Launch using keyboard activation, including release gating.
await page.locator('[data-action="launch"]').focus();
await page.keyboard.press('Enter');
await page.waitForSelector('#playfield');
let shot = false,
  boss = false,
  pauses = 0;
const started = Date.now();
while (Date.now() - started < 100000) {
  const state = await page.evaluate(() => {
    const k = window.__keystrike;
    return {
      screen: k.screen,
      phase: k.game?.phase,
      time: k.game?.time,
      targets: k.game?.targets.map((t) => ({
        x: t.x,
        y: t.y,
        ready: t.ready,
        p: t.steps[t.pip],
        kind: t.kind,
      })),
    };
  });
  if (state.screen === 'results') break;
  if (await page.locator('[data-action="resume"]').isVisible()) {
    pauses++;
    await page.locator('[data-action="resume"]').click();
    await page.waitForTimeout(3100);
    continue;
  }
  if (!shot && state.targets?.length) {
    await page.screenshot({ path: 'docs/screenshots/combat.png' });
    shot = true;
  }
  if (!boss && state.phase === 'boss') {
    await page.screenshot({ path: 'docs/screenshots/boss.png' });
    boss = true;
  }
  for (const target of state.targets ?? []) {
    if (state.time < target.ready) continue;
    const p = target.p;
    if (p.kind === 'key')
      await page.keyboard.press(
        p.key === 'Space' ? 'Space' : p.key === 'ShiftLeft' ? 'ShiftLeft' : p.key,
      );
    else if (p.kind === 'pair') {
      await page.keyboard.press('ShiftLeft');
      await page.keyboard.press(p.key === 'Space' ? 'Space' : p.key);
    } else {
      const r = await page.locator('#playfield').boundingBox();
      await page.mouse.click(r.x + (target.x / 1080) * r.width, r.y + (target.y / 620) * r.height, {
        button: p.button === 2 ? 'right' : 'left',
      });
    }
  }
  await page.waitForTimeout(80);
}
await page.waitForSelector('[data-action="save"]');
assert(boss, 'boss encounter seen');
assert(shot, 'combat seen');
assert.equal(await page.evaluate(() => window.__keystrike.game.stars), 3);
await page.locator('#nickname').fill('Test Ääni');
await page.locator('[data-action="save"]').click();
await page.waitForFunction(() => window.__keystrike.store.data.scores.length === 1);
await page.screenshot({ path: 'docs/screenshots/results.png', fullPage: true });
await page.locator('[data-action="hangar"]').click();
await page.locator('[data-shop="color:1"]').click();
await page.locator('[data-shop="color:1"]').click();
assert.equal(await page.evaluate(() => window.__keystrike.store.data.equipped.color), 1);
await page.screenshot({ path: 'docs/screenshots/hangar.png', fullPage: true });
await page.reload();
assert.equal(await page.evaluate(() => window.__keystrike.store.data.equipped.color), 1);
assert.equal(await page.evaluate(() => window.__keystrike.store.data.scores.length), 1);
await page.setViewportSize({ width: 1024, height: 768 });
await page.locator('[data-action="language"]').click();
await page.screenshot({ path: 'docs/screenshots/finnish-1024.png', fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  false,
);
assert.deepEqual(errors, []);
console.log(
  JSON.stringify({
    ok: true,
    elapsedSeconds: Math.round((Date.now() - started) / 1000),
    pauses,
    screenshots: 7,
    errors,
  }),
);
await browser.close();
await server.close();
