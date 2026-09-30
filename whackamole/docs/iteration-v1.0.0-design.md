# Whack-a-Mole 1.0.0 — Release Design

Date: 2026-10-01. Status: implemented for the 1.0.0 release. This replaces the earlier idea catalog and records the final product design. Historical baseline: inspected v0.4.5 source. Companions: [implementation plan and delivery status](implementation-v1.0.0-plan.md), [verification record](verification-v1.0.0.md), and [release notes](releases/v1.0.0.md).

## 1. Product intent

A cheerful offline PC mouse game for children aged 3–12: move the pointer, aim, click once, enjoy the response, and try another small challenge. A beginner should succeed before having to read instructions; a practiced player should find choices, surprises, and friendly competition.

1.0.0 is a complete small game: gentle onboarding and Practice, three distinct scored modes, personal progress, and a pass-the-mouse family match. It is not a curriculum or a developmental assessment. Age bands guide playtesting, not access restrictions or claims about developmental milestones.

| Player situation | Design response | Mouse skill |
| :--- | :--- | :--- |
| Mouse beginner, often 3–5 | Untimed Practice, large targets, picture demonstration, no hazards | Move to a stationary target and single-click |
| Comfortable clicking, often 6–8 | Gentle Garden, readable cues, achievable goals | Aim around the board, distinguish targets, avoid extra clicks |
| Wants a challenge, often 9–12 | Two-target Harvest, faster settings, records, family match | Prioritize, aim accurately, choose when to click |
| Mixed abilities | Shared-rule or explicitly labeled handicap match | Take turns and practice at a chosen pace |

Priorities: understandable play, satisfying feedback, controllable challenge, variety, and fair local competition. Replay should come from enjoyment. No login rewards, daily obligations, locked gameplay, or penalties for taking a break.

## 2. Verified baseline and compatibility

The app uses React 18, TypeScript, Vite, Tailwind v4, Tauri 2, and synthesized WebAudio. Version files identify v0.4.5; the README's feature summary still describes v0.2.

- Nine holes, one appearance, 30 seconds; normal +1, golden +3, bomb −2 floored at zero. First appearance is normal; subsequent draws are 73/15/12%.
- The self-rescheduling hop timer replaces a mole whether clicked or not. **It does not wait indefinitely for a click.** After a hit the hole stays empty until the next hop. The original proposal described this incorrectly.
- Five difficulty factors: 2, 1.25, 1, 0.75, 0.6. Level-3 intervals are 1200/1000/850/700 ms at scores 0/5/12/20; scaling rounds to 10 ms. Difficulty can change mid-round.
- Live FI/EN, Finnish default, remembered SFX/music toggles, music off by default.
- One local top-10 board stores name, score, date without difficulty. Old accuracy excludes bomb clicks. Historical scores cannot retrospectively be assigned to fair difficulty categories.
- Synchronous ref commits prevent duplicate points. After a hit removes a mole, a following click on that empty hole currently counts as a miss; new input semantics must address this explicitly.
- Native window is 800×1040 with a 720×960 minimum. This needs adjustment for laptop displays. There is no gameplay pause or tutorial.

Classic preserves existing scoring, probabilities, duration, score ramp and five speed factors. Shared 1.0 improvements intentionally change pause, layout, double-click forgiveness and reporting. Fixed-level Classic retains old point/pace rules; changed-level rounds remain personal unranked results. Preserve old data in **Legacy scores — mixed settings**, not a new difficulty board.

## 3. Decisions on the original proposals

| Original idea | Release decision and reason |
| :--- | :--- |
| Multiple moles, timed pops | Keep in Harvest, cap two; escalate by elapsed time so a bonus does not unexpectedly accelerate play. |
| Six scored modes | Replace with Garden, Harvest and Classic, plus untimed Practice; each has a distinct purpose. |
| Streak ×2/×3/×4 | Replace with a small additive Harvest combo reward; avoid compounding arithmetic and huge skill gaps. |
| Time, freeze, shield, lucky powers | Remove from 1.0; add a star visitor worth +2 with immediate feedback. No inventory, charges or hidden timer effects. |
| Daily challenge and attendance streak | Defer daily content; remove attendance streaks. Shared family rounds supply fair competition without schedule pressure. |
| Achievements/career | Keep eight personal stickers and per-category bests; hide detailed totals from Home. |
| Theme packs | Keep three optional backgrounds with invariant hazard/reward identities. |
| Shake, hit-stop, center callouts | Remove; use target-side feedback that preserves the aim point and board visibility. |
| Keyboard play | Keep optional access and separate input categories; Mouse stays default. |
| Simultaneous split-board multiplayer | Replace with sequential 2–4-player pass-the-mouse play, suitable for one mouse. |
| Fleeing and double-hit moles | Defer; moving targets and compulsory repeat clicks conflict with the beginner lesson. |
| Endless with lives | Remove; Practice offers relaxed play and bounded rounds offer challenge without repeated elimination. |
| No assets/dependencies ever | Keep current stack and prefer no additional dependencies; allow small bundled SVG art for consistent Windows visuals. |

