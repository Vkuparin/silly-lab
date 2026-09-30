# v1.1.0 design amendment and implementation plan

Authorized 2026-10-01: implement, push and publish this small update. This amendment governs the changes below over the v1.0 design; preserve historical feedback and release notes.

## Accepted behavior

- Results continuation uses the finished attempt's route and next level. When continuing from Pro, retain Pro only if that next level has been completed for the same campaign/track/layout/device profile. Otherwise select Standard before showing its briefing. Relaxed/Standard continuation retains its preset. Replay difficulty is independent of continuation.
- After a successful level below L12, highlight **Next level / Seuraava taso** if the next level has not yet been completed. Offer Try again as a secondary action. When revisiting a route whose next level is already completed, replay can remain primary. Failed attempts and L12 have replay as primary.
- Main menu includes localized **Exit / Lopeta**, reachable by primary pointer or Tab/Enter. Native Exit closes the app in windowed or fullscreen mode through a narrow app-owned command. The browser preview attempts to close its tab and exits browser fullscreen first; browser tab-closing policy still applies.
- The main-menu top bar shows the brand and language control, without a difficulty badge. Preset cues remain in setup, briefing, gameplay and results.
- Increase each wave's authored duration by exactly 1.5× in both campaigns and all presets, keeping spawn intervals, concurrency caps and individual regular-ship travel timings. More waves means more combat, without reducing pressure.
- Increase miniboss/commander hit counts by 1.5×, rounding up whole inputs. Sequel Keyboard/Mixed word counts use the same multiplier and rounding; the final seeded sentence remains one concluding sentence. Encounter deadlines continue to derive from the longer input/character workload. Keep phase gates, input settle time, number of phases, reward rules, purchased prices and cosmetic fairness. Additional defeated regular ships naturally award more scrap.

## Implementation and validation

`content.ts` owns longer waves and pointer/key encounter counts; `core.ts` owns longer word encounters; `main.ts` checks next-level eligibility against frozen route context, hides the home badge and dispatches Exit; `screens.ts` chooses results emphasis and adds the home button; `i18n.ts` localizes Exit; `lib.rs` exposes only app exit. Save schema remains 2. Existing progress, ownership, balance and boards survive; comparison tuple becomes **3.2.3** because content and gameplay change.

Validate both full-campaign matrices, wave boundaries and increased encounter workload across all presets, existing phases/text/Shift/economy fairness, actual Standard→Pro replay→new-level Standard continuation and already-unlocked Pro continuation. Inspect refreshed English/Finnish home/results screenshots. Package and run native L1/save/purchase/restart/move/corruption checks, then quit from fullscreen via the menu using keyboard activation. Follow AGENTS.md for final EXE/ZIP inventory, checksums, namespaced tag and release assets.

The 50% change is an authored workload increase, not a promise that every player's wall-clock run is precisely 1.5×. Human impact, difficulty tuning and school-laptop performance still require playtesting.
