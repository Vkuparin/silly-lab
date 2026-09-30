// Debugging is enabled only in this test child environment, never shipped.
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, copyFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const folder = path.resolve(`release/native-check-${Date.now()}`);
await mkdir(folder, { recursive: true });
await mkdir("docs/screenshots", { recursive: true });
await copyFile(
  process.env.MOLE_EXECUTABLE ?? "src-tauri/target/release/whackamole.exe",
  path.join(folder, "whackamole.exe"),
);
await writeFile(
  path.join(folder, "portable.txt"),
  "Portable smoke-test sandbox",
);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let child, browser;
process.on("exit", () => child?.kill());
async function launch() {
  child = spawn(path.join(folder, "whackamole.exe"), [], {
    cwd: folder,
    windowsHide: true,
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9228",
    },
  });
  child.on("error", (error) => console.error(error));
  for (let i = 0; i < 100; i++) {
    try {
      browser = await chromium.connectOverCDP("http://127.0.0.1:9228");
      break;
    } catch {
      await sleep(150);
    }
  }
  assert(browser, "native WebView2 endpoint available");
  let page;
  for (let i = 0; i < 50; i++) {
    page = browser
      .contexts()
      .flatMap((c) => c.pages())
      .find((p) => p.url().includes("tauri.localhost"));
    if (page) break;
    await sleep(100);
  }
  assert(page, "native app loaded");
  await page.locator('[data-action="play"]').waitFor();
  return page;
}
try {
  const page = await launch(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  assert.equal(
    await page.evaluate(() => typeof window.__whackamole),
    "undefined",
  );
  assert.equal(
    await page.evaluate(() => typeof window.__TAURI__.window.getCurrentWindow),
    "function",
  );
  // Upgrade fixture includes an authentic old-format board and preferences.
  await page.evaluate(() => {
    localStorage.setItem(
      "whackamole.scores.v1",
      JSON.stringify([
        { name: "Legacy player", score: 17, date: "2026-09-30T12:00:00Z" },
      ]),
    );
    localStorage.setItem("whackamole.lang.v1", "en");
    localStorage.setItem("whackamole.difficulty.v1", "2");
  });
  await page.reload();
  await page.getByRole("button", { name: "Records", exact: true }).click();
  await page
    .getByText("Legacy scores — mixed settings", { exact: true })
    .click();
  assert(
    await page.getByText("Legacy player — 17", { exact: true }).isVisible(),
  );
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.locator('[data-action="fullscreen"]').click();
  await page.waitForFunction(async () => await window.__TAURI__.window.getCurrentWindow().isFullscreen());
  assert.equal(
    await page.evaluate(() =>
      window.__TAURI__.window.getCurrentWindow().isFullscreen(),
    ),
    true,
  );
  assert(
    await page.locator('[data-action="exit"]').isVisible(),
    "Exit remains on fullscreen main menu",
  );
  await page.screenshot({ path: "docs/screenshots/native-fullscreen.png" });
  console.log(
    "Native fullscreen metrics:",
    await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      scale: devicePixelRatio,
    })),
  );
  await page.locator('[data-action="practice"]').click();
  await page.locator('[data-action="start"]').click();
  const target = page.locator('.hole[data-kind="normal"]').first();
  await target.click();
  assert.equal(await page.locator('[data-stat="score"]').innerText(), "1");
  await page.locator('[data-action="pause"]').click();
  await page.screenshot({ path: "docs/screenshots/native-pause.png" });
  page.on("dialog", (d) => d.accept());
  await page.locator(".brand").click();
  await page.locator('[data-action="collection"]').click();
  await page.locator(".profile-form input").fill("Native tester");
  await page.getByRole("button", { name: "Add player", exact: true }).click();
  await page.locator(".brand").click();
  const exited = new Promise((resolve) => child.once("exit", resolve));
  await page.locator('[data-action="exit"]').click();
  await Promise.race([
    exited,
    sleep(10000).then(() => {
      throw Error("Exit did not close fullscreen app");
    }),
  ]);
  await browser.close();
  browser = undefined;
  console.log(
    "Native fullscreen Exit closed the process. Relaunching to verify portable persistence.",
  );
  const relaunched = await launch();
  assert(
    (
      await relaunched
        .locator(".player-picker button[aria-pressed=true]")
        .innerText()
    ).includes("Native tester"),
  );
  assert.equal(
    await relaunched.evaluate(() => localStorage.getItem("whackamole.lang.v1")),
    "en",
  );
  assert(
    (await readdir(folder)).includes("data"),
    "portable data lives beside executable",
  );
  await relaunched.locator('[data-action="exit"]').click();
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "Native smoke passed: packaged app, legacy migration/preferences, fullscreen toggle, fullscreen menu Exit, pointer hit, pause, portable persistence/relaunch.",
  );
} finally {
  await browser?.close().catch(() => {});
  child?.kill();
}
