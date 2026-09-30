import { popIntervalMs, type Difficulty } from "./game.ts";
import {
  duration,
  makeTape,
  rngFor,
  type Mode,
  type Input,
  type Appearance,
  type Wave,
  type Kind,
} from "./modes.ts";

export interface Round {
  id: string;
  mode: Mode;
  level: Difficulty;
  initialLevel: Difficulty;
  input: Input;
  phase: "ready" | "playing" | "paused" | "over";
  elapsed: number;
  score: number;
  hits: number;
  misses: number;
  bombs: number;
  goldens: number;
  stars: number;
  streak: number;
  bestStreak: number;
  escapes: number;
  targets: Appearance[];
  consumed: number[];
  tape: Wave[];
  index: number;
  nextHop: number;
  seq: number;
  lastHole: number;
  seed: number;
  reasons: string[];
  resolvedAt: Record<number, number>;
  practiceHoles: 4 | 9;
}
export interface Press {
  roundId: string;
  hole: number;
  appearance: number | null;
  ignored: boolean;
}
export function newRound(
  mode: Mode,
  level: Difficulty,
  input: Input,
  seed: number,
  id: string,
  practiceHoles: 4 | 9 = 4,
  tape?: Wave[],
): Round {
  return {
    id,
    mode,
    level,
    initialLevel: level,
    input,
    phase: "ready",
    elapsed: 0,
    score: 0,
    hits: 0,
    misses: 0,
    bombs: 0,
    goldens: 0,
    stars: 0,
    streak: 0,
    bestStreak: 0,
    escapes: 0,
    targets: [],
    consumed: [],
    tape:
      tape ??
      (mode === "garden" || mode === "harvest"
        ? makeTape(mode, level, seed)
        : []),
    index: 0,
    nextHop: 0,
    seq: 0,
    lastHole: -1,
    seed,
    reasons: [],
    resolvedAt: {},
    practiceHoles,
  };
}
function spawnClassic(s: Round): Round {
  const rng = rngFor(s.seed + s.seq * 3797);
  const holes = Array.from({ length: 9 }, (_, i) => i).filter(
    (i) => i !== s.lastHole,
  );
  const hole = holes[Math.floor(rng() * holes.length)],
    draw = rng();
  const kind =
    s.seq === 0
      ? "normal"
      : draw < 0.12
        ? "bomb"
        : draw < 0.27
          ? "golden"
          : "normal";
  const nextHop = s.elapsed + popIntervalMs(s.score, s.level);
  return {
    ...s,
    seq: s.seq + 1,
    lastHole: hole,
    nextHop,
    targets: [{ id: s.seq + 1, hole, kind, until: nextHop }],
  };
}
export function begin(s: Round): Round {
  if (s.phase !== "ready") return s;
  return advance({ ...s, phase: "playing" }, 0);
}
export function advance(s: Round, elapsed: number): Round {
  if (s.phase !== "playing" || elapsed < s.elapsed) return s;
  if (elapsed >= duration(s.mode))
    return { ...s, elapsed: duration(s.mode), phase: "over", targets: [] };
  let next = { ...s };
  if (s.mode === "classic") {
    while (next.nextHop <= elapsed)
      next = spawnClassic({ ...next, elapsed: next.nextHop });
  } else if (s.mode === "practice") {
    if (!next.targets.length && next.nextHop <= elapsed) {
      const holes = Array.from(
        { length: next.practiceHoles },
        (_, i) => i,
      ).filter((i) => i !== next.lastHole);
      const hole =
        next.seq === 0
          ? next.practiceHoles === 9
            ? 4
            : 1
          : holes[Math.floor(rngFor(next.seed + next.seq)() * holes.length)];
      next = {
        ...next,
        seq: next.seq + 1,
        lastHole: hole,
        targets: [
          {
            id: next.seq + 1,
            hole,
            kind: (next.hits + 1) % 5 === 0 ? "golden" : "normal",
            until: Infinity,
          },
        ],
      };
    }
  } else {
    while (
      next.index < next.tape.length &&
      next.tape[next.index].at <= elapsed
    ) {
      const wave = next.tape[next.index];
      const escaped = next.targets.filter((t) => t.kind !== "bomb");
      next = {
        ...next,
        escapes: next.escapes + escaped.length,
        streak: next.mode === "harvest" && escaped.length ? 0 : next.streak,
        targets: wave.targets.map((t) => ({ ...t })),
        index: next.index + 1,
      };
    }
  }
  return { ...next, elapsed };
}
export function pause(s: Round): Round {
  return s.phase === "playing" ? { ...s, phase: "paused" } : s;
}
export function resume(s: Round): Round {
  return s.phase === "paused" ? { ...s, phase: "playing" } : s;
}
export function capture(s: Round, hole: number): Press {
  const target = s.targets.find((t) => t.hole === hole);
  return {
    roundId: s.id,
    hole,
    appearance: target?.id ?? null,
    ignored:
      s.phase !== "playing" ||
      (!target && s.elapsed - (s.resolvedAt[hole] ?? -Infinity) < 250),
  };
}
export function release(
  s: Round,
  press: Press,
  hole: number,
  input: "mouse" | "keyboard",
): { state: Round; event?: Kind | "miss"; delta: number } {
  if (
    s.phase !== "playing" ||
    press.ignored ||
    press.roundId !== s.id ||
    press.hole !== hole
  )
    return { state: s, delta: 0 };
  if (
    press.appearance !== null &&
    (s.consumed.includes(press.appearance) ||
      !s.targets.some((t) => t.id === press.appearance && t.until > s.elapsed))
  )
    return { state: s, delta: 0 };
  const mixed = s.input !== input;
  let state: Round = {
    ...s,
    input: mixed ? "mixed" : s.input,
    reasons: mixed ? [...new Set([...s.reasons, "mixed"])] : s.reasons,
  };
  if (press.appearance === null)
    return {
      state: { ...state, misses: state.misses + 1, streak: 0 },
      event: "miss",
      delta: 0,
    };
  const target = state.targets.find((t) => t.id === press.appearance)!;
  state = {
    ...state,
    targets: state.targets.filter((t) => t.id !== target.id),
    consumed: [...state.consumed, target.id],
    resolvedAt: { ...state.resolvedAt, [hole]: state.elapsed },
  };
  let delta: number;
  if (target.kind === "bomb") {
    delta = -Math.min(state.score, state.mode === "garden" ? 1 : 2);
    state = { ...state, bombs: state.bombs + 1, streak: 0 };
  } else {
    const streak = state.streak + 1;
    delta =
      state.mode === "practice"
        ? 1
        : (target.kind === "golden" ? 3 : target.kind === "star" ? 2 : 1) +
          (state.mode === "harvest" && streak % 5 === 0 ? 2 : 0);
    state = {
      ...state,
      hits: state.hits + 1,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      goldens: state.goldens + Number(target.kind === "golden"),
      stars: state.stars + Number(target.kind === "star"),
      nextHop: state.mode === "practice" ? state.elapsed + 400 : state.nextHop,
    };
  }
  return {
    state: { ...state, score: state.score + delta },
    event: target.kind,
    delta,
  };
}
export function changeLevel(s: Round, level: Difficulty): Round {
  if (level === s.level) return s;
  const next = { ...s, level, reasons: [...new Set([...s.reasons, "level"])] };
  if (s.mode === "garden" || s.mode === "harvest") {
    // Preserve current wave expiry, then regenerate future windows at the new pace.
    const deadline =
      s.targets[0]?.until ?? s.tape[s.index]?.at ?? duration(s.mode);
    const maxId = Math.max(
      0,
      ...s.tape.flatMap((w) => w.targets.map((t) => t.id)),
    );
    const remainder = makeTape(
      s.mode,
      level,
      s.seed,
      deadline,
      s.tape[s.index - 1]?.targets.map((t) => t.hole) ?? [],
      maxId,
    );
    next.tape = [...s.tape.slice(0, s.index), ...remainder];
  }
  return next;
}
export function clickAccuracy(s: Round): number | null {
  const attempts = s.hits + s.misses + (s.mode === "classic" ? 0 : s.bombs);
  return attempts ? Math.round((s.hits / attempts) * 100) : null;
}
