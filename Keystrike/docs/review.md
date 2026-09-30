# Keystrike — review and decision log

Date: 2026-09-30 · Current design: 0.2 · Implementation plan: 0.1

Status: implementation/push/first binary release authorized by the user's 2026-09-30 request. The initial review text below records the earlier planning phase. [ReviewerFeedback.md](ReviewerFeedback.md) is preserved unchanged as the review source. Current decisions/evidence are in [technical decisions](technical-decisions.md) and [verification](verification.md).

## Feedback disposition

| Reviewer section | Decision in design 0.2 | Design location / plan delivery |
| :--- | :--- | :--- |
| 1: preserve fairness | Fresh presses, disjoint prompts, neutral misses, rehearsal/Practice/Relaxed, versioned local scores retained | §§5–6, 9, 11, 13; M0–5 |
| 2.1: own a cannon | Visible selected waterfront cannon is player identity and laser origin | §§1, 4, 10; M2–3 |
| 2.2: rewards | Stars with thresholds, 10/25/50 milestones, every-eight-step cosmetic overcharge, salvage HUD, boss celebration | §§9–12; M3–5 |
| 2.3: light narrative | Scrap King scavenger fleet; short optional flavor and twelve named commanders | §§1, 4, 7; M3–5 |
| 2.4: weapon choice | Three cosmetic skins; no score/rule differences | §10; M3–5 |
| 2.4: repair drone | Deferred with bonus boss pulse; keep first boss loop focused | §§2, 6; future review |
| 3.1–4: ten-finger path | F/J bumps, home position, finger map, reach/return, three rows and profile-specific punctuation | §§5.4, 8.1; M2–4 |
| 3.5: layout fact | Corrected: U/Y do not swap between US and FI/SV QWERTY; punctuation/additional letters differ | §5.2; M0/content validation |
| 3.6: word lasers | Deferred; full words/text composition not v1 | §§1–2; future review |
| 4: mixed input | Distinct WASD cockpit curriculum and mouse aim, not full alphabet interleaving | §§5.1, 8.2; M2–4 |
| 4.4: dual-action ship | Deferred; ordinary mixed targets still require one device each | §§2, 5.1; future review |
| 5: upgrade loop | Destruction salvage, cosmetic-only sequential catalog, Hangar, persistent equipment/name | §10, §13.3; M3–5 |
| 5.1: payout ambiguity | Regular-step value paid only on destruction; mini/boss flat payouts replace step payout | §10; transaction tests M3 |
| 6: every-level bosses | One mini and one larger boss every level, including a gentle two/four-strike L1 | §§6–8; M3–4 |
| 6.3: pips/phases | Grouped readable pips, two distinct learned-pattern phase boundaries; no secret deadline shortening | §6.2; M3–5 |
| 6.3: boss leak | One charge; surviving escape is successful defense/unlock, no kill payout; zero shield still ends attempt | §6.2; M3 acceptance |
| 6.3: pulse | Deferred optional bonus pulse, rather than adding a new boss target/input exception now | §§2, 6.2 |
| 7: combos | Pro keyboard/Mixed L11–12; whitelisted release-separated left Shift pairs; Standard unchanged | §5.5, §6.3; M0/M4 |
| 7.1: order/holds | Resolve “ordered pair, either order” as explicit either-order tap–release–tap, one scored step, 800 ms | §5.5; M4 boundary tests |
| 7.2: Ctrl | Excluded in v1 across browser and desktop; no assumption preventDefault controls OS shortcuts | §5.5; M0 |
| 8: spectacle | Night/space Helsinki, moon/aurora/mothership, turret/effects/audio; Calm/Standard/Spectacular, default Standard | §§4, 12–13; M3–5 |
| 9: priorities | P0 and P1 incorporated; P2 deferred. Slice retains boss/upgrade loop | §§2, 14; M3 review gate |
| 10: scope/performance/session | Shared boss engine, bounded effects, measured duration, Spectacular L12 worst case | §§8.4, 13–15; M4–6 |
| 10/12: engagement | Voluntary replay, fun, upgrade understanding, boss/cannon recall; ≥half recall is an exploratory target | §15; M3/M5 playtests |

## Corrections and explicit tradeoffs

