# harryxie.me

Harry's personal site. GitHub Pages user site for `harryx2011-boop`, served at https://harryxie.me.

## Current state

- Live: a one-screen holding page (`index.html`, `aether.svg`, `.nojekyll`), commit `25eb6d0`, 2026-11-23.
- Next: the full portfolio, built in Next.js (static export, GitHub Actions deploy). Brief: `docs/plans/2026-11-23-portfolio-brief.md`.
- Do not push `docs/` or this file while Pages still builds from the branch: everything in the repo is served as it is until the Actions build replaces it.

## Setup

- Domain at Namecheap, DNS at Namecheap BasicDNS: 4 A records to GitHub Pages; `www` CNAME should be `harryx2011-boop.github.io` (open, Harry's change).
- HTTPS: certificate approved for `harryxie.me`, expires 2027-02-21; enforced.
- A push to `main` updates the live site: needs Harry's go.

## Log

- 2026-11-23: Domain checked (already pointed at GitHub Pages), certificate re-requested and approved, HTTPS enforced, holding page published. Portfolio brief written.
- 2026-11-23: Open side track: animated, more detailed Vulcan logo (ASCII flame on the Vulcan hero gradient) to replace `vulcan-pill.png` in the GitHub profile README repo `harryx2011-boop/harryx2011-boop`. Directions go on an Artifact page first.
