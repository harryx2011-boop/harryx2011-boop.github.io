# Local checks (PC, hidden browsers)

Real mouse input through Playwright (`playwright-core` from `C:\devprojects\Aether\node_modules`). No dev server: the demo is opened as a file.

1. Build the demo into a scratch folder: `bash build.sh <data.js>` writes `./out` beside the script. `data.js` is the published artifact's file (Artifact tool, `read_file`, path `data.js`).
2. Run: `DEMO_DIR=<folder that holds out/> node interact.mjs edge` (or `firefox`, `webkit`). Firefox and WebKit need `node C:/devprojects/Aether/node_modules/playwright-core/cli.js install firefox webkit` once.
3. `look.mjs <tag> <width> <height> name=selector ...` takes screenshots into `<DEMO_DIR>/shots`.

What `interact.mjs` checks (30): the desktop starts empty, an icon click opens an app, title drag, resize from a corner and two edges, the minimum size and the desktop edge, Esc, icon drag, Paint draws and clears, the film fits and fills its window, no heatmap, the Discord handle, and a blank start with no sideways overflow at 390, 820, 1024 and 1280 px.

Last result, 2026-11-25: Edge 158, Firefox 159 and WebKit 27.2 each PASS 30, FAIL 0.

The cloud-box harnesses in `../box` predate version 11: they expect the film to open at load and have not been rerun since.