New additions: picture-led onboarding, local avatar profiles, forgiving hit areas, pause on lost focus, small goal cards, shared full-round match schedules, explicit record categories, a cohesive visual overhaul, and responsive native layouts from laptops through 5120×1440 ultrawide.

## 4. Player journey

### Home and onboarding

Home shows a friendly mole, a large **Play** button, **Practice**, **Play together**, and Settings. Fresh-install Play defaults to Garden level 1; returning visits restore the last solo scored mode/level. Preserve existing language/audio preferences. Do not ask for birth dates or infer ability from age.

Home and Settings include **Toggle fullscreen** and **Exit game**. Exit closes the native main window even in fullscreen; no title-bar access is required. Browser builds leave fullscreen and explain that the tab can be closed. Native startup dimensions fit the monitor work area; narrow explicit Tauri permissions enable fullscreen/close without new Rust commands.

An optional three-panel demonstration teaches moving the pointer, clicking once, and distinguishing gold from the crossed-out bomb. Panels wait for the player, offer Back/Skip, and are replayable from Help. A drawn pointer demonstrates without moving the OS cursor. No tutorial timer. First Practice target is near the center.

Solo path: Home → avatar or Guest → mode/level → picture rule card → Ready → round → results → Play again / Change game / Home. Mode cards describe the game visually; five pace levels use age-neutral descriptions. Practice has no difficulty selector. All gameplay is unlocked immediately.

### During and after play

HUD: score, time digits plus bar, Harvest combo indicator, and Pause outside the board. Put language/audio/help inside the pause/settings panel. Changing language/audio preserves round state. Opening settings pauses play; returning from settings does not automatically resume.

Results use a separate screen rather than packing a panel into the holes. Lead with score and one truthful positive observation, such as “You found 4 golden moles!” Compare bests only for matching rules/input. Put accuracy and escapes behind **More details**. Zero score still offers a friendly replay or Practice suggestion; do not invent praise for nonexistent hits.

Selected profiles save eligible records automatically, once. Guest can save with an optional sanitized nickname or skip. Play again is always available without typing. Profile progress is saved even when a score misses the top 10. Guest has no persistent stickers. Display the selected avatar/name on results to prevent saving a sibling's progress accidentally.

## 5. Modes and initial balance

These are implementable starting settings, not age-calibrated facts. Playtests may tune them; scoring/opportunity changes require an updated rules revision and fixtures.

### Practice

- Untimed, unranked; default four large holes (2×2), optional nine. A target waits until clicked. No bombs, escape penalties or combo pressure.
- Each click gives one playful response. Every fifth success is golden with extra sparkles; still counts as one success. Next target appears in a different hole after 400 ms; holding the button never auto-hits.
- Optional repeatable “Find 5 moles” goal gives a small celebration and offers another five. Continue or leave freely. No reward for session length.
- Completing five hits may earn the First Clicks sticker once for a profile. No board or match record.

### Scored modes

| Rule | Garden | Harvest | Classic |
| :--- | :--- | :--- | :--- |
| Duration | 30 s | 45 s | 30 s |
| Board / active cap | Nine holes / 1 | Nine holes / 1; 2 after 15 s | Nine holes / 1 |
| Pace | Elapsed-time waves | Elapsed-time waves | Existing score ramp |
| Level-3 interval: first / middle / final third | 1800 / 1600 / 1400 ms | 1400 / 1200 / 1000 ms | Existing 1200/1000/850/700 ms |
| Normal / gold / bomb / star draw | 75 / 20 / 5 / 0% | 62 / 20 / 12 / 6% | 73 / 15 / 12 / 0% |
| Normal / gold / star value | +1 / +3 / — | +1 / +3 / +2 | +1 / +3 / — |
| Bomb | −1, floor 0 | −2, floor 0 | −2, floor 0 |
| Escape | No score/streak penalty | Reward escape resets combo; bomb escape does nothing | Existing no-penalty behavior |
| Combo points | None | +2 on each fifth consecutive reward hit | None; streak is a statistic |
| Scripted surprise | Golden wave near 10 s and 20 s | Star visit near 12 s; golden wave near 30 s | None |

