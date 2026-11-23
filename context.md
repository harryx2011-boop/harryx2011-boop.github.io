# harryxie.me

Harry's personal site. GitHub Pages user site for `harryx2011-boop`, served at https://harryxie.me.

## Current state

- Live: a one-screen holding page (`index.html`, `aether.svg`, `.nojekyll`), commit `25eb6d0`, 2026-11-23, plus a Lucide link icon and `aether-labs.dev` on its own line under the tagline (commit `2733528`). aether-labs.dev is Harry's (name.com) but still parked; the link works once the Aether site is hosted there.
- Next: the full portfolio, built in Next.js (static export, GitHub Actions deploy). Plan with Harry's 20 answers: `docs/plans/2026-11-23-portfolio-plan.md` (the older `2026-11-23-portfolio-brief.md` keeps the hosting facts). Concept: a dark one-page scroll whose hero is a live black hole in pure ASCII; scrolling flies the camera into it.
- Waiting on Harry: the black hole view (A "Bent disk", B "Ring", C "Horizon") on https://claude.ai/code/artifact/d07ecb7f-8225-4d19-aeb8-b548319a5689, and a Discord handle or invite.
- Design files: `design/comps/2026-11-23-black-hole-views/` (`src.html` is the source; `build.py <comp dir> <refs dir> <scratch dir>` inlines the hands map and writes `black-hole-views.html`), `design/refs/creation-of-adam/` (halftone footer: `hands.py <scan> <out dir>` builds `hands-map.b64` from the Wikimedia Commons scan `Michelangelo_-_Creation_of_Adam_(cropped).jpg`, which is not committed), `design/refs/study/` (reference study, not committed).
- Do not push `docs/` or this file while Pages still builds from the branch: everything in the repo is served as it is until the Actions build replaces it.

## Setup

- Domain at Namecheap, DNS at Namecheap BasicDNS: 4 A records to GitHub Pages; `www` CNAME should be `harryx2011-boop.github.io` (open, Harry's change).
- HTTPS: certificate approved for `harryxie.me`, expires 2027-02-21; enforced.
- A push to `main` updates the live site: needs Harry's go.

## Log

- 2026-11-23 (later): Harry asked for "a actual portfolio and complex web design animations/transitions and a clean.polished and premium scorll through", dark, with "a black hole in ascii/dithered animated as the hero". He answered 20 questions (table in the plan). He goes by Harry or Elixir. Built and published the live ASCII black hole demo (WebGL: Schwarzschild light bending rendered to a character grid, 4 samples per character, ramp ` .:-=+*#%@`, amber only above 0.9 brightness) with three views and a Fall in preview, plus the footer he asked for mid-session: the hands from Michelangelo's The Creation of Adam in halftone dots. Checked in headless Edge at 1440 and 390 px. A reference study of award-level sites was started in the background.

- 2026-11-23: Domain checked (already pointed at GitHub Pages), certificate re-requested and approved, HTTPS enforced, holding page published. Portfolio brief written.
- 2026-11-23: aether-labs.dev link added to the site (`2733528`).
- 2026-11-23: GitHub profile (repo `harryx2011-boop/harryx2011-boop`, commit `13a006f`): Harry picked direction B "Hero card" from https://claude.ai/code/artifact/a0cb68c2-671f-43b2-b6fb-6f2511b97564. `vulcan-pill.png` replaced by `vulcan-card.webp` (animated WebP, 768 x 480, 40 frames x 90 ms, loops, alpha, 723 KB; 40 x 30 ASCII flame from the Vulcan mark on the hero ember gradient, sparks loop seamlessly). `banner-blue.png` redrawn with a link icon and `aether-labs.dev` under the tagline; the banner links to https://aether-labs.dev. Checked live in Edge.
