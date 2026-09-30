// Pure Whack-a-Mole game logic for v0.2.0.
// No React, no DOM: every function is deterministic given its inputs and the
// injected collaborators (RNG, storage). The UI layer in App.tsx mirrors the
// authoritative state into a ref so same-frame double-clicks are validated
// synchronously (see design §3).

export type Phase = "idle" | "playing" | "over";
export type MoleKind = "normal" | "golden" | "bomb";
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface GameState {
  phase: Phase;
  score: number;
  timeLeft: number;
  moleHole: number | null;
  moleKind: MoleKind | null;
  /** Monotonically increasing appearance id, starting at 1 per round. */
  seq: number;
  /** seq of the appearance that already resolved a hit/bomb (anti-spam). */
  scoredSeq: number;
  streak: number;
  bestStreak: number;
  hits: number;
  misses: number;
  bombsHit: number;
  goldensHit: number;
}

export type WhackEvent = "hit" | "golden" | "bomb" | "miss" | "ignored";

export const ROUND_SECONDS = 30;
export const HOLES = 9;

// ---------------------------------------------------------------------------
// Difficulty levels (design §14.2) — v0.4.0
// ---------------------------------------------------------------------------

/**
 * Pop-interval factor per difficulty level. Level 3 (×1) is the original
 * speed — "current" per Ville's spec; 1 and 2 are slower, 4 and 5 faster.
 *
 * v0.4.5: level 1 re-tuned ×1.5 → ×2 — initial spawn 2400 ms, i.e. a 50 %
 * slower spawn rate than level 3 ("a lot easier"); levels 2–5 unchanged.
 */
export const DIFFICULTY_FACTOR: Record<Difficulty, number> = {
  1: 2,
  2: 1.25,
  3: 1.0,
  4: 0.75,
  5: 0.6,
};

export function clampDifficulty(value: number): Difficulty {
  if (!Number.isFinite(value)) return 3;
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  return clamped as Difficulty;
}

// Discrete pop intervals by score at level 3 (design §2.4, unchanged).
const POP_INTERVALS_MS = [1200, 1000, 850, 700];

/**
 * Pop interval for a score at the given difficulty (default 3, the original
 * speed). Level factor applied to the score-based base, rounded to the
 * nearest 10 ms (design §14.2 table). One-argument calls keep the exact
 * §2.4 values, so existing behavior and tests are untouched at level 3.
 */
export function popIntervalMs(score: number, difficulty: Difficulty = 3): number {
  let base: number;
  if (score >= 20) base = POP_INTERVALS_MS[3];
  else if (score >= 12) base = POP_INTERVALS_MS[2];
  else if (score >= 5) base = POP_INTERVALS_MS[1];
  else base = POP_INTERVALS_MS[0];
  return Math.round((base * DIFFICULTY_FACTOR[difficulty]) / 10) * 10;
}

export const DIFFICULTY_KEY = "whackamole.difficulty.v1";

/** Load the persisted difficulty; default 3, invalid values fall back to 3. */
export function loadDifficulty(): Difficulty {
  try {
    const raw = globalThis.localStorage?.getItem(DIFFICULTY_KEY);
    if (raw === null) return 3;
    const value = Number(raw);
    if (Number.isInteger(value) && value >= 1 && value <= 5) return value as Difficulty;
    return 3;
  } catch {
    return 3;
  }
}

export function saveDifficulty(difficulty: Difficulty): void {
  try {
    globalThis.localStorage?.setItem(DIFFICULTY_KEY, String(difficulty));
  } catch {
    // Persisting the preference is best-effort.
  }
}

export function createInitialState(): GameState {
  return {
    phase: "idle",
    score: 0,
    timeLeft: ROUND_SECONDS,
    moleHole: null,
    moleKind: null,
    seq: 0,
    scoredSeq: 0,
    streak: 0,
    bestStreak: 0,
    hits: 0,
    misses: 0,
    bombsHit: 0,
    goldensHit: 0,
  };
}

export function startRound(): GameState {
  return { ...createInitialState(), phase: "playing" };
}

/** One-second countdown; ends the round when the clock runs out. */
export function tick(state: GameState): GameState {
  if (state.phase !== "playing") return state;
  const timeLeft = state.timeLeft - 1;
  if (timeLeft <= 0) {
    return { ...state, timeLeft: 0, phase: "over", moleHole: null, moleKind: null };
  }
  return { ...state, timeLeft };
}

/**
 * Spawn a new appearance in `hole`. Appearance 1 of a round is always normal
 * (no bombs on the player's first whack); later appearances draw bomb 12% /
 * golden 15% / normal 73% from `rng` (injectable for deterministic tests).
 */
export function drawKind(rng: () => number, seq: number): MoleKind {
  if (seq <= 1) return "normal";
  const r = rng();
  if (r < 0.12) return "bomb";
  if (r < 0.12 + 0.15) return "golden";
  return "normal";
}

export interface SpawnOptions {
  rng?: () => number;
  /** Test seam: force the kind of this appearance. */
  forceKind?: MoleKind;
}