- **Learning:** the keyboard path now teaches ten-finger foundations explicitly; it still cannot detect fingers or certify learning. Continuous word typing remains a separate later bridge.
- **Tutorial encounters:** the feedback requests a miniboss every level but exempts L1 in its example table. This draft chooses every level, with very gentle L1 encounters and no redundant mini phase changes.
- **Boss escape:** “not an automatic failure” now has a precise outcome. A surviving city unlocks the next lesson; boss defeat/three stars/payout remain reasons to replay. Zero shields always ends an attempt.
- **Modifier semantics:** a plus-sign chord is not interchangeable with an either-order sequence. The UI uses arrows/release guidance and explains the difference from held real-world shortcuts. No simultaneous chord required.
- **Modifier safety:** sparse Shift does not justify claiming immunity to OS accessibility shortcuts. Sticky/Filter Keys and side identity are investigated; accessibility settings are respected, Ctrl deferred, basic play remains available.
- **Punctuation:** US semicolon/apostrophe cannot be blindly copied to FI/SV positions. Guide/curriculum use actual unshifted profile characters, no hidden AltGr/dead-key requirement.
- **Level length:** typical Standard target becomes 60–120 seconds including bosses. Long deadline paths/Relaxed may exceed it; campaign is multi-session. This is a playtest goal, not a hard timeout.
- **Economy:** rewards and purchases need stable IDs/atomic revisions, not only a persistent counter. Cosmetic farming permitted; failed/pending rewards cannot fund a durable purchase until saved.
- **Visual settings:** reduced motion overrides purchased spectacle. Cosmetic width/pulse/skin never changes targeting, score, or latency, preserving existing board grouping.

## Reviewer questions answered in this draft

| Question | Chosen proposal |
| :--- | :--- |
| Mixed interleaving or WASD cockpit? | WASD cockpit with interleaved key/mouse weak points and independent curriculum |
| Cosmetic or mechanical upgrades? | Cosmetic only; no loadout score axis |
| Narrative depth? | Named bosses and two-line optional flavor, not branching story |
| Default visual intensity? | Standard; Calm and Spectacular selectable independently of rules |
| Pro a preset or post-campaign mode? | Preset with per-level eligibility after Standard/Relaxed completion |
| L1 boss-free? | Two-strike mini and four-strike tutorial commander |

## Remaining user review

The draft resolves routine game-design choices so it can be assessed as a whole. Before coding, confirm or change:

1. Windows-first/runtime-dependent package and desired reference hardware.
2. Twelve-level, three-track scope with cosmetic progression, Practice/Relaxed, and Pro.
3. Surviving commander escape unlocks next lesson without a kill reward.
4. Release-separated Pro exercises rather than simultaneous modifier chords.
5. The implementation milestone order and one-level vertical-slice gate.

Prices, timing, stars, translated flavor/names, and visual polish remain provisional pending playtests. The original per-level local board/save/skip choice remains; no automatic anonymous saving or campaign-total ranking was added.

## Revision log

| Date | Version | Change |
| :--- | :--- | :--- |
| 2026-09-30 | Design 0.1 | Initial proposal, no implementation |
| 2026-09-30 | Design 0.2 / Plan 0.1 | Reviewer feedback incorporated with documented corrections/deferrals; phased implementation plan added; documentation only |

Future accepted changes should revise design, plan, and relevant checks consistently. Record explicit implementation authorization separately when given.

### 2026-09-30 implementation authorization and execution

The user explicitly requested implementing the first version, retaining future-development patterns in an instruction file, pushing Keystrike to this repo, README screenshots, and a standalone binary release. This supersedes earlier documentation-only/publication restrictions. No separate scope reduction was requested.

The user rejected AppData artifacts while playing. This overrides the optional marker/default app-data proposal: saves, backups and WebView2 caches always stay under executable-local `data/`; read-only startup refuses with a clear error. `AGENTS.md` preserves this contract and the repeated update/release workflow.

The campaign/encounters/Hangar loop is implemented and exercised automatically. Supervised child playtests, real keyboard accessibility combinations and school-laptop performance remain unclaimed follow-up validation. The first public build is marked as a playtest prerelease with these limits; synthetic input does not establish every human-focused milestone criterion.

### 2026-10-01 initial player feedback — planning only

