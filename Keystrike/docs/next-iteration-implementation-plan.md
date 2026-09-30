# Keystrike — next-iteration implementation roadmap

Date: 2026-10-01 · Based on [design amendment](next-iteration-design.md) · **The user authorized implementation and designated v1.0.0 the first full release. Both stages are implemented together.** The original staged roadmap remains below; [verification](verification.md) distinguishes observed checks from remaining human/hardware gates.

This plan follows [AGENTS.md](../AGENTS.md) and the existing deterministic core/adapters/portable-storage architecture. The initial release remains the playable baseline. The feedback source and release history are preserved. Stage A improves campaign one; Stage B builds the return campaign on those systems. Suggested release boundaries are after A and after B, with versions selected then; publication needs authorization in the implementing conversation.

## 1. Current implementation gaps

`content.ts` owns twelve missions, cumulative input curricula, pacing and purchased tiers. `core.ts` has cyclic/alternating prompts and simple linear/sine movement; displayed boss pip thirds are not authored mechanical phases. `audio.ts` chooses between two shared melodies by a boss boolean. `render.ts` has one scene and mainly transient effects. `main.ts` combines menus/input/orchestration and builds the separate score view from current settings. `storage.ts` schema 1 lacks campaign/text locale and explicit final-boss victory; progress completion can mean surviving an escape. The shell has no user-facing resolution control.

These gaps call for shared typed content and explicit attempt context, not a framework replacement. Keep `core.ts` free of DOM/audio/disk. Extract small UI/input modules from `main.ts` as touched so results, text entry and settings do not become another monolith. Do not refactor unrelated games.

## 2. Contracts to settle before expanding content

| Contract | Proposed responsibility | Required invariant |
| --- | --- | --- |
| Campaign/mission definition | `content.ts` or typed content modules | Stable IDs, curricula, scenes, music, roster, rewards and corpus refs validated together |
| Device profile | Content + normalized input + storage | Explicit supported button set; no new input without rehearsal; default two-button |
| Encounter phases | `core.ts` + content | Core owns boundaries, decks, timers, movement and transitions; effects cannot affect validity |
| Attempt context | Core/orchestrator snapshot | Immutable campaign/mission/preset/layout/profile/versions/locale/variant/seed used for results and save |
| Presentation events | Core → render/audio/HUD | Stable target/reward identity, damage, phase and earned/pending state; bounded consumers |
| Text prompt/input | Dedicated adapter → core | Committed normalized input, one owner, no duplicate key/composition scoring or paste shortcut |
| Victory/reward transaction | Storage | Completion, boss defeat, unlock and cosmetics commit once; interrupted receipt cannot duplicate |
| Resolution | UI + narrow shell command | Allowlisted window/fullscreen actions only; arena and simulation remain fair |

Adopt explicit campaign IDs and typed board construction before campaign two. New boards include gameplay/scoring/content versions; word boards also include content locale/corpus and unequal-variant identity when necessary. Retain legacy board lookup. Keep stable purchased category IDs; new earned appearance IDs are not array offsets.

## 3. Stage A — existing campaign improvements

### A0 — compatibility and rule specification

Write migration fixtures for real schema-1 shapes: Practice selection, all intensity/motion combinations, primary-only, purchased tiers, old scores and completed-but-escaped L12. Define new snapshot shape and bounded validation; do not simply broaden old regexes without campaign/profile limits. Preserve valid backups and original corrupted files. Define boss-defeat evidence precisely against released star semantics and saved boss flags. No evidence means rematch, not invented victory.

Finalize phase transition timing, button teaching table and per-preset provisional pacing. Preserve current keyboard curriculum and Shift safety. Validate middle/Mouse 4 with a disposable native input harness before relying on extended mode. Outcome: a reviewed compatibility/input specification and deterministic content validation, including immutable board context.

### A1 — one-mission vertical slice

Build one complete mission with new scene/music identity, central introduction, at least two genuine commander phases, progressive damage, defeat payoff, cannon aiming, wave/threat HUD and scrap event feedback. Add a later-mission extended-button slice separately; L1 must not acquire untaught buttons merely to demonstrate the feature.

Core changes precede adapters. Establish phase/input/movement tests, then render/audio/HUD consumers. Exercise Standard, Relaxed, Pro and reduced motion through wave → mini → commander → results → Hangar → replay. Verify active deadlines pause during gated transitions, accepted hits stay valid during movement, and presentation can be disabled without changing final score/rewards. Review human readability before multiplying content.

