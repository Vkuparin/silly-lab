# Release verification — Keystrike 1.1.0

Executed 2026-10-01 against the final v1.1.0 Windows package. [v1.0 evidence](verification-v1.0.0.md) is preserved separately. See [the amendment](update-v1.1.0.md) for the accepted behavior.

## Environment and automated checks

Same Windows 11/Ryzen 7 9800X3D/RTX 5090 development desktop and WebView2 154.0.4258.37 as v1.0. Node 26.10.0 and Rust/MSVC Windows x64. This is not the proposed school laptop.

- `npm ci --cache .npm-cache --offline`: pinned packages installed, zero reported vulnerabilities.
- `npm run check`: **741 tests pass**, strict TypeScript and production Vite build pass. Full defense and sequel matrices retain legal inputs, phases, completion, stars and transaction fairness. New pacing checks verify the 1.5× wave boundary and increased pointer/key/word work across twelve levels, both campaigns and all three presets. Existing boundary fixtures now find the last pip/pair rather than assuming old counts.
- Prettier and Rust formatting pass.
- `npm run release`: final Windows EXE, portable ZIP and SHA256SUMS generated.
- Final ZIP inventory is exactly EXE, PORTABLE.txt, LICENSE and THIRD-PARTY-NOTICES.txt inside the versioned folder. EXE and portable instructions match source staging. No data, cache or test fixtures. Both SHA-256 values verified.

## Browser and native checks

- `npm run smoke`: actual Standard L1 victory → results Pro selection → replay victory → Next level starts L2 Standard; with existing L2 completion, Next level starts L2 Pro. Both primary-action states verified. **120 seconds, zero pauses/page errors**, seven refreshed screenshots. Home Exit is present and no top-bar preset badge remains; English/Finnish views show no horizontal overflow.
- `npm run native:iteration`: final EXE delivers buttons 0/1/2/3 without document navigation, completes the longer Finnish L12 words and final sentence with **166 committed characters**, saves score and earns return-12. Fullscreen reaches 5120×1440. Obstructed write grants no purchase; retry succeeds. Obstructed data destination stops startup. Zero page errors. Observed running v1.1.0 WebView2 `--user-data-dir` points to EXE-local `data/webview/EBWebView`.
- `npm run native:smoke`: final packaged local app with no development inspection hook; actual L1 input, Save, purchase/equip, restart, whole-folder move and corrupt primary/backup recovery pass. **51 seconds, score 2862, final balance 33, zero pauses**. From native fullscreen, Home has no preset badge and Tab/Enter activation of localized Exit terminates the process with code 0.

- `npm run smoke:iteration`: longer defense L12 ending, return L1 and L12 words/sentence/ending, explicit Save/Skip, extended Mouse L9 and 5120×1440 browser layout pass. **246 seconds, 217 committed characters, 8 middle and 12 fourth-button inputs, zero page errors**. Six updated campaign/ultrawide screenshots.

## Final package

- `Keystrike-1.1.0-windows-x64.exe`: **3,178,496 bytes**, SHA-256 `258593dbf6dc6cd8e4842045f6318426c0c5ca065b8a0eec45afcaa92838ca48`.
- `Keystrike-1.1.0-windows-x64.zip`: **1,446,057 bytes**, SHA-256 `61889de03ea9f6ba9b67d63a5c8d87e5d18575b7e402023d96e075f6b03e9c20`.

The standalone game still requires Microsoft WebView2, excluded from those sizes. Saves/profile/cache use executable-local data, with schema 2 and no AppData fallback. New content comparison tuple 3.2.3 preserves historical boards separately.

## Material limits

50% is authored combat workload, not a promise of exact wall-clock length for every player. Human enjoyment/impact and beginner/expert timing need further playtesting. School-laptop performance, physical vendor mouse mappings, broad real-layout Sticky/Filter Keys/IME, DPI/multimonitor behavior, missing runtime, SmartScreen and power-loss recovery are still unverified. See the preserved v1.0 evidence for the full distinction between synthetic input and device/human claims.

The initial browser harness used the wrong Leave selector; the corrected final script passes and uses the actual results replay path. These were test-runner corrections, not shipped game failures.
