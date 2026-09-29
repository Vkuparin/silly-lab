// Synthesized sound effects for v0.2.0 — pure WebAudio, no assets, no deps.
// Every entry point is wrapped in try/catch: audio failures (headless,
// blocked, unsupported) are silent no-ops and never break the game.

const MUTE_KEY = "whackamole.muted.v1";

let audioCtx: AudioContext | null = null;
let muted = loadMutedPreference();

function loadMutedPreference(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    globalThis.localStorage?.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    // Persisting the preference is best-effort.
  }
}

/** Lazily create the AudioContext on first user gesture; resume if suspended. */
function getContext(): AudioContext | null {
  try {
    if (audioCtx === null) {
      const Ctor =
        globalThis.AudioContext ??
        (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor === undefined) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume().catch(() => undefined);
    }
    return audioCtx;
  } catch {
    return null;
  }
}

interface ToneOptions {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  /** Start offset in seconds from now. */
  at?: number;
  duration: number;
  volume?: number;
}

function scheduleTone(ctx: AudioContext, tone: ToneOptions): void {
  const { freq, freqEnd, type = "sine", at = 0, duration, volume = 0.2 } = tone;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
  }
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function play(tones: ToneOptions[]): void {
  if (muted) return;
  const ctx = getContext();
  if (ctx === null) return;
  for (const tone of tones) scheduleTone(ctx, tone);
}

/** Short low "thock" for a normal whack. */
export function playHit(): void {
  try {
    play([{ freq: 170, freqEnd: 80, type: "triangle", duration: 0.09, volume: 0.25 }]);
  } catch {
    // silent no-op
  }
}

/** Two-tone ding for a golden mole. */
export function playGolden(): void {
  try {
    play([
      { freq: 880, duration: 0.12, volume: 0.22 },
      { freq: 1318.5, at: 0.09, duration: 0.16, volume: 0.22 },
    ]);
  } catch {
    // silent no-op
  }
}

/** Low buzz for a bomb. */
export function playBomb(): void {
  try {
    play([
      { freq: 75, freqEnd: 45, type: "sawtooth", duration: 0.35, volume: 0.3 },
      { freq: 55, freqEnd: 38, type: "square", at: 0.02, duration: 0.3, volume: 0.12 },
    ]);
  } catch {
    // silent no-op
  }
}
