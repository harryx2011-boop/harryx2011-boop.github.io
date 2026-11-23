Status: PLANNED

# Portfolio plan (harryxie.me)

Replaces the waiting state of `2026-11-23-portfolio-brief.md`: Harry no longer sends references first; the references are gathered for him.

## Goal

A dark, cinematic one-page portfolio at https://harryxie.me whose hero is a live black hole drawn in ASCII characters, presenting Harry as the founder of Aether.

## Concept

Event horizon. The page is one fall into a black hole drawn in characters, and the work is the light caught around it. The one bold idea: scrolling is the camera, in through the hole, past the work, and back out. Everything else stays quiet.

## Decisions (Harry, 2026-11-23, 20 questions plus one message)

| # | Question | Answer |
|---|---|---|
| 3 | References | "mine and find them": awwwards search plus his reel notes and component libraries |
| 4 | Framing | Founder of Aether |
| 5 | Hero drawing | Pure ASCII |
| 6 | Black hole view | "horizon - add more color to it": view C, the camera skims the disk 3 degrees above it, the hole is cropped by the right edge and one bright line crosses the screen |
| 7 | Colour | First answer: off-white on black with one amber accent. Changed the same day to "add more color": he picks 1 "Furnace" (deep red to white-hot, by heat), 2 "Doppler" (red to pale blue-white, by motion) or 3 "Ember" (off-white with a wide amber and red-orange band) on https://claude.ai/code/artifact/d07ecb7f-8225-4d19-aeb8-b548319a5689. Open. The page ground stays black and the type stays off-white. |
| 8 | Hero interaction | Cursor shifts the camera; scroll falls into the hole |
| 9 | Site shape | One long page |
| 10 | Motion level | Cinematic: a pinned scene in every chapter, split-letter headlines, image hover distortion |
| 11 | Type | Newsreader headlines, monospace details (IBM Plex Mono in the comps; never Inter, Geist, Space Grotesk or JetBrains Mono for display) |
| 12 | Project layout | Full-screen chapters |
| 13 | Which projects | "just Aether" |
| 14 | Other work | "films, 3d scene renders of the night market and tidal racing's water" |
| 15 | From the GitHub profile | All four: Aether banners, Vulcan ASCII flame card, live GitHub activity, Clawd under the palm |
| 16 | About | "Hi. I'm Elixir and I am the founder of Aether, an AI research lab contributing to the next frontier." Also: "have a clean nav and a clean contact page with company icons/logos" |
| 17 | Name | "Hi. I'm Harry (or I can go by Elixir)" |
| 18 | Aether scope | One Aether chapter only; no product is named |
| 19 | Contact channels | GitHub and Discord, each with its brand logo |
| 20 | Contact and nav | Contact is the final scene of the scroll; nav has 4 links (Aether, Work, About, Contact) |
| + | Footer | The two hands from Michelangelo's The Creation of Adam, in halftone dots (public domain; source and map in `design/refs/creation-of-adam/`) |

Defaults Harry did not object to: a short ASCII loading sequence on first visit, no custom cursor, no sound, phones get the live hole with fewer and larger characters.

Earlier decisions that still hold: GitHub Pages, Namecheap DNS, Next.js static export built by GitHub Actions, push to `main` only with Harry's go. Public-content rule: shipped work only; early work carries "Coming soon" or "Research preview".

## Page order

1. Hero: ASCII black hole, name, one line.
2. Aether: one pinned chapter (mark, lab sentence, the two banners as video).
3. Work: the two films, Night Market 3D renders, Tidal Racing water.
4. GitHub: live activity drawn in ASCII, the Vulcan flame redrawn live, Clawd.
5. About: the short note in Harry's words.
6. Contact: the camera pulls back out to the hole; GitHub and Discord logos.
7. Footer: the halftone hands.

## Inputs still needed from Harry

- The colour treatment of the Horizon view: 1, 2 or 3.
- A Discord handle or invite link.
- Which film files are final.
- aether-labs.dev is still parked, so its link fails until the Aether site is hosted.
- Clawd is Anthropic's character; its brand terms are not checked. Harry chose to include it.

## Steps

1. Reference study (running 2026-11-23): 8 to 10 award-level sites, measured. Output `design/refs/study/notes.md`. Verify: the file has a token table and the six answers.
2. Harry picked the Horizon view; he still picks its colour treatment on the demo page. Verify: his answer is recorded in the table above.
3. Directions page: 3 hero comps at 390 and 1440 px, built from the study, published as an artifact. Harry picks one. Then write `design/direction.md` and `TOKENS.md`. Verify: both files exist and name the pick.
4. Scaffold Next.js (`output: 'export'`, `images.unoptimized`), `CNAME` in `public/`, components from harry-ui first, then shadcn/ui. Verify: `npx tsc --noEmit` and `npm run build` write `out/index.html`.
5. Add `.github/workflows/pages.yml` and switch Pages to `build_type: workflow` before anything under `docs/` or `design/` is pushed. Verify: `gh api repos/harryx2011-boop/harryx2011-boop.github.io/pages --jq .build_type` prints `workflow`.
6. Hero module: port the ASCII renderer from `design/comps/2026-11-23-black-hole-views/src.html` into pure rules (camera, fall curve, glyph ramp) plus a thin WebGL wrapper; scroll drives the fall. Verify: unit tests for the pure rules; screenshots at 390 and 1440.
7. Aether chapter. 8. Work chapter. 9. GitHub activity (data fetched at build, private repo names hidden). 10. About. 11. Contact scene and halftone footer. 12. Nav and loading sequence. Each: screenshots at both widths, reduced-motion check.
13. Critique: self-critique on real screenshots, then a `visual-designer` design review and a motion audit with a 0.25x clip. Fix the findings.
14. Go live: push to `main` with Harry's go. Verify: https://harryxie.me returns 200 with the new page.

## Out of scope

- A page per project, and any Aether product chapter.
- The Aether site itself.
- Email on the domain (Harry picked GitHub and Discord only).

## Risks and rollback

- Cinematic motion on phones can drop frames: the hero renders on a small character grid, pinned scenes get a simpler phone version, and reduced motion gets stills with gentle fades.
- WebGL off: a still ASCII frame is shown instead.
- Rollback: the holding page is commit `2733528`; `git revert` of the launch commit restores it.
