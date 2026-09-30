# Keystrike — implementation plan

Plan version: 0.1 · Based on game design 0.2 · Date: 2026-09-30

Status: implementation authorized by the user's 2026-09-30 request, including Git push and binary release. This is the original milestone framework; [technical decisions](technical-decisions.md) and [verification](verification.md) record execution and remaining human validation. The user overrides app-data defaults with always executable-local saves and caches. [game-design.md](game-design.md) governs gameplay; [review.md](review.md) explains decisions. Timing, prices, and performance targets remain provisional.

## 1. Intended release and implementation approach

The proposed first release is an offline Windows x64 game with twelve levels in Keyboard, Mouse, and Mixed tracks, Standard/Relaxed/Pro/Practice rules, Helsinki night scenery, a visible cannon, per-level miniboss/boss encounters, cosmetic salvage progression, bilingual UI, local scores, and explicit portable data mode.

Use a deterministic TypeScript core, Canvas renderer, semantic DOM menus, Web Audio, and a small Tauri 2 shell. Choose exact supported dependency versions at setup rather than copying the unrelated whackamole project's versions or constraints. Do not alter that project. Keep everything under Keystrike except its root README listing. No backend, accounts, network content, full physics engine, or general frontend filesystem permissions.

Build complete behavior in small reviewable milestones. The first playable slice must test the shooter and upgrade loop as well as learning: a target drops, cannon fires, miniboss and commander resolve, salvage buys a visible change, score is saved or skipped, and data survives restart. Placeholder art is acceptable during this slice; removing bosses or purchases is not.

## 2. Decisions and gates before coding

| Decision | Planning default | When to resolve |
| :--- | :--- | :--- |
| Scope | Design 0.2, cosmetic-only upgrades, twelve levels, Pro Shift exercises | User design/plan review |
| First platform | Windows x64; browser preview for review/development | Before shell packaging |
| Runtime package | Small ZIP requiring WebView2; optional larger runtime-ready variant | Input/portability investigation; state prerequisite accurately |
| Reference hardware | Ordinary integrated-graphics school laptop; record model/OS/display | Before performance conclusions |
| Boss escape | Surviving escape unlocks next lesson, no kill payout, one shield impact | Confirm in design review; implement/test consistently |
| Pair semantics | Either release-separated order, 800 ms in Pro | Confirm in design review; validate usability/input delivery |
| Any-Shift fallback | Explicit profile, separate Pro comparison group | Input investigation |
| UI framework | Plain DOM unless a specific shared component need justifies React | Setup; document choice |
| Test tooling | Small unit runner plus real-webview/browser integration checks | Setup; tools must exercise behavior rather than duplicate implementation |

Open packaging/hardware questions do not prevent a complete plan, but no release claim is valid until tested. If investigations overturn a default, revise the affected documents before building on it. Later coding authorization covers routine reversible implementation choices; it does not silently approve major scope changes.

## 3. Work packages and dependency order

Dependency chain: M0 → M1 → M2 → M3 → M4 → M5 → M6. Storage, input, and presentation are designed as separate interfaces, but integrate them in each milestone rather than postponing persistence or accessibility until release.

### M0 — scope freeze and risk investigation

**Depends on:** explicit coding authorization and reviewed design/plan.

Investigate supported keyboard profiles, punctuation/ÅÄÖ, left Shift side detection, Caps Lock/composition, logical mouse mapping, WebView2 runtime behavior, narrow storage commands, portable writable paths, and fixed-step input timing. Exercise release-separated Shift with Sticky/Filter Keys enabled and enabled accessibility shortcuts. Check that gameplay suppresses permitted scroll/context actions only while focused; do not try to claim control over OS shortcuts.

Record results and selected versions in a future technical-decisions document. Validate the actual supported runtime configurations, not only a browser event simulator. Pin a reference machine and note its display scaling. Investigate atomic replacement/backup behavior on Windows and moved/read-only portable folders.

