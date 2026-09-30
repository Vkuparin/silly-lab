# Release verification — Keystrike 1.0.0

Executed 2026-10-01 against the final v1.0.0 Windows package. v0.1.0 is the historical playtest; this is the user-designated first full release. Human/device claims remain separate from deterministic and synthetic-input evidence.

## Environment

Windows 11 Pro Insider Preview 10.0.26220; Ryzen 7 9800X3D, RTX 5090, 5120×1440 monitor. Node 26.10.0, Rust/MSVC Windows x64 and WebView2 154.0.4258.37. This is a desktop development machine, not the proposed school laptop. Browser QA covers 1200×860, Finnish 1024×768 and 5120×1440.

## Executed checks

| Evidence | Result |
| --- | --- |
| `npm ci` | Locked dependencies installed; audit reported zero vulnerabilities |
| `npm run check` | 740 tests pass, strict TypeScript and production Vite build pass |
| Campaign matrices | Existing defense matrix plus 504 sequel combinations across twelve levels, three tracks, three presets, two text locales and relevant mouse profiles; complete waves/miniboss/commander, legal prompts and rewards |
| Phase/input boundaries | Deterministic phases, transition deadlines/settle, fresh ownership, misses, escapes, Shift release/pause cases, NFC text, correction, bulk rejection and no key/text duplicate scoring |
| Economy/migration/boards | Schema-1 settings, ownership, balance and historical boards preserved; escape versus actual defeat distinguished; immutable comparison identity, earned appearance transaction, idempotent receipts and failed-write no-grant cases |
| `npm run format:check`, Rust formatting | Source formatting passes |
| `npm run smoke` | Actual Edge L1 input, Save/purchase/equip/reload, 30 seconds, zero pauses/page errors, seven refreshed screenshots |
| `npm run smoke:iteration` | Full defense ending, sequel L1 words and L12 final sentence/ending, explicit Save/Skip, extended Mouse L9 and ultrawide. 176 seconds; 154 committed text characters, 10 middle and 5 fourth-button inputs; zero page errors |
| Word presentation QA | Actual screenshots show the word/sentence beneath the ship, no typing popup. Correct-character core events drive immediate cannon/audio feedback; accepted prefix and next letter remain visible |
| `npm run release` | Final Windows x64 EXE, portable ZIP and SHA256SUMS generated |
| `npm run native:smoke` | Final EXE uses packaged local content without development inspection hook; L1 actual WebView2 input, score 2016, zero pauses, Save/purchase/equip, restart, whole-folder move and corrupt-primary backup recovery pass; final balance 31 |
| `npm run native:iteration` | Final EXE delivers logical buttons 0/1/2/3, blocks document navigation, completes Finnish return L12 words and sentence/ending with 112 committed characters, saves score and earns return-12; zero page errors |
| Native fullscreen | Observed 5120×1440 content viewport; settings exit to windowed mode works |
| Native failed write | `save.next.json` blocked with a directory: notice shown, purchase grants no ownership/currency change; remove obstruction and retry succeeds |
| Blocked startup | `data` replaced by a file in a fresh test folder: native diagnostic requests writable executable folder before WebView2, existing file retained |
| Portable WebView2 | Running packaged browser, GPU, utility, renderer and crash handler command lines point under EXE-local `data/webview/EBWebView`; crash database and metrics are there too |
| ZIP and checksums | Four files within the versioned folder: EXE, PORTABLE.txt, LICENSE and THIRD-PARTY-NOTICES.txt. ZIP EXE equals standalone EXE; both SHA-256 values verified. No saves/cache/test files |

The native test runner required execution outside the restricted sandbox to start/attach WebView2. An initial supplementary harness used an unsupported Playwright Finnish key name and later encountered a screen-transition race; the harness now dispatches real Finnish key/code events and tolerates an already-completed ending transition. Both final native checks passed after these harness corrections. No test debugging flag ships in the game.

Full Edge browser Mouse 4 can invoke browser-owned history outside DOM cancellation. The browser test resets navigation history before that input; the packaged application independently rejects later document navigation, verified with native Mouse 4 and an explicit navigation attempt. Physical vendor mappings remain a separate hardware check.

## Final package

- `Keystrike-1.0.0-windows-x64.exe`: **3,177,472 bytes**.
- `Keystrike-1.0.0-windows-x64.zip`: **1,445,816 bytes**.
- EXE SHA-256: `046b5486a3558f916fa0b4ef3697036e45523a67ccaf5f53870fbdd77a77545f`.
- ZIP SHA-256: `fbc93b1979180b61c9af10db88aeb41f448703f87486c6c28d666e76f656f8dd`.

WebView2 is separately installed and excluded from these sizes. No runtime-free or missing-runtime launch claim is made. Generated test folders/results stay in ignored `release/`.

## Remaining human/device validation

- Beginner/expert enjoyment, commander recognition, Finnish language review, human timing and supervised child sessions. No educational efficacy claim; automated perfect play is not a human session.
- Reference school-laptop frame rate, memory and warm launch. Bounded fixed-step logic does not establish a hardware budget.
- Physical vendor Mouse 4 mappings, swapped buttons, real FI/SV/US layouts, Caps Lock, Sticky/Filter Keys, broad IME and assistive configurations. Committed text is tested; synthetic input does not certify all OS delivery.
- DPI/multimonitor behavior, missing WebView2, SmartScreen on a fresh computer, other Windows releases, actual read-only media, power loss during replacement. Obstructed startup and writes were tested, but do not prove every filesystem failure mode.

Keep these limits explicit until observed evidence closes them. Future updates follow [AGENTS.md](../AGENTS.md), including the final-package checks.
