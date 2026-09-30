import {
  loadScores,
  sanitizeName,
  type HighScoreEntry,
  type KeyValueStorage,
} from "./game.ts";
import { RULES, MODES } from "./modes.ts";
import type { Round } from "./round.ts";
export const KEY = "whackamole.release.v1";
export const STICKERS = [
  "first",
  "garden",
  "golden",
  "careful",
  "combo",
  "harvest",
  "star",
  "explorer",
] as const;
export type Sticker = (typeof STICKERS)[number];
export interface Profile {
  id: string;
  name: string;
  avatar: number;
  stickers: Sticker[];
  rounds: number;
  hits: number;
  modes: string[];
  best: Record<string, number>;
}
export interface Entry {
  id: string;
  name: string;
  profile: string | null;
  score: number;
  date: string;
}
export interface Settings {
  mode: "garden" | "harvest" | "classic";
  level: 1 | 2 | 3 | 4 | 5;
  input: "mouse" | "keyboard";
  theme: "garden" | "snow" | "space";
  reduced: boolean;
  sfxVolume: number;
  musicVolume: number;
}
export interface SaveData {
  schema: 1;
  profiles: Profile[];
  selected: string | null;
  boards: Record<string, Entry[]>;
  recent: string[];
  settings: Settings;
}
export const category = (s: Round) =>
  `${RULES}/${s.mode}/${s.initialLevel}/${s.input}`;