**Exit evidence:** key/profile matrix, device/side fallback behavior, modifier safety/usability findings, runtime launch matrix, data path/write proof, and a decision whether the proposed stack remains suitable. If reliable Shift practice is unavailable on a configuration, retain basic play and define its unranked/Standard fallback. Ctrl stays excluded.

### M1 — project foundation and deterministic contracts

**Depends on:** M0 decisions.

Set up only Keystrike's build/typecheck/test scripts and desktop configuration. Define phase machine, content schemas, accepted-input sets, normalized actions, entity/pip/attempt IDs, simulation clock/RNG injection, domain events, settings/localization keys, storage snapshots, and adapters. Build semantic menu navigation and a development canvas with scale conversion.

Create schema/content validators before authoring the campaign: unsupported key labels, unlearned boss prompts, intersecting active input sets, impossible counts, missing translations, bad catalog prices/prerequisites, and oversized data must be rejected. Establish version fields for schema, gameplay/scoring, and content; development boards never mingle with release boards accidentally.

**Exit evidence:** typecheck/build pass, deterministic core can be stepped without DOM/audio, validated starter content, menu focus usable by either selected device, narrow desktop persistence capabilities, no runtime remote resources.

### M2 — ordinary combat and first learning loop

**Depends on:** M1.

Implement Scout/Drifter/Armored regular behavior, fresh-press filtering, unique input reservation, pointer weak-point zones, hit/impact ordering, scoring/streak, shields, spawn postponement, drains, settle windows, and pause/focus/resize handling. Add the F/J home guide, A/D cockpit guide, primary mouse rehearsal, and bilingual basic HUD. Connect immediate cannon beam and original minimal hit audio.

Introduce settings persistence now, including volumes, language versus layout, visual settings, and device profiles. Test with normalized action replay and actual focused input delivery.

**Exit evidence:** key and mouse targets resolve exactly once, repeated press cannot farm, input conflicts never hit two targets, wrong input only resets streak, bounds/coordinates correct, blur/large time gap causes no catch-up damage, animation/audio failure cannot break logic. This is an internal checkpoint, not the promised full slice.

### M3 — complete one-level vertical slice

**Depends on:** M2 and persistence contracts from M1.

Complete L1 variants for all three tracks: wave A/drain, two-pip miniboss, wave B/drain, four-pip named commander, pips/phases/entrance/deadline, win/escape/shield-depleted outcomes. Implement stars, results, optional nickname and idempotent Save/Skip, level unlock, first salvage payout, and a simple Hangar with default cannon plus at least the five-salvage cyan purchase.

Build reward ledger, snapshot revisioning, atomic balance+ownership transactions, portable/app-data mode, failure notices, session-only pending rewards, and restart persistence. Add a basic Helsinki-night scene, cannon recoil, alien escape pod, boss music/fanfare, Calm/Standard/Spectacular switches, and reduced-motion overrides. The slice needs clear representation, not final art polish.

**Exit evidence:** a player completes one level, understands boss progress, buys/equips an observable cosmetic, chooses Save or Skip, restarts with the intended data, and replays without duplicated currency/scores. Test boss escape and zero-shield paths deliberately. Retain feedback from an exploratory supervised session before multiplying content.

**Review gate:** demonstrate the whole loop with the user. If scope needs reducing, simplify flavor, overcharge presentation, then Hangar polish; preserve bosses, upgrade loop, fairness and persistence.

### M4 — campaign content and progression

**Depends on:** M3 slice feedback.

Author twelve levels for three tracks and two key-layout groups, using reusable content generation/validation rather than duplicating engine logic. Complete finger mapping, punctuation-specific curricula, multi-card rehearsal, Mixed WASD neighbors, primary-only pointer alternatives, all twelve commander silhouettes/names/signatures, phases, deadlines, and content-versioned score groups.

Implement Relaxed throughout, custom unranked Practice, suggestion aggregates, Pro per-level eligibility, late release-separated Shift pairs, pair reservation/reset/timeouts/accuracy, and mouse-only Pro. Populate the full cosmetic catalog and persistent equipment/name. Add stars, overcharge, combo milestones, and localized short flavor consistently.

