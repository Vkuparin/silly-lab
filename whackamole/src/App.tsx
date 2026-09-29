import { useEffect, useRef, useState } from "react";
import {
  HOLES,
  applyWhack,
  createInitialState,
  createStorageAdapter,
  popIntervalMs,
  sanitizeName,
  saveScoreToBoard,
  spawnMole,
  startRound,
  tick,
  type GameState,
  type HighScoreEntry,
  type MoleKind,
  type StorageAdapter,
  type WhackEvent,
} from "./game";
import { isMuted, playBomb, playGolden, playHit, setMuted } from "./sound";
import { loadLang, saveLang, t, type Lang } from "./i18n";

const MOLE = "🐹";
const BOMB = "💣";
const TOP_N = 5;

function playEvents(events: WhackEvent[]): void {
  for (const event of events) {
    if (event === "hit") playHit();
    else if (event === "golden") playGolden();
    else if (event === "bomb") playBomb();
    // miss / ignored: no sound (avoid punishing spam with noise).
  }
}

function mostRecentName(entries: HighScoreEntry[]): string {
  let latest: HighScoreEntry | null = null;
  for (const entry of entries) {
    if (latest === null || Date.parse(entry.date) > Date.parse(latest.date)) latest = entry;
  }
  return latest?.name ?? "";
}

function accuracy(game: GameState): string {
  const attempts = game.hits + game.misses;
  if (attempts === 0) return "—";
  return `${Math.round((game.hits / attempts) * 100)}%`;
}

interface ScoresPanelProps {
  lang: Lang;
  entries: HighScoreEntry[];
  limit: number;
  highlight?: HighScoreEntry | null;
}

