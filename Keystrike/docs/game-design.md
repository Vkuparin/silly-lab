# Keystrike / Näppäinisku — game design document

Version: 0.2 · Date: 2026-09-30 · Status: implementation authorized; first playable release 0.1.0. See [technical decisions](technical-decisions.md) and [verification](verification.md) for evidence and remaining human validation.

**v1.0 baseline (2026-10-01):** This document retains the v0.1.0 baseline. The approved [v1.0.0 design amendment](next-iteration-design.md) governs removals, combat/presentation changes and the second campaign for the first full release. See its [roadmap](next-iteration-implementation-plan.md), [release notes](releases/v1.0.0.md) and [verification](verification.md).

This revision incorporates [ReviewerFeedback.md](ReviewerFeedback.md). The [decision log](review.md) records accepted proposals, corrections, and deferrals; the [original implementation plan](implementation-plan.md) records the first-release framework. All timing, prices, and budgets are provisional playtest values. The original documentation-only phase is historical; the first release is implemented, and the linked v1.0 and v1.1 amendments are implemented.

## 1. Game promise

**Take command of Helsinki's cannon. Find the weak point. Send the scavenger fleet packing.**

Keystrike is a lightweight, offline retro shooter that teaches keyboard and mouse skills through city defense. The player owns a visible futuristic waterfront cannon. Alien ships expose keyboard keycaps or mouse-button icons. Correct input fires a satisfying laser; destroyed ships drop salvage for new cannon looks, beams, and sounds. Every level includes a multi-strike miniboss and a larger named commander fight.

The Scrap King's cartoon scavenger fleet wants Helsinki's shiny metal. The player protects a recognizable nighttime waterfront beneath stars, aurora, and a distant mothership. Aliens escape in silly pods; no injured residents or graphic destruction appear.

Audience proposal: roughly ages 6–12, also suitable for older beginners. Keyboard mode offers a clear foundation for ten-finger typing: home position, finger mapping, three letter rows, punctuation, and special keys. Mixed mode develops gaming input fluency with the WASD cluster and mouse aiming. Mouse mode develops pointer movement and button control. Guidance cannot verify the finger used or certify typing; continuous words and text composition remain a later extension.

Visits should fit 5–15 minutes: a few levels, a Hangar visit, and untimed breaks. Standard action targets 60–120 seconds per level including bosses, approximately 20–30 minutes for the campaign before breaks. Relaxed deliberately permits longer levels. Finishing the campaign in one sitting is not expected.

## 2. Scope and requirement lineage

| Source | Requirement | Response |
| :--- | :--- | :--- |
| Original brief | Retro Helsinki defense, alien weak points, keys/clicks, lasers and audio | Night waterfront, cannon, readable targets, chiptune |
| Original brief | Keyboard-only, mouse-only, increasing difficulty, later two hands | Three distinct tracks and twelve-level curricula |
| Original brief | Lightweight, modern, portable, persistent settings/scores | Proposed TypeScript/Canvas/Web Audio/Tauri; local and portable data |
| Original brief | Enter or skip score after each level | Untimed optional nickname/save/skip on every outcome |
| Original brief | Review before coding | Documentation only; separate coding request required |
| Review incorporated | Shooter identity, upgrades, per-level miniboss/boss, ten-finger path, WASD mixed track | Required initial-release design scope |
| Review recommendations incorporated | Pro modifier exercises, stars, overcharge, named bosses, boss music | Initial-release scope with explicit fallback rules |
| Review extensions deferred | Word lasers, dual keyboard/mouse target, repair drones, endless | Later review after campaign playtests |

Review additions are distinguished from the original brief; this draft is not implementation approval. Out of v1: online services, multiplayer, ads, purchases, accounts, user-generated levels, complex physics, a geographic map, full nonvisual realtime combat, simultaneous chords, Ctrl combinations, wheel/drag lessons, endless, and full text composition. Touchscreen-only play is outside the initial goal.

## 3. Design pillars

1. **Shooter first, useful practice throughout.** A cannon to personalize, ships to drop, minibosses to break, and memorable commanders to defeat.
2. **Readability before difficulty.** Labels, aim rings, and current boss prompts stay clear above all effects.
3. **Fair on ordinary hardware.** Fresh presses, generous hit zones, supported layouts, primary-only pointer profile, no required simultaneous chords.
4. **Mistakes invite another attempt.** Wrong input resets streak, not city health; rehearsal and untimed Practice remain available.
5. **Short sessions and offline ownership.** Local progress, cosmetics and scores, explicit save choices, no runtime content downloads.

## 4. World and player identity