**Exit evidence:** all track/profile/preset content validates; learned-set requirements met; every level has a miniboss and larger boss; no imported alphabet lesson in Mixed; Pro replaces specified boss pips and never requests Ctrl. Campaign unlock/save behavior correct across retries and rules presets. Rehearsal is readable without timed text pressure.

### M5 — presentation, accessibility, tuning, and data resilience

**Depends on:** M4.

Replace placeholders with final bounded pixel art, twelve distinguishable commanders, three cannon skins, night skyline, aurora/mothership, skin sounds, level/boss loops, escape celebrations, Hangar previews, and bilingual polish. Optimize decorative rendering without altering combat timing. Verify all loadouts under reduced motion and every intensity.

Finish backup, migrations, export/import preview, corrupt-data recovery, read-only fallback, separate domain resets, mouse on-screen name entry, long Finnish strings, focus/error paths, and no-audio operation. Imports replace domains with explicit consequences; never merge currency by replaying receipts.

Playtest both ends of the age/skill span, tune deadlines/sets/prices, and record rationale. Content/scoring changes produce a new board version. The 60–120-second target must be measured with bosses/drains; accommodate slower Relaxed sessions rather than disguising their duration.

**Exit evidence:** usability/learning/engagement observations, reference-machine performance results under Spectacular L12 load, accessible selected-device navigation, credible session lengths, recoverable persistent data failures, complete English/Finnish strings.

### M6 — package, release candidate, and handoff

**Depends on:** M5 and closed material risks.

Build the Windows x64 portable ZIP and any explicitly selected runtime-ready variant. Include marker/data-location instructions, prerequisite guidance, controls/profiles, storage backup/reset instructions, notices/licenses, known limitations, and measured requirements. Test ordinary and read-only locations, moved folders, offline supported runtime, and missing runtime handling. No automatic public publishing or unrelated repo changes are part of this plan.

**Exit evidence:** fresh launch and restart smoke tests, final schema/content/type/build checks, focused gameplay regression suite, package inventory/hash and measured size, accurate WebView2 requirement, reference-hardware results, all design acceptance criteria addressed with evidence or an explicitly agreed limitation. User reviews release candidate before any separately requested publishing action.

## 4. Planned source responsibilities and interfaces

These are eventual files/areas, not folders or code created now.

| Area | Owns | Does not own |
| :--- | :--- | :--- |
| core | Simulation, phase transitions, target/pip state, score/reward events | DOM, file writes, audio |
| content | Typed level/profile/catalog/commander definitions and validation | Per-frame state |
| input | Fresh keys, side identity, logical buttons, coordinate conversion, normalized timestamps | Score awards |
| render | City/cannon/ship/laser snapshots, cached effects, preset caps | Hit validity or deadlines |
| audio | Lazy context, event sounds, music/fades/voice limits | Required gameplay feedback alone |
| ui | Semantic menus, guide/rehearsal, HUD, results, Hangar, localization | Authoritative combat mutation |
| storage | Schema validation, migration, revisions, reward/purchase commit, backup/import/export | Selecting difficulty silently |
| src-tauri | Window lifecycle, narrow native storage paths, packaging | Full game logic |

Core emits immutable domain events such as StepResolved, ShipDestroyed, ShieldHit, EncounterEscaped, PhaseChanged and AttemptResolved. Presentation consumes them without feeding cosmetic timing into the core. Economy consumes stable destruction IDs once. Score submission uses stable attempt IDs; record writes are serialized by revision.

Content specifies keys as semantic labels plus profile guide positions; side-specific modifiers have an explicit side requirement. Accepted-input sets drive conflict checks. Raw user keys are not logged persistently. Render snapshots expose positions/current prompt/pips/shield/visual events, not a second authority on hits.

## 5. Content and asset inventory

