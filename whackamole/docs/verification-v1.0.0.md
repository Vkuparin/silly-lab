# 1.0.0 verification record

Date: 2026-10-01. Windows x64; Node 26.10.0, Vite 8.3.1, Tauri 2.12.0, installed Microsoft Edge/WebView2. Checks use isolated synthetic profiles and legacy fixtures, not the user's saved game data.

| Check | Evidence |
| :--- | :--- |
| Baseline | Original 46 tests and frontend build passed before changes |
| Final unit tests | `npm test`: 62 passed, 0 failed |
| Frontend | `npm run build`: TypeScript and production build passed |
| Native build | `npm run tauri build`: optimized executable, x64 NSIS and MSI generated |
| Browser production smoke | `npm run smoke`: real pointer/double-click, five Practice hits/sticker, pause/resume, all scored modes/results, Family handoff/rematch, theme/profile persistence, keyboard/held-key, FI switching and gap/focus pause passed; no page runtime errors |
| Layout | Complete board and ≥88 px circular targets at 960×640, 1280×720, 1920×1080, 1920×1200, 2560×1440, 3440×1440, 3840×2160, 5120×1440; no horizontal overflow |
| Native fullscreen | Actual WebView viewport 5120×1440, device scale 1; fullscreen toggle, visible menu Exit, pointer hit/pause, Exit closes process |
| Native persistence/upgrade | Old-format board and language/pace preference fixtures preserved; selected profile persists across close/relaunch; portable data exists beside executable |
| MSI payload | Administrative extraction exit 0, without installing/replacing an app; extracted executable passed the same native smoke |
| Portable ZIP | Extracted marker, README and executable; executable SHA-256 matches the final native-tested build |
| Installer prerequisites | Generated MSI/NSIS scripts inspected: WebView2 detection and downloadBootstrapper behavior confirmed |
| Git/release scope | Only whackamole project files staged; sibling changes excluded; release binaries live in ignored release staging |

Logic coverage includes both new modes/five levels/25 seeds, safety windows, guaranteed surprises, distinct holes/IDs, identical opportunities under different clicks/pauses, Classic score thresholds, duplicate/stale/expiry input, combo/bomb/escape rules, eligibility changes, corrupt/future/throwing storage, bounded records/bests, stickers, idempotent folding, deletion, and 2–4-player ties/rotating rematches.

## Rendered evidence

- [Main menu at 1280×720](screenshots/home-1280x720.png)
- [Main menu at 5120×1440](screenshots/home-5120x1440.png)
- [Harvest at minimum viewport](screenshots/harvest-960x640.png)
- [Harvest at 5120×1440](screenshots/harvest-5120x1440.png)
- [Practice](screenshots/practice.png)
- [Family results](screenshots/family-results.png)
- [Finnish menu](screenshots/finnish-home.png)
- [Space Garden](screenshots/space-home.png)
- [Native fullscreen menu](screenshots/native-fullscreen.png)
- [Native pause](screenshots/native-pause.png)

Screenshots were visually inspected for target identity, hierarchy, compact fit, central controls and consistent styling. Native fullscreen and browser images preserve full resolution; chat previews may downscale them.

## Known limits and follow-ups

- Supervised child sessions and independent fluent Finnish review have not occurred in this coding session. No age-specific validation or measured educational benefit claim.
- 125%/150% physical monitor configurations and monitor-to-monitor DPI transitions remain unverified. Browser checks cover logical sizes; native 5120×1440 at scale 1 is verified separately.
- MSI payload launch is verified; a full installer install/upgrade/uninstall cycle and a machine without WebView2 were not tested. NSIS/MSI compilation and prerequisite logic are verified. Packages are unsigned.
- Fast spatial gameplay is not claimed fully accessible to screen readers. Menus have semantic controls/focus and optional keyboard gameplay; touch is unranked.
- Audio code/toggles are exercised without blocking play; perceptual sound quality needs listening on intended speakers/headphones.

Initial sandboxed native initialization and installer-tool downloading were blocked by sandbox access. Authorized unsandboxed checks succeeded. An initial fullscreen assertion was corrected to wait for Windows' asynchronous transition; final checks verify native state before testing Exit.