Garden/Harvest use existing difficulty factors on intervals, rounded to 10 ms, floor 600 ms. Wave 1 starts at t=0 with one normal target. To schedule the next wave, use the interval for the current wave's start time; at that next wave's start, determine its phase/cap from its elapsed time. Each appearance lasts until the next wave or round end. A hit removes it but creates no replacement. Entry animation is at most 120 ms, with full clickability from appearance start. Do not add a separate 650 ms expiry on easy levels.

In new modes, prohibit bombs before 6 s in Garden and 8 s in Harvest. Prohibit consecutive bomb-containing waves and more than one bomb per wave. Prohibited draws become normal, without re-rolling. These safety rules alter realized frequencies; the table gives initial draw distributions, not promised observed percentages. Classic retains only its existing first-normal rule.

Choose holes without replacement within each wave, excluding previous-wave holes. For each scripted surprise use the first wave at or after its listed time, never at/after round end. Garden's selected wave becomes one golden; Harvest's star replaces slot 1 and its golden wave makes all slots golden. Consume normal random draws before applying overrides; surprises take priority over kind/safety rules, never add targets or time. A star hat and +2 picture explain the visitor without powers or charges.

Harvest normal/gold/star each increment combo; hits 5, 10, 15 etc. receive base value plus 2. Empty-hole click, bomb click, or reward escape resets it. Bomb escape does nothing; simultaneous expiries cause one reset. Resolve expiries before new spawns. No multiplier stacks, extra time, or bonus for doing nothing.

Give a 180 ms hole-rim cue before waves after the first: location only, not kind. Targets must be recognizable immediately when clickable. Surprise decorations never cover the board. No additional rare behaviors in 1.0.

## 6. Input, pause and correctness

- Use the OS primary mouse button, including left-handed configurations; secondary button is ignored. Resolve on release with press/release in the same hole and on the same appearance ID. Entire visible hole is the hit area, not just opaque artwork.
- Capture target ID at press. Press-empty/release-new-target is a miss; pressing an appearance that expires before release is ignored, never transferred to its replacement. Release outside the original hole cancels without a miss.
- Consumed appearance IDs cannot score twice. Ignore duplicate activations on the same ID. Suppress a new same-hole press within 250 ms after resolution if the hole is empty: double-click forgiveness, not a global rate limit. A later empty press/release counts as a miss. Different live targets remain immediately clickable.
- Keyboard option: 1–9 in reading order (1–4 for 2×2 Practice), no key-repeat, same scoring path. Ignore game shortcuts during text editing or modified keystrokes. Enter/Space activates focused controls normally, without a second global start action. Escape pauses, never auto-resumes.
- Choose Mouse or Keyboard before a scored round. Gameplay activation with another input marks Mixed; keyboard menu navigation does not change the category. Touch gameplay is unranked and outside PC acceptance.
- Scored Ready is 3–2–1 with optional skip; time starts afterward. Practice has no countdown. Before-start, paused and post-end clicks are ignored.
- Pause on explicit action, focus loss, hidden page or settings. Require explicit Resume, with short countdown outside game time. No target advancement, combo penalty or escape during pause. Local records/matches allow pauses.
- One monotonic active-play clock drives gameplay. At equal timestamps process round-end, expiries, spawn, then input. A click at expiry is too late. Remaining seconds use ceiling; never negative. Decorative effects/audio never modify timing.
- If a foreground callback observes a gap over 250 ms, pause before advancing active time, retaining the last displayed state; Resume is required. This includes machine sleep. Smaller gaps process deadlines in order. Never replay missed waves as a rapid burst or penalize unseen targets.
- Changing difficulty in pause preserves progress but permanently makes that round ineligible for fixed-rule records. Show this consequence beside the control. Apply the change from the next interval scheduled, leaving the current deadline intact. Mode changes require leaving the round. In matches, offer restart under original settings or end match.
- Replay uses a new round ID and rejects stale input/timer callbacks. Abandon confirmation is needed only when leaving active/paused play. Abandoned rounds earn no round-end records/stickers; completed Practice goals remain earned.

## 7. Competition and score fairness

### Solo records