Helsinki's cathedral dome, cranes, islands, trams, and lit blocks form a stylized panorama, not a scale map. Three defense districts share one shield. One prominent active cannon fires every successful hit; other turret silhouettes are scenery. The player selects its skin and optional local nickname in the Hangar. Cannon names follow score-nickname sanitization.

The sky includes a moon, restrained starfield, aurora, and noninteractive mothership. Briefings give at most two optional lines of commander flavor; no branching narrative. Aliens have distinct silhouettes, big eyes, and comic machinery. Impacts ripple shields and dim windows. Defeated pilots escape in tiny pods.

Visual intensity is independent of rules difficulty and leaderboard grouping:

| Setting | Effects | Particle cap |
| :--- | :--- | :--- |
| Calm | Thin beam, minimal sparks, still background, no shake | 40 |
| Standard (default) | Beam glow, modest trails, local recoil and celebrations | 120 |
| Spectacular | Rich glow/trails, fragments, brief bounded shake | 240 |

Reduced motion overrides every preset and purchased effect: no shake, moving aurora, simulated slow motion, moving confetti, or large explosion movement. It retains a clear static hit pulse. No preset uses strobes or full-screen flashing. Labels/aim rings draw last outside shake transforms; decorative shedding never affects targets. Offer Calm + Relaxed to beginners and Spectacular + Standard/Pro to experienced players without automatically classifying them by age.

Conceptual scene: HUD with score/shield/salvage/pause; clear upper playfield; ships and labelled weak points; a waterfront cannon firing upward; optional keyboard/mouse guide below. Boss pips and name replace ordinary wave information without covering targets. Final art/layout require review.

## 5. Inputs, targeting, and fairness

### 5.1 Tracks

| Track | Combat | Learning |
| :--- | :--- | :--- |
| Keyboard | Displayed key auto-aims at its unique target | Home position, finger mapping, both hands, full key map |
| Mouse | Aim inside a weak-point ring and press its logical button | Pointer travel/tracking, primary/secondary buttons |
| Mixed | WASD-area key targets auto-aim; mouse targets require aiming | Gaming cluster in one hand, aiming in the other |

WASD does not move the cannon or cursor in v1: these are weak-point triggers. Mixed is an interleaved action loop with its own curriculum. A target requiring both devices is deferred. Keyboard-only menus/results/Hangar work with keyboard navigation; mouse-only equivalents work with the primary button, including optional on-screen name entry. Mixed requires both devices. Left-handed players can reverse suggested hand arrangement; custom one-hand practice remains available.

### 5.2 Keyboard rules and layouts

- Only a fresh key-down resolves a hit. Held repeat and duplicate event delivery cannot score again.
- Uppercase letter caps name a key, not shifted text. Letters accept either case/Caps Lock. Punctuation shows the actual unshifted character taught by the profile; Shift/AltGr symbols are not silently substituted.
- At most one active target owns any possible accepted keyboard input. A modifier exercise reserves both members throughout its lifetime/partial progress. Conflicting spawns wait. Malformed conflicts resolve only the closest-to-impact target, then stable spawn order.
- Wrong supported combat input is one miss and resets streak. It never damages shield, consumes ammo, or erases completed boss pips. Composition, repeats, system/unsupported input, settle-period input, menu input, and resume input are ignored.
- Escape pauses; Tab navigates menus. Alt/AltGr, Windows/Command, Ctrl combinations, function keys, and system shortcuts are not prompts. Space, Enter, arrows, and standalone left Shift are taught explicitly later.
- Handlers operate only with active playfield focus; menus/text fields retain normal behavior. Start/resume requires release before combat. Clear held/partial state on blur and transitions.

Support Finnish/Swedish QWERTY and plain US QWERTY independently of UI language. Verify profiles in a short input check. Character matching governs letters/punctuation; physical position supplies guide placement. Named left Shift uses code/location. If side identity is unavailable, offer a labelled any-Shift accessibility profile with its own Pro board group.

US and FI/SV QWERTY share ordinary alphabet/WASD positions; U/Y do not swap between these profiles, correcting the review's example. Extra letters and punctuation differ. Validate guides against supported OS layouts, not code names or interface language. See [Microsoft layout reference](https://learn.microsoft.com/en-us/globalization/windows-keyboard-layouts), [MDN key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key), and [MDN code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code).

US-International/dead-key variants and other layouts are not implicitly supported. Never prompt an unavailable character. Offer supported profiles/custom unranked practice; a detected mismatch pauses for correction without penalty.

### 5.3 Mouse rules

