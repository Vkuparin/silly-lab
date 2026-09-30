import { DIFFICULTY_FACTOR, type Difficulty } from "./game.ts";

export type Mode = "practice" | "garden" | "harvest" | "classic";
export type Kind = "normal" | "golden" | "bomb" | "star";
export type Input = "mouse" | "keyboard" | "mixed";
export const RULES = "1.0.0";
export const MODES = ["practice", "garden", "harvest", "classic"] as const;
export const duration = (mode: Mode) =>
  mode === "practice" ? Infinity : mode === "harvest" ? 45000 : 30000;
export function interval(
  mode: Mode,
  elapsed: number,
  level: Difficulty,
): number {
  const phase = Math.min(2, Math.floor(elapsed / (duration(mode) / 3)));
  const base = (mode === "harvest" ? [1400, 1200, 1000] : [1800, 1600, 1400])[
    phase
  ];
  return Math.max(600, Math.round((base * DIFFICULTY_FACTOR[level]) / 10) * 10);
}
export interface Appearance {
  id: number;
  hole: number;
  kind: Kind;
  until: number;
}
export interface Wave {
  at: number;
  targets: Appearance[];
}
export function rngFor(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let n = Math.imul(value ^ (value >>> 15), 1 | value);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
export function makeTape(
  mode: "garden" | "harvest",
  level: Difficulty,
  seed: number,
  startAt = 0,
  previousHoles: number[] = [],
  startId = 0,
): Wave[] {
  const rng = rngFor(seed),
    waves: Wave[] = [];
  let at = startAt,
    id = startId,
    previous: number[] = previousHoles,
    hadBomb = false;
  const events = mode === "garden" ? [10000, 20000] : [12000, 30000];
  const used = new Set<number>(events.filter((t) => t < startAt));
  while (at < duration(mode)) {
    const count = mode === "harvest" && at >= 15000 ? 2 : 1;
    const candidates = Array.from({ length: 9 }, (_, i) => i).filter(
      (i) => !previous.includes(i),
    );
    const targets: Appearance[] = [];
    const until = Math.min(duration(mode), at + interval(mode, at, level));
    let bomb = false;
    for (let slot = 0; slot < count; slot++) {
      const hole = candidates.splice(
        Math.floor(rng() * candidates.length),
        1,
      )[0];
      const draw = rng(),
        bombRate = mode === "garden" ? 0.05 : 0.12;
      let kind: Kind =
        draw < bombRate
          ? "bomb"
          : draw < bombRate + 0.2
            ? "golden"
            : mode === "harvest" && draw < 0.38
              ? "star"
              : "normal";
      if (
        kind === "bomb" &&
        (at < (mode === "garden" ? 6000 : 8000) || hadBomb || bomb)
      )
        kind = "normal";
      if (at === 0) kind = "normal";
      if (kind === "bomb") bomb = true;
      targets.push({ id: ++id, hole, kind, until });
    }
    for (const event of events)
      if (at >= event && !used.has(event)) {
        if (mode === "harvest" && event === 12000) targets[0].kind = "star";
        else targets.forEach((t) => (t.kind = "golden"));
        used.add(event);
      }
    hadBomb = targets.some((t) => t.kind === "bomb");
    previous = targets.map((t) => t.hole);
    waves.push({ at, targets });
    at = until;
  }
  return waves;
}
