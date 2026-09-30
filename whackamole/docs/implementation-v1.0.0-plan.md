# Whack-a-Mole 1.0.0 — Implementation Plan

Date: 2026-10-01. Status: implementation complete for 1.0.0, with verification and release packaging. Governing requirements: [release design](iteration-v1.0.0-design.md). The v0.2 design is historical; new requirements here take precedence while Classic point/pace compatibility remains explicit. See [verification record](verification-v1.0.0.md) for actual evidence and pending human checks.

## Delivery status

| Slice | Actual status |
| :--- | :--- |
| S0/S1 | Baseline preserved; pure engine/input/pause and compatibility tests implemented |
| S2/S3 | Illustrated UI, Practice, Garden, Harvest, Classic, themes and ultrawide layouts implemented |
| S4/S5 | Profiles/stickers/records/storage recovery and 2–4-player Family implemented |
| S6 | Automated language/access/layout checks and visual review complete; child sessions and independent Finnish review pending |
| S7 | Optimized executable, MSI, NSIS and portable ZIP prepared; native fullscreen Exit/persistence and MSI payload tested |

The user explicitly authorized coding, Git push and 1.0.0 publication after the documentation stage, adding a mandatory fullscreen main-menu Exit button. External human sessions and additional DPI configurations are documented follow-ups rather than an assertion that those original review tasks have already happened.

## 1. Delivery approach

Build vertical slices and keep the app runnable. Internal checkpoints are not permission to label incomplete scope 1.0. Start with compatibility contracts, then engine/input, beginner UX, variety, persistence, Family, and release validation. Art, language and playtesting are delivery work, not a late decoration pass.

Use current dependencies and Node's built-in test runner. No services, new Rust commands or general-purpose engine framework. Keep changes in whackamole: the parent silly-lab repo currently has unrelated sibling changes that must not enter game work.

## 2. Proposed module boundaries

Names are guidance, not an instruction to create empty abstractions.

| Location | Responsibility |
| :--- | :--- |
| `src/game.ts` | Preserve existing tested Classic helpers and scoring/pace contracts |
| `src/modes.ts` | Mode configs, rules revision, safety and scripted surprises |
| `src/round.ts` | Pure round transitions, deadlines, appearances, summaries/eligibility |
| `src/input.ts` | Press/release capture, stale-ID rejection, click grace and input classification |
| `src/tape.ts` | Seeded RNG, complete immutable tapes and versioned fixtures |
| `src/progress.ts` | Eight stickers, goals, profile folding and bests |
| `src/storage.ts` | Guarded schema adapter, bounded boards, Legacy and failure states |
| `src/match.ts` | Setup, turn order, handoff, ties, restart and rematch |
| `src/App.tsx`, `src/components/` | Navigation, one scheduler, ref commit, Home/Practice/board/settings/results/profile/match screens |
| `src/Art.tsx`, `docs/assets.md` | Original inline SVGs and source/license manifest |
| `src/native.ts`, native capability/config | Official global window API for fullscreen/Exit; narrow permissions and work-area sizing |
| `src/sound.ts`, `src/music.ts` | Shared guarded audio context, volume/mute, pause lifecycle |
| `src/i18n.ts`, `src/index.css` | Typed EN/FI, responsive stable board, reduced motion/themes |
| `test/*.test.mjs` | Behavior tests with injected clock/RNG/storage; no real sleeps |
| `src-tauri/tauri.conf.json` | Supported native dimensions, minimums and final metadata |
| Package/Cargo manifests and locks | Version synchronization only during final release preparation |

## 3. Work packages

### S0 — Baseline and contracts

Depends on: nothing.

- Run current game/i18n/music suites and frontend build; record runtime versions and pre-existing failures.
- Capture current browser/native behavior and fixed-RNG Classic fixtures at all five levels. Verify timer-driven replacement, old accuracy and score ramp.
- Establish typed configs, round/appearance IDs, summaries, eligibility reasons and tape contracts from design sections 5–7.
- Inventory old storage keys and audio lifecycle; account for throwing `window.localStorage` acquisition.

