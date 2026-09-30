# Release verification — Keystrike 0.1.0

Executed 2026-09-30. Human/OS claims are kept separate from deterministic and synthetic-input evidence.

## Environment

Windows 11 Pro Insider Preview 10.0.26220; Ryzen 7 9800X3D, RTX 5090 (also Radeon integrated graphics present). Node 26.10.0, Rust/MSVC Windows x64 build, installed WebView2 154.0.4258.37. This is a desktop development machine, **not** the proposed integrated-graphics school laptop. Browser screenshots checked at 1200×860 and Finnish 1024×768.

## Executed checks

| Evidence | Result |
| --- | --- |
| `npm run check` | 231 checks pass; strict TypeScript and production Vite build pass |
| Full campaign matrix | 12 levels × 3 tracks × 3 ranked presets × 2 layouts: all phases finish, mini and commander present, legal prompts, disjoint active ownership, full-defense stars and rewards |
| Fairness boundaries | Fresh/duplicate resolution, settle ignore, misses do not hurt shield, hit before impact, boss escape/no payout, zero shield immediately ends attempt |
| Pro sequences | Both release-separated orders; overlap hint/no score; inclusive 800 ms edge; timeout one failure; pause clears partial without penalty; mouse-only stays mouse-only |
| Economy and score data | Idempotent rewards/scores, atomic purchase/restart, duplicate/stale rejection, failed write cannot spend/grant, serialized no-overspend, score Skip independence, corrupt backup recovery, bounded import/schema |
| `npm run smoke` | Actual keyboard-driven L1 playthrough in Edge; 28 s automated defense including the final celebration, zero auto-pauses, zero page errors; three stars; save, buy/equip cyan, reload persistence; seven screenshots |
| Native Computer Use | Packaged window observed; Finnish first launch, English toggle; executable-local `save.json` observed; native WebView2 command line points under `data/webview/EBWebView` |
| `npm run native:smoke` | Packaged local content, no development inspection hook; actual L1 input, three stars, zero impacts/errors/pauses; 39 salvage then cyan purchase/equip leaves 34; score/name, lesson 2 and equipment persist after restart |
| Moved native folder | Whole test folder renamed; second launch reads existing data and reports new executable-local path; no AppData fallback |
| Native snapshot writes | 13 sequential flushed/replaced snapshot revisions including purchases, score and settings; last-good backup present; no currency replay on restart |
| Native corruption recovery | Broken primary JSON replaced with the valid backup; balance, owned cyan and score retained; next durable write preserves the broken original as `save.corrupt-*.json` |
| `npm run release` | Windows x64 release compiled; clean fresh staging; EXE, ZIP and SHA256SUMS created |
| ZIP inspection | Exactly Keystrike.exe, PORTABLE.txt, LICENSE and THIRD-PARTY-NOTICES.txt; **no saves/cache/test files** |

Visual QA caught and corrected gameplay overflowing the 860 px viewport and resulting full-page screenshot resize pauses. Combat now fits the available height while preserving canvas coordinate conversion; final screenshots show live prompts and readable commander pips, not a pause overlay. Rehearsal button activation by Enter was fixed and retested. Vite now ignores native build/cache/release folders to avoid watching locked WebView2 files.

## Package measurements

- `Keystrike-0.1.0-windows-x64.exe`: **3,163,648 bytes**.
- `Keystrike-0.1.0-windows-x64.zip`: **1,433,107 bytes**.
- Frontend JavaScript approximately 60 kB (22 kB gzip), CSS approximately 9 kB; assets are procedural. Dependency notices conservatively include locked build/runtime libraries.
- EXE SHA-256: `5eaebce5c305eb4d5bef1fa7794fabfd569f02c35a66acd198c2e2bb1b11aff3`.
- ZIP SHA-256: `7f62d7180936addb38a7d4b80d3aff45459ade7d91e966f7bb6ce290ecc4c14c`.

WebView2 is installed separately and excluded from these sizes. No runtime-free or missing-runtime launch claim is made.

## Material unverified cases / next playtest work

- Real FI/SV and US OS layouts across Caps Lock/composition/Sticky Keys/Filter Keys, swapped mouse buttons, DPI scaling and actual assistive configurations. Synthetic event/code tests do not establish OS input delivery or shortcut suppression.
- Human beginner recognition, finger use, fun, commander recall, replay interest, Finnish language review and cosmetic comprehension. No children participated; no learning efficacy claim.
- The 60–120 s human-session target: automated perfect L1 is 28 s including celebration. Deadlines remain the authored draft values; tune based on beginner sessions, not an artificial minimum wait.
- Reference school-laptop 30/60 FPS, memory/warm launch measurements and worst-case Spectacular L12 presentation. Core logic is bounded/fixed-step, but that does not prove a hardware budget.
- Real read-only-media launch, power-loss/interrupted disk replacement, missing WebView2, SmartScreen on a fresh computer and other Windows versions. Read-only/failed writes are handled in code and fault-injection tests, but not all OS scenarios have been physically exercised.

This is a first playable **prerelease**, with a complete campaign loop and evidence for the implementation tested here. Keep these limits explicit in later release notes until actual evidence closes them.
