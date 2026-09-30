# Keystrike — Reviewer Feedback (Game Design Review)

**Reviewer:** Kynsi (game design review)
**Date:** 2026-09-30
**Reviewed:** `README.md`, `docs/game-design.md` (v0.1), `docs/review.md`
**Mandate:** Ensure the design is (1) fun and learning oriented, (2) offers a clear path to 10-finger typing on the keyboard side, (3) focuses the mixed-input side on WASD and surrounding gaming keys, (4) delivers engaging visuals for 6–12 year olds — cool lasers, space imagery, futuristic guns, aliens, (5) supports weapon upgrades unlocked by dropping alien ships, (6) structures every level with multi-keystrike minibosses and an even larger end-of-level boss fight, and (7) introduces key combinations (L-Shift / L-Ctrl + WASD-area keys) in late levels and higher difficulties.

---

## Overall verdict

v0.1 is a genuinely strong **foundation**: the input-handling rules, fairness invariants, accessibility, persistence, and bilingual handling are better than what most shipped games manage. The problem is the center of gravity. As written, this is a **typing trainer wearing a spaceskin** — and the brief describes a **shooter game that happens to teach typing**: guns, upgrades, bosses, spectacle.

The good news: every gap below is additive. None of the fixes require dismantling the input fairness, accessibility, scoring, or persistence work, which should be preserved essentially as-is.

**Gap summary against the brief:**

| # | Brief requirement | v0.1 status | Gap |
| :--- | :--- | :--- | :--- |
| 1 | Fun and learning oriented | Learning: strong. Fun: thin | Reward cadence, spectacle, narrative, and player identity underdeveloped |
| 2 | Clear path to 10-finger typing | Home-row start (F/J → D/K → S/L → A/G/H) | Implicit only; doc disclaims it; missing home-anchor instruction, finger mapping, right-hand punctuation |
| 3 | Mixed input focused on WASD + surroundings | Mixed track = letter curriculum + mouse | No WASD-centric framing; gaming-cluster keys (Q E Z X C, Space, Shift, Ctrl) absent |
| 4 | Cool lasers, space imagery, futuristic guns, aliens | Lasers ✅, friendly aliens ✅, guns ❌, space ❌ (dusk city) | No player weapon to love, no space scenery, default presentation is cozy rather than cool |
| 5 | Weapon upgrades unlocked by dropping ships | No upgrade or currency system | Absent entirely |
| 6 | Minibosses per level + end-of-level boss | Armored (2 steps), relay (3–4); flagship only on L6 & L12 | Per-level boss structure missing; "boss" is a rarity, not a structure |
| 7 | Late-level Shift/Ctrl key combinations | Explicitly out of scope for the campaign | Needs a safe, fair mechanism (sequential input) plus a higher-difficulty tier |

---

## 1. What to keep (do not regress these)

- **Readable-before-difficult** philosophy and the "at most one active prompt per key" invariant. Exactly right for 6–12.
- **Fresh-press-only input rules**, no held-key farming, IME/Caps Lock/layout handling, key-vs-code semantics. This is the kind of detail that makes keyboard games actually work on real school PCs.
- **Rehearsal before each level**, Practice mode, Relaxed preset. This is real pedagogy.
- **Wrong presses don't damage the city** (streak reset + neutral hint only). The correct emotional contract for children.
- **Shame-free, descriptive feedback** ("Try D and K again in practice").
- **Deterministic seeds, versioned boards, save/skip flow, export/import.** Solid.
- **Non-violent ship resolution** (fragments / escape pods) — keep, and make it funnier (§4).
- Scope honesty (design only, numbers are tuning starting points).

Everything below builds on top of these.

---

## 2. Fun loop: from "press the right key" to "I'm the gunner with a cool gun"

The atomic loop (read target → press input → laser → explosion) is correct and must stay. What's missing is the *loop around the loop*:

### 2.1 A weapon the player owns

The player should be a **turret gunner**, not an invisible force. Put a visible, named, drawn sci-fi cannon on the Helsinki waterfront ("Helsinki Defense Cannon") and fire the laser from it, with recoil glow and a distinct sound per weapon. This single change delivers the brief's "futuristic guns" requirement and becomes the anchor for the upgrade system (§5). The three defense districts can each get a turret silhouette; the active one is the player's gun.

