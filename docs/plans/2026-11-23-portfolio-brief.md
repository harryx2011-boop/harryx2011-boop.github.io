# Portfolio brief (harryxie.me)

Written 2026-11-23 for the next session. Harry will send reference portfolios first; the build starts from those.

## Goal

A personal portfolio at https://harryxie.me that presents Harry as the founder of Aether. Harry's words: "just describe me as a founder of Aether. ill send ref portfolios and we leave a brief for next session to build".

## Where things stand

| Item | State |
|---|---|
| Domain | `harryxie.me`, registered at Namecheap, Namecheap BasicDNS (`dns1/dns2.registrar-servers.com`). DNS stays at Namecheap (Harry's pick). |
| DNS records | 4 A records to GitHub Pages (`185.199.108-111.153`). `www` is a CNAME to `harryxie.me`; it should be `harryx2011-boop.github.io` (Harry changes it in Namecheap > Advanced DNS). MX records exist, likely email forwarding: leave them. |
| Host | GitHub Pages user site, repo `harryx2011-boop/harryx2011-boop.github.io` (public), local copy `C:\devprojects\harryxie.me`. Pages source: branch `main`, folder `/`, legacy build; `.nojekyll` set. |
| HTTPS | Certificate approved for `harryxie.me` (expires 2027-02-21), HTTPS enforced. `www` is not covered until its CNAME is fixed. |
| Live page | Holding page, commit `25eb6d0`: name, "Founder of Aether. Building tools for the next frontier.", GitHub link, Aether mark. Newsreader + Geist Mono on the profile banner's navy-to-blue sky. |

## Decisions already made (Harry, 2026-11-23)

- Host: GitHub Pages, the personal user site.
- DNS: keep Namecheap DNS (do not move nameservers to Vercel).
- Build: Next.js static export, published by a GitHub Actions job on each push to `main`.
- Framing: founder of Aether. The project list waits for the references; the first answer picked software projects, design and films, about and contact, then narrowed to the founder framing.

## Steps

1. When `www` shows `harryx2011-boop.github.io` (`nslookup -type=CNAME www.harryxie.me 1.1.1.1`), re-request the certificate: PUT `repos/harryx2011-boop/harryx2011-boop.github.io/pages` with `cname: null`, then `cname: "harryxie.me"` (same `source` both times), then check `https_certificate.domains` lists both names.
2. Study Harry's reference portfolios with `~/.claude/reference/site-study.md`: structure only, never their palette or marks.
3. Build 2-3 directions as hero comps at 390 and 1440 px on one Artifact page; Harry picks. Candidates from the holding page: A "Horizon card" (what is live now), B "Letterhead" (light paper ground, name small at the top, one large italic sentence about Aether), C "Mark first" (Aether hexagon huge and cropped off the right edge, name and role small in mono on black).
4. Scaffold Next.js with `output: 'export'` and `images: { unoptimized: true }`; components from harry-ui first. Keep `CNAME` in `public/`.
5. Add `.github/workflows/pages.yml` (`actions/configure-pages`, `actions/upload-pages-artifact` on `out/`, `actions/deploy-pages`) and switch Pages to `build_type: workflow`. Do this before pushing anything under `docs/`: with the current branch build, every file in the repo is served as it is.
6. Push to `main` only with Harry's go (it updates the live site), then check https://harryxie.me returns 200 with the new page.

## Not in scope here

- The animated Vulcan logo for the GitHub profile README (`harryx2011-boop/harryx2011-boop`, `vulcan-pill.png`): its own track, see `context.md`.