### A2 — menus, results, progression and economy

Remove Practice and intensity UI; migrate their settings. Apply localized labels and preset identity consistently. Build result board from frozen attempt context, candidate row, durable Save refresh, Retry/Skip and eligible difficulty replay. Add campaign-one ending and explicit victory unlock data. Apply the proposed 611-scrap catalog without changing old ownership. Implement earned/pending scrap status with existing serialized transactions.

Outcome: complete user loop including failure/escape, score outside top ten, unsaved replay, final victory and skipped outro. Migration retains old score access and progress. No source feedback or initial release notes are rewritten as if this behavior shipped.

### A3 — full first-campaign content and Pro tuning

Author twelve backgrounds, twelve level loops, twelve commander themes/damage signatures, commander phase decks and signature endings, with varied regular/miniboss damage/defeat assets. Scene/audio reuse is structural; every mission still needs a recognizable identity. Put original asset provenance in `assets/manifest.md` when assets are made. Define motion bounds, prompt readability, per-profile fallback decks and music transition states in content.

Tune the three Pro axes independently with actual players, including late L11/L12 Shift lessons and Mouse-only patterns. A fast synthetic player establishes rule correctness, not sufficient challenge or beginner learnability. Preserve caps until evidence justifies expanding them. Review increasing menace, contrast and reduced-motion versions across all twelve missions.

### A4 — resolution, native and stage-A review gate

Add window presets/fullscreen through narrow native capability; no general shell/filesystem plugin. Test minimum size, 1200×860, common 16:9, and 5120×1440 plus Windows scaling. Inspect both locales, all menus, entrance/results overlays, pointer mapping, fullscreen exit and explicit resume after resize. Use decorative ultrawide wings around the fixed logical arena. Measure effect/audio/backing-buffer cost on a reference school laptop before claiming performance.

Stage-A acceptance requires feedback rows 1–28, migration, full loop, representative extended hardware, old/new boards, and portable native persistence. Record unavailable human/hardware evidence explicitly; do not call the milestone fully validated based only on the existing gaming PC.

## 4. Stage B — return campaign

### B0 — word encounter prototype and fairness gate

Implement a distinct word/sentence prompt with letter progress drawn beneath the boss and a cannon beam for every correct letter and committed-input adapter. Test EN/FI text using actual US/FI layouts, repeated letters, Backspace, spaces, punctuation, composition commits, focus changes, held keys, bulk paste and transitions. Resolve adapter behavior where `beforeinput` is absent/non-cancellable through committed-value reconciliation. Establish what input methods are supported before claiming compatibility.

Prototype one miniboss, commander and final sentence variant; include pointer equivalents for Mouse. Measure word/sentence deadlines with beginners and experts, preserving Relaxed and stronger Pro. Set scoring/accuracy denominators, phase pip counts, locale/corpus board keys and variant equivalence. Lock the active corpus regardless of subsequent UI-language changes. No ordinary key target may consume the same character. Outcome: reviewed complete mission slice with durable progress/cosmetic reward and no typing in Mouse.

### B1 — campaign content and earned cannon roster

Author twelve localized story beats, backgrounds and level loops; twelve regular/miniboss/commander sets with boss music/signatures/phases; returning Scrap King finale; EN/FI word pools and final sentence presets. Document a content inventory with stable IDs, grapheme lengths, supported characters, profile decks, phase timings, reward IDs and scene/music bindings. Human-edit both languages rather than literal length-matched translation.

Extend the Mixed text curriculum explicitly: mission briefings teach letters/spacing outside its first-campaign gaming cluster before timed use. Validate corpora against accumulated taught characters for each route and avoid introducing a new mouse button alongside a new text group. Keyboard and Mixed cannot share an assumed alphabet prerequisite merely because both use word encounters.

Implement twelve mission-earned appearance rewards with clear locked previews and once-only ownership. Existing purchased equipment remains available and score-neutral. Apply all stage-A effects, preset identities, scores/replay, HUD, hardware fallback and ultrawide layouts. Reuse orchestration, not campaign-one fixed array indexing. Extend content validators over both campaigns.

### B2 — campaign-wide and release-readiness gate

