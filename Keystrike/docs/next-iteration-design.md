# Keystrike — proposed next-iteration design

Date: 2026-10-01 · Amendment to historical design 0.2 · **Approved for implementation by the user's follow-up; incorporated into v1.0.0.** Original planning rationale and provisional tuning values remain below. See [release notes](releases/v1.0.0.md) and [verification](verification.md) for actual behavior/evidence.

Source: [initial player feedback](initial_release_player_feedback.md), preserved unchanged. Read alongside [released design](game-design.md), [technical decisions](technical-decisions.md), and the [implementation roadmap](next-iteration-implementation-plan.md). Where this proposal differs from the released design, it describes future behavior, not current functionality. Numbers are tuning hypotheses, not validated targets.

The proposal has two delivery stages: **A, improve the existing twelve-mission campaign; B, add the twelve-mission return campaign**. Stage B includes every shared improvement from A. This split is a dependency and review strategy, not a deferral of the requested second campaign out of scope. App versions and release dates remain undecided.

## 1. Feedback disposition and traceability

“Normal” in the feedback means the existing Standard preset. Retain Standard/Relaxed/Pro as the internal and English names; Finnish labels remain localized. The user clarified that the new button means **middle-click press**, and approved **words in Keyboard/Mixed with parallel pointer encounters in Mouse**.

| # | Feedback | Coherent proposed change | Stage / section |
| --- | --- | --- | --- |
| 1 | Always Spectacular | Remove intensity selector; retain reduced motion, readable targets and bounded effects | A / §2 |
| 2 | Own boss music and entrance change | Twelve distinct commander themes; transition when entrance begins | A / §3 |
| 3 | Own increasingly sinister background per level | Twelve identifiable scenes with escalating cartoon menace | A / §3 |
| 4 | Own level music | Twelve identifiable level loops matching scenes | A / §3 |
| 5 | Distinct boss damage sounds | Commander-specific damage signatures, separate from cannon sound | A / §3 |
| 6 | Bigger central boss introduction | Large localized entrance overlay while action is gated | A / §3 |
| 7 | Remove English Näppäinisku subtitle | English home displays Keystrike; Finnish identity remains | A / §2 |
| 8 | Remove Offline buttons/text | Remove redundant UI badges/copy; retain offline ownership and README contract | A / §2 |
| 9 | Short localized version label | Version X.Y.Z / Versio X.Y.Z; comparison versions stay internal | A / §2 |
| 10 | Remove Practice | Remove standalone mode/custom setup; retain briefing rehearsal and Relaxed | A / §2 |
| 11 | Later middle/Mouse 4, hardware fallback | Opt-in extended profile; retain primary-only and two-button routes | A / §4 |
| 12 | More complex Mouse bosses | Authored spatial/button sequences and phase changes for every profile | A / §4–5 |
| 13 | Rename Local scores | Highscores / Parhaat tulokset throughout | A / §6 |
| 14 | Visible progressive damage and hit shake | Persistent damage states and local hit response for multi-hit ships | A / §3 |
| 15 | Distinct preset presentation everywhere | Consistent labeled badge, accent and icon on menus, arena and results | A / §2 |
| 16 | Varied ship and custom boss defeats | Bounded defeat variants; unique commander/miniboss payoff | A / §3 |
| 17 | Replay another difficulty after result | Explicit preset selector; suggest eligible Pro after Standard | A / §6 |
| 18 | Results leaderboard primary, refresh on Save | Immutable attempt board above secondary stats, durable save refresh | A / §6 |
| 19 | Prices roughly +50% | Ceil(old price × 1.5), no retroactive charges | A / §7 |
| 20 | Pro substantially harder | Stronger pacing, authored movement and phase patterns | A / §5 |
| 21 | Scrap gain feedback | Earned/pending feedback from reward events | A / §7 |
| 22 | Wave progress | Scheduled wave progress plus outstanding-threat count | A / §5 |
| 23 | Mechanical/visual boss phases | Core-owned phases with distinct movement and input decks | A / §5 |
| 24 | Campaign ending and special final results | Skippable Scrap King escape/vow after defeat; victory presentation | A / §8 |
| 25 | Cannon tracking | Pointer aim in Mouse/Mixed; shot target aim in Keyboard | A / §3 |
| 26 | Lifelike Standard/Pro movement | Seeded bounded movement, independent of readable threat deadline | A / §5 |
| 27 | Alien objective/proximity | Visible city collection targets, approach boundary and threat meter | A / §5 |
| 28 | Resolution/fullscreen up to 5120×1440 | Window presets and native fullscreen; fair central arena with decorative wings | A / §9 |
| 29 | Unlock twelve-level return campaign | New story, scenes, roster and returning final king | B / §8, §10 |
| 30 | Localized words; final preset sentence | Dedicated text encounters in Keyboard/Mixed; seeded sentence selection | B / §10 |
| 31 | New level-earned cannon visuals | Stable cosmetic reward IDs; no mechanical advantage | B / §7, §10 |
| 32 | Apply all improvements to campaign two | Shared systems; full second-campaign content/validation matrix | B / §10 |