The user requested a coherent design and implementation plan for [initial release player feedback](initial_release_player_feedback.md), explicitly asking not to create the next version yet. The source feedback and historical reviewer/release documents are preserved. No implementation or publishing authorization is inferred from the earlier first-release request.

The [proposed design amendment](next-iteration-design.md) provides a complete traceability table and future rules; the [implementation roadmap](next-iteration-implementation-plan.md) provides module contracts, staged slices, migration and validation gates. Released design 0.2 remains the baseline. Proposed stages improve the original campaign first, then add the requested twelve-level return campaign; the second campaign is retained in scope.

**Confirmed by the user during planning:** “scroll button” means middle-click press; word encounters belong in Keyboard/Mixed, with parallel pointer encounters through the same second-campaign story in Mouse.

**Proposed reconciliations, not implementation approvals:** Spectacular default retains reduced motion; Practice removal retains untimed briefing rehearsal and Relaxed; device fallback retains primary-only as well as two-button play; Pro gains stronger pacing/authored phases without unsafe chords; leaderboards use frozen attempt context; costs round up at 1.5× without retroactive charges; campaign-two unlock requires final commander defeat rather than mere surviving escape. Legacy completion alone cannot prove defeat. Ultrawide scenery surrounds a fair fixed arena. Word corpora/layouts, scoring and deadlines need dedicated input and human validation.

Planning validation: compare all feedback paragraphs against traceability and the current content/core/storage/render/audio/UI contracts; review links, price arithmetic and documentation-only diff. No new gameplay tests, assets, dependencies, builds, binaries, commits, pushes or release publication are part of this round. Exact content, Mixed button introduction, timing and real hardware evidence are assigned to future slice gates.

### 2026-10-01 v1.0.0 implementation authorization

The user requested building the planned next version using AGENTS.md, then explicitly designated it the actual first release v1.0. Both planned stages are implemented together as v1.0.0. The prior documentation-only restriction is superseded for this work; the preserved development/package/release flow applies. The earlier playtest remains v0.1.0.

Accepted implementation choices: Mixed introduces middle/Mouse 4 at L7/L9 (no new key group there); schema 2 migrates validated schema 1; final commander defeat is persisted separately from lesson completion; returning word encounters use dedicated committed text input; shorter miniboss pools and final sentence variant boards preserve comparison context. App version is 1.0.0 and gameplay/scoring/content tuple is 2.2.2. Window size/fullscreen uses a narrow allowlisted native command; executable-local persistence and WebView2 overrides are preserved.

Human tuning/hardware gates remain explicitly unverified where no device or player session is available. Automated/browser/native evidence belongs in [verification.md](verification.md); first full release does not imply certified educational efficacy, school-laptop performance or all vendor/accessibility input behavior.

The user refined text presentation during implementation: **no typing popup**. Words/sentences appear beneath the boss in the arena, accepted letters immediately fire cannon beams, and completing the text resolves an authored boss pip. The committed-input adapter remains invisible and keyboard-accessible. This supersedes the earlier prototype panel.

Final execution evidence: 740 tests plus typecheck/build, formatting, browser L1 and both-campaign/extended/ultrawide checks pass. Final-package native baseline and supplementary checks pass, including Finnish words/sentence, Mouse 4 navigation guard, 5120×1440 fullscreen, failed-write no-grant and blocked startup. ZIP inventory and SHA-256 checks pass. Actual screenshots and v1.0.0 release notes are refreshed; details and remaining human/device gates are in verification.md.


### 2026-10-01 v1.1.0 small update

The user reported Pro continuation entering a locked next level, requested Next level emphasis after success when the next level is unbeaten, a fullscreen-safe main-menu Exit, no main-menu mode badge, and approximately 50% longer waves/minibosses/bosses across all modes. Implementation, push and release are explicitly authorized. The [amendment](update-v1.1.0.md) fixes route-specific eligibility and increases active combat workload rather than adding waiting. App version 1.1.0, comparison tuple 3.2.3; save schema 2 and executable-local storage remain.

Execution: 741 tests/typecheck/build and formatting pass. Actual results Pro replay and both continuation branches pass. Final native baseline passes, including fullscreen menu Exit (process code 0); native extended/Finnish word/sentence/storage-failure checks pass. Full browser campaign/ending/ultrawide checks pass; README screenshots, release notes, package inventory and checksums are updated. See verification.md for measurements and remaining human/device limits.
