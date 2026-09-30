# Whack-a-Mole v0.2.0 — Design Document

Status: approved spec for implementation; v0.4.0 scope added as §14 (2026-09-30)
Scope owner: Kynsi (design + implementation)
Baseline: v0.1.0 (commit `179349b`) — one mole, nine holes, 30 s, speed ramp.

Shipped history: v0.1.0 (PoC), v0.2.0 (+ high scores, golden/bomb, EN/FI — §13),
v0.3.0 (portable mode, window fit, FI string fixes), v0.4.0 (difficulty levels,
retro arcade music — §14).

## 1. Goals

1. **Persistent high-score board** (top 10) that survives app restarts.
2. **Nickname entry** after each game: the player may save their score with a name, or skip.
3. **Anti-spam hit validation**: exactly one score per mole appearance, no matter how
   fast or repeatedly the mouse is clicked.
4. **Classic whack-a-mole improvements**: bonus mole, bomb mole, miss tracking with
   accuracy, streak tracking, and sound effects with a mute toggle.

### Non-goals (explicitly out of scope for v0.2)

- Tauri/Rust storage backend (file-based scores) — see §9.
- Lives, pause, countdown, multi-round modes, theming, networking, cloud sync.
- New npm dependencies of any kind (see §10).

## 2. Gameplay rules (normative)

### 2.1 Mole kinds and spawn

Each time the mole pops up into a hole, that is an **appearance**, assigned a
monotonically increasing id `seq` starting at 1 per round.