Rows split combined feedback paragraphs into independently verifiable requirements; numbering is this document's traceability, not numbering added to the source.

## 2. Menus, presets and accessibility

Spectacular becomes the ordinary presentation; remove the Calm/Standard/Spectacular selector. Keep explicit reduced motion and OS reduced-motion support. Reduced motion replaces shake, long trails and moving transitions with short/static readable feedback. Avoid flashes, preserve target contrast, cap concurrent effects, and shed decoration under load without altering rules. Difficulty is independent of effect intensity.

Use distinct labeled badges, icons and accents for Standard, Relaxed and Pro on home, mission selection, briefing, HUD, pause, Hangar context, scores and results. Color alone never communicates a preset. Pro can look more urgent without making prompts smaller or obscuring them; Relaxed stays celebratory.

Remove Practice from preset lists, its custom setup and result recommendations. Keep untimed pre-mission key/button rehearsal, the device check and pair explanation. These do not create a second ranked mode or currency source. Recommend briefing rehearsal or Relaxed after difficulty. Remove redundant Offline labels, not offline operation. Keep concise localized version and score labels. Add both languages together.

## 3. Presentation, music and feedback

Retain the first Helsinki waterfront as mission one. Author twelve scene identities with changing skyline, weather, fleet presence and lighting; later menace remains playful, with no graphic harm to residents. Use shared procedural scene layers and original audio rather than a new engine. Each mission has a distinct level motif and commander theme, not just a pitch change to the same two loops. The second campaign needs another twelve identities of each kind. Miniboss arrangements may reuse the mission motif.

Music receives campaign, mission, encounter and pause state. Commander music starts at the large central entrance, transitions without stacked loops, ducks for introduction/damage cues, and restores consistently after pause. Commander-specific damage timbres remain distinguishable with any cannon sound equipped. Respect mute/volume. Music timing never changes hit windows.

Damage presentation uses remaining versus initial pips: intact, cracked and heavily damaged forms, with local shake on impact and static alternatives for reduced motion. A one-hit regular has a defeat transition, not invented intermediate damage. Regular defeats select bounded explosion or smoke/drift variants; minibosses and commanders receive authored signature endings. Remove the defeated target from simulation and settle rewards before cosmetic playback. Decorations cannot intercept hits, conceal live prompts or extend hazards.

Center the commander name/introduction in a large safe area, localized and readable at minimum size. The existing drained-wave entrance remains action-gated, initially about two seconds. The player cannot lose shields while reading it. Cannon aim follows the pointer in Mouse/Mixed, and points at the struck target in Keyboard. Aim is a render transform, not new hit logic.

## 4. Mouse profiles and patterns

Profiles: **primary-only**, **primary + secondary** (default/backward-compatible), and **extended** (primary + secondary + middle + Mouse 4). Keep primary-only support. Explicit capability rehearsal confirms buttons; do not infer missing hardware from inactivity. Use logical labels and an understandable diagram. Mouse 4 means the fourth button, commonly browser Back; it is not Mouse 5.

