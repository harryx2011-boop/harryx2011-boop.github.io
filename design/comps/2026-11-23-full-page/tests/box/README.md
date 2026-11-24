# Box test harnesses

Copies of the scripts and test pages from /workspace/crt-test and /workspace/page-test in the cloud box, byte for byte (sha256 checked 2026-11-24). Run them in the box. They drive headless Chrome over the DevTools Protocol.

## What each tests
- crt-test/run.mjs: real mouse, touch and keyboard input on the small desktop (drag, focus, minimize, maximize, close, Tab order, apps, narrow 390 px, page2.html fixes).
- page-test/pass.mjs: walks the whole page in desktop, phone or reduced-motion mode and screenshots each step; on phone it also checks the menu and sideways overflow.
- page-test/measure.mjs: scroll sweep that measures the gap from the hole to the first face and checks the name against the Contact heading.
- page-test/reduced-gap.mjs: the same gap check under reduced motion, at 1440 and 390.
- probe.mjs (both folders), one.mjs, extra.mjs: one-off checks (WebGL info, one screenshot, chosen scroll points).

## Commands (run inside the box folder)
- cd /workspace/crt-test && node run.mjs
- cd /workspace/page-test && node pass.mjs desktop (or phone, reduced)
- cd /workspace/page-test && node measure.mjs desktop <tag> (or phone <tag>)
- cd /workspace/page-test && node reduced-gap.mjs

## Also needed in the box folders
- crt-test: helpers.js (run.mjs injects it), probe-expr.js (probe.mjs) and data.js (page2 loads it; here it is a copy of page-test/data.js, any stand-in works) are in this folder. Copy from the parent folder on the PC: engine.js, chapters.js, github.js, ui.js, and the PC files base.css, chapters.css, crt.css, crt-os.css, crt-engine.js, crt-plants.js, crt-computer.js, crt-ground.js, crt-scenes.js, crt-scene.js, os-icons.js, os-apps.js, os.js.
- page-test: index.html (lib.mjs serves it at /; make it by wrapping page.html in a doctype, html, head with charset and viewport metas, and body), and the PC files base.css, chapters.css, crt.css, crt-os.css, crt-engine.js, crt-plants.js, crt-computer.js, crt-ground.js, crt-scenes.js, crt-scene.js, os-icons.js, os-apps.js, os.js, engine.js, camera.js, hole.js, hands.js, chapters.js, github.js, ui.js.
- wide-hash.json is written on the first run if it is missing.

## Last known result
- run.mjs: PASS 138, FAIL 0 (2026-11-24).

## Facts
- The box has Chrome 157 and Node 24 (v24.21.0) but no Playwright; the scripts start Chrome directly.
- Media files are not copied, so requests for missing images are expected (run.mjs ignores them in its page-error check).