Exercise both twelve-mission tracks through unlock, victory, escape, replay, legacy migration, corpus selection, restart and equipment. Validate every sentence preset and supported character, all phase boundaries and profile fallbacks. Re-test real button delivery and text composition in the final packaged WebView2 build. Capture actual gameplay screenshots only after implementation; update README and future release notes then.

Stage B is complete only when feedback rows 29–32 and the shared A requirements hold. No placeholder second campaign or only-English corpus counts as the requested expansion.

## 5. Verification matrix for future implementation

| Area | Focused automated evidence | Native / human evidence |
| --- | --- | --- |
| Phases and movement | Seed reproducibility, boundaries, gated deadlines, no duplicate hits, reservations and caps | Readable paths/prompts; early gentle vs late challenging bosses |
| Presets | Track/layout/profile content matrix; Pro eligibility; no cosmetic mechanics | Beginner Standard/Relaxed and experienced Pro timing/pacing |
| Input | Fresh press/release, correct button semantics, no cross-owner key/text scoring | Middle/Mouse 4 without unintended navigation; real layout/Shift/IME cases |
| Results | Frozen board despite replay changes; successful/failed/double Save; cutoff and Skip | Keyboard/pointer navigation, Finnish wrapping, understandable candidate status |
| Economy | Old-tier preservation; exact prices; repeated reward receipts; atomic earned cosmetics | Scrap popups match durable/pending notices; satisfying progression |
| Migration | Old rules/intensity/profiles, old boards, victory evidence/escape, malformed/imported snapshots | Backup recovery, restart and moving portable folder |
| Campaigns | IDs/rosters/corpora bindings, per-route unlocks, sentence variant boards, reward bounds | Story/ending clarity and all twelve mission identities in both campaigns |
| Presentation | Bounded effect/event consumers; simulation independent of presentation | Both locales, mute/pause/music transitions, reduced motion, all presets |
| Display/performance | Coordinate transforms and same seeded rules at different render rates | 1024×768 through 5120×1440, DPI/fullscreen/resize and reference laptop |
| Portability | Snapshot schema/transaction regressions; package inventory | Final EXE local `data/` + WebView2 path; read-only/error/corrupt recovery |

Test high-risk boundaries with focused assertions, not snapshots mirroring every implementation detail. Use existing `npm run check`, formatting and browser/native smoke workflow when implementation starts. Broaden native smoke to representative new phases and text/button inputs. The existing L1 smoke alone cannot establish these changes. Record observations and limits in `verification.md`.

## 6. Persistence and deployment guardrails

Migrate validated old snapshots before validating them against the new schema. Plan a versioned migration chain (A adds profiles/victory/settings; B adds campaign/text/earned cosmetics), with backup recovery and interrupted-upgrade fixtures. Decide exact schema numbers when final fields are known. Revisit bounded progress/score capacities for two campaigns without allowing unbounded user content. Preserve balance, purchases and legacy boards; no AppData fallback or save folder change.

For an authorized implementation release: align app versions and comparison tuple, write new release notes with actual evidence, refresh real README screenshots, run the preserved final-package checks, exclude saves/caches/debug hooks, and use namespaced `keystrike-vX.Y.Z` tags/assets/checksums. Windows x64 and WebView2 remain the runtime contract unless separately changed. Publishing is not part of this planning request.

## 7. Planning outcome and remaining choices

User-confirmed: middle click rather than wheel scrolling; Keyboard/Mixed word encounters with Mouse pointer equivalents. Proposed and reviewable: stage A/B split, conservative accessibility preservation, extended opt-in profile, stricter Pro hypotheses, exact +50% price rounding, defeat-based second-campaign unlock, legacy migration and fixed-arena ultrawide layout.

Resolve exact Mixed introduction missions, authored content names/corpora, timing coefficients and hardware/performance evidence at the listed slice gates. These do not require beginning implementation now. No game source, assets, dependencies, binaries or published release are changed by this plan.


## v1.0.0 implementation outcome

The later user authorization supersedes the original docs-only boundary above. Stages A and B are implemented together for the first full release. Schema 2 migrates validated schema 1 directly; Mixed introduces middle click at L7 and Mouse 4 at L9 without a new key group. Final authored corpora, scenes and timing live in the shared content/core modules. The user's final amendment replaces any typing panel with words beneath the boss and a cannon shot for each accepted letter. Follow AGENTS.md for future updates and [verification.md](verification.md) for executed gates and remaining human/device evidence.
