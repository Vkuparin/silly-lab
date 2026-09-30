// Native WebView2 integration test. Debugging is enabled only by this test's
// child environment; no debug port or inspection hook ships in the executable.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, copyFile, readFile, rename, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(`release/native-check-${Date.now()}`);
await mkdir(root, { recursive: true });
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
await copyFile(`release/Keystrike-${version}-windows-x64.exe`, path.join(root, 'Keystrike.exe'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let activeChild;
process.on('exit', () => activeChild?.kill());
async function launch(folder) {
  const child = spawn(path.join(folder, 'Keystrike.exe'), [], {
    windowsHide: true,
    env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9227' },
  });
  activeChild = child;
  let browser;
  for (let i = 0; i < 100; i++) {
    try {
      browser = await chromium.connectOverCDP('http://127.0.0.1:9227');
      break;
    } catch {
      await sleep(100);
    }
  }
  assert(browser, 'native WebView2 endpoint');
  let page;
  for (let i = 0; i < 50; i++) {
    page = browser
      .contexts()
      .flatMap((c) => c.pages())
      .find((p) => p.url().includes('tauri.localhost'));
    if (page) break;
    await sleep(100);
  }
  assert(page, 'packaged local content loaded');
  await page.waitForSelector('[data-action="setup"]');
  return { child, browser, page };
}
let run = await launch(root);
const page = run.page;
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
assert.equal(
  await page.evaluate(() => typeof window.__keystrike),
  'undefined',
  'no dev inspection in release',
);
assert.equal(await page.locator('[data-action="language"]').innerText(), 'ENGLISH');
await page.locator('[data-action="language"]').click();
await page.locator('[data-action="settings"]').click();
assert((await page.locator('.data-path').innerText()).startsWith(root));
await page.locator('[data-action="home"]').click();
await page.locator('[data-action="setup"]').click();
await page.locator('[data-action="briefing"]').click();
await page.locator('[data-action="launch"]').click();
const start = Date.now();
let pauses = 0;
while (Date.now() - start < 70000) {
  if (await page.locator('[data-action="save"]').isVisible()) break;
  if (await page.locator('[data-action="resume"]').isVisible()) {
    pauses++;
    await page.locator('[data-action="resume"]').click();
    await sleep(3100);
    continue;
  }
  const keys = await page.locator('#guide kbd.active').allTextContents();
  if (keys.length && ['F', 'J'].includes(keys[0])) await page.keyboard.press(keys[0].toLowerCase());
  await sleep(85);
}
await page.waitForSelector('[data-action="save"]');
await page.locator('#nickname').fill('Native Ääni');
await page.locator('[data-action="save"]').click();
await page.waitForFunction(() =>
  document.querySelector('#score-status')?.textContent.includes('Score saved'),
);
await page.locator('[data-action="hangar"]').click();
await page.locator('[data-shop="color:1"]').click();
await page.locator('[data-shop="color:1"]').click();
await page.waitForFunction(() =>
  document.querySelector('[data-shop="color:1"]')?.textContent.includes('Equipped'),
);
const data = JSON.parse(await readFile(path.join(root, 'data/save.json'), 'utf8'));
assert.equal(data.equipped.color, 1);
assert.equal(data.scores.length, 1);
assert.equal(data.scores[0].name, 'Native Ääni');
assert.equal(data.settings.lang, 'en');
assert(data.balance >= 30);
assert.equal(data.active, null);
assert.equal(Object.values(data.progress)[0].unlocked, 2);
assert.deepEqual(errors, []);
await run.browser.close();
run.child.kill();
await sleep(3000);
run = await launch(root);
assert.equal(await run.page.locator('[data-action="language"]').innerText(), 'SUOMI');
await run.page.locator('[data-action="hangar"]').click();
assert((await run.page.locator('[data-shop="color:1"]').innerText()).includes('Equipped'));
await run.browser.close();
run.child.kill();
await sleep(3000);
const moved = root + '-moved';
await rename(root, moved);
run = await launch(moved);
await run.page.locator('[data-action="settings"]').click();
assert((await run.page.locator('.data-path').innerText()).startsWith(moved));
await run.browser.close();
run.child.kill();
assert((await readdir(path.join(moved, 'data'))).includes('webview'));
await sleep(3000);
await writeFile(path.join(moved, 'data/save.json'), '{broken');
run = await launch(moved);
assert((await run.page.locator('.notice').innerText()).includes('Recovered'));
await run.page.locator('[data-action="language"]').click();
await run.page.waitForFunction(
  () => document.querySelector('[data-action="language"]')?.textContent === 'ENGLISH',
);
const recovered = JSON.parse(await readFile(path.join(moved, 'data/save.json'), 'utf8'));
assert.equal(recovered.balance, data.balance);
assert.equal(recovered.owned.color, 1);
assert.equal(recovered.scores.length, 1);
assert((await readdir(path.join(moved, 'data'))).some((n) => n.startsWith('save.corrupt-')));
await run.browser.close();
run.child.kill();
console.log(
  JSON.stringify({
    ok: true,
    pauses,
    elapsedSeconds: Math.round((Date.now() - start) / 1000),
    location: moved,
    score: data.scores[0].score,
    balance: data.balance,
  }),
);