Exit: baseline evidence and meaningful compatibility fixtures, including integrated scheduling rather than only helper arithmetic. No version bump.

### S1 — Engine, input and pause

Depends on: S0.

- Implement one active-play clock and ready/playing/paused/over transitions. Distinguish Classic hop policy from fixed waves while sharing appearance resolution.
- Add appearance arrays capped at two, consumed IDs, deadline ordering, counters and summary creation.
- Implement pointer press/release identity, double-click grace, keyboard repeat suppression, input categories and irreversible eligibility flags. Synchronously commit before effects.
- Pause on focus/visibility/settings and >250 ms callback gaps; explicit resume countdown. Clean up timers and stale round events on Replay/unmount.
- Mark debug overrides unranked and ineligible for progress.

Tests: same-frame duplicate input, two different simultaneous targets, hole reuse, expired press, press-empty/release-new-target, outside release, secondary button, grace boundary, stale round after replay, repeated key, paused/end-boundary input, simultaneous expiries, pause/resume and sleep without bursts. Replay Classic engine against all baseline fixtures, including mid-round level changes and score thresholds.

Exit: existing mode runs through the new scheduler with old point/pace behavior and specified intentional input/reporting improvements; no second hidden timer chain.

### S2 — Beginner path and desktop shell

Depends on: S1.

- Build Home, optional picture tutorial, Practice 2×2/3×3, center-first target and five-hit goals.
- Implement mode cards, separate results, pause/settings, live language/audio controls and replay without typing.
- Build the required visual overhaul: layered illustrated scenery, consistent expressive SVG characters, shaded hole rims, mode cards, avatar chips, rounded controls and shared screen typography/spacing. Record art sources in the manifest.
- Add whole-hole hit areas, standard pointer, stable HUD, visible focus and reduced motion. Keep every gameplay identity clear without color alone.
- Fit gameplay from 960×640 CSS viewport through 5120×1440 physical ultrawide, covering 16:9/16:10/21:9/32:9. Bound the board around 300–600 CSS px with 88 px minimum scored holes and larger Practice targets. Compose peripheral scenery and nearby non-playing panels instead of stretching the playfield.
- Change native sizing/minimums to fit available work areas; preserve resize/maximize and verify pointer coordinates after resize/DPI changes. Essential controls stay near the centered board on ultrawide.

Exit: Practice and navigation are complete; no reading/timing requirement; mouse and keyboard menus work; board does not scroll/crop. Review compact, standard and 5120×1440 compositions with actual rendered screenshots. Conduct an early beginner usability check before adding content.

### S3 — Garden, Harvest and feedback

Depends on: S1, S2.

- Implement complete mode tables, phase boundaries, difficulty scaling/floor, safe openings and bomb constraints.
- Generate/validate full fixed-wave tapes with stable RNG draw order even when overrides replace kinds. No click-driven generation.
- Implement two-target Harvest after 15 s, combo +2 every five rewards, escape semantics, star visitor and scripted golden waves.
- Add rim cues, target-side score/animation/sounds, restrained reward particles, finished result ribbons/new-best highlights and sticker reveals. Add short skippable transitions with static/reduced-motion equivalents. Themes alter scenery only; decorative effects never change clock/board layout.

Tests: draw boundaries; safety windows and consecutive-bomb constraints; holes unique and excluded from previous wave; interval rounding/floor; cap/phase boundaries; surprise selection across all five levels; no wave at round end; combo/reset edges; bomb escape harmless; no negative score. Compare full tapes/outcomes across different input histories and theme/motion/audio settings. First-ten-spawn equality alone is insufficient.

Exit: three scored modes work at all levels, surprises occur reliably, and same seed/config gives equal Garden/Harvest opportunities regardless of clicks.

### S4 — Profiles, progress and persistence

Depends on: S2, S3.

- Add six-profile cap, stable IDs, six avatars, optional sanitized names, Guest and optional guest save/skip.
- Add bounded schema storage, readonly Legacy, retained preferences, categorized top-10 and personal bests outside top-10 placement.
- Implement exactly-once completion folding, eight stickers, cross-round Explorer and immediate Practice milestone.
- Add session-only status for failed/corrupt/future storage without overwriting raw payload, confirmed deletion, goals, result details and one quiet break suggestion per visit.

