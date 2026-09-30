import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const server = await createServer({
  server: { host: '127.0.0.1', port: 1430, strictPort: true },
  logLevel: 'error',
});
await server.listen();
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1200, height: 860 } }),
    page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const cdp = await context.newCDPSession(page);
  await mkdir('docs/screenshots', { recursive: true });
  await page.goto('http://127.0.0.1:1430');
  // Progress fixture unlocks the review missions, never substitutes for playing
  // the encounters. Core tests cover every prerequisite mission and escape.
  await page.evaluate(async () => {
    const s = window.__keystrike.store;
    await s.change((d) => {
      d.settings.lang = 'en';
      d.settings.layout = 'us';
      d.settings.textLang = 'en';
      d.progress['defense:keyboard:us:two-buttons'] = {
        unlocked: 12,
        stars: {},
        completed: Array.from({ length: 12 }, (_, i) => i + 1),
        commanders: [],
      };
    });
  });
  await page.reload();
  let wordShot = false,
    sentenceShot = false,
    introShot = false;
  const inputCounts = { middle: 0, fourth: 0, text: 0 },
    started = Date.now();
  async function pointer(button, x, y) {
    if (button === 3) {
      // Full Edge browser owns a history stack outside the game. Native
      // WebView2 blocks navigation; exercise that host guard in native smoke.
      await cdp.send('Page.resetNavigationHistory');
      for (const type of ['mousePressed', 'mouseReleased'])
        await cdp.send('Input.dispatchMouseEvent', {
          type,
          x,
          y,
          button: 'back',
          buttons: type === 'mousePressed' ? 8 : 0,
          clickCount: 1,
        });
      inputCounts.fourth++;
    } else {
      await page.mouse.click(x, y, {
        button: button === 1 ? 'middle' : button === 2 ? 'right' : 'left',
      });
      if (button === 1) inputCounts.middle++;
    }
  }
  async function drive(label, limit = 150000) {
    console.log(`Playing ${label}`);
    const began = Date.now();
    while (Date.now() - began < limit) {
      const state = await page.evaluate(() => {
        const k = window.__keystrike;
        return {
          screen: k.screen,
          time: k.game?.time,
          phase: k.game?.phase,
          targets: k.game?.targets.map((t) => ({
            x: t.x,
            y: t.y,
            kind: t.kind,
            ready: t.ready,
            p: t.steps[t.pip],
            buffer: t.textBuffer,
          })),
        };
      });
      if (state.screen === 'outro') {
        await page.screenshot({ path: `docs/screenshots/${label}-outro.png` });
        await page.locator('[data-action=outroContinue]').first().click();
        continue;
      }
      if (state.screen === 'results') return;
      if (await page.locator('[data-action=resume]').isVisible()) {
        await page.locator('[data-action=resume]').click();
        await page.waitForTimeout(3100);
        continue;
      }
      if (state.phase === 'entrance' && !introShot) {
        await page.screenshot({ path: 'docs/screenshots/introduction.png' });
        introShot = true;
      }
      for (const target of state.targets ?? []) {
        if (state.time < target.ready) continue;
        const p = target.p;
        if (p.kind === 'text') {
          await page.waitForFunction(
            () =>
              document.activeElement?.id === 'typing' &&
              !document.querySelector('#typing').disabled,
          );
          if (!wordShot) {
            await page.screenshot({ path: 'docs/screenshots/return-words.png' });
            wordShot = true;
          }
          if (p.text.includes(' ') && !sentenceShot) {
            await page.screenshot({ path: 'docs/screenshots/return-sentence.png' });
            sentenceShot = true;
          }
          // Commit characters as actual text events; do not fill/paste a word.
          for (const char of p.text.slice(target.buffer.length)) {
            await page.keyboard.insertText(char);
            inputCounts.text++;
          }
        } else if (p.kind === 'key') await page.keyboard.press(p.key === 'Space' ? 'Space' : p.key);
        else if (p.kind === 'pair') {
          await page.keyboard.press('ShiftLeft');
          await page.keyboard.press(p.key === 'Space' ? 'Space' : p.key);
        } else {
          const r = await page.locator('#playfield').boundingBox();
          await pointer(
            p.button,
            r.x + (target.x / 1080) * r.width,
            r.y + (target.y / 620) * r.height,
          );
        }
      }
      await page.waitForTimeout(70);
    }
    throw Error(`Timed out: ${label}`);
  }
  if (!process.env.KEYSTRIKE_SMOKE_EXTENDED_ONLY) {
    await page.locator('[data-action=setup]').click();
    await page.locator('[data-level="12"]').click();
    await page.locator('[data-action=briefing]').click();
    while (await page.locator('[data-action=rehearsalNext]').count())
      await page.locator('[data-action=rehearsalNext]').click();
    await page.locator('[data-action=launch]').click();
    await drive('defense');
    assert(await page.evaluate(() => window.__keystrike.game.bossKilled));
    assert(
      await page.evaluate(() =>
        window.__keystrike.store.data.progress[
          'defense:keyboard:us:two-buttons'
        ].commanders.includes(12),
      ),
    );
    const defenseBoard = await page.evaluate(() => window.__keystrike.game.board);
    await page.locator('#replayRules').selectOption('relaxed');
    assert.equal(await page.evaluate(() => window.__keystrike.game.board), defenseBoard);
    await page.locator('[data-action=skip]').click();
    await page.locator('[data-action=home]').click();
    await page.locator('[data-action=setup]').click();
    await page.locator('#campaign').selectOption('return');
    await page.locator('[data-action=briefing]').click();
    while (await page.locator('[data-action=rehearsalNext]').count())
      await page.locator('[data-action=rehearsalNext]').click();
    await page.locator('[data-action=launch]').click();
    await drive('return-first');
    assert.equal(await page.evaluate(() => window.__keystrike.game.stars), 3);
    assert(await page.evaluate(() => window.__keystrike.store.data.earned.includes('return-1')));
    // Inspect final sentence without requiring a full 12-mission UI marathon.
    await page.locator('[data-action=home]').click();
    await page.evaluate(async () => {
      await window.__keystrike.store.change((d) => {
        d.progress['return:keyboard:us:two-buttons'].unlocked = 12;
      });
    });
    await page.locator('[data-action=setup]').click();
    await page.locator('[data-level="12"]').click();
    await page.locator('[data-action=briefing]').click();
    while (await page.locator('[data-action=rehearsalNext]').count())
      await page.locator('[data-action=rehearsalNext]').click();
    await page.locator('[data-action=launch]').click();
    await drive('return');
    assert(sentenceShot && wordShot && introShot);
    assert.equal(await page.evaluate(() => window.__keystrike.game.stars), 3);
    await page.locator('[data-action=save]').click();
    await page.waitForFunction(() => window.__keystrike.store.data.scores.length === 1);
    await page.locator('[data-action=home]').click();
  }
  await page.evaluate(async () => {
    await window.__keystrike.store.change((d) => {
      d.settings.track = 'mouse';
      d.settings.campaign = 'defense';
      d.settings.mouseProfile = 'extended';
      d.progress['defense:mouse:us:extended'] = {
        unlocked: 12,
        stars: {},
        completed: [9],
        commanders: [],
      };
    });
  });
  await page.locator('[data-action=setup]').click();
  await page.locator('[data-level="9"]').click();
  await page.locator('[data-action=briefing]').click();
  for (const button of [0, 2, 1, 3]) {
    const r = await page.locator(`[data-button="${button}"]`).boundingBox();
    await pointer(button, r.x + r.width / 2, r.y + r.height / 2);
  }
  assert(await page.locator('[data-action=launch]').isEnabled());
  while (await page.locator('[data-action=rehearsalNext]').count())
    await page.locator('[data-action=rehearsalNext]').click();
  await page.locator('[data-action=launch]').click();
  await page.waitForTimeout(3500);
  await page.setViewportSize({ width: 5120, height: 1440 });
  await page.locator('[data-action=resume]').click();
  await page.waitForTimeout(3100);
  await page.screenshot({ path: 'docs/screenshots/ultrawide-5120.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await drive('extended');
  assert(await page.evaluate(() => window.__keystrike.game.bossKilled));
  assert(inputCounts.middle > 1 && inputCounts.fourth > 1);
  if (!process.env.KEYSTRIKE_SMOKE_EXTENDED_ONLY) assert(inputCounts.text > 20);
  assert.deepEqual(errors, []);
  const result = {
    ok: true,
    elapsedSeconds: Math.round((Date.now() - started) / 1000),
    inputCounts,
    errors,
  };
  await mkdir('release', { recursive: true });
  await writeFile('release/iteration-smoke-results.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
  await server.close();
}
