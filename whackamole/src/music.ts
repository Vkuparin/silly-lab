// Retro arcade music for v0.4.0 (design §14.4) — pure WebAudio, no assets,
// no deps. A 4-bar chiptune loop in A minor (Am–F–C–G): square-wave lead
// over a triangle-wave bass, scheduled with a lookahead timer on the
// AudioContext clock. Every entry point is wrapped in try/catch: audio
// failures (headless, blocked, unsupported) are silent no-ops and never
// break the game (same discipline as the SFX in sound.ts).

import { getContext } from "./sound.ts"; // explicit extension: Node type-stripping requires it

const MUSIC_KEY = "whackamole.music.v1";

// ---------------------------------------------------------------------------
// Pattern — pure data, exported for unit tests (design §14.5/§14.7)
// ---------------------------------------------------------------------------

/** 16th-note step duration at 150 BPM (60 / 150 / 4 = 0.1 s). */
export const STEP_SECONDS = 0.1;
/** 4 bars × 16 sixteenth notes. */
export const LOOP_STEPS = 64;
/** Rest marker in the pattern arrays. */
export const REST = -1;

/** Lead melody (square wave), MIDI note numbers; REST = silence. */
export const LEAD_PATTERN: number[] = [
  // Bar 1 — Am
  69,
  REST,
  REST,
  76,
  REST,
  REST,
  72,
  REST,
  69,
  REST,
  REST,
  65,
  REST,
  REST,
  64,
  REST,
  // Bar 2 — F
  65,
  REST,
  REST,
  69,
  REST,
  REST,
  72,
  REST,
  69,
  REST,
  REST,
  65,
  REST,
  REST,
  64,
  REST,
  // Bar 3 — C
  72,
  REST,
  REST,
  67,
  REST,
  REST,
  64,
  REST,
  67,
  REST,
  REST,
  72,
  REST,
  64,
  REST,
  REST,
  // Bar 4 — G
  74,
  REST,
  REST,
  71,
  REST,
  REST,
  67,
  REST,
  69,
  REST,
  REST,
  71,
  REST,
  69,
  REST,
  67,
];

/** Bass roots (triangle wave) on eighth notes (every even step). */
export const BASS_PATTERN: number[] = [
  // Bar 1 — A2 (MIDI 45)
  45,
  REST,
  45,
  REST,
  45,
  REST,
  45,
  REST,
  45,
  REST,
  45,
  REST,
  45,
  REST,
  45,
  REST,
  // Bar 2 — F2 (MIDI 41)
  41,
  REST,
  41,
  REST,
  41,
  REST,
  41,
  REST,
  41,
  REST,
  41,
  REST,
  41,
  REST,
  41,
  REST,
  // Bar 3 — C3 (MIDI 48)
  48,
  REST,
  48,
  REST,
  48,
  REST,
  48,
  REST,
  48,
  REST,
  48,
  REST,
  48,
  REST,
  48,
  REST,
  // Bar 4 — G2 (MIDI 43)
  43,
  REST,
  43,
  REST,
  43,
  REST,
  43,
  REST,
  43,
  REST,
  43,
  REST,
  43,
  REST,
  43,
  REST,
];

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

const LOOKAHEAD_MS = 50;
/** How far ahead (s) notes get scheduled on the AudioContext clock. */
const SCHEDULE_AHEAD_S = 0.25;

let enabled = loadMusicPreference();
let paused = false;
let musicVolume = 0.5;
export function setMusicVolume(value: number): void {
  musicVolume = Math.max(0, Math.min(1, value));
}
export function pauseMusic(): void {
  paused = true;
  stop();
}
export function resumeMusic(): void {
  paused = false;
  ensureMusicRunning();
}
let schedulerId: number | null = null;
let stepIndex = 0;
let nextStepTime = 0;
let visibilityHooked = false;

function loadMusicPreference(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUSIC_KEY) === "1";
  } catch {
    return false;
  }
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function note(
  ctx: AudioContext,
  freq: number,
  t0: number,
  duration: number,
  type: OscillatorType,
  volume: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(Math.max(0.0001, volume * musicVolume), t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function scheduleStep(step: number, t0: number, ctx: AudioContext): void {
  const lead = LEAD_PATTERN[step];
  if (lead !== REST) {
    note(ctx, midiToFreq(lead), t0, 0.09, "square", 0.07);
  }
  const bass = BASS_PATTERN[step];
  if (bass !== REST) {
    note(ctx, midiToFreq(bass), t0, 0.19, "triangle", 0.12);
  }
}

function tick(): void {
  const ctx = getContext();
  if (ctx === null) {
    stop();
    return;
  }
  while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
    scheduleStep(stepIndex, nextStepTime, ctx);
    stepIndex = (stepIndex + 1) % LOOP_STEPS;
    nextStepTime += STEP_SECONDS;
  }
}

export function isMusicEnabled(): boolean {
  return enabled;
}

export function setMusicEnabled(value: boolean): void {
  enabled = value;
  try {
    globalThis.localStorage?.setItem(MUSIC_KEY, value ? "1" : "0");
  } catch {
    // Persisting the preference is best-effort.
  }
  if (value) start();
  else stop();
}

function start(): void {
  if (!enabled || paused || schedulerId !== null) return;
  try {
    hookVisibility();
    const ctx = getContext();
    if (ctx === null) return;
    stepIndex = 0;
    nextStepTime = ctx.currentTime + 0.05;
    schedulerId = window.setInterval(tick, LOOKAHEAD_MS);
  } catch {
    schedulerId = null;
  }
}

function stop(): void {
  if (schedulerId !== null) {
    try {
      window.clearInterval(schedulerId);
    } catch {
      // best-effort
    }
    schedulerId = null;
  }
}

/**
 * Resume the loop if the user has it enabled (idempotent). Call from user
 * gestures (Play click, whack) so a preference that survived a reload starts
 * playing on the first interaction, as required for a fresh AudioContext.
 */
export function ensureMusicRunning(): void {
  if (enabled) start();
}

/** Pause while the window is hidden, resume when visible (design §14.4.6). */
function hookVisibility(): void {
  if (visibilityHooked) return;
  try {
    if (typeof document === "undefined") return;
    visibilityHooked = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      // The game resumes explicitly after focus loss.
    });
  } catch {
    // No DOM available: music simply doesn't auto-pause.
  }
}