Tests: malformed nested data, corrupt/future JSON, throwing acquisition/read/write/quota, old key untouched, sanitization and caps, category isolation/ties, zero attempts/two accuracy definitions, all sticker true/false boundaries, duplicate folding/replay, profile deletion, Guest isolation and personal best below board cutoff.

Exit: restart/upgrade preserve correct data; failures never falsely say saved; no unbounded history; selecting a sibling never transfers records.

### S5 — Pass-the-mouse Family

Depends on: S3, S4.

- Build 2–4-player setup, shared Garden fixed-level match and clearly labeled per-player-level handicap option.
- Generate Same round tape before turn one; replay it under unique turn round IDs with reset counters.
- Add waiting handoff/Ready, one turn each, shared winners on ties, rotating-order fresh-tape rematch and safe cancellation.
- Keep match scores out of solo boards; legitimate turns can fold profile totals/stickers once.
- Handle changed input/level with restart under original rules or end match. Closing app ends session-only match.

Tests: full-tape equality despite different click histories/pauses, no turn-state leakage, duplicate Ready, two/three/four players, ties, rematch order, restart/abandon, handicap label, keyboard menus preserving Mouse classification, and no solo board writes.

Exit: setup→handoff→results→rematch works with one mouse and no typing. Verify human handoff in the native app.

### S6 — Language, accessibility and child tuning

Depends on: S2–S5; language/visual checks also run throughout.

- Finish typed EN/FI including recovery/status/rules; get fluent Finnish review and test long text/names.
- Verify muted play, independent volume/music, reduced motion, focus/shortcuts and stable target recognition across backgrounds. Limit accessibility claims to tested features.
- Visually review Home, Practice, each scored mode, pause, Family handoff, results and stickers at compact, standard, 21:9 and 32:9 sizes. Capture screenshots at 1280×720, 1920×1080, 1920×1200, 2560×1440, 3440×1440, 3840×2160 and 5120×1440, plus the 960×640 CSS minimum. Check readable copy, crisp art, aspect ratios, panel bounds and central control placement. Confirm native DPI behavior on available monitors; distinguish browser-emulated resolutions from real monitor tests in the verification log.
- Arrange small supervised formative sessions, ideally two mouse beginners, two intermediate and two practiced children spanning 3–12 when available. Use normal guardian participation/permission; record anonymous offline observations, no identifying data.
- Suggested tasks: tutorial/Practice five clicks, Garden level 1 and chosen level, Harvest when comfortable, Family handoff. Stop when the child wants; no requirement to finish every mode.
- Observe independent pointer/click use, extra clicks, hazard/star recognition, understanding of handoff/results, confusion, frustration and voluntary replay. Repeated trouble finding Play or distinguishing targets blocks release; tune level-1 lifetime/size before effects.
- Update rules revision/config/fixtures after opportunity or scoring changes. Representative child sessions are a documented follow-up for this release; do not claim audience validation passed. The user has authorized publication with transparent verification notes.

Exit: automated/visual checks pass, no known critical usability failure, and human review status is explicit. Independent Finnish review and child observations remain follow-ups. Session duration alone does not prove fun or learning.

### S7 — Packaged release candidate

Depends on: all prior exits.

- Refresh stale README with final features, controls, supported display/layout, local data/Legacy behavior, verified accessibility and real runtime prerequisites.
- Add `docs/releases/v1.0.0.md` with final changes, migration and limitations. No unsupported mobile, online or full screen-reader claim.
- Synchronize 1.0.0 in package manifest/root lock metadata, Cargo manifest/app lock entry and Tauri config. Avoid unrelated dependency upgrades.
- Run frontend/native builds; inspect actual output names. Prepare portable executable ZIP, NSIS and MSI; document installed WebView2 requirements and installer handling rather than assuming portability includes runtime/data.
- Smoke packaged fresh install and v0.4.5 upgrade: Practice, all solo modes, Family, pause/focus, persistence/relaunch, FI/EN, audio and Windows scaling. Include native ultrawide/maximize behavior up to 5120×1440 where hardware is available; clearly report any hardware-verification gap while retaining full-resolution automated layout checks.
- Record checksums, versions, test evidence, prerequisites and known issues. Preserve app identity/storage origin unless an explicit migration is implemented.
- Commit/push/tag/publication are now explicitly authorized. Stage only this project's changes and publish verified packages/checksums from the recorded project commit.

