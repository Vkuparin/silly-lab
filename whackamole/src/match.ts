import { makeTape, type Wave } from "./modes.ts";
import type { Difficulty } from "./game.ts";
export interface Player {
  name: string;
  avatar: number;
  profile: string | null;
  level: Difficulty;
}
export interface Match {
  players: Player[];
  handicap: boolean;
  tape: Wave[];
  seed: number;
  turn: number;
  scores: number[];
}
export function createMatch(
  players: Player[],
  handicap: boolean,
  seed: number,
): Match {
  if (players.length < 2 || players.length > 4)
    throw Error("2–4 players required");
  return {
    players: players.map((p) => ({
      ...p,
      level: handicap ? p.level : players[0].level,
    })),
    handicap,
    tape: makeTape("garden", players[0].level, seed),
    seed,
    turn: 0,
    scores: [],
  };
}
export function finishTurn(
  m: Match,
  score: number,
  expectedTurn = m.turn,
): Match {
  return m.scores.length !== m.turn ||
    expectedTurn !== m.turn ||
    m.turn >= m.players.length
    ? m
    : { ...m, scores: [...m.scores, score], turn: m.turn + 1 };
}
export function rematch(m: Match, seed: number): Match {
  return createMatch([...m.players.slice(1), m.players[0]], m.handicap, seed);
}
export function winners(m: Match): number[] {
  const best = Math.max(...m.scores);
  return m.scores.flatMap((score, i) => (score === best ? [i] : []));
}
