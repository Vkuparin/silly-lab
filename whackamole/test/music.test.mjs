// Unit tests for the retro arcade music module (design §14.4/§14.5).
// Run with: node --test test/music.test.mjs
// Zero new dependencies. The module is Node-safe: AudioContext/localStorage
// access is guarded, so importing and toggling it here is a no-op for audio.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BASS_PATTERN,
  ensureMusicRunning,
  isMusicEnabled,
  LEAD_PATTERN,
  LOOP_STEPS,
  REST,
  setMusicEnabled,
  STEP_SECONDS,
} from "../src/music.ts";

test("pattern is a 4-bar sixteenth-note loop (64 steps, 0.1 s steps at 150 BPM)", () => {
  assert.equal(LOOP_STEPS, 64);
  assert.equal(STEP_SECONDS, 0.1);
  assert.equal(LEAD_PATTERN.length, 64);
  assert.equal(BASS_PATTERN.length, 64);
});

test("lead notes are a sensible square-wave lead range (C4..C6)", () => {
  for (const step of LEAD_PATTERN) {
    if (step === REST) continue;
    assert.ok(step >= 60 && step <= 84, `lead note ${step} out of range`);
  }
  // There must actually be lead notes (a loop of silence is not a loop).
  assert.ok(LEAD_PATTERN.filter((n) => n !== REST).length >= 16);
});

test("bass plays eighth-note roots (every even step) in a low range (C2..C4)", () => {
  const roots = new Set();
  for (let step = 0; step < 64; step++) {
    const note = BASS_PATTERN[step];
    if (step % 2 === 0) {
      assert.notEqual(note, REST, `bass should play on every even step`);
      assert.ok(note >= 36 && note <= 60, `bass note ${note} out of range`);
      roots.add(note);
    } else {
      assert.equal(note, REST, `bass should rest on odd steps (eighth notes)`);
    }
  }
  // Four bars of Am–F–C–G: exactly four distinct roots.
  assert.equal(roots.size, 4);
});

test("music is off by default (no prior preference)", () => {
  assert.equal(isMusicEnabled(), false);
});

test("toggling music on/off updates state and stays safe in Node", () => {
  setMusicEnabled(true);
  assert.equal(isMusicEnabled(), true);
  setMusicEnabled(false);
  assert.equal(isMusicEnabled(), false);
  // Idempotent resume path: must never throw, even with no AudioContext.
  ensureMusicRunning();
});