export function fresh(): SaveData {
  let level: Settings["level"] = 1;
  try {
    const raw = globalThis.localStorage?.getItem("whackamole.difficulty.v1");
    if (raw && /^[1-5]$/.test(raw)) level = Number(raw) as Settings["level"];
  } catch {
    /* session defaults */
  }
  return {
    schema: 1,
    profiles: [],
    selected: null,
    boards: {},
    recent: [],
    settings: {
      mode: "garden",
      level,
      input: "mouse",
      theme: "garden",
      reduced: false,
      sfxVolume: 0.7,
      musicVolume: 0.5,
    },
  };
}
export function getStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
export function legacy(storage = getStorage()): HighScoreEntry[] {
  return storage ? loadScores(storage) : [];
}
const integer = (x: unknown) =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
const object = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
export function read(storage = getStorage()): {
  data: SaveData;
  writable: boolean;
  warning: boolean;
} {
  try {
    if (!storage) return { data: fresh(), writable: false, warning: true };
    const raw = storage.getItem(KEY);
    if (!raw) return { data: fresh(), writable: true, warning: false };
    const d = JSON.parse(raw);
    if (
      !object(d) ||
      d.schema !== 1 ||
      !Array.isArray(d.profiles) ||
      d.profiles.length > 6 ||
      !object(d.boards) ||
      !Array.isArray(d.recent) ||
      d.recent.length > 100 ||
      !d.recent.every(
        (id: unknown) => typeof id === "string" && id.length <= 100,
      ) ||
      !object(d.settings)
    )
      throw Error("schema");
    const ids = new Set<string>();
    for (const p of d.profiles) {
      if (
        !object(p) ||
        typeof p.id !== "string" ||
        !p.id ||
        p.id.length > 100 ||
        ids.has(p.id) ||
        typeof p.name !== "string" ||
        !integer(p.avatar) ||
        (p.avatar as number) > 5 ||
        !integer(p.rounds) ||
        !integer(p.hits) ||
        !Array.isArray(p.stickers) ||
        p.stickers.length > 8 ||
        !p.stickers.every((s: unknown) => STICKERS.includes(s as Sticker)) ||
        !Array.isArray(p.modes) ||
        p.modes.length > 3 ||
        !p.modes.every((m: unknown) =>
          ["garden", "harvest", "classic"].includes(m as string),
        ) ||
        !object(p.best) ||
        !Object.entries(p.best).every(
          ([k, v]) => validCategory(k) && integer(v),
        )
      )
        throw Error("profile");
      p.name = sanitizeName(p.name);
      ids.add(p.id);
    }
    if (
      d.selected !== null &&
      (typeof d.selected !== "string" || !ids.has(d.selected))
    )
      throw Error("selected");
    for (const [key, rows] of Object.entries(d.boards)) {
      if (!validCategory(key) || !Array.isArray(rows) || rows.length > 10)
        throw Error("board");
      for (const e of rows) {
        if (
          !object(e) ||
          typeof e.id !== "string" ||
          e.id.length > 100 ||
          typeof e.name !== "string" ||
          !integer(e.score) ||
          typeof e.date !== "string" ||
          !Number.isFinite(Date.parse(e.date)) ||
          (e.profile !== null && !ids.has(e.profile as string))
        )
          throw Error("entry");
        e.name = sanitizeName(e.name);
      }
    }
    const c = d.settings;
    if (
      !["garden", "harvest", "classic"].includes(c.mode as string) ||
      ![1, 2, 3, 4, 5].includes(c.level as number) ||
      !["mouse", "keyboard"].includes(c.input as string) ||
      !["garden", "snow", "space"].includes(c.theme as string) ||
      typeof c.reduced !== "boolean" ||
      ![c.sfxVolume, c.musicVolume].every(
        (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1,
      )
    )
      throw Error("settings");
    return { data: d as unknown as SaveData, writable: true, warning: false };
  } catch {
    return { data: fresh(), writable: false, warning: true };
  }
}
function validCategory(key: string): boolean {
  return /^1\.0\.0\/(garden|harvest|classic)\/[1-5]\/(mouse|keyboard)$/.test(
    key,
  );
}
export function write(data: SaveData, storage = getStorage()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function stickersFor(s: Round, profile: Profile): Sticker[] {
  const out: Sticker[] = [];
  const complete = s.phase === "over",
    legitimate = !s.reasons.includes("debug");
  if (!legitimate) return out;
  if ((s.mode === "practice" && s.hits >= 5) || (complete && s.hits >= 5))
    out.push("first");
  if (!complete || s.mode === "practice") return out;
  if (s.mode === "garden" && s.hits >= 10) out.push("garden");
  if (s.goldens >= 3) out.push("golden");
  if (s.hits >= 10 && !s.misses && !s.bombs) out.push("careful");
  if (s.mode === "harvest" && s.bestStreak >= 5) out.push("combo");
  if (s.mode === "harvest" && s.hits >= 15) out.push("harvest");
  if (s.mode === "harvest" && s.stars) out.push("star");
  const modes = new Set([...profile.modes, ...(s.hits ? [s.mode] : [])]);
  if (MODES.filter((m) => m !== "practice").every((m) => modes.has(m)))
    out.push("explorer");
  return out.filter((id) => !profile.stickers.includes(id));
}
export function fold(
  data: SaveData,
  s: Round,
  profileId: string | null,
  name: string,
  match = false,
): { data: SaveData; unlocked: Sticker[] } {
  if (
    data.recent.includes(s.id) ||
    s.reasons.includes("debug") ||
    s.phase !== "over" ||
    s.mode === "practice"
  )
    return { data, unlocked: [] };
  const profile = data.profiles.find((p) => p.id === profileId),
    unlocked = profile ? stickersFor(s, profile) : [];
  const key = category(s),
    eligible = !s.reasons.length && !match;
  const boards = { ...data.boards };
  if (eligible) {
    const row: Entry = {
      id: s.id,
      name: sanitizeName(name),
      profile: profileId,
      score: s.score,
      date: new Date().toISOString(),
    };
    boards[key] = [...(boards[key] ?? []), row]
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.date.localeCompare(b.date) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, 10);
  }
  const profiles = data.profiles.map((p) =>
    p.id !== profileId
      ? p
      : {
          ...p,
          rounds: p.rounds + 1,
          hits: p.hits + s.hits,
          stickers: [...p.stickers, ...unlocked],
          modes: [...new Set([...p.modes, ...(s.hits ? [s.mode] : [])])],
          best: eligible
            ? { ...p.best, [key]: Math.max(p.best[key] ?? 0, s.score) }
            : p.best,
        },
  );
  return {
    data: {
      ...data,
      profiles,
      boards,
      recent: [...data.recent, s.id].slice(-100),
    },
    unlocked,
  };
}
export function deleteProfile(data: SaveData, id: string): SaveData {
  return {
    ...data,
    selected: data.selected === id ? null : data.selected,
    profiles: data.profiles.filter((p) => p.id !== id),
    boards: Object.fromEntries(
      Object.entries(data.boards).map(([key, rows]) => [
        key,
        rows.filter((e) => e.profile !== id),
      ]),
    ),
  };
}
