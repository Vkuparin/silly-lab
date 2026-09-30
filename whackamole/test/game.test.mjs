// Unit tests for the pure game logic (design §8.1).
// Run with: node --test test/game.test.mjs
// Zero new dependencies: Node's built-in test runner + type stripping for the
// .ts import. This file is plain .mjs (no TS syntax) — types live in game.ts.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_ENTRIES,
  applyWhack,
  clampDifficulty,
  createInitialState,
  createMemoryStorage,
  createStorageAdapter,
  DIFFICULTY_KEY,
  drawKind,
  loadDifficulty,
  loadScores,
  popIntervalMs,
  sanitizeName,
  saveDifficulty,
  saveScoreToBoard,
  sortEntries,
  spawnMole,
  startRound,
  tick,
} from "../src/game.ts";

/** A playing round with one mole forced up in `hole`. */
function playingWithMole(kind, hole = 4, seq = 1) {
  let state = startRound();
  for (let s = 1; s <= seq; s++) {
    state = spawnMole(state, hole, { forceKind: kind });
  }
  return state;
}

/** Whack the mole up in `state`, then spawn the next appearance in `nextHole`. */
function whackAndRespawn(state, kind, nextHole = 0) {
  const { state: afterWhack } = applyWhack(state, state.moleHole ?? -1);
  return spawnMole(afterWhack, nextHole, { forceKind: kind });
}

function entry(name, score, date) {
  return { name, score, date };
}

// ---------------------------------------------------------------------------
// Scoring (design §2.2)
// ---------------------------------------------------------------------------

test("whacking a normal mole scores +1", () => {
  const state = playingWithMole("normal");
  const { state: next, events } = applyWhack(state, 4);
  assert.equal(next.score, 1);
  assert.equal(next.hits, 1);
  assert.deepEqual(events, ["hit"]);
});

test("whacking a golden mole scores +3", () => {
  const state = playingWithMole("golden");
  const { state: next, events } = applyWhack(state, 4);
  assert.equal(next.score, 3);
  assert.equal(next.hits, 1);
  assert.equal(next.goldensHit, 1);
  assert.deepEqual(events, ["golden"]);
});

test("whacking a bomb scores -2, floored at 0", () => {
  let state = playingWithMole("normal");
  state = whackAndRespawn(state, "bomb");
  assert.equal(state.score, 1);
  const { state: next, events } = applyWhack(state, 0);
  assert.equal(next.score, 0); // 1 - 2 floored at 0
  assert.equal(next.bombsHit, 1);
  assert.deepEqual(events, ["bomb"]);
});

test("bomb penalty never takes the score below 0", () => {
  const state = playingWithMole("bomb");
  const { state: next } = applyWhack(state, 4);
  assert.equal(next.score, 0);
  assert.equal(next.bombsHit, 1);
});

test("bomb penalty subtracts 2 when the score is high enough", () => {
  let state = playingWithMole("golden", 4, 1);
  state = whackAndRespawn(state, "golden", 1); // +3 -> 3
  state = whackAndRespawn(state, "bomb", 2); // +3 -> 6, bomb up
  const { state: next } = applyWhack(state, 2); // -2 -> 4
  assert.equal(next.score, 4);
  assert.equal(next.bombsHit, 1);
});

test("clicking an empty hole counts a miss and scores nothing", () => {
  const state = playingWithMole("normal", 4);
  const { state: next, events } = applyWhack(state, 5);
  assert.equal(next.score, 0);
  assert.equal(next.misses, 1);
  assert.equal(next.hits, 0);
  assert.deepEqual(events, ["miss"]);
});

test("clicks while not playing are ignored", () => {
  const idle = createInitialState();
  const { state: next, events } = applyWhack(idle, 0);
  assert.equal(next, idle);
  assert.deepEqual(events, ["ignored"]);
});

// ---------------------------------------------------------------------------
// Anti-spam hit validation (design §3)
// ---------------------------------------------------------------------------

test("second click on the same appearance scores 0", () => {
  // The whacked mole ducks immediately (design §2.4), so the second click
  // lands on the now-empty hole: no score, counted as an honest miss.
  const state = playingWithMole("normal");
  const first = applyWhack(state, 4);
  assert.equal(first.state.score, 1);
  const second = applyWhack(first.state, 4);
  assert.equal(second.state.score, 1);
  assert.equal(second.state.misses, 1);
  assert.deepEqual(second.events, ["miss"]);
});