export function spawnMole(state: GameState, hole: number, options?: SpawnOptions): GameState {
  const seq = state.seq + 1;
  const kind = options?.forceKind ?? drawKind(options?.rng ?? Math.random, seq);
  return { ...state, moleHole: hole, moleKind: kind, seq };
}

/**
 * Apply a click on `hole`. Pure: returns the next state plus the sound events
 * it produced. Anti-spam rule (design §3): a click scores iff phase is playing,
 * the hole is the mole's current hole, the kind is normal/golden, and
 * scoredSeq !== seq. Because the caller commits the returned state to a ref
 * synchronously, a same-frame double-click sees scoredSeq === seq and is
 * rejected — exactly one score per appearance, guaranteed.
 */
export function applyWhack(state: GameState, hole: number): { state: GameState; events: WhackEvent[] } {
  if (state.phase !== "playing") return { state, events: ["ignored"] };

  if (hole !== state.moleHole || state.moleKind === null) {
    // Empty-hole click: a miss, every time.
    return {
      state: { ...state, misses: state.misses + 1, streak: 0 },
      events: ["miss"],
    };
  }

  // Second-or-later click on the same appearance: ignored, always.
  if (state.scoredSeq === state.seq) return { state, events: ["ignored"] };

  const kind = state.moleKind;

  if (kind === "bomb") {
    return {
      state: {
        ...state,
        score: Math.max(0, state.score - 2),
        bombsHit: state.bombsHit + 1,
        streak: 0,
        scoredSeq: state.seq,
        moleHole: null,
        moleKind: null,
      },
      events: ["bomb"],
    };
  }

  const delta = kind === "golden" ? 3 : 1;
  const streak = state.streak + 1;
  return {
    state: {
      ...state,
      score: state.score + delta,
      hits: state.hits + 1,
      goldensHit: state.goldensHit + (kind === "golden" ? 1 : 0),
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      scoredSeq: state.seq,
      moleHole: null,
      moleKind: null,
    },
    events: [kind === "golden" ? "golden" : "hit"],
  };
}

// ---------------------------------------------------------------------------
// High scores (design §4)
// ---------------------------------------------------------------------------

export interface HighScoreEntry {
  name: string; // 1–16 chars after sanitization
  score: number; // integer >= 0
  date: string; // ISO 8601, time of saving
}

export const SCORES_KEY = "whackamole.scores.v1";
export const MAX_ENTRIES = 10;

/** Minimal key-value storage surface (structural, so window.localStorage fits). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface StorageAdapter {
  load(): HighScoreEntry[];
  save(entries: HighScoreEntry[]): void;
}

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

/** Adapter over any KeyValueStorage; the browser one is built in App.tsx. */
export function createStorageAdapter(storage: KeyValueStorage): StorageAdapter {
  return {
    load: () => loadScores(storage),
    save: (entries) => {
      try {
        storage.setItem(SCORES_KEY, JSON.stringify(entries));
      } catch {
        // Storage unavailable or full: scores are best-effort, never fatal.
      }
    },
  };
}

/**
 * Load the board: parse in try/catch, validate every entry (shape + ranges),
 * drop invalid ones, re-sort, cap at 10. Corrupt storage degrades to an empty
 * board, never crashes the game.
 */
export function loadScores(storage: KeyValueStorage): HighScoreEntry[] {
  let raw: string | null;
  try {
    raw = storage.getItem(SCORES_KEY);
  } catch {
    return [];
  }
  if (raw == null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid: HighScoreEntry[] = [];
    for (const item of parsed) {
      const entry = parseEntry(item);
      if (entry !== null) valid.push(entry);
    }
    return sortEntries(valid).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function parseEntry(item: unknown): HighScoreEntry | null {
  if (typeof item !== "object" || item === null) return null;
  const e = item as Record<string, unknown>;
  if (typeof e.name !== "string") return null;
  if (typeof e.score !== "number" || !Number.isInteger(e.score) || e.score < 0) return null;
  if (typeof e.date !== "string" || Number.isNaN(Date.parse(e.date))) return null;
  return { name: e.name, score: e.score, date: e.date };
}

/** Sort by score descending; ties broken by earlier date first. */
export function sortEntries(entries: HighScoreEntry[]): HighScoreEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || Date.parse(a.date) - Date.parse(b.date));
}

/** Append -> sort -> cap at 10 (design §4.2 save order). */
export function saveScoreToBoard(board: HighScoreEntry[], entry: HighScoreEntry): HighScoreEntry[] {
  return sortEntries([...board, entry]).slice(0, MAX_ENTRIES);
}

/** Trim, strip control characters, cap at 16 chars; "Anonymous" when empty. */
export function sanitizeName(raw: string): string {
  let cleaned = "";
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    // Drop C0 controls, DEL, and C1 controls; keep everything else.
    if (code >= 0x20 && code !== 0x7f && !(code >= 0x80 && code <= 0x9f)) cleaned += ch;
  }
  cleaned = cleaned.trim().slice(0, 16);
  return cleaned.length > 0 ? cleaned : "Anonymous";
}