Proposed introduction: middle in Mouse L7 and Mouse 4 in L9, each taught before timed use. Mixed introduction points must be chosen against its existing curriculum so a new key group and new button are not introduced in one mission. Preserve the first campaign's keyboard curriculum and Pro release-separated Shift lessons. No wheel scrolling, Ctrl/Alt chord, required double click or mandatory simultaneous button hold.

All profiles receive authored boss decks: repeated-primary bursts, asymmetrical button sequences, traversing weak points and phase-specific movement. A two-button or primary-only encounter must still have varied aim paths and pacing; mechanically replacing every extended action with primary is insufficient. Keep one active boss weak point and generous zones. New buttons never appear outside the selected profile; comparison boards distinguish profiles.

Validate actual WebView2 middle/Mouse 4 delivery before finalizing extended mode. DOM `button` values are 0/1/2/3 for primary/middle/secondary/fourth; `buttons` is a different bitmask. Mouse 4 can trigger browser navigation or vendor software. Rehearsal and native testing must establish safe delivery; do not assume cancelling a DOM event disables an OS macro. If unavailable, offer a compatible profile instead of blocking play. Sources: [MDN button](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button), [MDN buttons](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons).

## 5. Combat, phases and difficulty

Give commanders explicit core-owned phase definitions: pip boundaries, input deck, bounded path, visual/audio identity and transition event. Early L1 remains gentle (two readable phases); later commanders use three. Minibosses have shorter patterns, not mandatory full commander complexity. A phase changes movement and input structure, rather than merely changing a displayed label at pip thirds. Preserve unique prompt reservations, fresh presses and the existing 150 ms input settle.

Transitions must not silently steal response time. Proposed short, action-gated phase transition pauses the encounter deadline; the core accounts for this, and the renderer only displays it. Show the next phase pattern before it becomes actionable. Freeze/discard partial pairs on pause as before. No prompt reassignment caused by animation.

Standard ships gain seeded curves, drifts and bounded lateral decisions. Pro increases their complexity and cadence. Position and threat progress remain deterministic from seed and simulation time; randomness cannot teleport ships, invalidate an already accepted hit, or erase a readable window. Relaxed uses simpler/slower paths. Retain initial limits of six regular ships and twelve active steps while tuning.

Pro tuning starting hypotheses: regular travel multiplier 0.75 of Standard (currently 0.9), spawn interval multiplier 0.8, commander active deadline `6 + 2.5 × pips` seconds instead of `8 + 3.5 × pips`. Validate these separately before combining them; adjust by mission/profile, not a blanket claim that they are fair. Keep five shields, taught inputs, readable zones and release-separated Shift. Standard must remain beginner-viable; Relaxed retains longer windows and seven shields. Pro unlock remains per-level completion, not a paid upgrade.

Show what aliens want: visible city scrap collection sites and an approach boundary. A threat meter reflects the core deadline even when the ship circles laterally. Boundary/impact visuals agree with the actual shield event. Wave progress measures scheduled spawn time; at its end show “clearing remaining ships” with a count before advancing. Do not imply all enemies are defeated because the schedule reached 100%. Boss HUD shows remaining pips and phase markers separately.

## 6. Results, scores and replay

The primary results panel is the top-ten board for the **finished attempt**, followed by compact highlights and expandable detail. Freeze campaign, track, mission, preset, layout, device/Shift profile, comparison version and (for words) content locale/corpus in the attempt. Changing replay settings cannot switch the board being shown.

The unsaved attempt is a clearly labeled candidate row, not a saved ranked entry. Preserve optional nickname and explicit Save/Skip. Refresh after successful durable Save; failed writes retain Retry and pending state. If outside top ten, explain the cutoff rather than pretending the board contains it. Double Save cannot duplicate a row.

Offer replay preset selection and return to missions/Hangar. Suggest Pro only after a qualifying Standard/Relaxed completion makes this mission eligible. Respect profile/campaign unlocks. Leaving for replay still explicitly resolves Save/Skip; no automatic anonymous save and no unranked Practice route. Old scoreboards remain accessible as legacy comparisons, not merged with new rules.

## 7. Salvage and cosmetic progression