### 2.2 Reward cadence

Children need a dopamine tick every few seconds, not one per level. v0.1's rewards are almost entirely at level end. Add:

- **Combo milestones** at 10 / 25 / 50 consecutive correct steps: short fanfare + floating bilingual text ("HUIKEA! / AMAZING!") + a cosmetic overcharge blast.
- **Overcharge**: every 8 correct steps, the *next* hit fires a visibly bigger beam with extra explosion. Purely cosmetic — no score or rule change — but it makes streaks *feel* like power.
- **Salvage counter in the HUD** (§5) ticking up on every kill.
- **Star rating per level** (1–3 stars from shield charges remaining + accuracy). Children remember stars, not 1,240 points. Stars also give the results screen a clear "good / great / perfect" shape.
- **Boss-down celebration** (§6): slow-mo explosion, city lights flash, the alien pilot pops out in a tiny pod with a comedic "blup", "BOSS DOWN!" banner, bonus salvage payout.

### 2.3 Light narrative (flavor, not a novel)

The aliens aren't invaders — they're a **scavenger fleet** run by a cartoonish "Scrap King" who wants Helsinki's shiny metal. Each level's boss is a different alien commander with a silly name ("The Wobbler", "Rusty Rex", "Zorp the Collector"). Two-line story beats on briefing and results screens, bilingual. This gives the campaign shape ("who's next?") and turns a failed level into "the boss beat us, let's fight again" instead of "test failed". The existing "curious and mischievous, not frightening" tone is exactly right — just give the aliens names and a goal. Keep it light; no story branching, no dialogue trees.

### 2.4 Agency within the fairness rules

The design correctly bans decoys, relabeling, and unfair targets. Small agency additions that don't break that:

- **Weapon selection** (2–3 turrets; identical function, different look + sound + beam color). Selection persists; it's the upgrade system's visible payoff.
- **Optional repair drone** (late levels only): a small friendly drone with a keycap that, when shot, restores one shield charge. It's a bonus, never a decoy — missing it costs nothing. Adds a real decision (drone vs. descending ship) without punishment mechanics.

---

## 3. Learning: make 10-finger typing explicit

v0.1's curriculum already starts on the home row (F, J first — the universal touch-typing anchors), which is the right seed. But the doc twice disclaims it ("not a strict typing-course home-row convention", "does not certify touch typing"). If the goal is a clear path to 10-finger typing, own it:

1. **Teach the home position in Level 1.** Show the two **finger bumps** (F and J) on the on-screen keyboard guide and say "rest your fingers on F and J". This is the single most effective habit for touch typing and costs nothing to add. Name it: the home row is the "home base".
2. **Add finger mapping to the on-screen keyboard guide.** Each new key highlights *which finger* owns it (pinky A, ring S, middle D, index F — mirrored on the right). Key recognition alone teaches "finding a key"; finger mapping teaches "which finger goes there", which is what 10-finger typing actually is. This is standard in typing instruction and very legible for 7–10 year olds.
3. **Complete the curriculum arc.** Suggested keyboard-track shape:
   - L1–2: F/J → D/K (anchors) — as-is ✅
   - L3–5: full home row S/L/A/G/H — as-is ✅
   - L6: first boss; home-row consolidation
   - L7–8: upper row (Q W E R T / Y U I O P) — as-is ✅
   - L9: lower row (Z X C V B / N M) — as-is ✅, **plus right-hand punctuation (; ' , .) in L9–10** — it's part of the 10-finger map and currently unteachable
   - L11: Space, Enter, arrows, digits — as-is ✅, plus **Shift as a named key** (setup for §7)
   - L12: full-set boss; optional Pro-tier combos (see §7)
   - That is a complete 10-finger map: three rows, both hands, special keys, and a modifier introduction.
4. **Boss sequences are the two-hand trainer.** Boss keystrike sequences should alternate hands (D→K→S→L style). The design already has F→J→D→K ordered sequences; the boss fights are the natural home for them, so the hardest fight in every level is simultaneously the best two-hand practice.
5. **Layout fact to exploit.** The home-row anchors (F J D K S L A G H) and the WASD gaming cluster (W A S D Q E Z X C F, Space, Shift, Ctrl) occupy the **same physical positions** on US, Finnish, and Swedish QWERTY — unlike U/Y, which swap rows between layouts. Anchor practice and WASD practice are therefore layout-independent; only the "other" letters need per-profile handling, which the doc already does correctly via character semantics. Worth stating explicitly in §5.2.
6. **Optional v2 bridge — "word lasers".** A later mode where the player types a short Finnish word ("TULI", "LASER", "AURINKO") and the completed word fires as a big beam. This is the clearest available bridge from key recognition to actual typing, and it's very fun (the word *is* the laser). Flag as a v2 candidate; it's scope growth, but it is the strongest learning upgrade on the table.

---

## 4. Mixed mode: make WASD the cockpit

The brief is explicit: the mixed-input side should focus on WASD and surrounding keys — the keys PC gamers actually use. v0.1's mixed track is "keyboard track + mouse track interleaved", which is the wrong frame for this audience.

**Proposed reframe: the player is a turret gunner. Left hand on the cockpit cluster (WASD + neighbors), right hand on the mouse (aim).**

1. **Mixed track L1–4 teach WASD first**, interleaved with primary-mouse aim/click. W A S D as the core keyboard targets, then the **surrounding cluster: Q, E, Z, X, C, F, Space** (Shift/Ctrl in Pro tier, §7). The fantasy maps perfectly: WASD-area keys = trigger/weapon keys, mouse = aim.
2. **The keyboard track keeps the full-alphabet curriculum** (that's the 10-finger path, §3). Mixed track is a *different curriculum with a different goal*: gaming input fluency + pointer control. Both legitimate; the document should say so plainly. (This also answers review.md question 1 cleanly: aiming stays, and the keyboard side becomes the gaming cluster kids already half-know. Mixed mode becomes "the mode for kids who want to play games", not "learn typing".)
3. **W is an upper-row key** — teach it early in the mixed track (L2–3) as a gaming anchor, while the keyboard track introduces it at L7–8 with the rest of the row. Same key, different curricula, different times. No conflict.
4. **Optional late mixed mechanic — "double-action" targets:** one ship requires a keyboard key (e.g., W) *and* a mouse click, in any order within a generous window. Teaches the left-hand/right-hand split that real gaming uses, without requiring simultaneous input. Keep it to late mixed levels only.
5. **WASD is layout-stable** (see §3.5), so the mixed track works identically on US/FI/SV profiles — a genuine advantage over letter-based content, and a good selling point for the Finnish market where WASD gaming is universal.

---

## 5. Weapon upgrades unlocked by dropping ships

**This is absent from v0.1 and is the single biggest fun gap.** Children aged 6–12 are driven by visible, accumulating power. Propose:

### 5.1 Currency: Salvage (FI: "Romua")

- Earned by **destroying ships**: +1 per weak-point step on normal ships, +10 per miniboss, +25–50 per boss.
- Visible counter in the HUD (ticking up on every kill) and on the results screen.
- Persisted with progress (new record type in §13.4; separate from scores so it can't be farmed for rankings).

### 5.2 Upgrade tree (cosmetic + feel, not power)

Fairness rule: **upgrades never change gameplay rules or scoring** — so the existing per-level boards stay perfectly comparable. Upgrades buy *spectacle and identity*:

| Line | Tiers (example) |
| :--- | :--- |
| Beam color | Mint (default) → Plasma cyan → Violet → Rainbow cycle |
| Beam shape | Single thin → Wider core → Twin parallel beams → Pulse (thick, slow, heavy) |
| Effects | Basic sparks → Trail + glow → Starburst explosion → Full spectacle (screen shake, confetti fragments) |
| Sound | Chiptune blip → Laser zap → Plasma hum → Deep boom |
| Turret skin | Standard cannon → Sleek railgun → Heavy assault gun |
| Name | Player can name their cannon (16-char rule from §10 applies) |

Pricing is tuning territory (roughly: cheap cosmetic 5–15, mid 25–50, showcase 100+); the first unlock should land within one or two levels so every child sees the loop work early.

### 5.3 The Hangar

A new screen between levels ("Hangar" / "Hangari") showing the cannon, its skin, beam preview, and the upgrade tree with locked/unlocked states. This is the **progression showcase** — the screen kids will revisit and show their friends. It's the garage of the game.

### 5.4 Alternative considered

Mechanical upgrades (e.g., +1 shield, wider hit zones) would break score-board comparability unless every board gains a loadout axis. That's doable (board keys in §10 already include the rules preset) but adds a second dimension of confusion for a 7-year-old. **Recommendation: cosmetic-only for v1; revisit mechanical upgrades only if playtesting shows the cosmetic loop feels empty.**

---

## 6. Per-level structure: minibosses + boss

v0.1 has multi-step ships (armored = 2, relay = 3–4) and a flagship only on L6 and L12. The brief requires **minibosses on every level and a bigger boss ending every level**. Restructure:

### 6.1 Level flow

1. **Briefing + rehearsal** (as-is ✅)
2. **Wave phase**: authored spawn schedule (as-is, §8 table)
3. **Miniboss phase**: one or two minibosses with **2–4 keystrikes** (reframe armored/relay ships as the miniboss class; they should appear in every level from L2)
4. **Boss phase**: one boss with **even more keystrikes** (see table), dramatic entrance, then level end + results (as-is ✅)

### 6.2 Boss keystrike budgets (Standard)

| Level | Minibosses (each) | Boss |
| :--- | :--- | :--- |
| 1 | — (tutorial boss instead) | 3–4 (generous, one hand at a time) |
| 2–3 | 2 | 5–6 |
| 4–5 | 2–3 | 7–8 |
| 6 | 3 | 9–10 (first "real" boss) |
| 7–8 | 3–4 | 11–12 |
| 9–10 | 4 | 13–15 |
| 11 | 4–5 | 15–16 |
| 12 | 5 | 18–20 (final boss, may add one Pro combo step in Pro tier) |

These are starting points for playtesting. Time budget: a boss taking 8 keystrokes at ~2–3 s per step adds roughly 20–30 s — the "under ~90 s of action" target in §8 should be re-examined to "under ~2 minutes with boss" rather than dropped.

### 6.3 Boss mechanics (all fairness-preserving)

- **HP pips, not a bar:** show the keystrikes as a row of pips above the boss; each correct strike fills a pip and the boss flinches. A visible countdown to victory is extremely motivating for this age.
- **Phases:** at ⅔ and ⅓ remaining, the boss changes pattern (speeds up slightly, shifts lanes, or swaps which key-group it uses). Phases only use the level's already-learned key set — **keep v0.1's rule that a flagship never requires unpracticed skill; it extends naturally to all bosses.**
- **Telegraphed actions:** boss periodically fires a slow, wide, clearly-telegraphed "pulse" that the player destroys by hitting its keycap (an extra optional strike worth bonus salvage). It never damages the city directly — its failure state is "the pulse expires", keeping the no-shame contract.
- **Boss entrance:** warning banner + klaxon + boss name card ("RUSTY REX approaches!") with the boss's silhouette. Two seconds of showmanship before the first actionable pip.
- **Boss exit:** the full §2.2 celebration sequence.
- **Leak rule:** if a boss (or miniboss) crosses the shield line, it consumes one charge and retreats, *not* a level failure — keep v0.1's "partly damaged ship costs one charge" rule. Bosses never end the level early; the level always resolves to a results screen. (For a 6-year-old, "the boss escaped, fight it again" beats a hard fail.)
- **Spawn freeze:** keep v0.1's rule — no other ships spawn during a boss encounter.
- **No new threats from defeats** (keep).

### 6.4 Boss roster

Give each of the 12 bosses a name, a silhouette, and one signature visual (a drill, a disco ball, a giant claw). A 6-year-old who remembers "the one with the disco ball" has a game; one who remembers "level 7" has an exercise. This is cheap to produce (one sprite + one line of text each) and pays off in re-engagement.

---

## 7. Key combinations in late levels and higher difficulties

v0.1 explicitly excludes modifiers ("Ctrl, Alt/AltGr, Command/Windows, function keys, and system shortcuts are not targets") and defers chords. The brief wants **L-Shift or L-Ctrl + WASD-area keys in late levels and higher difficulties**. Both can be true, with the right mechanism:

### 7.1 Sequential input, not simultaneous chords

Require the combo as an **ordered pair with a generous window**, not a simultaneous chord:

- Prompt shows **two keycaps connected by a plus sign** (`SHIFT + W`), visually distinct from single-key prompts (bigger, double outline, different fill).
- Valid: press either key, then the other within **800 ms** (Relaxed: 1500 ms). Either order accepted.
- This is hardware-safe (no ghosting/rollover concern at 2 keys), IME-safe, and readable for a 9-year-old. A failed attempt (wrong key, or timeout) resets the streak only — no partial state, consistent with v0.1's wrong-press contract.
- The existing 150 ms settle period and "only the current step is active" rules apply unchanged.
- Score it as **one step** (one 100-point award), not two — prevents combo inflation in the boards.

### 7.2 Combo whitelist (safety-critical)

| Combo | Status | Reason |
| :--- | :--- | :--- |
| Shift + W / A / S / D | ✅ safe | No OS/browser conflicts |
| Shift + Q / E / Space | ✅ safe | No conflicts |
| Ctrl + W / A / S / D | ⚠️ handle | **Ctrl+W closes the window** in browsers and Tauri — must be intercepted with `preventDefault` in the game area, or excluded |
| Ctrl + C / V / A / X / Z | ❌ exclude | Clipboard/editing shortcuts |
| Alt / AltGr + anything | ❌ exclude | IME and Finnish dead-key conflicts — v0.1's instinct to avoid Alt is correct |
| Win/Command, F-keys, Esc, Tab | ❌ exclude | v0.1's existing exclusions stand |

**Recommendation: v1 combo set = Shift+W/A/S/D/Q/E/Space. Ctrl-combos only after the Tauri shell demonstrably swallows them, and never in the browser preview build.**

### 7.3 Placement

- **Standard campaign: no modifier combos** (v0.1's fairness principle holds; the brief says "may require" for higher difficulties).
- **Pro tier** (new rules preset alongside Standard/Relaxed/Practice): L11–12 content plus a "Pro" extension set where bosses include 1–2 combo steps, each introduced in the briefing with its own rehearsal target. Pro gets its own score board — the board key in §10 already includes the rules preset, so this is a clean extension.
- This also satisfies the "higher difficulties" part of the brief without touching the core campaign.

---

## 8. Visuals for 6–12 year olds: cool, with a Calm fallback

v0.1's art direction ("restrained dusk palette") is tasteful but undersells the audience. A 7-year-old's first question is "is it cool?" The brief's list — cool lasers, space imagery, futuristic guns, aliens — is the spec, not a suggestion. Keep Helsinki (it's the differentiator and the heart of the design) but make it **Helsinki at night under a space sky**:

1. **Space scenery:** starfield, a large moon or alien planet on the horizon, occasional shooting stars, a distant alien mothership in the background (non-interactive set dressing), and — because it's Helsinki — the **aurora**. The aurora is free space-adjacent spectacle and on-brand.
2. **The turret:** a big drawn sci-fi cannon with visible emitter glow, recoil, and weapon skins (§5). This is the player's avatar.
3. **Laser juice:** bright core + glow + short trail, hit spark bursts, and a small screen shake on boss hits — **all gated behind a visual intensity setting** (see below). v0.1's "laser beam fades in 100–150 ms" is the Calm preset; the default should feel like a laser show.
4. **Aliens with personality:** big eyes, goofy pilots, cartoonish boss warlords. Defeat moment: the pilot pops out in a tiny pod with a comedic sound (the existing "escapes in a tiny pod" rule — keep and amplify). Boss defeat: the §6.3 full sequence.
5. **HUD juice:** score popups on every kill, combo text, star rating on results, salvage counter ticking.
6. **Audio:** keep the chiptune direction, but add a **boss theme** (one or two, distinct from the level loop), a victory fanfare, and per-weapon-skin hit sounds. The voice-limit and ducking rules in §12 already cover the technical side.

**Visual intensity presets (new setting):** Calm (≈ v0.1: restrained, no shake, minimal particles) / Standard (juice, modest particles) / Spectacular (max glow, shake, particle count). Default: Standard. This preserves v0.1's accessibility commitments (reduced motion, no strobe, no full-screen flashes) while letting the default presentation match the brief. Note: Spectacular needs the particle budget in §13.5 raised (e.g., 120 → ~240) and verified on the reference laptop — or Spectacular should favor glow/trails over raw particle count to stay within budget.

**Age span 6–12 is wide.** The intensity preset plus Relaxed timing is the right lever: a 6-year-old gets Calm + Relaxed, a 12-year-old gets Spectacular + Standard (or Pro). Say this explicitly in the design so playtesting can target both ends.

---

## 9. Priorities and scope

**P0 — brief requirements, must be in the final design:**
1. Per-level miniboss + boss structure (§6) with HP pips, phases, named roster
2. WASD-centric mixed track (§4)
3. Salvage + cosmetic upgrade tree + Hangar screen (§5)
4. Space-night visual direction + turret + laser juice + intensity presets (§8)
5. Explicit 10-finger framing: home-anchor lesson, finger mapping, right-hand punctuation, complete arc (§3)

**P1 — strongly recommended:**
6. Pro tier with Shift-combos, sequential input, whitelist (§7)
7. Star ratings, combo milestones, overcharge (§2.2)
8. Boss names + light scavenger-fleet narrative (§2.3, §6.4)
9. Boss theme + victory fanfare + per-skin sounds

**P2 / v2 — only if P0–P1 playtest well:**
10. Word-laser typing mode (§3.6)
11. Double-action mixed targets (§4.4)
12. Repair drones (§2.4)
13. Endless waves (already deferred — keep deferred until campaign tuning is sound, as v0.1 says)

---

## 10. Risks and trade-offs to manage

- **Scope creep:** P0 is a real chunk (bosses ×12, mixed reframe, upgrade loop, visual pass). If the vertical slice (Phase in §14) must shrink, cut in this order: narrative flavor → overcharge → hangar polish. Never cut the boss structure or the upgrade loop — those are the brief.
- **Fairness vs. upgrades:** hold the cosmetic-only line for v1 (§5.4). It's what keeps the existing board design valid.
- **Combo key safety:** treat the §7.2 whitelist as a hard constraint and add it to the acceptance criteria (no combo may trigger an OS/browser action in any supported runtime).
- **Level length:** bosses add time. Re-baseline the §8 "under ~90 s" target per level and confirm session length stays in the 5–15 min band.
- **Performance:** spectacle + bosses + particles is the new worst case for §13.5. The reference-laptop validation already planned in §15 should explicitly include a Spectacular-preset late-campaign boss fight.
- **Playtest metrics:** v0.1's playtest plan measures learning. Add engagement metrics: voluntary replays, time-to-second-level, self-reported "fun" (1–5), and whether children mention the boss or their cannon by name. If kids talk about the Wobbler, the design worked.

---

## 11. Questions for the design team

1. Does mixed mode remain "keyboard + mouse interleaved" (v0.1) or is redefined as the WASD cockpit track (this review's recommendation)?
2. Upgrades: cosmetic-only (recommended) or mechanical with a loadout board axis?
3. Narrative depth: flavor text + named bosses (recommended) vs. full story beats?
4. Default visual intensity for the 6–12 band: Standard (recommended) or Spectacular?
5. Pro tier: a fourth preset inside the campaign (recommended) or a post-campaign mode?
6. Boss on level 1: a gentle 3–4 strike tutorial boss (recommended) or keep L1 boss-free and start bosses at L2?

---

## 12. Suggested acceptance additions

Append to §15's candidate acceptance criteria:

1. Every level ends in a boss fight whose keystrike count exceeds every miniboss in that level; boss pips and phases are visible and readable at 1024×768.
2. The mixed track's first six levels use only WASD + surrounding keys (Q E Z X C F Space) on the keyboard side, and complete without the other track's letter curriculum.
3. Destroying ships awards salvage; at least five upgrade tiers are purchasable, visible in the Hangar, and changing the active beam's appearance without altering scores or rules.
4. The keyboard track teaches the home anchor (F/J bumps) by L1, full home row by L5, and covers all three rows plus right-hand punctuation by L10.
5. In the Pro tier, at least one level requires a Shift+W/A/S/D-family combo, resolved via sequential input, with no OS/browser shortcut fired in the Tauri build or browser preview.
6. With Spectacular intensity and a late-campaign boss active, frame time stays within budget on the reference laptop.
7. In a supervised playtest, at least half of participating children can name a boss or their cannon after three levels.

---

*This feedback is professional game-design review of the v0.1 proposal. It authorizes nothing; the design team decides what enters the final draft, per the process in `review.md`.*