Top-10 categories include rules revision, mode, fixed difficulty and gameplay input. Theme/language/audio/motion do not split records. One eligible entry per completed round; tied scores share rank, with timestamp then round ID ordering rows. Personal bests per profile/category exist independently of top-10 placement. No combined “best at everything” score.

Classic is casual because performance changes pace; Garden/Harvest solo seeds vary, so their boards are casual records too. Only a Family shared tape is labeled **Same round**. Changed-setting, mixed-input or assisted rounds show an unranked session result. Legacy scores stay separate because their rules/settings provenance is incomplete.

### Play together — required for 1.0

2–4 players choose avatars and optional names; Guest slots get localized Player 1 etc. One mouse, sequential turns. **Same round** uses Garden and one fixed level for all players. Before turn one, generate a complete immutable tape of timestamps, holes, kinds, appearance IDs and expiries from seed/config/rules revision. Every player receives it independent of clicking, score, pauses or rendering speed. No spawn RNG during playback. A seed alone is insufficient when performance alters scheduling; time-based Garden fixes that.

Handoff is a full “Pass the mouse to [avatar]” screen waiting for Ready. Never auto-start the next child. One turn each, then results, joint winners on ties, and optional rematch with a fresh tape and rotated player order. Later players may benefit from watching; describe this as friendly competition, not formal skill measurement.

Alternative **Choose your own pace** permits per-player levels and different tapes/opportunity counts; label it a handicap match, not Same round. Match scores are session-only and never enter solo boards. Completed legitimate turns can award ordinary profile stickers and totals once. Mid-turn gameplay input/level change offers original-tape restart or end match, never a misleading shared result. Closing the app ends the match. No networking or simultaneous input.

## 8. Personal progress

Up to six local profiles: stable ID, six-choice avatar, optional nickname capped at 16 characters. Guest always available. No email, required real name, birth date, password or cloud. Switch profiles outside active play. All modes/themes available without achievements.

Eight stickers, once per profile, with visible picture and goal:

| Sticker | Exact condition |
| :--- | :--- |
| First Clicks | Complete a five-hit Practice goal, or scored round with ≥5 reward hits |
| Garden Friend | Complete Garden with ≥10 reward hits |
| Golden Finder | ≥3 golden hits in one completed scored round |
| Careful Clicker | Completed scored round with ≥10 reward hits, zero misses and bomb hits |
| Five Together | Reach combo 5 in a completed Harvest round |
| Harvest Helper | Complete Harvest with ≥15 reward hits |
| Star Visitor | Hit a star in a completed Harvest round |
| Game Explorer | Complete Garden, Harvest and Classic with ≥1 reward hit each across any days |

Practice milestone evaluates immediately; all other conditions at completed round end. Unranked legitimate rounds may earn stickers; debug/forced rounds cannot. Garden match turns count. At most two large unlock cards on results; remaining unlocks under View stickers. No mid-round modal, repeated fanfare, attendance badge or compulsory grinding.

Each solo scored round has one optional goal on the rule card: Garden 5 reward hits, Harvest 10, Classic 5. Completion earns a results ribbon, no points or permanent achievement. After three completed solo rounds in a visit, offer a quiet break suggestion once, without blocking replay.

Profile page shows stickers, completed scored rounds, total reward hits and category bests. Avoid lifetime accuracy across unlike modes. New-mode Click accuracy = reward hits / (reward hits + misses + bomb hits); no attempts shows “—”. Escapes are separate. Classic retains its old denominator, labeled Classic accuracy with a note that bombs are separate. Never merge those percentages.

## 9. Presentation, access and language

### 9.1 Required visual improvements

The visual overhaul is part of the 1.0 release scope, with finished screens and consistent art rather than additional controls attached to the proof of concept.

Warm garden, rounded forms, expressive friendly moles. Prefer original bundled SVG gameplay targets over OS-dependent emoji: normal mole, gold-crowned mole, obvious bomb with crossed-out marker, star-hat mole. Document assets/attribution. No blood, injury, startling explosion or taunting loss text.

Required visual work:

- **Illustrated game world:** layered sky, distant hills or themed equivalents, and a foreground play patch. Soft lighting, restrained textures and foreground details make the holes feel embedded in a place; decorative scenery stays quieter than clickable targets.
- **Distinct characters:** consistent vector silhouettes, gold crown, star hat and hazard marker. Happy, surprised and brief dazed expressions provide personality without implying injury. Recognition must work without relying on hue alone.
- **Physical-feeling board:** shaded hole rims, inset soil, subtle mound highlights and clear target separation. Visible rim cues and hover/focus states belong to this visual system; no shifting borders that change hit areas.
- **Designed screens:** illustrated mode cards, clear difficulty pace icons, large rounded buttons, avatar chips and readable score/time displays. Home, rule cards, pause, handoff, results and sticker collection share typography, spacing and component styling. Avoid a wall of tiny segmented controls.
- **Responsive feedback:** short pop/squash, local score labels and small gold/star particles. A results ribbon, new-best highlight and sticker reveal make completed rounds satisfying. Celebrations stay brief, skippable and never start another round automatically.
- **Polished transitions:** short screen fades and target entry/exit transitions with no input delay or timer alteration. Maintain contrast in every background; all decoration has a reduced-motion/static alternative.

Three settings backgrounds: Garden, Snow Garden, Space Garden. Only scenery changes; hazard/reward identity, values, outlines, contrast and hit areas remain stable. Snowflakes never mean both reward and hazard. No automatic seasonal change.

### 9.2 Display support through 5120×1440

Support resizable/maximized Windows layouts from a 960×640 CSS viewport through **5120×1440 physical resolution**, including 16:9, 16:10, 21:9 and 32:9. Gameplay must fit without scrolling, stretched artwork or clipped targets. Desktop pixels and CSS pixels differ: test native usable area at 100%/125%/150% scaling on displays with sufficient logical space. At 1280×720 physical resolution, verify the baseline at 100%; higher scaling that falls below the minimum logical viewport must show a readable resize/scaling message rather than silently crop gameplay.

| Display case | Intended composition |
| :--- | :--- |
| 960×640 CSS / 1280×720 laptop at 100% | Compact HUD, centered board, collapsed secondary panels; full gameplay visible |
| 1920×1080 and 1920×1200 | Comfortable centered play area, generous margins, illustrated screen layouts |
| 2560×1440 and 3840×2160 | Crisp vector artwork and typography; bounded gameplay size, no giant pointer travel |
| 3440×1440 (21:9) | Wide scenery and balanced nearby side panels on non-playing screens |
| 5120×1440 (32:9 ultrawide) | Full-width composed scenery, central interaction area and intentional side zones; no stretched 16:9 canvas |

Minimum scored holes: 88 CSS px diameter with 12 px gaps; Practice aims for 140 px. Scale the board within approximately 300–600 CSS px based primarily on available height; never enlarge it just because the screen is very wide. Collapse secondary panels before shrinking targets. Home/results may scroll; gameplay cannot. Remove the current 960 px minimum window height. Size the initial window to fit the available work area, preserve resize/maximize behavior, and pause safely on focus loss when moving between displays.

On ultrawide, keep the board, score/time and Pause together in the central region. Do not put essential controls at opposite screen edges. Use peripheral space for calm theme scenery during play; on Home/results it may hold mode previews, stickers or records, with the main actions still near the center. Panels have bounded line lengths. Pointer targets, typography and circular holes retain their aspect ratios. Scene layers adapt to aspect ratio instead of stretching a background screenshot. Score changes and celebrations must not move the board. Vector art stays crisp across resolutions and DPI; verify pointer coordinates after resizing or changing monitor scale.

### 9.3 Feedback, access and language

Standard pointer is default. Optional hammer cursor must retain an accurate hotspot and is not a release requirement. Feedback: immediate target response, +value beside hole about 500 ms, squash ≤120 ms, short synthesized sound. No screen shake, global flash, hit-stop or center obstruction. Bomb feedback is subdued. Independent music/SFX mute and volume; music off by default. Pause suspends audio, resume requires gesture, audio failure never blocks play. Critical cues have visual equivalents.

Respect system reduced motion; in-game switch may force reduction on. Substitute static borders/text for particles, pulsing and movement; preserve playable windows. No strobing. Visible keyboard focus, semantic controls, localized hole/current-kind labels, accessible menu/result navigation. Politely announce phase/final results, not every spawn/timer tick. Keyboard fallback does not establish full screen-reader access to fast spatial gameplay; document only verified support.

Typed EN/FI keys cover all screens, picture cards, goals, fallbacks, recovery messages and labels. Finnish remains default; never translate nicknames. Fluent Finnish review includes natural phrasing such as “Paras putki” and “Peli päättyi”. Picture demonstration works without reading; spoken narration is later work.

Pause/difficulty and untimed explanations draw on Microsoft's [difficulty guidance](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/108) and [UI time-limit guidance](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/116), which distinguishes gameplay timers from timed menus. These inform the design; they are not certification or proof of age-specific timing suitability.