Raise paid tier costs by `ceil(old × 1.5)`:

| Category | Old paid tiers | Proposed paid tiers |
| --- | --- | --- |
| Color | 5 / 15 / 35 | 8 / 23 / 53 |
| Shape | 10 / 25 / 50 | 15 / 38 / 75 |
| Impact | 10 / 30 / 60 | 15 / 45 / 90 |
| Sound | 10 / 25 / 45 | 15 / 38 / 68 |
| Skin | 25 / 60 | 38 / 90 |

Total rises from 405 to 611 scrap (about 51%). First miniboss's ten scrap still buys the eight-scrap first color. Preserve balances, owned tiers and equipment; no retroactive charges or forced repurchases. Replay farming remains allowed. Validate acquisition pacing with real play before changing rewards too.

Core reward events drive scrap popups and the HUD. Distinguish pending earnings from durable currency; particle drops cannot be the transaction mechanism. Writes, receipts, retries and purchases retain exactly-once behavior.

Campaign-two mission rewards are a separate roster of cannon appearances earned once per defeated mission, identified by stable cosmetic IDs. They do not replace or renumber purchased tier ownership. Show earned/locked status and reward preview; equip independently of mechanical rules. Cosmetic unlock and mission completion commit together, with a pending notice on failure.

## 8. Campaign victory and unlocks

Defeating campaign-one L12 Scrap King produces a skippable outro: his damaged craft flees, and he promises to return for Helsinki's shiny metal. Use localized captions and a static reduced-motion version. Special final results celebrate victory, show the attempt board and present the return-campaign unlock. Commit progress before cinematic playback; skipping, closing or replaying cannot duplicate rewards.

Distinguish **defended lesson** from **commander defeated**. Existing surviving-escape behavior still unlocks the next lesson without a kill reward. Campaign two requires defeating L12's commander in Standard, Relaxed or Pro for the applicable track/layout/device route; no three-star gate. A surviving escape gives a defense result and invites a king rematch, not a defeat cinematic or campaign unlock. Persist explicit final-commander victory, campaign unlock and outro-seen flags.

Legacy migration must not interpret `completed[]` alone as a kill: it also records escapes. Valid existing two/three-star evidence or a saved L12 entry explicitly marking commander defeat can establish victory during migration, scoped to its original route. Otherwise preserve first-campaign progress and request an L12 rematch. Future unlock authority is persisted victory, not the continued presence of a top-ten score. Never erase progress because a player skipped saving their score.

## 9. Resolution and fullscreen

Offer window-size presets up to 5120×1440 when supported, and fullscreen at the monitor's available size. Do not change OS display mode or force unsupported sizes. Preserve keyboard-operable controls, usable Finnish menus at 1024×768, and an obvious exit-fullscreen action.

Keep a consistent logical combat arena and hit geometry. On ultrawide screens extend decorative scenery to the sides rather than revealing extra spawn lanes or changing reaction distances. Lay out HUD safely and keep prompt sizes legible. Map pointer coordinates through the arena rectangle, not the whole window. Cap backing-buffer pixel density/render resolution to control cost; resolution must not alter simulation or scoring. Resize/fullscreen changes pause with explicit fresh-input resume.

5120×1440 visual inspection and native input are acceptance requirements, not a present performance claim. Portable settings and WebView2 remain under executable-local `data/`; resolution settings do not justify broader filesystem permissions.

## 10. Return campaign and text encounters

Campaign two is twelve missions with a new localized story, twelve scenes, distinct regular/miniboss/commander identities, and Scrap King returning as final commander. Share systems with campaign one; do not copy twelve bespoke engines. Ordinary waves retain the route's input skills. Keyboard/Mixed minibosses and commanders switch to text encounters; Mouse uses equally developed pointer patterns through the same story, as confirmed by the user. Mouse never requires typing.

