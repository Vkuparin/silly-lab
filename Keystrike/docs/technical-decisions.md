# Technical decisions — 0.1.0

Implementation authorized by the user's 2026-09-30 coding/release request. The documentation-only status in earlier drafts is historical. The requested first release retains the twelve levels, three tracks, four presets, bosses and cosmetic progression. No unrelated game code was changed.

| Decision | Implementation |
| --- | --- |
| Platform | Windows x64, Tauri 2.12.0, WebView2 prerequisite; portable executable/ZIP, no installer |
| Frontend | TypeScript 6.0.3, Vite 8.3.1, plain semantic DOM, Canvas 2D, synthesized Web Audio |
| Storage override | User explicitly superseded design §13.2: always executable-local `data/`, including WebView2; no marker and no AppData fallback |
| Folder permissions | Writable portable folder required at startup; native error dialog otherwise. Mid-session write failure keeps explicit pending rewards, disables spending those rewards and allows retry/discard |
| Snapshot | Versioned JSON, serialized frontend queue, native file lock, flushed temporary file, same-directory replacement, last-good backup; corrupt originals preserved |
| Data recovery | Frontend validates bounded candidates and chooses the newest valid snapshot. Interrupted attempts seal; hazards/scores never resume or replay currency |
| Layouts | FI/SV and plain US unshifted character curricula; key/code identity for Shift; labelled any-Shift and primary-only profiles; independent language setting |
| Input | Fresh key-down only, composition/system shortcuts ignored, semantic logical pointer buttons, canvas coordinates scaled through bounding rectangle; blur/visibility/resize/large gap pause |
| Pro | One/two mandatory release-separated left-Shift boss pips at L11/L12 in Keyboard/Mixed. Inclusive 800 ms simulation window; overlapping holds hint without scoring. Standard fallback remains available |
| Boards | Per-level, track/rules/layout/device/content split, explicit Save/Skip, stable attempt IDs, top ten and deterministic tie breakers |
| Assets | Original procedural pixel geometry and oscillator music; no downloaded runtime assets/fonts, no account or content services |
| Release workflow | Keystrike/AGENTS.md and scripts/release.ps1; namespaced tags, locked dependencies, checksums and clean portable package |

Tauri's [absolute webview data-directory API](https://docs.rs/tauri/2.12.0/tauri/webview/struct.WebviewWindowBuilder.html#method.data_directory) and [runtime distribution guidance](https://v2.tauri.app/distribute/windows-installer/) informed packaging. Setting only game-save paths would leave browser caches elsewhere, so the shell explicitly redirects both.

The school-laptop performance target and supervised child/accessibility playtests remain external validation work. This release is a first playable iteration, not a certified typing curriculum. The accelerated automated L1 run is shorter than the provisional 60–120 s human-play target; that target must be tuned using actual beginner sessions rather than forcing idle delay.