test("same-frame double-click scores exactly once", () => {
  // Simulates two handler invocations back-to-back with no re-render between:
  // the second call receives the state the first one committed to the ref.
  const state = playingWithMole("normal");
  const first = applyWhack(state, 4);
  const second = applyWhack(first.state, 4);
  assert.equal(second.state.score, 1); // not 2
  assert.equal(second.state.hits, 1);
});

test("a click on an already-resolved appearance is ignored", () => {
  // Defensive path: mole still up but scoredSeq === seq (unreachable in
  // normal play because a resolved appearance ducks immediately).
  const state = playingWithMole("normal");
  const resolved = { ...state, scoredSeq: state.seq };
  const { state: next, events } = applyWhack(resolved, 4);
  assert.equal(next, resolved);
  assert.deepEqual(events, ["ignored"]);
});

test("bomb clicks are applied exactly once per bomb appearance", () => {
  const state = playingWithMole("bomb");
  const first = applyWhack(state, 4);
  assert.equal(first.state.bombsHit, 1);
  const second = applyWhack(first.state, 4);
  assert.equal(second.state.bombsHit, 1);
  assert.equal(second.state.score, 0);
  assert.equal(second.state.misses, 1); // mole ducked: empty-hole click
});

test("a new appearance can be scored again after the previous one resolved", () => {
  let state = playingWithMole("normal", 4, 1);
  state = whackAndRespawn(state, "normal", 7); // +1 -> 1
  state = whackAndRespawn(state, "normal", 2); // +1 -> 2
  assert.equal(state.score, 2);
  assert.equal(state.hits, 2);
});

test("after a whack the mole ducks, so clicking its hole is a miss", () => {
  const state = playingWithMole("normal");
  const { state: ducked } = applyWhack(state, 4);
  assert.equal(ducked.moleHole, null);
  const { state: next, events } = applyWhack(ducked, 4);
  assert.equal(next.score, 1);
  assert.equal(next.misses, 1);
  assert.deepEqual(events, ["miss"]);
});

// ---------------------------------------------------------------------------
// Streak (design §2.3)
// ---------------------------------------------------------------------------

test("streak increments on consecutive hits and bestStreak tracks the max", () => {
  let state = playingWithMole("normal", 4, 1);
  state = whackAndRespawn(state, "normal", 1); // streak 1
  state = whackAndRespawn(state, "golden", 2); // streak 2
  assert.equal(state.streak, 2);
  assert.equal(state.bestStreak, 2);
});

test("a miss resets the streak but keeps bestStreak", () => {
  let state = playingWithMole("normal", 4, 1);
  state = whackAndRespawn(state, "normal", 1); // streak 1
  const { state: missed } = applyWhack(state, 8); // empty hole
  assert.equal(missed.streak, 0);
  assert.equal(missed.bestStreak, 1);
  assert.equal(missed.misses, 1);
});

test("a bomb hit resets the streak but keeps bestStreak", () => {
  let state = playingWithMole("normal", 4, 1);
  state = whackAndRespawn(state, "bomb", 1); // streak 1, bomb up
  const { state: bombed } = applyWhack(state, 1); // bomb hit
  assert.equal(bombed.streak, 0);
  assert.equal(bombed.bestStreak, 1);
  assert.equal(bombed.bombsHit, 1);
});

// ---------------------------------------------------------------------------
// Spawn table (design §2.1)
// ---------------------------------------------------------------------------

test("appearance 1 of a round is always normal, even with a bomb-biased RNG", () => {
  const alwaysBomb = () => 0;
  const state = spawnMole(startRound(), 3, { rng: alwaysBomb });
  assert.equal(state.seq, 1);
  assert.equal(state.moleKind, "normal");
});

test("spawn table draws bomb 12% / golden 15% / normal 73% via injected RNG", () => {
  assert.equal(drawKind(() => 0.0, 2), "bomb");
  assert.equal(drawKind(() => 0.119, 2), "bomb");
  assert.equal(drawKind(() => 0.12, 2), "golden");
  assert.equal(drawKind(() => 0.269, 2), "golden");
  assert.equal(drawKind(() => 0.27, 2), "normal");
  assert.equal(drawKind(() => 0.999, 2), "normal");
});

