# Keystrike development and release instructions

These instructions apply to this project only. Keep other games in the silly-lab catalogue independent. Read this file at the start of every Keystrike task; do not rediscover the workflow each time.

## Source of truth and planning

- Read `docs/game-design.md`, the current `docs/technical-decisions.md`, and the most recent release notes before planning a change. `docs/ReviewerFeedback.md` is historical source material; preserve it intact.
- The user authorized implementation, push, and the first binary release on 2026-09-30. Ordinary future implementation requests authorize local work, tests and packaging. Push/publish when the current conversation authorizes those actions; otherwise present the concrete local result first. Do not ask again for actions already authorized.
- Record accepted changes and their validation in `docs/review.md`. For changed gameplay, update design and implementation plan consistently. Avoid rewriting historical feedback or silently dropping requirements.
- Before coding an update, state the concrete intended behavior, affected modules, and focused validation. Small fixes need a short explanation; broader mechanics need a design amendment. Keep changes reviewable and preserve user work.
- Do not introduce accounts, services, telemetry, mechanical weapon power, Ctrl/Alt shortcuts, or new frameworks as incidental improvements. Do not claim educational efficacy, accessibility compatibility or low-end performance without observed evidence.

## Architectural patterns

- `src/content.ts`: typed curricula, twelve commanders, pacing, catalog, comparison versions and content validation.
- `src/core.ts`: deterministic simulation, input ownership, phases, deadlines, score and immutable presentation/reward events. No DOM, audio or disk. Step at 1/60 second; pause on wall gaps, never catch up unseen damage. Validate inputs before mutation; one step/ship reward once.
- `src/main.ts`: semantic DOM screens, input normalization, focus/pause behavior and orchestration. Keep menu input out of combat. Fresh presses only; discard partial pairs on pause, require key release before launch/resume.
- `src/render.ts`, `src/audio.ts`: bounded original presentation consuming the core. Never feed effect/music timing into hit validity. Respect reduced motion even for purchased effects; preserve contrast and large hit zones.
- `src/i18n.ts`: all user-facing translations and finger/key labels. Finnish is first-launch default; layout and language remain independent. Add both languages together.
- `src/storage.ts`: schema validation, serialized snapshot revisions, atomic economy changes, active reward receipts, explicit Save/Skip, ten-entry boards and export/import. Failed disk writes must not grant purchases or label pending currency saved.
- `src-tauri/src/lib.rs`: narrow app-owned storage commands, native launch and locking. No general filesystem/shell plugin permissions. One running instance per portable folder.
- Browser preview data is separate localStorage test data. Desktop settings, progress, cosmetics and scores use one JSON snapshot plus last-good backup. Never copy test saves into a release.

## Non-negotiable portable storage

All Keystrike-owned persistence, caches and WebView2 profile files stay in `data/` beside `Keystrike.exe`. There is no marker requirement and no AppData fallback, including development executables. Keep absolute `current_exe()`-based paths, `AppDirectoriesOverride`, and the explicit WebView2 `data_directory` override. Never use the current working directory to locate saves.

If the folder cannot be written, show a clear failure (native startup dialog, or in-game temporary-data notice after launch). Do not silently write elsewhere. Preserve damaged files, recover valid backups, and keep currency/purchases transactional. Move the whole executable folder to transfer progress. Read-only startup may refuse to launch; it must never create an AppData profile first.

## Repeatable commands (PowerShell, from Keystrike)

1. `npm ci` with pinned package-lock; Rust dependencies are pinned by Cargo.lock.
2. `npm run dev` for local browser review at `http://127.0.0.1:1430`; `npm run desktop` for native development.
3. `npm run check` for content/core/storage tests, strict TypeScript checking, and production frontend build.
4. `npm run smoke` for a self-contained Edge browser playthrough and actual README screenshots. Edge must be installed. The test starts/stops its own Vite server. Do not edit imported source while this runs.
5. `npm run release` builds/checks the Windows executable and produces versioned EXE, portable ZIP and SHA256SUMS under ignored `release/`. Each local run uses a fresh timestamped staging folder and refreshes the local versioned artifacts; published tags must not be overwritten without authorization. No installers or CI. Never ship `data/`, node_modules, target build files, debug inspection hooks or remote assets.
6. `npm run native:smoke` exercises the **final** packaged executable in a fresh writable folder: launch, change a setting, complete L1 through actual packaged WebView2 input, save, buy/equip, close/restart, then move the whole folder and repeat. It uses a test-only WebView2 debug port (9227), never a shipped debug flag. Check `data/save.json`, backup and WebView2 `--user-data-dir` arguments. Exercise corrupt backup, failed writes and read-only startup when storage code changes.
7. Record evidence and material untested cases in `docs/verification.md`. Test real OS layout/Shift/accessibility cases separately from synthetic browser input. School-laptop/child playtesting is human evidence, never infer it from unit tests or a gaming PC.

Run focused tests appropriate to each change plus required `check`; broaden when a failure or unresolved concern warrants it. Do not add implementation-mirroring tests. For gameplay changes, exercise complete phase transitions, fairness boundaries, all relevant presets, and economy/score independence. For UI changes, inspect screenshots at 1200×860 and Finnish 1024×768; all menus must work by keyboard and primary pointer.

Use `npm run format` / `npm run format:check` for the pinned source format. Preserve historical review documents and upstream license text. Keep the core/adapters readable rather than committing hand-minified source; Vite handles production minification.

## Versions, docs and publishing

- Keep package.json, package-lock.json, Cargo.toml, Cargo.lock package version, tauri.conf.json, UI version labels and README aligned. Use semver for the app. Bump the `VERSION` gameplay/scoring/content tuple when comparison rules/content change; old boards remain separate.
- Write `docs/releases/vX.Y.Z.md` describing behavior, validation, storage/runtime contract and known limits. Refresh README screenshots from the actual game when visibly changed. Maintain original asset/license provenance in `assets/manifest.md` and dependency notices.
- Release naming: tag `keystrike-vX.Y.Z`; title `Keystrike vX.Y.Z`. Keep unrelated games' tags/releases untouched. Upload `Keystrike-X.Y.Z-windows-x64.exe`, `Keystrike-X.Y.Z-windows-x64.zip`, and `SHA256SUMS.txt`. The EXE is standalone game code; Windows WebView2 is an explicit prerequisite, not bundled. Do not claim runtime-free support.
- Inspect `git status` and the staged diff. Stage only Keystrike plus its catalogue README row. Commit a concrete summary. Push to the authorized repo/branch. Create the GitHub release using `gh release create TAG ASSETS --title TITLE --notes-file docs/releases/vX.Y.Z.md`; use `--prerelease` for an initial/playtest build or when warranted by the changes. Do not overwrite an existing tag/release without authorization.
- Verify the remote commit and release asset inventory/size after publishing, and return the release link plus relevant limitations. For a created pull request, attach it to the chat as required by the app; a release does not require a PR artifact.

## Handoff quality

Report what changed, what was tested, and any material limitations. Keep a playable full loop (ordinary waves → miniboss → commander → results → Hangar → replay). Favor shared content/encounter systems over twelve bespoke engines. Preserve cosmetic fairness, optional names, offline ownership and the user's no-AppData rule in every iteration.