| Inventory | First slice | Full v1 |
| :--- | :--- | :--- |
| Track content | Three L1 variants | Twelve levels × three tracks, profile/preset variations |
| Rehearsals/guides | F/J, A/D, primary click | Finger map, all curriculum groups, buttons, Pro pairs |
| Encounters | One shared mini, Wobbler | Twelve commanders, shared mini variants, reusable phase behavior |
| City | One readable waterfront/cannon | Layered Helsinki night skyline, moon/aurora/mothership |
| Ships/effects | Scout, simple beams/pod/pips | Drifter/armor, skins/colors/shapes/impact presets, bounded celebrations |
| Cosmetics | Default and cyan purchase | Five lines, fourteen purchasable tiers, three total skins |
| Audio | Shot/hit/impact, level/boss loops, result cue | Four total sound-pack styles, victory/milestone/pod cues |
| Localization | Complete slice EN/FI | Every UI/error/flavor/catalog string, Finnish glyph coverage |

Fourteen tiers = three each in color/shape/impact/sound plus two skins. Shared rendering families avoid independently producing every combination. Maintain an asset manifest with origin/license and size. Use original artwork/music or verified appropriately licensed assets; no production assets are generated now.

## 6. Persistence sequencing and failure policy

Implement this contract before multiplying the campaign:

1. Create a fresh attempt ID with known track/profile/preset/content versions. Create an active credit ledger in the progress/economy snapshot.
2. Core resolves destruction once and emits attempt+ship ID with its payout. Serialized storage applies only unseen IDs in the current active attempt revision.
3. Successful durable commit updates visible available balance. Failed writes keep bounded session-only pending amounts with a clear notice; no purchase may spend them.
4. Before sealing/retrying/leaving, retry pending rewards or explicitly offer continuing without those unsaved rewards. Confirm any deliberate discard, then seal the old attempt so delayed events cannot reopen it. Gameplay is not blocked permanently by a failed disk.
5. At attempt resolution, commit unlock/stars and seal reward delivery. Results preserve a score candidate in memory until Save/Skip. A score decision never controls rewards or unlocks.
6. Purchase validates catalog/prerequisites/ownership/balance/revision, commits balance+ownership atomically, then reports success. Duplicate transaction IDs and stale revisions cannot charge twice.
7. Startup recovers the newest valid snapshot/backup. An interrupted combat attempt is closed without resuming hazards or score entry; only already committed rewards remain.

Bound receipt state to current/recent unsealed work; close it deterministically rather than keeping an unlimited history. Failed-write queues are bounded and block further reward-credit requests with a visible temporary-data notice if their cap is reached; they never silently claim saved currency. Import/reset seals active attempt state and invalidates pending revisions before replacing a domain.

Migrations preserve old data for recovery. Test process interruption at commit boundaries, not merely malformed JSON. Currency and cosmetics are local household progress, not a secure financial system; no anti-tamper backend is needed.

## 7. Verification matrix and evidence

| Area | Minimum meaningful scenarios | Milestone |
| :--- | :--- | :--- |
| Core determinism | Seed replay, fixed steps at 30/60 FPS, no catch-up burst, hit/impact tie | M1–2 |
| Input | FI letters/punctuation, US plain layout, Caps Lock, repeats, composition, blur/resume consumption | M0–2 |
| Pointer | Logical swapped buttons, secondary menu suppression, trackpad/primary-only, DPI/resize/margins | M0–3 |
| Encounters | Mini/boss every level, pips/phases, partial damage, escape/zero shield, drain/completion order | M3–4 |
| Pro | Both release-separated orders, exact window edge, overlapping hold hint, timeout one failure, left/right distinction, no collisions | M0/M4 |
| Scoring | Exact bonuses, pair once, star boundaries, no-attempt accuracy, board splits/ties | M2–4 |
| Rewards/shop | Bundle on kill only, no boss escape payout, duplicate/stale events, insufficient funds, write-failed purchase | M3–5 |
| Score flow | Every outcome Save/Skip, duplicate Save, nonqualifying top ten, failed save retry, remembered-name opt-in | M3–5 |
| Persistence | Restart, interrupted commit, corrupt/older records, backup, read-only location, moved folder, import/reset | M0/M3/M5–6 |
| Presentation | Silence, reduced motion overrides all loadouts, long FI labels, twenty pips at 1024×768, device-only navigation | M3–5 |
| Performance/package | Spectacular final boss/full effects/audio, warm launch/memory/size, 30 FPS, offline/runtime prerequisite | M5–6 |