test("every spawn gets a fresh, monotonically increasing seq", () => {
  let state = startRound();
  state = spawnMole(state, 0, { forceKind: "normal" });
  state = spawnMole(state, 1, { forceKind: "normal" });
  state = spawnMole(state, 2, { forceKind: "normal" });
  assert.equal(state.seq, 3);
});

// ---------------------------------------------------------------------------
// Speed ramp (design §2.4)
// ---------------------------------------------------------------------------

test("pop interval ramps with score: 1200/1000/850/700", () => {
  assert.equal(popIntervalMs(0), 1200);
  assert.equal(popIntervalMs(4), 1200);
  assert.equal(popIntervalMs(5), 1000);
  assert.equal(popIntervalMs(11), 1000);
  assert.equal(popIntervalMs(12), 850);
  assert.equal(popIntervalMs(19), 850);
  assert.equal(popIntervalMs(20), 700);
  assert.equal(popIntervalMs(999), 700);
});

// ---------------------------------------------------------------------------
// Difficulty levels (design §14.2)
// ---------------------------------------------------------------------------

test("difficulty table: factors applied to the score ramp, rounded to 10 ms", () => {
  const table = {
    1: [2400, 2000, 1700, 1400],
    2: [1500, 1250, 1060, 880],
    3: [1200, 1000, 850, 700],
    4: [900, 750, 640, 530],
    5: [720, 600, 510, 420],
  };
  for (const [level, row] of Object.entries(table)) {
    const d = Number(level);
    assert.equal(popIntervalMs(0, d), row[0]);
    assert.equal(popIntervalMs(5, d), row[1]);
    assert.equal(popIntervalMs(12, d), row[2]);
    assert.equal(popIntervalMs(20, d), row[3]);
  }
});

test("default difficulty is 3, identical to the original (level 3) ramp", () => {
  for (const score of [0, 4, 5, 11, 12, 19, 20, 999]) {
    assert.equal(popIntervalMs(score, 3), popIntervalMs(score));
  }
});

test("levels are ordered: 1 slowest ... 5 fastest at every score tier", () => {
  for (const score of [0, 6, 13, 25]) {
    assert.ok(popIntervalMs(score, 1) > popIntervalMs(score, 2));
    assert.ok(popIntervalMs(score, 2) > popIntervalMs(score, 3));
    assert.ok(popIntervalMs(score, 3) > popIntervalMs(score, 4));
    assert.ok(popIntervalMs(score, 4) > popIntervalMs(score, 5));
  }
});

test("clampDifficulty: out-of-range, fractional and NaN values land on a valid level", () => {
  assert.equal(clampDifficulty(0), 1);
  assert.equal(clampDifficulty(-7), 1);
  assert.equal(clampDifficulty(1.4), 1);
  assert.equal(clampDifficulty(1.5), 2);
  assert.equal(clampDifficulty(3), 3);
  assert.equal(clampDifficulty(2.5), 3);
  assert.equal(clampDifficulty(4.2), 4);
  assert.equal(clampDifficulty(5), 5);
  assert.equal(clampDifficulty(6), 5);
  assert.equal(clampDifficulty(Number.NaN), 3);
});

test("loadDifficulty: no stored value falls back to the default of 3", () => {
  // Fresh test process: nothing under the key yet (or a leftover invalid
  // value — both must degrade to 3, see next test).
  assert.equal(loadDifficulty(), 3);
});

test("difficulty persists round-trip and invalid values fall back to 3", () => {
  // Node has no localStorage; polyfill it with the in-memory store so the
  // real loadDifficulty/saveDifficulty path is exercised, then restore.
  const store = createMemoryStorage();
  const hadGlobal = "localStorage" in globalThis;
  const previous = hadGlobal ? globalThis.localStorage : undefined;
  Object.defineProperty(globalThis, "localStorage", {
    value: store,
    configurable: true,
    writable: true,
  });
  try {
    // Fresh store: nothing under the key yet, must fall back to 3.
    assert.equal(loadDifficulty(), 3);

    saveDifficulty(5);
    assert.equal(store.getItem(DIFFICULTY_KEY), "5");
    assert.equal(loadDifficulty(), 5);

    saveDifficulty(1);
    assert.equal(loadDifficulty(), 1);

    store.setItem(DIFFICULTY_KEY, "9");
    assert.equal(loadDifficulty(), 3);
    store.setItem(DIFFICULTY_KEY, "banana");
    assert.equal(loadDifficulty(), 3);
    store.setItem(DIFFICULTY_KEY, "2.5");
    assert.equal(loadDifficulty(), 3); // not an integer
    store.setItem(DIFFICULTY_KEY, "");
    assert.equal(loadDifficulty(), 3);
  } finally {
    if (hadGlobal) {
      Object.defineProperty(globalThis, "localStorage", {
        value: previous,
        configurable: true,
        writable: true,
      });
    } else {
      delete globalThis.localStorage;
    }
  }
});

