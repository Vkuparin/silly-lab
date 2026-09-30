import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, copyFile, readFile, writeFile, rmdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fresh } from '../src/storage.ts';
const root = path.resolve(`release/native-iteration-${Date.now()}`);
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let child, browser;
process.on('exit', () => child?.kill());
async function launch(folder, data) {
  await mkdir(path.join(folder, 'data'), { recursive: true });
  await copyFile(
    `release/Keystrike-${version}-windows-x64.exe`,
    path.join(folder, 'Keystrike.exe'),
  );
  await writeFile(path.join(folder, 'data/save.json'), JSON.stringify(data));
  child = spawn(path.join(folder, 'Keystrike.exe'), [], {
    windowsHide: true,
    env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9227' },
  });
  for (let i = 0; i < 100; i++) {
    try {
      browser = await chromium.connectOverCDP('http://127.0.0.1:9227');
      break;
    } catch {
      await sleep(100);
    }
  }
  assert(browser, 'native endpoint');
  let page;
  for (let i = 0; i < 50; i++) {
    page = browser
      .contexts()
      .flatMap((c) => c.pages())
      .find((p) => p.url().includes('tauri.localhost'));
    if (page) break;
    await sleep(100);
  }
  assert(page);
  await page.waitForSelector('[data-action=setup]');
  assert.equal(await page.evaluate(() => typeof window.__keystrike), 'undefined');
  return page;
}
try {
  const d = fresh();
  Object.assign(d.settings, {
    lang: 'en',
    layout: 'us',
    textLang: 'en',
    track: 'mouse',
    mouseProfile: 'extended',
  });
  d.progress['defense:mouse:us:extended'] = {
    unlocked: 12,
    stars: {},
    completed: [9],
    commanders: [],
  };
  let page = await launch(path.join(root, 'buttons'), d);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.locator('[data-action=setup]').click();
  await page.locator('[data-level="9"]').click();
  await page.locator('[data-action=briefing]').click();
  const cdp = await page.context().newCDPSession(page);
  for (const button of [0, 2, 1, 3]) {
    const r = await page.locator(`[data-button="${button}"]`).boundingBox(),
      x = r.x + r.width / 2,
      y = r.y + r.height / 2;
    if (button === 3)
      for (const type of ['mousePressed', 'mouseReleased'])
        await cdp.send('Input.dispatchMouseEvent', {
          type,
          x,
          y,
          button: 'back',
          buttons: type === 'mousePressed' ? 8 : 0,
          clickCount: 1,
        });
    else
      await page.mouse.click(x, y, {
        button: button === 1 ? 'middle' : button === 2 ? 'right' : 'left',
      });
    await sleep(100);
    assert(
      await page.locator(`[data-button="${button}"].checked`).count(),
      `native button ${button} delivered without navigation`,
    );
  }
  assert(await page.locator('[data-action=launch]').isEnabled());
  // A browser history action must not replace the native game's document.
  const url = page.url();
  await cdp.send('Page.navigate', { url: url + '?must-be-blocked' });
  await sleep(200);
  assert.equal(page.url(), url);
  assert(await page.locator('[data-action=launch]').count());
  await browser.close();
  browser = null;
  child.kill();
  await sleep(2000);

  const word = fresh();
  Object.assign(word.settings, {
    lang: 'fi',
    track: 'keyboard',
    campaign: 'return',
    layout: 'fi',
    textLang: 'fi',
  });
  word.progress['defense:keyboard:fi:two-buttons'] = {
    unlocked: 12,
    stars: {},
    completed: [12],
    commanders: [12],
  };
  word.progress['return:keyboard:fi:two-buttons'] = {
    unlocked: 12,
    stars: {},
    completed: [12],
    commanders: [],
  };
  const folder = path.join(root, 'words');
  page = await launch(folder, word);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.locator('[data-action=setup]').click();
  await page.locator('[data-level="12"]').click();
  await page.locator('[data-action=briefing]').click();
  while (await page.locator('[data-action=rehearsalNext]').count())
    await page.locator('[data-action=rehearsalNext]').click();
  await page.locator('[data-action=launch]').click();
  const wordCDP = await page.context().newCDPSession(page);
  const began = Date.now();
  let characters = 0,
    sentence = false,
    outro = false;
  const named = {
    '␣': 'Space',
    '↵': 'Enter',
    '←': 'ArrowLeft',
    '→': 'ArrowRight',
    '↑': 'ArrowUp',
    '↓': 'ArrowDown',
    'L ⇧': 'ShiftLeft',
  };
  while (Date.now() - began < 150000) {
    if (await page.locator('[data-action=save]').count()) break;
    if (await page.locator('[data-action=outroContinue]').count()) {
      outro = true;
      await page
        .locator('[data-action=outroContinue]')
        .first()
        .click({ timeout: 1000 })
        .catch(async (error) => {
          if (!(await page.locator('[data-action=save]').count())) throw error;
        });
      continue;
    }
    if (await page.locator('[data-action=resume]').count()) {
      await page.locator('[data-action=resume]').click();
      await sleep(3100);
      continue;
    }
    const typing = await page.evaluate(() => {
      const input = document.querySelector('#typing'),
        section = document.querySelector('#text-encounter');
      return input && section && !section.hidden && !input.disabled
        ? {
            word: document.querySelector('#word-prompt').textContent,
            buffer: document.querySelector('#word-buffer').textContent,
          }
        : null;
    });
    if (typing) {
      sentence ||= typing.word.includes(' ');
      const buffer = typing.buffer === '…' ? '' : typing.buffer;
      for (const char of typing.word.slice(buffer.length)) {
        await page.keyboard.insertText(char);
        characters++;
      }
    } else {
      const keys = await page.locator('#guide kbd.active').allTextContents();
      if (keys[0]) {
        const key = named[keys[0]] ?? keys[0].toLocaleLowerCase('fi');
        if ('äöå'.includes(key)) {
          const code = { ä: 'Quote', ö: 'Semicolon', å: 'BracketLeft' }[key],
            vk = { ä: 222, ö: 186, å: 219 }[key];
          await wordCDP.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key,
            code,
            text: key,
            unmodifiedText: key,
            windowsVirtualKeyCode: vk,
          });
          await wordCDP.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key,
            code,
            windowsVirtualKeyCode: vk,
          });
        } else await page.keyboard.press(key);
      }
    }
    await sleep(75);
  }
  await page.waitForSelector('[data-action=save]');
  assert(sentence && outro && characters > 40, 'native Finnish words and final sentence');
  await page.locator('#nickname').fill('Natiivi ääni');
  await page.locator('[data-action=save]').click();
  await page.waitForFunction(() =>
    document.querySelector('#score-status')?.textContent.includes('tallennettu'),
  );
  const saved = JSON.parse(await readFile(path.join(folder, 'data/save.json'), 'utf8'));
  assert(saved.earned.includes('return-12'));
  assert(saved.progress['return:keyboard:fi:two-buttons'].commanders.includes(12));
  assert(saved.scores[0].boss);
  assert(saved.scores[0].board.includes(':fi:') && saved.scores[0].board.includes(':sentence-'));
  await page.locator('[data-action=home]').click();
  await page.locator('[data-action=settings]').click();
  await page.locator('#resolution').selectOption('fullscreen');
  await sleep(400);
  const fullscreen = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  await page.locator('[data-action=exitFullscreen]').click();
  await sleep(400);
  // Force an actual native write failure, then verify no purchase was granted.
  const beforeFailure = JSON.parse(await readFile(path.join(folder, 'data/save.json'), 'utf8'));
  await mkdir(path.join(folder, 'data/save.next.json'));
  await page.locator('#motion').check();
  await page.waitForSelector('.notice');
  await page.locator('[data-action=home]').click();
  await page.locator('[data-action=hangar]').click();
  await page.locator('[data-shop="color:1"]').click();
  const failed = JSON.parse(await readFile(path.join(folder, 'data/save.json'), 'utf8'));
  assert.equal(failed.balance, beforeFailure.balance);
  assert.equal(failed.owned.color, beforeFailure.owned.color);
  await rmdir(path.join(folder, 'data/save.next.json'));
  await page.locator('[data-action=home]').click();
  await page.locator('[data-action=settings]').click();
  await page.locator('[data-action=retrySettings]').click();
  await page.waitForFunction(() => !document.querySelector('.notice'));
  assert.deepEqual(errors, []);
  const result = {
    ok: true,
    nativeButtons: [0, 1, 2, 3],
    navigationBlocked: true,
    characters,
    sentence,
    earned: saved.earned,
    location: root,
    errors,
    fullscreen,
    nativeWriteFailure: true,
  };
  await writeFile(path.join(root, 'results.json'), JSON.stringify(result, null, 2));
  await browser.close();
  browser = null;
  child.kill();
  await sleep(2000);
  const blocked = path.join(root, 'blocked-startup');
  await mkdir(blocked, { recursive: true });
  await copyFile(
    `release/Keystrike-${version}-windows-x64.exe`,
    path.join(blocked, 'Keystrike.exe'),
  );
  await writeFile(path.join(blocked, 'data'), 'Blocked data destination for startup test');
  child = spawn(path.join(blocked, 'Keystrike.exe'), [], {
    windowsHide: true,
    env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '' },
  });
  let diagnostic = '';
  child.stderr.on('data', (chunk) => {
    diagnostic += chunk.toString();
  });
  await sleep(1000);
  assert((await stat(path.join(blocked, 'data'))).isFile());
  assert(diagnostic.includes('writable executable folder'));
  child.kill();
  result.blockedStartup = true;
  await writeFile(path.join(root, 'results.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser?.close();
  child?.kill();
}