function HighScoresPanel({ lang, entries, limit, highlight = null }: ScoresPanelProps) {
  return (
    <div className="w-full rounded-2xl bg-white/70 p-4 shadow-md backdrop-blur-sm">
      <h2 className="mb-2 text-lg font-extrabold text-lime-900">{t(lang, "highScores")}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-lime-800/80">{t(lang, "highScoresEmpty")}</p>
      ) : (
        <ol className="space-y-0.5">
          {entries.slice(0, limit).map((entry, i) => (
            <li
              key={`${entry.date}-${entry.name}-${entry.score}`}
              className={`flex justify-between rounded px-2 py-0.5 text-sm font-semibold ${
                highlight === entry
                  ? "bg-amber-300/80 text-amber-950"
                  : "text-lime-950"
              }`}
            >
              <span>
                {i + 1}. {entry.name}
              </span>
              <span>{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Lazy singleton over window.localStorage (stateless adapter, no hooks needed).
let storageInstance: StorageAdapter | null = null;
function storage(): StorageAdapter {
  if (storageInstance === null) {
    storageInstance = createStorageAdapter(window.localStorage);
  }
  return storageInstance;
}

export default function App() {
  const [game, setGame] = useState<GameState>(createInitialState);
  const gameRef = useRef(game);
  const [lang, setLangState] = useState<Lang>(loadLang);
  const [board, setBoard] = useState<HighScoreEntry[]>(() => storage().load());
  const [muted, setMutedState] = useState(isMuted);
  const [nameInput, setNameInput] = useState("");
  const [namePrefilled, setNamePrefilled] = useState(false);
  const [savedEntry, setSavedEntry] = useState<HighScoreEntry | null>(null);
  const [skipped, setSkipped] = useState(false);
  const forcedKindRef = useRef<MoleKind | null>(null);

  // Synchronous commit: the ref is the authoritative state between renders, so
  // a same-frame double-click is validated against the post-first-click state
  // (design §3). React state is only a render mirror.
  function commit(next: GameState): void {
    gameRef.current = next;
    setGame(next);
  }

  // Test seam (design §7): force the kind of the next appearance.
  useEffect(() => {
    const api = {
      forceNextKind: (kind: MoleKind) => {
        forcedKindRef.current = kind;
      },
    };
    (window as unknown as { __whackamole?: unknown }).__whackamole = api;
    return () => {
      delete (window as unknown as { __whackamole?: unknown }).__whackamole;
    };
  }, []);

  // One-second countdown while playing.
  useEffect(() => {
    if (game.phase !== "playing") return;
    const id = setInterval(() => commit(tick(gameRef.current)), 1000);
    return () => clearInterval(id);
  }, [game.phase]);

  // Hop the mole on a self-rescheduling timeout chain: each hop reads the
  // current score, so the speed ramp applies to the next tick, and a whacked
  // mole stays down until that tick (natural brief pause, design §2.4).
  useEffect(() => {
    if (game.phase !== "playing") return;
    let id: number;
    const hop = () => {
      const s = gameRef.current;
      if (s.phase !== "playing") return;
      let next = Math.floor(Math.random() * HOLES);
      while (next === s.moleHole) next = Math.floor(Math.random() * HOLES);
      const forced = forcedKindRef.current;
      forcedKindRef.current = null;
      commit(spawnMole(s, next, forced !== null ? { forceKind: forced } : undefined));
      id = window.setTimeout(hop, popIntervalMs(gameRef.current.score));
    };
    hop(); // hop() schedules the next tick itself — one chain, not two
    return () => clearTimeout(id);
  }, [game.phase]);

  // Prefill the nickname once per round when the game-over screen appears.
  useEffect(() => {
    if (game.phase === "over" && !namePrefilled) {
      setNameInput(mostRecentName(board));
      setNamePrefilled(true);
    }
  }, [game.phase, namePrefilled, board]);

  function start(): void {
    forcedKindRef.current = null;
    setSavedEntry(null);
    setSkipped(false);
    setNamePrefilled(false);
    setNameInput("");
    commit(startRound());
  }

  function whack(hole: number): void {
    const { state, events } = applyWhack(gameRef.current, hole);
    commit(state);
    playEvents(events);
  }

  function toggleMute(): void {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  // On-the-fly language switch (design §13.1.4): every string is rendered
  // through t(lang, key), so updating this state re-renders all visible text
  // immediately — the round itself (score/timer/streak) is untouched.
  function setLang(next: Lang): void {
    setLangState(next);
    saveLang(next);
  }

  function saveScore(): void {
    const entry: HighScoreEntry = {
      name: sanitizeName(nameInput),
      score: game.score,
      date: new Date().toISOString(),
    };
    const next = saveScoreToBoard(board, entry);
    storage().save(next);
    setBoard(next);
    setSavedEntry(entry);
  }

  function skipSave(): void {
    setSkipped(true);
  }

  const showSaveFlow = game.phase === "over" && game.score >= 1 && savedEntry === null && !skipped;
  // Null when the entry was dropped by the top-10 cap (board full of higher scores).
  const savedRank =
    savedEntry !== null && board.indexOf(savedEntry) >= 0
      ? board.indexOf(savedEntry) + 1
      : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gradient-to-b from-sky-200 via-lime-100 to-lime-300 p-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-lime-900">
        {t(lang, "title")}
      </h1>
      {game.phase === "idle" && (
        <p className="-mt-3 text-center text-sm font-semibold text-lime-800/80">
          {t(lang, "subtitle")}
        </p>
      )}

      <div className="flex items-center gap-6 text-xl font-bold text-lime-950">
        <span>
          {t(lang, "score")}: {game.score}
        </span>
        <span>
          {t(lang, "time")}: {game.timeLeft}s
        </span>
        {game.streak >= 2 && (
          <span className="text-amber-600">
            {t(lang, "streak")} x {game.streak}
          </span>
        )}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? t(lang, "soundOn") : t(lang, "soundOff")}
          className="rounded-full bg-white/60 px-2.5 py-1 text-lg shadow-sm transition hover:bg-white/90 active:scale-95"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <div
          className="flex overflow-hidden rounded-full border-2 border-lime-900/20 bg-white/60 text-sm font-extrabold shadow-sm"
          role="group"
          aria-label={t(lang, "langLabel")}
        >
          {(["fi", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`px-2.5 py-1 uppercase transition ${
                lang === l
                  ? "bg-lime-900 text-white"
                  : "text-lime-900 hover:bg-white/80"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <main className="relative w-full max-w-md">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: HOLES }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => whack(i)}
              aria-label={t(lang, "hole").replace("{n}", String(i + 1))}
              className="relative aspect-square w-full select-none overflow-hidden rounded-full bg-amber-950/90 shadow-[inset_0_8px_12px_rgba(0,0,0,0.6)]"
            >
              {game.moleHole === i && game.moleKind !== null && (
                <span
                  className={`absolute inset-x-0 bottom-0 text-center text-7xl leading-none ${
                    game.moleKind === "golden"
                      ? "animate-golden"
                      : "animate-mole-pop"
                  }`}
                >
                  {game.moleKind === "bomb" ? BOMB : MOLE}
                </span>
              )}
            </button>
          ))}
        </div>

        {game.phase === "over" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl bg-lime-950/70 p-4 backdrop-blur-sm">
            <p className="text-3xl font-extrabold text-white">{t(lang, "gameOver")}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-semibold text-lime-100">
              <span>
                {t(lang, "score")}: {game.score}
              </span>
              <span>
                {t(lang, "accuracy")}: {accuracy(game)}
              </span>
              <span>
                {t(lang, "hits")}: {game.hits}
              </span>
              <span>
                {t(lang, "bestStreak")}: {game.bestStreak}
              </span>
              <span>
                {t(lang, "misses")}: {game.misses}
              </span>
              <span>
                {t(lang, "goldens")}: {game.goldensHit}
              </span>
              <span>
                {t(lang, "bombs")}: {game.bombsHit}
              </span>
            </div>

            {showSaveFlow && (
              <div className="flex w-full max-w-xs flex-col items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={16}
                  placeholder={t(lang, "namePlaceholder")}
                  aria-label={t(lang, "yourName")}
                  className="w-full rounded-full border-2 border-lime-300 bg-white/90 px-4 py-1.5 text-center font-bold text-lime-950 outline-none placeholder:text-lime-800/50 focus:border-amber-400"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveScore}
                    className="rounded-full bg-amber-400 px-5 py-1.5 font-bold text-amber-950 transition hover:bg-amber-300 active:scale-95"
                  >
                    {t(lang, "saveScore")}
                  </button>
                  <button
                    type="button"
                    onClick={skipSave}
                    className="rounded-full bg-lime-200/80 px-5 py-1.5 font-bold text-lime-950 transition hover:bg-lime-100 active:scale-95"
                  >
                    {t(lang, "skip")}
                  </button>
                </div>
              </div>
            )}

            {savedEntry !== null && savedRank !== null && (
              <p className="text-lg font-extrabold text-amber-300">
                {t(lang, "savedRank").replace("{rank}", String(savedRank))}
              </p>
            )}

            <div className="w-full max-w-xs">
              <HighScoresPanel lang={lang} entries={board} limit={TOP_N} highlight={savedEntry} />
            </div>

            <button
              type="button"
              onClick={start}
              className="mt-1 rounded-full bg-amber-400 px-8 py-2.5 text-lg font-bold text-amber-950 transition hover:bg-amber-300 active:scale-95"
            >
              {t(lang, "playAgain")}
            </button>
          </div>
        )}
      </main>

      {game.phase === "idle" && (
        <div className="flex w-full max-w-md items-end gap-4">
          <HighScoresPanel lang={lang} entries={board} limit={10} />
          <button
            type="button"
            onClick={start}
            className="shrink-0 rounded-full bg-amber-400 px-8 py-2.5 text-lg font-bold text-amber-950 shadow-md transition hover:bg-amber-300 active:scale-95"
          >
            {t(lang, "play")}
          </button>
        </div>
      )}

      <p className="text-center text-xs font-semibold text-lime-900/70">
        {t(lang, "goldenHint")} · {t(lang, "bombHint")}
      </p>
    </div>
  );
}
