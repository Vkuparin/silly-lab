# Technical decisions — 1.0.0

The user authorized the feedback implementation and named v1.0.0 the actual first full release. The original v0.1.0 playtest remains historical. Both planned stages ship together, using shared encounter/content systems. No unrelated game code is part of this release.

| Decision | Implementation |
| --- | --- |
| Platform | Windows x64, Tauri 2.12.0, WebView2 prerequisite; portable EXE/ZIP, no installer |
| Frontend | TypeScript 6.0.3, Vite 8.3.1, semantic DOM, Canvas 2D and synthesized Web Audio |
| Storage | Absolute executable-local `data/` for saves, backups and WebView2 profile/cache, including development; no marker or AppData fallback |
| Transactions | Schema 2; validate schema 1 before migration; serialized revision queue, native lock, flushed temporary file, backup and same-directory replacement. Failed writes never grant purchases; pending rewards remain explicit |
| Victory | Lesson completion and commander defeat are distinct. Final defeat unlocks the sequel for the same route; saved older defeat evidence is migrated. Rewards do not depend on saving a score |
| Campaigns | Two campaigns of twelve missions. Shared authored scenes, rosters, phase transitions, movement and reward IDs in `campaigns.ts`; no separate mission engines |
| Phases | Two phases at L1, three later; deterministic pip boundaries, brief transition gate with extended deadlines and settled input |
| Mouse | Primary-only, two-button and opt-in extended. Middle-click press starts L7, Mouse 4 starts L9 in Mouse/Mixed. Untimed device check precedes launch |
| Text | Keyboard/Mixed sequel minibosses use shorter words, commanders whole localized words, final commander a seeded sentence. Committed text has exclusive ownership; NFC/case normalization, prefix correction, no paste-to-win. Words are drawn beneath the ship; each accepted letter emits a cannon event |
| Text fairness | Word deadlines reflect character count. Letter shots are presentation events; word completion scores a pip once. FI text requires FI/SV layout; Mouse encounters remain pointer-only |
| Comparison | Frozen per-attempt campaign/track/preset/layout/profile/content identity; tuple 2.2.2. Locale, word rotation and final sentence variants separate unequal comparisons; historical boards survive |
| Presets | Standard, Relaxed and stronger Pro. Practice folds into Relaxed; briefing rehearsal stays. Pro uses shorter travel/intervals and stronger commanders; defense L11/L12 keeps release-separated Shift sequences |
| Cosmetics | Purchases cost ceil(old price × 1.5); existing ownership survives. Twelve earned sequel appearances. Equipment never changes score, damage or timing |
| Presentation | Twenty-four procedural scenes, 24 level and 24 commander themes, damage states, cannon aim, scrap cues and endings. Bounded effects; reduced motion overrides moving effects |
| Display | Fixed logical arena with scenery wings. Native allowlisted window presets to 5120×1440 if monitor supports them, plus fullscreen. Resize/focus loss pauses |
| Native input | Single-document navigation guard rejects later navigation, including auxiliary-button browser defaults. Browser smoke resets external browser history before Mouse 4; shipped native protection is checked separately |
| Release | Repeatable commands and contracts in AGENTS.md; locked dependencies, namespaced tag, clean EXE/ZIP, checksums and final-package tests |

Tauri's [absolute webview data-directory API](https://docs.rs/tauri/2.12.0/tauri/webview/struct.WebviewWindowBuilder.html#method.data_directory) and [runtime distribution guidance](https://v2.tauri.app/distribute/windows-installer/) inform packaging. Redirecting only save paths would leave browser caches elsewhere, so both are explicitly redirected.

School-laptop performance, human pacing/fun and real accessibility/layout compatibility remain external validation work. Automated perfect play is not a human session or evidence of educational efficacy. See [verification](verification.md) for observed results and limits.