Use unit tests for deterministic rules and transactions, integration checks for event delivery/focus/UI/storage, and real packaged-webview smoke tests for OS/runtime behavior. Automated synthetic events alone cannot establish shortcut suppression, layout mapping, device reach, or educational benefit. Run focused tests for the touched behavior and the required type/build/content checks; broaden on new failures or changes.

Do not create tests during this planning phase. Later tests should use externally observable invariants and boundary cases, not mirror function implementation. No learning or performance result is claimed before measurement.

## 8. Playtest and tuning protocol

Slice questions: Can a beginner identify a target, understand the cannon hit, follow boss pips, find Save/Skip, buy cyan, and notice the change? Does a failed defense invite another attempt? Does aiming feel responsive?

Campaign questions: Do finger prompts teach reach/return? Does mixed feel like cockpit input rather than alphabet drill? Are Pro pairs understandable without encouraging dangerous held shortcuts? Do late sequences reward alternating hands? Are phase boundaries legible? Is a first cosmetic affordable in L1–2?

Collect short supervised sessions with appropriate permission, no raw key logging or identity requirement. Cover younger Calm/Relaxed and older Standard/Pro groups. Record session configuration, participant count, action duration, accuracy/impacts, voluntary replay, time-to-second-level, optional fun 1–5, upgrade comprehension, and boss/cannon recall after three levels. Compare small untimed recognition tasks exploratorily; do not confuse higher game score with certified typing progress.

Use the design's ≥half name recall as a directional engagement goal, not a statistical universal claim. If recognition fails, simplify prompts/guides before accelerating play. If upgrades feel empty, improve visible/audio contrast first; mechanical power remains outside v1. Retune schedules/thresholds under new content versions and retain the previous board group.

## 9. Risks, response, and scope control

| Risk | Response / gate |
| :--- | :--- |
| Twelve bosses turn into twelve systems | Shared pip/phase engine; identity in silhouettes/flavor/audio; validate complete L1 first |
| Punctuation labels mismatch layout | Verify plain US/FI-SV profiles; semantic labels, per-profile guide, no hidden AltGr/dead keys |
| Modifier exercise triggers OS behavior | Release-separated whitelist, sparse Shift, real accessibility/runtime checks, Standard fallback; no Ctrl |
| Boss deadlines violate short sessions | Measure full phases/drains; tune wave windows/counts before claiming duration; Relaxed may be longer |
| Cosmetic glow hides learning targets | Draw prompts last, motion override, capped effects, visibility review of every loadout |
| Portable executable missing runtime | Launch matrix and explicit WebView2 prerequisite; separate size budget for bundled runtime |
| Reward retry/failed write duplicates economy | Stable IDs, serialized revisions, atomic snapshot, seal ledgers, fault-injection tests |
| Shared household progress confuses identity | Nicknames optional/opt-in; no claim of per-child profiles or cloud tracking |
| Scope expands before core fun | Gate at one-level slice; defer word lasers/dual targets/repair/endless |

No delivery-date estimate is promised before M0/M3 evidence. Track milestone exit evidence rather than inferring progress from file count. Asset production and playtesting are real work packages, not assumed automatic polish.

## 10. Coding handoff checklist

Before a separate coding task starts:

- User has reviewed design 0.2 and this plan and explicitly requested implementation.
- Confirm the agreed scope/platform and record any changed defaults in review.md.
- Keep ReviewerFeedback.md intact as source material; revise design/plan together for accepted changes.
- Start with M0, report concrete risk findings, and move through the dependency gates.
- Keep game code/assets/dependencies out of this documentation-only change.
- Leave later publishing, non-Windows promises, mechanical upgrades and deferred modes out unless separately requested.

The handoff is ready for review; no milestone has been executed and no test result or working game is implied.