- A fresh pointer-down inside the visible weak-point ring with the requested logical button resolves one hit. Artwork outside it does not count; movement/releases are not attempts.
- Zones are at least 56 CSS pixels initially, 40 later, 64 in Relaxed/large-target practice. Never overlap/obscure them. Scale, DPI, resizing, and letterboxing must preserve hit testing.
- Teach primary before secondary; reflect left-handed swapping in icons/legend. Verify mapping in setup; see [MDN button semantics](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button).
- Wrong button or empty-sky click is a miss. UI/margins/inactive clicks are not. Double-clicks are ordinary fresh presses but cannot score twice on a destroyed step.
- Suppress context menus only in active play. No middle click, simultaneous buttons, pointer lock, or cursor warping required.
- Primary-only/trackpad substitutes secondary actions across the whole campaign and mouse Pro, with separate comparison groups.

### 5.4 Ten-finger foundation and two-hand progression

L1 shows F/J bumps and home position: index fingers on F/J, other fingers along the home row, thumbs near Space. Every new key gets a reach-and-return rehearsal and finger symbol/text, not just color.

| Finger | Common taught positions; profile additions shown in guide |
| :--- | :--- |
| Left little | Q A Z; named left Shift |
| Left ring | W S X |
| Left middle | E D C |
| Left index | R T F G V B |
| Right index | Y U H J N M |
| Right middle | I K comma |
| Right ring | O L period |
| Right little | P, right home punctuation/Ö/Ä, slash/hyphen positions, Enter, Å where applicable |
| Thumbs | Space; either thumb |

B-to-left-index is an adjustable teaching convention, not a scoring constraint. Digit guidance extends columns; arrows are navigation practice. Guidance cannot measure fingers used. Boss patterns alternate hands once learned; Mixed instead teaches a cockpit hand and pointer hand. Hideable guides, slower timing, and reachable custom sets remain available.

### 5.5 Pro modifier exercises

Pro is a rules preset, entered per level after its Standard or Relaxed completion. Keyboard/Mixed L11 and L12 contain respectively one and two mandatory left-Shift exercises in the boss, after rehearsal. Mouse Pro has no keyboard targets.

This is a release-separated sequence, not a simultaneous chord: `L-Shift → release → W` or `W → release → L-Shift`. Both orders accepted. Explain that ordinary real-world shortcuts often use held modifiers; the game sequence introduces their keys rather than defining universal shortcut behavior.

1. First fresh member starts an 800 ms simulation-time window. Release it, then freshly press the other within that window to resolve one pip/step.
2. Show partial progress/window. Settle 150 ms before the first member; no additional settle between members.
3. Wrong input or timeout clears partial state, registers exactly one failed attempt, and resets streak. Completed pips survive. Release/repeat is ignored; overlapping holds show a release hint without an extra miss or success.
4. First member alone is not a correct scored step. Completion counts once for accuracy; abandoned/failed pairs count one failure. Both members are reserved against other targets.
5. Pause freezes deadlines but discards partial pair on resume without penalty; held modifiers cannot carry into a new prompt.
6. Unranked Practice offers adjustable windows, default 1500 ms.

Whitelist: left Shift with W/A/S/D/Q/E/Space only. Ctrl, Alt/AltGr, Windows/Command, Escape, Tab, function pairs, and clipboard combinations are excluded from v1. Suppress only cancellable defaults for permitted active inputs; do not rely on preventDefault to make Ctrl+W safe or promise interception of OS shortcuts.

