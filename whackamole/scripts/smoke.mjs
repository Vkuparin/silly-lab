import { chromium } from "@playwright/test";
import { preview } from "vite";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const server = await preview({
  preview: { host: "127.0.0.1", port: 1450, strictPort: true },
  logLevel: "error",
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  reducedMotion: "reduce",
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
const action = (name) => page.locator(`[data-action="${name}"]`);
const score = async () =>
  Number(await page.locator('[data-stat="score"]').innerText());
const target = () =>
  page
    .locator(
      '.hole[data-kind="normal"], .hole[data-kind="golden"], .hole[data-kind="star"]',
    )
    .first();
async function home() {
  await page.locator(".brand").click();
  await action("play").waitFor();
}
async function start(mode) {
  await page.locator(`[data-mode="${mode}"]`).click();
  await action("start").click();
  if (mode !== "practice") await action("skip-countdown").click();
}
async function fits() {
  const board = await page.locator(".board").boundingBox(),
    viewport = page.viewportSize();
  assert(
    board &&
      board.x >= 0 &&
      board.y >= 0 &&
      board.x + board.width <= viewport.width &&
      board.y + board.height <= viewport.height,
    "complete board within viewport",
  );
  const hole = await page.locator(".hole").first().boundingBox();
  assert(
    hole.width >= 88 && Math.abs(hole.width - hole.height) < 2,
    "large circular mouse target",
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "no horizontal overflow",
  );
}
try {
  await mkdir("docs/screenshots", { recursive: true });
  await page.clock.install({ time: new Date("2026-10-01T09:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-01T09:00:01Z"));
  await page.goto("http://127.0.0.1:1450");
  assert.equal(
    await page.evaluate(() => typeof window.__whackamole),
    "undefined",
    "no release cheat API",
  );
  await page.locator(".top-actions button").first().click();
  await action("collection").click();
  await page.locator(".profile-form input").fill("Sunflower");
  await page.getByRole("button", { name: "Add player", exact: true }).click();
  await home();
  await start("practice");
  await fits();
  await target().dblclick();
  assert.equal(await score(), 1, "double click scores once");
  for (let i = 1; i < 5; i++) {
    await page.clock.runFor(450);
    await target().click();
  }
  assert.equal(await score(), 5);
  await page.screenshot({ path: "docs/screenshots/practice.png" });
  await action("pause").click();
  await page.clock.runFor(3000);
  assert.equal(await score(), 5);
  await action("resume").click();
  await action("skip-countdown").click();
  await home();
  await action("collection").click();
  assert.equal(
    await page.locator(".stickers .earned").count(),
    1,
    "practice sticker saved",
  );
  await home();
  for (const [width, height] of [
    [960, 640],
    [1280, 720],
    [1920, 1080],
    [1920, 1200],
    [2560, 1440],
    [3440, 1440],
    [3840, 2160],
    [5120, 1440],
  ]) {
    await page.setViewportSize({ width, height });
    assert(await action("exit").isVisible(), "Exit visible on main menu");
    await page.screenshot({
      path: `docs/screenshots/home-${width}x${height}.png`,
    });
    await start("harvest");
    await page.clock.runFor(18000);
    await fits();
    await page.screenshot({
      path: `docs/screenshots/harvest-${width}x${height}.png`,
    });
    await home();
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const mode of ["garden", "harvest", "classic"]) {
    await start(mode);
    await target().click();
    await page.clock.runFor(mode === "harvest" ? 45000 : 30000);
    await action("again").waitFor();
    assert(await page.locator(".result-score").isVisible());
    await page.screenshot({ path: `docs/screenshots/results-${mode}.png` });
    await home();
  }
  await action("family").click();
  await action("match-start").click();
  for (let turn = 0; turn < 2; turn++) {
    await action("turn-ready").click();
    await action("skip-countdown").click();
    if (turn === 0) await target().click();
    await page.clock.runFor(30000);
    await action("next-turn").click();
  }
  assert(await page.locator(".family-results").isVisible());
  await page.screenshot({ path: "docs/screenshots/family-results.png" });
  await action("rematch").click();
  assert(await page.locator(".handoff").isVisible());
  await home();
  await action("settings").click();
  await page.getByLabel(/World/).selectOption("space");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.screenshot({ path: "docs/screenshots/space-home.png" });
  await page.reload();
  assert(await page.locator(".theme-space").isVisible(), "theme persisted");
  assert(
    await page
      .locator(".player-picker button[aria-pressed=true]")
      .innerText()
      .then((s) => s.includes("Sunflower")),
    "profile persisted",
  );
  // Real keyboard play, key-repeat suppression, live Finnish and focus/gap pause.
  await page.locator('[data-mode="garden"]').click();
  await page.getByLabel(/Play with/).selectOption("keyboard");
  await action("start").click();
  await action("skip-countdown").click();
  const key = String(Number(await target().getAttribute("data-hole")) + 1);
  await page.keyboard.down(key);
  await page.keyboard.down(key);
  await page.keyboard.up(key);
  assert.equal(await score(), 1);
  await action("pause").click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("combobox", { name: /Language/ }).selectOption("fi");
  await page.getByRole("button", { name: "Takaisin", exact: true }).click();
  await action("resume").click();
  await action("skip-countdown").click();
  assert.equal(await score(), 1, "language preserves points");
  await page.clock.fastForward(1000);
  assert(await action("resume").isVisible(), "scheduling gap pauses");
  await action("resume").click();
  await action("skip-countdown").click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  assert(await action("resume").isVisible(), "focus loss pauses");
  await action("resume").click();
  await action("skip-countdown").click();
  await page.clock.runFor(30000);
  await action("again").waitFor();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("whackamole.release.v1")),
  );
  assert(
    Object.keys(stored.boards).some((key) => key.endsWith("/keyboard")),
    "keyboard category saved",
  );
  await home();
  await page.screenshot({ path: "docs/screenshots/finnish-home.png" });
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "Browser smoke passed: real pointer/double-click, practice/stickers, pause/resume, 8 display layouts, all solo rounds, family/rematch, persistence; no runtime errors.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