Proposed length bands for authoring: early mini words 3–4 graphemes and commander words 4–6; later mini words 5–8 and commander words 7–12. These are corpus budgets, not a demand to translate English words literally into equal-length Finnish words. Author familiar age-appropriate EN/FI pools with stable IDs, no personal information or unsafe OS shortcuts. Show the word directly beneath the boss, highlighting typed letters and the next letter. Every correct letter fires a cannon beam immediately; there is no typing popup. The final sentence follows the same presentation. An invisible focusable input is an accessibility/input adapter, not a visible text box. Keep language and keyboard layout separate; default US-layout word content to English and FI/SV to Finnish, with an explicit supported content-language selector. UI language never silently changes a running corpus. Verify actual character entry; do not require AltGr/dead-key combinations or silently transliterate Finnish. Offer the supported corpus when the configured layout cannot enter a word.

The final commander has ordinary word phases followed by a full sentence chosen from localized presets by the attempt seed. Show the complete sentence with clear wrapping and progress; initially author short 25–45-grapheme sentences with simple spacing/punctuation. Seed and preset ID are stored in the attempt. Bound word lengths and pool sizes in content validation. For ranked play, select from authored variants matched for grapheme count and input demands; if materially unequal variants remain, include variant ID in the board key rather than asserting comparable random difficulty. Locale/corpus version always separates boards.

Keyboard campaign-one graduates have a broad alphabet; Mixed's first campaign teaches a smaller gaming cluster. Do not assume those prerequisites are equal. Campaign-two Mixed briefings must explicitly rehearse new letters/spacing before they appear in timed words. Start with words from its known set where practical and introduce authored character groups progressively; validate each mission's corpus against the route's accumulated taught characters. Final-sentence punctuation must likewise be taught. This is a text-curriculum extension, not an incidental mouse-button introduction in the same mission.

Text input needs a dedicated adapter and prompt type. Use committed text, Unicode NFC normalization and case-insensitive comparison; allow Backspace to correct the suffix, ignore held-key auto-repeat, and keep system shortcuts out of combat. One wrong committed character resets streak/counts a mistake once without costing a shield. Do not simultaneously interpret text characters as ordinary ship-key hits. One displayed word owns focus; Mouse aiming can remain in Mixed outside the typing encounter. Preserve focus-loss pause, visible buffer, transition settling and fresh input. Composition is reconciled through committed input, not scored per intermediate keystroke. `beforeinput` alone is insufficient for all input methods; native support must be demonstrated before claiming IME compatibility. Sources: [MDN beforeinput](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event), [MDN input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event).

Proposed scoring unit: one completed word (or final sentence) resolves one authored pip and earns the base step score; character progress drives beams and character accuracy, not per-character salvage or a kill before completion. Wrong-input accounting is character-based; display word completion separately. Keep word boards separate from letter/pointer boards. Scale deadlines from expected graphemes, difficulty and phase demand rather than reusing `seconds × word pips`. Establish coefficients with a one-mission text playtest before authoring all twelve. No mandatory uppercase, concurrent Shift-pair lesson, paste-to-win, autofill, or shortcut submission. The adapter must distinguish supported typing from bulk paste/replace and document limits for composition; test actual WebView2 behavior.

## 11. Compatibility and decisions still to validate

Preserve original feedback and released notes. Migration removes Practice from selectable settings (saved selection becomes Relaxed), preserves legacy scores, and removes intensity while mapping prior Calm to reduced motion to avoid unexpectedly enabling more movement. Preserve existing reduced-motion preference for other settings. Map `primaryOnly` to the new primary/two-button profiles; extended is never enabled silently. New schema and comparison versions are chosen during implementation with tested migrations.

Confirmed by user: middle click; Keyboard/Mixed words with Mouse pointer route. Remaining implementation gates: exact Mixed button-introduction missions; validated native Mouse 4 handling; Pro/word timing; authored phase decks and localized corpora; human progression pacing; fullscreen/DPI and low-end performance. These are bounded validation tasks, not permission requests or claims of completed work.

Implementation comparison detail: every return-campaign text board also includes `words-N` (seed modulo four), so different authored word rotations are not merged when word lengths differ. Final missions additionally include the sentence preset ID. The native single-document navigation guard blocks browser Back/Forward; the full Edge preview smoke clears its external history before testing Mouse 4, which is not a claim that DOM cancellation disables vendor macros.