Keep Shift prompts sparse, never repeated-Shift drills. Windows supports a five-Shift Sticky Keys shortcut; do not change accessibility configuration. Verify Sticky/Filter Keys in the future input spike; offer Standard/custom practice if compatible reliable delivery is unavailable, without awarding a Pro-comparable result. See [Microsoft accessibility shortcuts](https://support.microsoft.com/en-au/accessibility/windows/windows-keyboard-shortcuts-for-accessibility). Respect retained modifier flags and assistive settings; never require disabling them to play the basic game.

## 6. Level loop, bosses, and outcomes

### 6.1 Phases

Setup → briefing/rehearsal → countdown → wave A → drain → miniboss → wave B → drain → boss entrance → boss → celebration/escape → results → optional Hangar → next briefing.

Every level, including L1, has one miniboss and a larger final boss. L1 uses a gentle two-strike miniboss and four-strike boss. This resolves the review's every-level requirement versus its suggested tutorial exception.

Split ordinary spawn time in half. Drain regular threats before encounters; no regular ships spawn during either encounter. Only one encounter ship/current prompt is active. No hidden/unpracticed inputs. New prompts settle 150 ms; settle input is ignored. Correct hit resolves immediately; animation cannot delay scoring. Boss entrance lasts two seconds, not actionable or part of its deadline.

### 6.2 Boss mechanics and deadlines

Show progress pips in rows of at most ten. Phases occur after roughly one-third/two-thirds of completed pips at distinct pip boundaries; two-pip tutorial miniboss has no redundant transitions. Change machinery/music/learned input patterns, never unknown keys or silently shortened deadlines.

Standard encounter deadline: `8 + 4 × strikeCount` seconds; Pro: `8 + 3.5 × strikeCount`; Relaxed: 1.5× Standard. Settle time is included. A four-strike tutorial boss gets 24 s; the twenty-strike final boss gets 88 s. Boss descends slowly with a time-to-impact indicator. These are tuning values, not established difficulty results.

Encounter impact consumes one charge and retreats. Miniboss escape does not block the final boss. Final boss escape with shields remaining gives **Defended — commander escaped**: successful defense/lesson unlock, replay invitation, no boss-kill payout. Zero shields at any time gives **Shield depleted** and immediately ends the attempt. No automatic failure solely because a commander escaped.

Completion requires every scheduled phase resolved and at least one charge. Boss destroyed gives **Commander defeated**. Completed partial pips give step points but no destruction bonus/salvage. Explosions do not delay completion. Optional bonus boss pulses/repair drones are deferred; defeats never spawn threats. Boss celebration runs after simulation ends, bounded/skippable, so decorative slow motion cannot alter scores.

### 6.3 Presets and recovery

| Preset | Shields | Timing/targets | Boards/progress |
| :--- | :--- | :--- | :--- |
| Standard | 5 | Authored timing; no pairs | Normal completion, own board |
| Relaxed | 7 | 1.5× travel/interval/encounter deadline; large zones; no speed bonus | Unlocks lessons, separate board |
| Pro | 5 | Regular travel/interval 0.9× Standard; encounter formula above; late keyboard/Mixed pairs | Per-level eligibility, own board |
| Practice | Unlimited/optional | Custom taught inputs, frozen targets/adjustable time | No ranks, salvage, or unlocks |

Restore shields each level/retry. Retry resets score/streak but preserves committed salvage. After two failures offer Relaxed/Practice without silently switching. Focus loss/hidden window auto-pauses movement, spawning, timers, streak, and audio. Resume requires explicit action/release/countdown; no catch-up. Leaving an active attempt confirms losing its unsaved score, not already committed salvage.

## 7. Enemies and commanders

| Class | Strikes | Role |
| :--- | :--- | :--- |
| Scout | 1 | Frequent readable success |
| Drifter | 1, gentle lateral movement | Tracking from L4 |
| Armored regular | 2 | Learned sequences from L7 |
| Miniboss | 2–5 | Multi-strike checkpoint every level |
| Commander | 4–20 | Larger final encounter every level |

Only current prompts activate. No decoys, surprise relabeling, compulsory double-click timing, or tiny adjacent zones. Mouse encounters use button/aim sequences with the same pip count; Mixed alternates cluster-key/pointer steps; Keyboard alternates hands.

| Level | Provisional English / Finnish commander | Signature |
| :--- | :--- | :--- |
| 1 | The Wobbler / Vaappuja | Wobbling saucer, tiny helmet |
| 2 | Rusty Rex / Ruoste-Rex | Rust-red jaw hull |
| 3 | Zorp the Collector / Keräilijä Zorp | Oversized scrap claw |
| 4 | Disco Dax / Disko-Dax | Disco-ball armor |
| 5 | Magnet Molli / Magneetti-Molli | Magnet wings |
| 6 | Drill Duke / Poraherttua | Blunt cartoon drill |
| 7 | Bolt Baron / Pulttiparoni | Bolt crown |
| 8 | Nebula Nelli / Tähtisumu-Nelli | Ringed engines |
| 9 | Gear Gert / Ratas-Gert | Gearwheel shield |
| 10 | Comet Kiki / Komeetta-Kiki | Twin tail fins |
| 11 | Admiral Clank / Amiraali Kolina | Antenna bridge |
| 12 | Scrap King / Romukuningas | Crown and salvage crane |

Use one encounter system and reusable sprite parts; silhouettes/palettes/pilot reactions distinguish twelve commanders without bespoke mechanics. Finnish names/flavor require language review.

## 8. Curriculum and difficulty

### 8.1 Keyboard: ten-finger foundation

| Level | New material / focus |
| :--- | :--- |
| 1 | F J, home position, tactile bumps |
| 2 | D K, middle-finger reach/return |
| 3 | S L, ring fingers |
| 4 | A and US semicolon / FI-SV Ö, little fingers |
| 5 | G H, full main home row |
| 6 | Home-row consolidation, Space/thumbs, US apostrophe / FI-SV Ä reach |
| 7 | Q W E R T Y U I, successive small rehearsal groups |
| 8 | O P and FI-SV Å, upper-row consolidation |
| 9 | Z X C V B N M, comma and period |
| 10 | US slash / FI-SV hyphen position, three-row/punctuation consolidation |
| 11 | Digits 1–0, Enter, arrows, named left Shift, successive rehearsals |
| 12 | All learned inputs, alternating-hand commander; Pro pairs |

At most four new inputs per rehearsal card. Larger sets use successive untimed cards before countdown; no unannounced mid-combat lesson. Bosses use verified learned keys. Guides/schedules are profile-specific and versioned. US punctuation includes semicolon/apostrophe/comma/period/slash. FI-SV uses its actual Ö/Ä/Å and unshifted comma/period/hyphen positions, not shifted US equivalents or dead/AltGr symbols. Capital-text production and extended symbols remain future lessons.

### 8.2 Mixed: WASD cockpit

| Level | Keyboard additions/focus | Mouse focus |
| :--- | :--- | :--- |
| 1 | A D, cockpit stance | Large stationary primary targets |
| 2 | W S, complete WASD | Familiar primary aim |
| 3 | Q E | Wider lanes, existing primary aim |
| 4 | No new keys; consolidate | Secondary click, gentle tracking |
| 5 | F Space | Learned buttons |
| 6 | Z X C | Consolidate aiming |
| 7–8 | Entire cluster, faster alternation | Longer travel, sequences |
| 9–10 | Cluster prioritization | Moving learned targets |
| 11 | Named left Shift; Pro one pair | No new buttons |
| 12 | Full cluster; Pro two pairs | Final commander |

L1–2 roughly half keys/half primary-mouse steps; later authored counts about 60% keys/40% pointer, tuned for alternation. No new keyboard group shares a level with a new button action. No full-alphabet/digit/arrow curriculum imported into Mixed combat.

### 8.3 Mouse

L1 large stationary primary targets; L2 lanes; L3 secondary rehearsal; L4 movement; L5 button alternation; L6 consolidation; L7 multi-zone sequences; L8 wider travel; L9 prioritization; L10 moving sequences; L11 density; L12 commander. Primary-only substitutes throughout. No keyboard/wheel/middle/simultaneous buttons, including Pro.

### 8.4 Standard pacing baseline

Wave window is ordinary spawn time, split around the miniboss; excludes drains/entrance/encounters/breaks. Interval is minimum between launches; travel is spawn-to-impact. One miniboss/boss always follow their phases.

| Level | Wave window | Interval | Regular travel | Max regulars | Mini pips | Boss pips |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 20 s | 5.0 s | 10 s | 1 | 2 | 4 |
| 2 | 24 s | 4.0 s | 10 s | 2 | 2 | 5 |
| 3 | 24 s | 3.5 s | 9 s | 2 | 2 | 6 |
| 4 | 28 s | 3.0 s | 9 s | 3 | 3 | 7 |
| 5 | 28 s | 2.6 s | 8 s | 3 | 3 | 8 |
| 6 | 30 s | 2.4 s | 8 s | 3 | 3 | 10 |
| 7 | 30 s | 2.2 s | 8 s | 4 | 4 | 11 |
| 8 | 32 s | 2.0 s | 7.5 s | 4 | 4 | 12 |
| 9 | 32 s | 1.8 s | 7.5 s | 4 | 4 | 13 |
| 10 | 34 s | 1.6 s | 7 s | 5 | 4 | 15 |
| 11 | 34 s | 1.4 s | 7 s | 5 | 5 | 16 |
| 12 | 36 s | 1.2 s | 6.5 s | 6 | 5 | 20 |

60–120 s describes typical successful Standard play, not maximum deadline paths: final-level encounters nearly expiring can approach three minutes. Relaxed may take longer. Measure before claiming session fit. Pro pairs replace boss pips, not extra unlisted counts.

Full fields/prompt conflicts/overlapping labels postpone spawns without catch-up bursts. Validate counts and deterministic seeds. Regular unfinished-step limits: 2 at L1–3, 5 at L4–6, 8 at L7–9, 12 at L10–12. Encounters allow twenty total pips but only one active prompt/two reserved pair keys. Sequence previews are not active targets. Fixed ranked schedules do not adapt silently; Practice may favor missed inputs.

## 9. Scores, stars, and feedback

Per-level score resets each attempt:

- 100 per completed step/pip. Pro pair is one award.
- On destruction once per ship: `floor(50 × remainingDeadline / initialDeadline)`, clamped 0–50. Relaxed omits this.
- Correct-step streak bonus `5 × min(previousStreak, 10)`, capped 50. Miss/impact resets streak.
- Successful defense: 100 per remaining shield. None on shield depletion. Boss escape permits defense bonus, not kill bonus.
- Cosmetics/overcharge/salvage/intensity never modify score or rules.

Accuracy = completed steps / (completed steps + failed attempts); none shows —. First pair member is not separately counted. Show destroyed/spawned ships, escapes/impacts, remaining shield, best streak, median actionable-to-completion response time, and up to two practice suggestions with at least three observations. Mouse timing includes travel; no cross-mode ability ranking. Exclude menu/repeat/composition/release/settle/ignored system input. Feedback is descriptive, never shaming.

Stars: 1 for successful defense including escape; 2 for boss destroyed, ≥60% starting shield remaining and ≥80% accuracy; 3 for boss destroyed, full shield and ≥95% accuracy. Shield depletion: 0 and neutral retry. Thresholds provisional, normalized for Relaxed. Best stars stored per track/profile/preset; no accuracy gate on unlocks.

Every eight completed correct steps charges the next hit's cosmetic larger beam, cumulative within attempt and not lost on a miss. Streak 10/25/50 gets a short bilingual milestone/fanfare once per threshold per attempt. Neither clears extra ships nor adds score/salvage. Accessibility overrides apply.

## 10. Salvage, upgrades, and Hangar

Salvage (FI Romu; quantity label Romua: 12) is local cosmetic currency, paid on destruction only:

| Defeat | Payout |
| :--- | :--- |
| Regular | 1 per required step, paid as one bundle on destruction |
| Miniboss | 10 total, replacing step payout |
| Boss L1–6 | 25 total |
| Boss L7–12 | 50 total |

Replays/failures keep earned salvage; cosmetic farming is permitted and cannot affect ranks. Practice pays nothing. Skip score does not skip salvage. No random loot, real-money value, timed pressure, or currency loss on failure.

Stable attempt+ship reward IDs commit exactly once at destruction. Failed saves display session-only pending balance and retry identical transactions. Purchases use durable available balance, not pending rewards; play may continue without falsely claiming persistence.

Hangar opens from Home/after score decision, never during combat. Preview cannon, balance, equipment, sequential tier catalog, cost, locked/owned states. Purchase/equip are separate; preview/name editing free. Name follows sixteen-grapheme rule. No stats:

| Line | Default → unlock tiers | Cost per new tier |
| :--- | :--- | :--- |
| Beam color | Mint → cyan → violet → rainbow | 5 / 15 / 35 |
| Shape | Single → wide core → twin → pulse | 10 / 25 / 50 |
| Impact | Sparks → trail/glow → starburst → spectacle | 10 / 30 / 60 |
| Sound | Blip → zap → hum → deep boom | 10 / 25 / 45 |
| Skin | Standard cannon → railgun → heavy cannon | 25 / 60 |

Sequential prices buy the indicated tier. Equip one item per category. At least five buyable tiers visibly/audibly change the cannon. First color costs five, reachable from first miniboss alone. All timing, hit zones, shield, scoring, and reaction latency remain identical. Wide/twin/pulse still hit one validated step; no splash damage. Label readability, loudness normalization, motion/intensity overrides apply to every loadout. Mechanical upgrades require future review; no loadout board axis in v1.

## 11. Results and high scores

Every outcome opens untimed results: named outcome, score/stars/metrics, salvage earned/saved/pending, optional nickname, Save score/Skip. No nickname needed for progress/purchases. Blank stores an anonymous marker displayed Anonymous/Nimetön. Trim/control-strip/cap sixteen graphemes, Finnish characters supported, text-safe rendering; ask for nickname, not real name. Remember only by opt-in, never from another leaderboard player. Mouse on-screen entry optional; anonymous/Skip easy.

Save submits once to top ten. Repeated activation cannot duplicate. Nonqualifying attempts explain not retained; no hidden archive. Failed qualifying writes offer Retry save/Skip. Continue/Replay/Hangar/Menu explicitly resolve an undecided choice as Skip, never silent save. Progress/salvage independent.

Board key: track + rules preset + level + key/device profile group + gameplay/scoring/content version. Primary-only/side-remapped Pro split where relevant. Custom rules/sets unranked; UI language, loadout, visual intensity, guides and reduced motion do not split. Sort score descending, successful defense, commander defeated, fewer impacts, earlier saved timestamp, stable attempt ID. Local household records, not tamper-proof competition. No campaign-total board in v1.

## 12. UI, audio, localization, and accessibility

Screens: Home, setup/levels, device check, briefing/rehearsal, playing HUD, pause, results, Hangar, scores, settings/data management, Practice. HUD shows score/shield/salvage/level/encounter progress and Pause. Menus/previews do not occupy combat space.

Finnish defaults; English available from first launch/every menu. Layout independent. All prompts/flavor/shop/errors/accessibility labels externalized. Clean readable key font with Finnish glyphs; headings may use pixel lettering. Check long Finnish text at 1024×768.

| English | Finnish proposal |
| :--- | :--- |
| Hangar / Cannon | Hangaari / Tykki |
| Salvage / Upgrades | Romu / Parannukset |
| City shield / Accuracy | Kaupungin suojakilpi / Tarkkuus |
| Save score / Skip | Tallenna tulos / Ohita |
| Commander defeated | Komentaja kukistettu |
| Defended — commander escaped | Kaupunki turvassa — komentaja pakeni |
| Shield depleted / Try again | Suojakilpi tyhjeni / Yritä uudelleen |
| Calm / Standard / Spectacular | Rauhallinen / Normaali / Näyttävä |
| Pro / Practice | Pro / Harjoittelu |

Rules preset/intensity are clearly separate controls. Gameplay settings apply next level/explicit restart. Language/audio/visuals change while paused. Retain contrast, visible focus, text/symbols plus color, selected-device menu operation, scalable labels, one-hand practice, no forced fullscreen, no timed menus. Semantic menus/results do not imply full screen-reader realtime combat. Resize pauses as needed for geometry.

Original synthesized chiptune: 30–60 s level loop, reusable distinct boss theme, victory fanfare, normalized per-skin effects. SFX 60%, music 30%, master on proposed defaults, audio only after user gesture. Persist separate volumes/mute; rate-limit misses, cap twelve voices, duck/fade transitions, never stack resumed loops. Audio failure nonblocking; necessary cues have visual equivalents.

Beam visible next render frame, lasts 100–150 ms; destruction 250–400 ms. Boss celebration ≤3 s, skippable after first second, simulation already ended. Banners never cover actionable prompts. Effects cannot extend simulation/score deadlines.

## 13. Technical proposal, persistence, and portability

### 13.1 Architecture

Propose TypeScript + Vite, Canvas 2D, semantic DOM menus, Web Audio, Tauri 2 desktop. Plain DOM is sufficient; React only if justified during setup. Exact dependencies/versions selected later. Bounded 2D design does not require a full engine.

Deterministic core owns phases/entities/accepted actions/combat/scoring/rewards/events. Content owns curricula/roster/schedules/catalog/localization. Adapters own input/render/audio/UI/persistence. Fixed-step simulation, monotonic time, timestamped normalized queue, stable attempt/entity/pip IDs, injected RNG. Valid hit wins simultaneous impact tie; ordered mutation prevents repeat awards. Event-driven storage cannot delay firing; no frame-state component rerenders. Large time gaps pause.

Future source areas: core, content, input, render, audio, ui, storage, src-tauri. They are not created in this phase.

### 13.2 Portability contract

Windows x64 proposed first; other platforms need separate builds/tests. Tauri requires WebView2 on Windows: executable portability does not guarantee runtime-free launch. See [prerequisites](https://v2.tauri.app/start/prerequisites/) and [runtime distribution](https://v2.tauri.app/distribute/windows-installer/).

User override, 2026-09-30: **always** adjacent `data/` for settings/scores/lessons/cosmetics **and WebView2 cache/profile**. No marker or AppData fallback. Move the whole folder to transfer. Show active location. Read-only startup gives a clear error; later write failures offer explicit temporary/pending play and retry. Expose narrow app-owned storage commands only. The first ZIP requires an installed WebView2 runtime; it is not bundled. Browser preview uses separate browser storage/export. Ordinary offline play needs no admin/account/network content.

### 13.3 Persistence and transactions

Versioned records: settings (language/track/preset/profile/audio/intensity/motion/guides/nickname opt-in); progress (unlocks/best stars/commander defeat/Pro eligibility); economy (durable balance/owned tiers/equipment/name/reward receipts); score entries (outcome/metrics/IDs/nickname/timestamps/content versions); optional practice aggregates (no raw key log/telemetry).

Progress/economy share one transactionally replaced snapshot. Active attempt stores credited reward IDs; seal its credit ledger before retry starts a fresh ID. Crashed combat never resumes: committed rewards remain, unfinished score is discarded. Sealed attempts cannot receive events. Bounded receipts plus ordered revisions reject stale duplicate reward/purchase events.

Failed reward writes queue bounded session-only pending updates, visibly unsaved, retried by identical IDs. Before sealing/retrying/leaving, retry pending rewards or explicitly confirm continuing without those unsaved rewards, then seal the ledger against delayed events. A full queue shows a temporary-data notice rather than silently claiming additional saved currency. Purchases check prior tier, ownership, durable balance, price and revision, atomically commit balance+item, then show success/equip. Failed write purchases nothing. Failed progress saves keep session unlock with clear retry, not a persistence claim.

Desktop atomic replacement/last-good backup where supported; load validates schema/size/bounds and migrates. Preserve corrupt originals. Export/import bounded validated JSON with preview/backup; replace selected domains instead of merging currency ambiguously. Import seals ledgers and never replays rewards.

Separate confirmed resets: scores, lessons, cosmetics, settings. Lesson reset retains cosmetics; cosmetic reset clears balance/collection/equipment but not scores/lesson access. Explain consequences. No personal information required.

### 13.4 Budgets

Goal 60 FPS on agreed integrated-graphics school laptop; correct at 30 FPS. Six regular ships/twelve unfinished regular steps; one encounter with twenty total pips/one active prompt; maximum 240 particles (lower caps by preset); twelve audio voices. Pool/cached glow; drop decoration under load, never inputs/rules.

Provisional warm-menu <2 s, total app/webview memory ~150 MB, compressed frontend <5 MB, runtime-dependent ZIP ~25 MB. Measure, not promises. Worst case: Spectacular L12 boss with purchased starburst/pulse, aurora, HUD rewards, and boss music.

## 14. Delivery order after authorization

Verify input/layout/modifier/runtime/storage risks, then one complete level in all tracks with miniboss/boss, salvage purchase, lasers/music and save/skip. Expand twelve levels/Pro after that loop is understandable and fun. The [implementation plan](implementation-plan.md) defines dependencies, inventory, tests, and gates.

Slice must retain bosses/upgrades. If necessary simplify flavor first, overcharge presentation second, Hangar polish third; never replace fairness/persistence/accessibility with deferred systems.

## 15. Acceptance and playtesting

Future checks, not already executed:

1. Every level/track has miniboss and larger boss; twenty pips/phases/current prompt/shield fit 1024×768.
2. Twelve levels usable with selected devices. Mixed first six use learned WASD neighbors only.
3. F/J home lesson at L1, main home row L5, three letter rows/profile punctuation L10; finger guide/rehearsal.
4. Fresh input hits once; repeat/duplicate cannot farm score/salvage; disjoint accepted inputs, settle and impact ties correct.
5. Every outcome optional save/skip; skip writes no score, duplicate save no duplicate entry; unlock/economy independent.
6. Escape costs one charge; surviving final escape unlocks without kill payout; zero ends attempt; partial pips no destruction salvage.
7. Durable destruction salvage exactly once; at least five buyable/equippable tiers alter cannon without altering score/rules/geometry/latency.
8. Stars/overcharge/milestones/phases follow definitions; presentation cannot change ranked outcomes.
9. Keyboard/Mixed Pro L11–12 require whitelisted release-separated Shift; mouse Pro stays mouse-only. Verify Caps Lock/side remap/IME/repeats/timeouts/pause/default suppression/accessibility. No forbidden shortcut prompts; do not disable OS accessibility.
10. Settings/progress/cosmetics/scores survive restart; failure/corruption/migration/import/read-only paths do not duplicate rewards/spending.
11. Blur no unseen damage; DPI/resize correct; mute/reduced motion preserve cues; bilingual selected-device navigation through Hangar/results.
12. Offline launch and reference measurements support packaging/budgets, including Spectacular late-boss and correct 30 FPS behavior.

Supervised exploratory playtests include younger Calm/Relaxed and older Standard/Pro. Observe recognition, finger-guide comprehension, aim, frustration, and modifier safety; compare short untimed recognition tasks without claiming certified learning. Record voluntary replay, time to second level, optional fun 1–5, understanding first upgrade, recall of a boss/cannon after three levels. Aim ≥half recall one: directional engagement signal, not statistical proof or universal release guarantee. Record participant count/context.

## 16. Remaining review gates

Confirm Windows-first/runtime package, reference hardware, v1 scope, boss-escape unlock rule, and release-separated Pro semantics. Timing/prices/names remain provisional. Any changed settled rule must update this design, plan, decision log, and affected acceptance checks together. No implementation begins without a separate request.


**Current v1.1.0:** The authorized [small-update amendment](update-v1.1.0.md) governs next-level eligibility/results emphasis, main-menu Exit/badge removal and approximately 50% longer combat. See [release notes](releases/v1.1.0.md) and [verification](verification.md).
