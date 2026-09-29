// Unit tests for the i18n module (design §13.4).
// Run with: node --test test/i18n.test.mjs
// Zero new dependencies: Node's built-in test runner + type stripping for the
// .ts import.

import { test } from "node:test";
import assert from "node:assert/strict";
import { LANG_KEY, en, fi, loadLang, saveLang, t } from "../src/i18n.ts";

test("en and fi have identical key sets (parity)", () => {
  const enKeys = Object.keys(en).sort();
  const fiKeys = Object.keys(fi).sort();
  assert.deepEqual(fiKeys, enKeys);
});

test("no translation is empty", () => {
  for (const [name, table] of [["en", en], ["fi", fi]]) {
    for (const [key, value] of Object.entries(table)) {
      assert.equal(typeof value, "string", `${name}.${key} is not a string`);
      assert.ok(value.length > 0, `${name}.${key} is empty`);
    }
  }
});

test("t returns the entry for the given language", () => {
  assert.equal(t("en", "play"), "Play");
  assert.equal(t("fi", "play"), "Pelaa");
  assert.equal(t("en", "gameOver"), "Game over");
  assert.equal(t("fi", "gameOver"), "Peli loppui");
  assert.equal(t("fi", "highScores"), "Parhaat tulokset");
});

test("loadLang defaults to fi when storage is empty or unavailable", () => {
  // Node has no localStorage: loadLang must degrade to "fi", never throw.
  assert.equal(loadLang(), "fi");
});

test("loadLang/saveLang round-trip; invalid values fall back to fi", () => {
  const original = globalThis.localStorage;
  try {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => void store.set(key, value),
    };
    assert.equal(loadLang(), "fi");
    saveLang("en");
    assert.equal(loadLang(), "en");
    store.set(LANG_KEY, "fr"); // invalid value
    assert.equal(loadLang(), "fi");
    store.set(LANG_KEY, "EN"); // case-sensitive: only exact "en" counts
    assert.equal(loadLang(), "fi");
  } finally {
    globalThis.localStorage = original;
  }
});

test("loadLang/saveLang survive a throwing storage", () => {
  const original = globalThis.localStorage;
  try {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    assert.equal(loadLang(), "fi");
    saveLang("en"); // must not throw
  } finally {
    globalThis.localStorage = original;
  }
});