Exit: all design release gates have evidence, generated packages launch under documented prerequisites, and no unresolved release-blocking failure/data-loss path remains.

## 4. Verification matrix and commands

| Area | Automated evidence | Human/native evidence |
| :--- | :--- | :--- |
| Classic | Old suites plus engine fixtures | Fixed-level baseline comparison |
| Timing/input/fairness | Boundary cases and full-tape comparisons | Mouse response, pause/sleep behavior |
| Beginner flow | Fresh/returning flow and goal states | Non-reader demonstration/five hits |
| Records | Schema/Legacy/failure/category/idempotency | Restart/upgrade and honest failed save |
| Family | Tape/order/tie/restart/cancel cases | Same-PC handoff and mixed ability |
| Language/access | Key parity, controls/keyboard events | FI review, focus, muted/reduced-motion play |
| Visuals/layout | Screen screenshots and pointer flows at minimum, 720p, 1080p, 1200p, 1440p, 4K, 3440×1440 and 5120×1440 | Native work area, resize/maximize and 100%/125%/150% scaling; note hardware coverage |
| Packaging | Builds, artifact presence/version | Portable and installed launch/restart |

Current suites: `node --test test/game.test.mjs test/i18n.test.mjs test/music.test.mjs`. With new suites: `node --test test/*.test.mjs`. Existing tests import TypeScript directly; record/use a Node runtime compatible with that setup. Frontend: `npm run build`. Native: `npm run tauri build`.

Browser flows must use real pointer press/release events through input validation rather than direct score mutations. Prefer available automation tooling, without adding a dependency just to mirror implementation. Keep a concise pass/fail verification log and screenshots for layout. CSS-token presence is not a substitute for visual/access review.

## 5. Execution order and scope control

No day-based estimates or schedule-driven feature cuts. The next coding session should execute the dependency order S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7, with visual review, translation and relevant checks alongside each slice. Completion is measured by working behavior and the release gates, not elapsed development time.

The visual overhaul and display support through 5120×1440 are required scope, alongside Practice, distinct Garden/Harvest, Classic compatibility, safe input/pause, Family fairness, category separation, stickers, FI/EN and honest persistence. Optional hammer cursor, additional particles and detailed profile totals can stay small; required visual quality must not be reduced to a late cosmetic task. Any core deferral requires explicitly revising the design/release promise.

## 6. Main risks and responses

| Risk | Mitigation |
| :--- | :--- |
| Helper tests pass while new Classic scheduling changes | Integrated baseline fixtures and native comparison |
| Beginners overwhelmed even on easy | Early Practice/Garden sessions and size/window tuning |
| Seed mistaken for equal opportunities | Full immutable time-based tape; different click histories |
| Double clicks hit replacements or count as misses | Appearance capture/grace/stale IDs and real pointer tests |
| Old data lost or mislabeled | Readonly Legacy, schema validation, app identity preservation |
| Feedback obstructs aiming | Stable board, local effects, no shake/hit-stop, reduced motion |
| Native layout excludes laptops or wastes ultrawide | Early work-area/DPI checks and composed 5120×1440 screenshots; bounded central board |
| Scope drifts to curriculum/services | Single-click spatial play and local competition; later ideas deferred |

## 7. Handoff

All planned implementation slices are delivered. The frontend runtime stack remains unchanged; Playwright was added only as a development test dependency. Remaining discovery is supervised audience/copy review and additional physical DPI/installer-lifecycle checks. Source, versions, documentation and packages now target 1.0.0; the verification record distinguishes completed checks from follow-ups.