## 10. Technical and persistence contracts

Keep current stack. Separate pure rules/scheduling, tape generation, input validation, progress and storage from React. Typed mode configs describe numbers/policies; small named functions handle special behavior without a generic rule language. Keep tested Classic helpers while migrating; old helper tests alone cannot establish new UI compatibility.

Round state: phase, round ID, rules revision, mode, initial/current difficulty, eligibility reasons, input category, active elapsed time, active appearances, consumed IDs, counters and tape position. Derive displayed seconds/combo indicators. One authoritative synchronous ref is committed before rendering/audio. One scheduler owns deadlines; injected monotonic clock/RNG support tests. Wall time is only for saved timestamps. Pause stops active elapsed time rather than rewriting every expiry. Classic hop reads live score/level as today; no click-triggered spawn.

No runtime downloads, telemetry, accounts, online boards or new Rust commands. Small local SVG assets and existing synthesized audio suffice. Tauri window/config, version and product metadata changes are allowed; release maintenance is not forbidden by a literal “no Rust changes” rule.

Store a schema-versioned `whackamole.release.v1` document with profiles, progress, new settings and bounded category boards. Category keys encode rules revision/mode/level/input; each row includes round ID, profile ID or guest name, score and timestamp. Only eligible rounds enter boards. Limits: six profiles, ten rows/category, eight sticker IDs/profile, last 100 finalized round IDs for idempotency; no unbounded event/round history. UI also guards each completion commit; old summaries are never replayed automatically. Match state/tapes stay in memory.

Retain existing language, difficulty, SFX mute and music keys/preferences. New users get Garden level 1; migrated users retain their saved level, including a valid level 3. Do not change the app identifier/storage origin casually. Read old scores key untouched in Legacy; never guess difficulty. Validate nested shapes, known enums, finite integer ranges, IDs, sanitized names, dates and limits. For corrupt/future-version new storage, show recovery information and use a temporary session; do not automatically overwrite the raw payload. Guard localStorage acquisition as well as read/parse/write.

Persistence failure leaves play usable in memory; results say “Saved for this visit only”, never a false permanent save. LocalStorage follows app/WebView user data. The existing portable.txt marker redirects it to the adjacent data folder; copying that folder with the executable/marker carries portable saves. Installed builds use per-user data. Moving the executable alone does not carry scores; clearing app data may erase them. Profile deletion removes progress/records after confirmation; separate confirmed actions clear 1.0 data and Legacy. No automatic deletion during migration, cloud backup or export requirement.

Development/smoke hooks must mark forced-kind/time/tape rounds ineligible for boards/progress. Production hooks are absent or enforce that marker.

## 11. Release gates

Product and automated/package gates apply to the release; external human checks are tracked honestly as follow-ups under the user's instruction to implement and release:

1. A beginner can complete five Practice hits without timer, mandatory reading or typing; replay is a short consistent path.
2. Garden, Harvest, Classic work at five levels; Practice, scripted surprises, stickers and Family are complete.
3. Same-round matches replay the full identical tape under different click histories; handoff, ties, rematch and cancel work.
4. Duplicate/stale inputs, key repeat, expiry boundaries, pause/focus loss and sleep do not double-score or penalize unseen targets.
5. Records are categorized honestly, Legacy remains readable, corrupt data is protected and failed saving is visible.
6. All screens work in FI/EN with reviewed Finnish, reduced motion, audio off and keyboard navigation.
7. The required visual overhaul is complete across Home, play, pause, handoff and results; targets stay identifiable across themes. Entire board fits supported laptop/native scaling cases through 5120×1440, with deliberately composed 21:9/32:9 layouts and no stretched targets or distant essential controls.
8. Logic tests, frontend build, browser flows and real packaged Windows smoke tests pass; portable ZIP, NSIS and MSI launch with documented runtime prerequisites.
9. Record the status of supervised child sessions and independent Finnish review. Those sessions remain follow-ups for this release; do not claim validated age-specific usability or learning outcomes. Future sessions should include beginners/practiced players, address repeated confusion and avoid identifying data or analytics.
10. README, release notes, controls, storage limitations, versions/locks and distribution instructions match the finished game.

## 12. Later candidates

After feedback: optional drag/drop garden activity, spoken FI/EN instructions, locally shareable custom challenges, scenery, moving targets, progress export/import. Each needs its own usability/fairness design. Daily content, lives-based survival and more power-up systems are not prerequisites for a complete release.
