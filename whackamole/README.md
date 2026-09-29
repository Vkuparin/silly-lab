# Whack-a-Mole

A small Whack-a-Mole proof of concept built with Tauri 2, React 18, TypeScript, Vite, and Tailwind CSS v4.

A mole pops up in one of 9 holes. Click it to score. You have 30 seconds — the mole hops faster the higher your score climbs.

## v0.2.0 features

- **Persistent high-score board** (top 10) with nickname entry — save or skip after each round. Stored in `localStorage`, survives restarts.
- **Golden moles** worth **3 points** (15% of appearances, gold glow) and **bomb moles** worth **−2** (12%, floored at 0), clearly distinct visuals.
- **Round stats**: hits, misses, accuracy, best streak, goldens, bombs.
- **Sound effects** (synthesized with WebAudio — no audio assets) with a mute toggle (🔊/🔇) that remembers your choice.
- **Finnish localization** with an in-game **EN/FI language toggle** in the HUD — switches on the fly (even mid-round), defaults to Finnish, and remembers your choice.
- **Anti-spam hit validation**: exactly one score per mole appearance, guaranteed even for same-frame double-clicks.
- **Pure game logic** in `src/game.ts` with unit tests via `node --test` (zero new dependencies).

## Commands

| Command             | Action                                       |
| :------------------ | :------------------------------------------- |
| `npm run dev`       | Start the Vite dev server (web only)         |
| `npm run build`     | Type-check and build the frontend to `dist/` |
| `npm run preview`   | Preview the production build locally         |
| `npm run tauri dev` | Run the desktop app in dev mode              |
| `npm run tauri build` | Build a release desktop app                |

## Testing

### Unit tests

```sh
node --test test/game.test.mjs
```

Covers scoring (normal +1, golden +3, bomb −2 floored at 0), anti-spam hit validation (second click and same-frame double-click score 0), streaks, the spawn table (appearance 1 always normal; 12/15/73 via injected RNG), the speed ramp, and the high-score store (sort/cap-10/ties, corrupt-JSON recovery, name sanitization) — all against the pure logic in `src/game.ts` with an in-memory storage fake.

### i18n tests

```sh
node --test test/i18n.test.mjs
```

Covers EN/FI key parity (identical key sets, no empty translations) and the language persistence rules (default `fi`, invalid values fall back to `fi`, throwing storage degrades gracefully).

### Test seam

The app exposes `window.__whackamole.forceNextKind("normal" | "golden" | "bomb")` to force the kind of the next mole appearance. It exists for deterministic headless playtests (local single-user PoC; not a security boundary).

## Project layout

| File                 | Responsibility                                              |
| :------------------- | :---------------------------------------------------------- |
| `src/game.ts`        | Pure game logic: types, spawn table, scoring, streak, high-score store (injected storage adapter). No React, no DOM. |
| `src/sound.ts`       | WebAudio SFX (hit, golden, bomb) + mute persistence. All calls guarded — audio failures are silent no-ops. |
| `src/App.tsx`        | UI wiring: phases, HUD, grid, high-score panel, save flow.  |
| `src/i18n.ts`        | EN/FI string tables + language persistence. Pure module.    |
| `src/index.css`      | Tailwind v4 setup + golden-mole glow.                       |
| `test/game.test.mjs` | `node --test` unit tests (game logic).                      |
| `test/i18n.test.mjs` | `node --test` unit tests (i18n parity + persistence).       |