// ---------------------------------------------------------------------------
// Round countdown (design §2.5)
// ---------------------------------------------------------------------------

test("tick counts down and ends the round at 0", () => {
  let state = startRound();
  state = tick(state);
  assert.equal(state.timeLeft, 29);
  for (let i = 0; i < 29; i++) state = tick(state);
  assert.equal(state.timeLeft, 0);
  assert.equal(state.phase, "over");
  assert.equal(state.moleHole, null);
});

// ---------------------------------------------------------------------------
// High scores (design §4)
// ---------------------------------------------------------------------------

test("saving inserts, sorts by score descending, and caps at 10", () => {
  let board = [];
  for (let i = 1; i <= 12; i++) {
    board = saveScoreToBoard(board, entry(`p${i}`, i * 10, `2026-01-${String(i).padStart(2, "0")}T00:00:00Z`));
  }
  assert.equal(board.length, MAX_ENTRIES);
  assert.deepEqual(
    board.map((e) => e.score),
    [120, 110, 100, 90, 80, 70, 60, 50, 40, 30],
  );
  assert.equal(board[0].name, "p12");
});

test("ties are broken by earlier date first", () => {
  const board = sortEntries([
    entry("late", 50, "2026-01-02T00:00:00Z"),
    entry("early", 50, "2026-01-01T00:00:00Z"),
    entry("high", 60, "2026-01-03T00:00:00Z"),
  ]);
  assert.deepEqual(
    board.map((e) => e.name),
    ["high", "early", "late"],
  );
});

test("corrupt JSON in storage degrades to an empty board", () => {
  const corrupt = createMemoryStorage();
  corrupt.setItem("whackamole.scores.v1", "not json{{{");
  assert.deepEqual(loadScores(corrupt), []);
});

test("non-array JSON and invalid entries are dropped", () => {
  const storage = createMemoryStorage();
  storage.setItem(
    "whackamole.scores.v1",
    JSON.stringify([
      entry("good", 10, "2026-01-01T00:00:00Z"),
      { name: "bad", score: -5, date: "2026-01-01T00:00:00Z" },
      { name: "bad", score: 1.5, date: "2026-01-01T00:00:00Z" },
      { name: "bad", score: 10, date: "not-a-date" },
      { score: 10, date: "2026-01-01T00:00:00Z" },
      "nope",
      42,
    ]),
  );
  const board = loadScores(storage);
  assert.equal(board.length, 1);
  assert.equal(board[0].name, "good");

  storage.setItem("whackamole.scores.v1", JSON.stringify({ not: "an array" }));
  assert.deepEqual(loadScores(storage), []);
});

test("storage adapter round-trips a saved board", () => {
  const adapter = createStorageAdapter(createMemoryStorage());
  assert.deepEqual(adapter.load(), []);
  adapter.save(saveScoreToBoard([], entry("ada", 42, "2026-01-01T00:00:00Z")));
  const loaded = adapter.load();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].name, "ada");
  assert.equal(loaded[0].score, 42);
});

test("sanitizeName: empty and whitespace fall back to Anonymous", () => {
  assert.equal(sanitizeName(""), "Anonymous");
  assert.equal(sanitizeName("   "), "Anonymous");
});

test("sanitizeName: control characters are stripped", () => {
  const withControls = `a${String.fromCharCode(0)}b${String.fromCharCode(1)}c`;
  assert.equal(sanitizeName(withControls), "abc");
  assert.equal(sanitizeName(String.fromCharCode(0x7f)), "Anonymous");
});

test("sanitizeName: trims and caps at 16 characters", () => {
  assert.equal(sanitizeName("  ada  "), "ada");
  const capped = sanitizeName("abcdefghijklmnopqrstuvwxyz");
  assert.equal(capped, "abcdefghijklmnop");
  assert.equal(capped.length, 16);
});