- Appearance 1 of a round: always **normal** (no bombs on the player's first whack).
- Every later appearance is drawn with:
  - **bomb**: 12 %
  - **golden**: 15 %
  - **normal**: 73 %
- Kinds are rendered as: normal `🐹`, golden `🐹` with a gold glow, bomb `💣`.

### 2.2 Scoring

| Action                                    | Score effect       |
| :---------------------------------------- | :----------------- |
| Whack a normal mole (first click, see §3) | **+1**             |
| Whack a golden mole (first click)         | **+3**             |
| Whack a bomb mole (first click)           | **−2, floor 0**    |
| Click an empty hole while playing         | 0 (counted as a **miss**) |
| Any second-or-later click on the same appearance | **0** (ignored) |
| Clicks while not playing                  | ignored            |

Score never goes below 0.

### 2.3 Streak

- `streak` = consecutive successful whacks (normal or golden).
- A **miss** (empty-hole click) or a **bomb hit** resets `streak` to 0.
- `bestStreak` = max streak during the round. Reported at game over.

### 2.4 Speed ramp (unchanged from v0.1)

Pop interval by score: `1200 ms` (base) → `1000 ms` (score ≥ 5) → `850 ms`
(score ≥ 12) → `700 ms` (score ≥ 20). The mole stays down after a whack until the
next tick (natural brief pause), then pops in a different hole with a fresh `seq`
and a freshly drawn kind.

### 2.5 Round

30 s countdown, then game over. Stats collected per round: `score`, `hits`
(successful normal/golden whacks), `misses`, `bombsHit`, `goldensHit`,
`bestStreak`. **Accuracy** = `hits / (hits + misses)` (bombs are a hit on
something that was up; they are penalized in score and shown separately).

## 3. Anti-spam / hit validation (normative, critical)

**Problem in v0.1:** two clicks landing in the same React frame both read the
same `moleHole` state and both call `setScore(+1)` — a fast double-click scores
twice for one appearance.

**Rule:** a click scores if and only if, at the instant the handler runs:
1. phase is `playing`,
2. the clicked hole is the mole's current hole,
3. the mole's kind is `normal` or `golden` (bombs never score), and
4. `scoredSeq !== seq` for the current appearance.

Condition 4 is checked and set **synchronously against a mutable ref**
(`scoredSeqRef`), not React state, so the second click of a same-frame
double-click sees the updated value and is rejected. The mole's current hole,
seq, and kind are likewise mirrored into a ref that is updated in the same
handler pass that changes state.

Consequences:
- Max **one score per appearance**, guaranteed even under click spam.
- Bomb clicks are applied exactly once per bomb appearance (floor 0).
- Empty-hole clicks are counted as misses each time (spamming an empty hole
  only hurts your accuracy — acceptable, and honest).

## 4. High scores (normative)

### 4.1 Data model

```ts
type HighScoreEntry = {
  name: string;   // 1–16 chars after sanitization
  score: number;  // integer ≥ 0
  date: string;   // ISO 8601, time of saving
};
```

Board = at most **10** entries, sorted by `score` descending; ties broken by
earlier `date` first.

### 4.2 Storage

- Primary backend: `localStorage`, key `whackamole.scores.v1`, value: JSON array
  of `HighScoreEntry` (best-first order).
- Load: parse in `try/catch`; validate every entry (shape + ranges); drop
  invalid entries; re-sort; cap at 10. Corrupt storage degrades to an empty
  board, never crashes the game.
- Save: append → sort → cap → write, in that order, inside `try/catch`.
- The storage layer is a small injected interface
  (`{ load(): HighScoreEntry[]; save(entries: HighScoreEntry[]): void }`)
  so the pure logic is unit-testable with an in-memory fake.

### 4.3 Sanitization

Trim, strip control characters, cap at 16 characters; fall back to
`"Anonymous"` when the result is empty. (Rendering uses React text nodes, so
there is no HTML injection path; the cap is for sanity.)

### 4.4 UI

- **Idle screen:** the 3×3 grid is visible (no overlay covering it), plus a
  **High Scores** panel listing up to 10 entries (`1. Name — 23`), and a
  **Play** button. Empty board shows a friendly empty state.
- **Game-over screen:** round stats (score, accuracy, best streak, goldens,
  bombs), then:
  - if `score ≥ 1`: nickname input (prefilled with the name of the most recent
    board entry) + **Save score** + **Skip**. After saving, show
    `#N on the board` and the updated top 5.
  - if `score === 0`: stats + top 5 + **Play again** (no point saving zero).
  - **Play again** always available.

## 5. Sound (normative behavior, best-effort implementation)

- Synthesized with WebAudio — **no audio assets, no dependencies**.
- Events: hit (short low "thock"), golden (two-tone ding), bomb (low buzz).
  Miss: no sound (avoid punishing spam with noise).
- `AudioContext` created lazily on first user gesture; every call wrapped in
  `try/catch` so audio failures (headless, blocked, unsupported) are silent
  no-ops and never break the game.
- Mute toggle button (🔊/🔇) in the HUD; preference persisted in
  `localStorage` key `whackamole.muted.v1` (`"1"`/`"0"`).

## 6. UI/UX summary

- HUD: `Score: N` · `Time: Ns` · streak indicator (`x N` when streak ≥ 2) ·
  mute toggle.
- Idle: title, HUD, grid (mole down), High Scores panel, Play.
- Playing: HUD updates; golden mole glows; bomb clearly distinct.
- Game over: stats, optional name save flow, top 5 (new entry highlighted),
  Play again.
- Keep the existing visual language (lime/sky gradient, dark round holes,
  bold rounded typography). No layout overhaul.

## 7. Test seam

`window.__whackamole = { forceNextKind(kind: "normal" | "golden" | "bomb") }`
— forces the kind of the *next* appearance. Always exposed (local single-user
PoC; not a security boundary). Used by the headless playtest to deterministically
verify golden and bomb behavior.

## 8. Test plan

1. **Unit tests** — `node --test test/game.test.mjs` (Node's built-in runner,
   zero new dependencies). Cover at minimum:
   - scoring: normal +1, golden +3, bomb −2 with floor 0;
   - hit validation: second click on the same appearance scores 0;
     same-frame double-click scores exactly once (simulate two handler
     invocations back-to-back with no re-render between);
   - streak: increments on hits, resets on miss and on bomb, bestStreak tracked;
   - spawn: appearance 1 always normal; probabilities drawn from the 12/15/73
     table (injectable RNG for determinism);
   - high scores: insert/sort/cap-10/ties, corrupt-JSON recovery, sanitization
     (empty → "Anonymous", control chars stripped, 16-char cap).
2. **Type check + build** — `npm run build` (`tsc && vite build`), zero errors.
3. **Headless playtest** — puppeteer-core against `npm run preview`:
   - idle board renders (seed store via `localStorage`, reload);
   - Play → appearance 1 is normal;
   - **same-tick double-click** on the mole → score +1, not +2;
   - empty-hole click → miss counted;
   - force golden → +3; force bomb → −2 (floor 0);
   - streak indicator appears at streak ≥ 2;
   - game over → stats present → save with nickname → board contains entry,
     rank shown; skip path leaves board unchanged;
   - reload page → board persists;
   - mute toggle works and preference persists across reload;
   - Play again resets all round state.
4. **Desktop build** — `npm run tauri build`; verify
   `whackamole.exe`, NSIS `.exe`, MSI exist under
   `src-tauri/target/release`.

## 9. Architecture / files

| File                      | Responsibility |
| :------------------------ | :------------- |
| `src/game.ts`             | Pure logic: types, spawn table, scoring, streak, high-score store (with injected storage adapter). No React, no DOM. |
| `src/sound.ts`            | WebAudio SFX + mute persistence. All calls guarded. |
| `src/App.tsx`             | UI wiring: phases, HUD, grid, high-score panel, save flow. |
| `src/index.css`           | Existing Tailwind v4 setup + `mole-golden` glow. |
| `test/game.test.mjs`      | `node --test` unit tests (in-memory storage fake, injected RNG). |

Constraints:
- **No new dependencies** (runtime or dev) in `package.json`.
- No Tauri commands or plugins; the Rust side stays bare.
- Keep the whole thing readable — this is a PoC, not a product.

### Why localStorage and not a Tauri file backend?

For a single-user local PoC, `localStorage` is persistent per machine, requires
zero Rust, and keeps the game fully testable in plain headless Chrome. A
`tauri` file command (e.g. `scores.json` in appdata) is the natural v0.3
upgrade if "cleared site data wipes my scores" ever becomes a complaint.
Noted, deferred.

## 10. Version & release

- Bump `0.1.0 → 0.2.0` in: `package.json`, `src-tauri/tauri.conf.json`,
  `src-tauri/Cargo.toml`.
- App `README.md`: new features, how to run, how to test, test seam note.
- Release assets: `whackamole-0.2.0-win-x64.zip` (portable exe),
  `whackamole_0.2.0_x64-setup.exe` (NSIS), `whackamole_0.2.0_x64_en-US.msi`.
- Changelog: see §11.

## 11. Changelog (release notes)

### v0.2.0

**New**
- Finnish localization with an in-game language toggle (EN/FI) — switches on the fly.
- Persistent high-score board (top 10) with nickname entry — save or skip after each round.
- Golden moles worth **3 points** (15% of appearances) and bomb moles worth **−2** (12%), clearly distinct visuals.
- Round stats: hits, misses, accuracy, best streak, goldens, bombs.
- Sound effects (synthesized, no assets) with a mute toggle that remembers your choice.

**Fixed**
- Click-spam no longer double-scores: exactly one score per mole appearance, guaranteed even for same-frame double-clicks.

**Under the hood**
- Pure game logic extracted to `src/game.ts` with unit tests via `node --test` (zero new dependencies).

## 12. Acceptance criteria (for the implementer)

1. All §2–§5 rules and §13 implemented exactly as written.
2. `node --test` passes (including the §13.4 i18n tests); `npm run build` passes with zero TS errors.
3. Headless playtest of §8.3 passes, **including the same-tick double-click test**.
4. Version bumped in all three places; `npm run tauri build` succeeds; all three artifacts exist.
5. App README updated (mention EN/FI toggle).
6. No new dependencies; no Rust changes beyond the version bump.
7. Do **not** run `git commit`/`git push` — the orchestrator handles git and release.

## 13. Addendum (added 2026-09-30, scope extension by Ville): Finnish localization

**Scope note:** this ships in the same v0.2.0 release. No new dependencies.

### 13.1 Requirements (normative)

1. Two languages: **English (`en`)** and **Finnish (`fi`)**.
2. **Every user-visible string** (titles, buttons, labels, stats, empty states, placeholder
   text, toasts) is externalized into a typed string table. No hardcoded UI text left
   in components.
3. **Language selector** (FI / EN toggle) visible in the HUD on all screens — idle,
   playing, game over.
4. **On-the-fly switching:** changing the language while a round is in progress must
   update all visible text immediately, without restarting the round, without
   resetting score/timer/streak, and without a reload.
5. **Default:** Finnish. **Persistence:** selection stored in `localStorage`
   `whackamole.lang.v1` (`"en"` | `"fi"`); loaded on startup; invalid values fall
   back to `fi`.

### 13.2 Architecture

- NEW `src/i18n.ts`: `type Lang = "en" | "fi"`; `type StrKey = keyof typeof en`;
  string tables `en` and `fi` as `Record<StrKey, string>`; helper
  `t(lang, key)`; `loadLang()` / `saveLang()` with the persistence rules above.
  Pure module — no React, no DOM (localStorage calls wrapped in `try/catch`,
  degrading to `"fi"`).
- `src/App.tsx` holds `lang` state; all strings rendered via `t(lang, key)`.
- **No i18n library.** Two languages, flat key space — a typed table is the whole
  framework.

### 13.3 String keys (minimum set; implementer may add)

`title`, `subtitle`, `play`, `playAgain`, `score`, `time`, `streak`, `highScores`,
`highScoresEmpty`, `gameOver`, `hits`, `misses`, `accuracy`, `bestStreak`,
`goldens`, `bombs`, `yourName`, `namePlaceholder`, `saveScore`, `skip`,
`savedRank`, `soundOn`, `soundOff`, `goldenHint`, `bombHint`, `langLabel`.

Finnish translations must be natural, idiomatic Finnish (Ville is a native speaker —
bad translations are a defect). Example tone: `High scores` → `Ennätystulokset`,
`Play again` → `Pelaa uudelleen`, `Best streak` → `Pitkimmät putki`, `Accuracy` →
`Tarkkuus`, `Skip` → `Ohita`, `Save score` → `Tallenna tulos`, `Your name` →
`Nimesi`, `Game over` → `Peli over` is NOT acceptable — use `Peli loppui`.

### 13.4 Tests

- `test/game.test.mjs` (or new `test/i18n.test.mjs`): **key parity** — every key in
  `en` exists in `fi` and vice versa, and no translation is empty.
- Headless: switch language mid-round → HUD labels change, score/timer intact;
  reload → selection persists.

### 13.5 UI notes

- Toggle renders as two small buttons `FI` / `EN` (active one highlighted) in the
  HUD — compact, keyboard-friendly, works on all screens.
- The high-score board shows stored names as-is (user data is not translated).

## 14. Addendum (added 2026-09-30, v0.4.0 scope by Ville): difficulty levels + retro arcade music

**Scope note:** ships in the v0.4.0 release. No new dependencies, no Rust
changes beyond the version bump. §14.2 **extends** the §2.4 speed ramp:
the §2.4 table is level 3 ("current speed"); levels 1–2 are slower, levels
4–5 faster. Level 3 must produce exactly the v0.3.0 behavior.

### 14.1 Difficulty requirements (normative)

1. **Five difficulty levels**, 1 (slowest) through 5 (fastest).
2. **Level 3 is the current speed** — the §2.4 ramp (`1200/1000/850/700` ms)
   is level 3, unchanged.
3. **Level 1 is a lot slower** than level 3, **level 2 slower** than level 3;
   symmetrically **level 4 faster**, **level 5 a lot faster**.
4. **Changeable on the fly:** the selector is visible in the HUD on all
   screens (idle, playing, game over) and changing it mid-round takes effect
   **from the next mole hop** — no round restart, no reset of score/timer/
   streak, no reload. Same on-the-fly semantics as the language toggle (§13).
5. **Persistence:** selection stored in `localStorage` key
   `whackamole.difficulty.v1` (value `"1"`…`"5"`); default **3**; invalid
   values fall back to **3**. Loaded on startup.
6. **Localization:** all new strings in the `en`/`fi` tables (§14.6); the
   parity test (§13.4) must keep passing.

### 14.2 Speed table (normative, extends §2.4)

Pop interval = §2.4 base interval × level factor, rounded to the nearest
10 ms:

| Level | 1 | 2 | 3 (current) | 4 | 5 |
| :---- | :-- | :-- | :-- | :-- | :-- |
| Factor | ×2.00 | ×1.25 | ×1.00 | ×0.75 | ×0.60 |
| Base (score 0) | 2400 ms | 1500 ms | 1200 ms | 900 ms | 720 ms |
| score ≥ 5 | 2000 ms | 1250 ms | 1000 ms | 750 ms | 600 ms |
| score ≥ 12 | 1700 ms | 1060 ms | 850 ms | 640 ms | 510 ms |
| score ≥ 20 | 1400 ms | 880 ms | 700 ms | 530 ms | 420 ms |

**v0.4.5 (2026-09-30):** level 1 factor ×1.50 → ×2.00 — initial spawn
2400 ms, i.e. a 50 % slower spawn rate than level 3 ("a lot easier").
Levels 2–5 are unchanged.

API (in `src/game.ts`, pure and unit-testable):

```ts
type Difficulty = 1 | 2 | 3 | 4 | 5;
DIFFICULTY_FACTOR: Record<Difficulty, number>  // {1:2, 2:1.25, 3:1, 4:0.75, 5:0.6}
clampDifficulty(value: number): Difficulty      // out-of-range/NaN → nearest valid
loadDifficulty(): Difficulty                    // default 3, invalid → 3
saveDifficulty(d: Difficulty): void             // try/catch, best-effort
popIntervalMs(score: number, difficulty?: Difficulty): number  // default 3 (back-compat)
```

`popIntervalMs(score)` with one argument must return the exact §2.4 values
(existing tests must keep passing untouched).

### 14.3 Difficulty UI (normative)

- Segmented control `1 2 3 4 5` in the HUD (all screens), active level
  highlighted, mirroring the FI/EN toggle styling.
- Group `aria-label` = `t(lang, "difficulty")`; each button
  `aria-pressed` with label `t(lang, "level").replace("{n}", …)`.
- Selection is **not** part of round state: a change mid-round only alters the
  interval the hop chain schedules for the *next* hop (the hop effect already
  reads live values per hop — same mechanism as the score ramp, §2.4).

### 14.4 Retro arcade music (normative behavior, best-effort implementation)

1. **Synthesized chiptune loop** with WebAudio — **no audio assets, no
   downloads, no dependencies** (same discipline as §5 SFX; composed inline,
   not fetched).
2. **Loop:** 4 bars of 16th notes at 150 BPM (64 steps × 0.10 s), key A minor,
   progression Am–F–C–G. Square-wave lead (pluck, ~0.09 s notes) over a
   triangle-wave bass (eighth-note roots: A2, F2, C3, G2). Export the pattern
   data (lengths, note ranges) for sanity tests.
3. **Scheduler:** lookahead pattern — a 50 ms `setInterval` schedules notes
   ~0.25 s ahead on the `AudioContext` clock; stop clears the timer (already
   scheduled notes ring out ≤ 0.3 s, acceptable).
4. **Toggle:** separate 🎵/🎵-off button in the HUD, independent of the SFX
   mute. **Default: off.** Persisted in `localStorage` key
   `whackamole.music.v1` (`"1"`/`"0"`).
5. **Play state:** when enabled, the loop runs continuously — idle, playing,
   and game over (arcade attract-mode feel). Starting requires a user gesture
   (the toggle click); `AudioContext` created/resumed lazily via the shared
   `getContext()` from `sound.ts`.
6. **Housekeeping:** pause when the window is hidden (`visibilitychange`),
   resume when visible if still enabled. Every call wrapped in `try/catch`:
   audio failure is a silent no-op and never breaks the game (§5 rule).

### 14.5 Architecture

- `src/game.ts`: + `Difficulty` type, `DIFFICULTY_FACTOR`, `clampDifficulty`,
  `loadDifficulty`, `saveDifficulty`; `popIntervalMs` gains the optional
  difficulty parameter (default 3).
- NEW `src/music.ts`: pattern data (pure), scheduler, toggle + persistence.
  All DOM/Audio calls guarded; Node-safe (no `document`/`AudioContext`
  access at module top level outside guards).
- `src/sound.ts`: export `getContext()` for reuse by `music.ts` (single
  AudioContext per app).
- `src/i18n.ts`: + keys `difficulty`, `level`, `musicOn`, `musicOff` (EN + FI,
  parity-checked).
- `src/App.tsx`: difficulty state + ref (read per hop), selector UI, music
  toggle wiring.
- Tests: `test/game.test.mjs` + difficulty table/clamp/persistence cases;
  NEW `test/music.test.mjs` (pattern length, note range, step duration);
  `test/i18n.test.mjs` parity covers the new keys automatically.

### 14.6 String keys (normative, EN + FI)

- `difficulty` — "Difficulty" / "Vaikeustaso" (selector group label).
- `level` — "Level {n}" / "Taso {n}" (per-button accessible label).
- `musicOn` / `musicOff` — key names follow `soundOn`/`soundOff` (name =
  resulting state): `musicOn` "Music on" / "Musiikki päälle" (aria label when
  music is off, i.e. the click turns it on); `musicOff` "Music off" /
  "Musiikki pois" (aria label when music is on).

### 14.7 Acceptance criteria (v0.4.0)

1. §14.1–§14.3 implemented exactly: 5 levels, level 3 ≡ v0.3.0 speed,
   on-the-fly change applies from the next hop without resetting the round.
2. §14.4 implemented: music toggle works, default off, preference persists,
   no audio asset or dependency added.
3. `node --test` passes (including new difficulty + music cases and the i18n
   parity test); `npm run build` zero errors.
4. Version bumped 0.3.0 → 0.4.0 in all three places; `npm run tauri build`
   succeeds; all three artifacts exist and are staged in `release/v0.4.0/`.
5. No new dependencies; Rust side unchanged except the Cargo version bump.
