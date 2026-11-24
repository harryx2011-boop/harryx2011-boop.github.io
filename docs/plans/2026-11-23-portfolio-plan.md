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
| 7 | Colour | First answer: off-white on black with one amber accent. Changed the same day to "add more color": he picks 1 "Furnace" (deep red to white-hot, by heat), 2 "Doppler" (red to pale blue-white, by motion) or 3 "Ember" (off-white with a wide amber and red-orange band) on https://claude.ai/code/artifact/d07ecb7f-8225-4d19-aeb8-b548319a5689. **Picked: 1 "Furnace"** ("furnace", 2026-11-23). The page ground stays black and the type stays off-white. |
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
| + | Hero layout | He first said "baseline", then "actually, i like the introduction part more. lets go with that": layout 2 "Introduction" (his sentence in a left column, the disk on a diagonal) |
| + | Hero line | "Harry first, your exact words": "Hi. I am Harry (or I can go by Elixir). I am the founder of Aether, an AI research lab contributing to the next frontier." (with "I’m" on the page) |
| + | Aether logo | "include aethers logo": a small mark beside "founder of Aether" in the hero and a large one in the Aether chapter. Blue: "Keep the blue everywhere" (he picked this over the recommended "blue in the Aether chapter only") |
| + | Profile images | "build sections for them further down the page - include my github profile as well of Ceres Fauna". Two sections: the two banners in the Aether chapter; the Vulcan card and Clawd side by side in the GitHub section. His profile picture (a drawing of Ceres Fauna) appears in both the GitHub profile card and About ("Both") |
| + | Films | Short silent loops on the page, about 10 s each (the full files are 229 MB and 130 MB; GitHub blocks files over 100 MB) |
| + | Coastline banner | "make the aether ascii bg not as dark - make it brighter on github profile and website": photo brightness 0.45 to 0.80, on the profile (commit `a202e24` in `harryx2011-boop/harryx2011-boop`) and in the demo. Script: `design/refs/profile-banner/make_coast.py` |

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

- His verdict on the whole-page demo: https://claude.ai/code/artifact/a70350d1-66ca-441e-9573-72a269a14c22
- More About text, if he wants more than the one sentence.
- Which film files are final.
- aether-labs.dev is still parked, so its link fails until the Aether site is hosted.
- Clawd is Anthropic's character; its brand terms are not checked. Harry chose to include it.

## Steps

1. Reference study: DONE 2026-11-23. 10 sites, 34 measured values, two contact sheets, in `design/refs/study/` (`notes.md`). Gaps it reported: only 1 verified ASCII site, no pinned-scene timing measured (the motion capture failed twice and the page reader went down), robots checks on 5 of 10 sites. Scroll pacing therefore starts from an estimate. Library picks for the build: React Bits HalftoneReveal (footer) and SplitText (headlines), both copy-ok with credit to David Haz.
2. DONE 2026-11-23. Harry picked the Horizon view and the Furnace colour. Discord handle `@ogexr` read from his public GitHub bio.
3. Directions page: PUBLISHED 2026-11-23, https://claude.ai/code/artifact/d2c2cd50-540d-4310-b145-a914b986b990 (source `design/comps/2026-11-23-hero-directions/`). Three layouts at 1440 and 390 px with the live Horizon hole and a colour switch: 1 "Title card" (role as a caps headline, name as the credit line; from adrienquechon.com), 2 "Introduction" (his own sentence in a left column, disk on a diagonal; from windowtomars.com and carterogunsola.com), 3 "Baseline" (the name written on the disk line, bottom tabs; from nahiyan.codes and zenobasi.com). DONE 2026-11-23: he picked Introduction and Furnace; `design/direction.md` and `TOKENS.md` exist and name the pick.
3b. Whole-page demo (he chose "Whole page as a demo" before any site code): PUBLISHED 2026-11-23 (version 4 after his change request, see "Change request" below), https://claude.ai/code/artifact/a70350d1-66ca-441e-9573-72a269a14c22 (source `design/comps/2026-11-23-full-page/`, one module per scene; `build.py <comp dir> <refs dir> <contrib.json> <out dir>` assembles it; `media/` is not committed). Six parts with real content: hero, Aether, Work (the laptop), GitHub, About, Contact, plus the footer. Checked on real screenshots at 1440 and 390 px. Not built in the demo: loading sequence, image hover distortion, smooth scrolling. Next: Harry reviews it; then step 4.
4. Scaffold Next.js (`output: 'export'`, `images.unoptimized`), `CNAME` in `public/`, components from harry-ui first, then shadcn/ui. Verify: `npx tsc --noEmit` and `npm run build` write `out/index.html`.
5. Add `.github/workflows/pages.yml` and switch Pages to `build_type: workflow` before anything under `docs/` or `design/` is pushed. Verify: `gh api repos/harryx2011-boop/harryx2011-boop.github.io/pages --jq .build_type` prints `workflow`.
6. Hero module: port the ASCII renderer from `design/comps/2026-11-23-black-hole-views/src.html` into pure rules (camera, fall curve, glyph ramp) plus a thin WebGL wrapper; scroll drives the fall. Verify: unit tests for the pure rules; screenshots at 390 and 1440.
7. Aether chapter. 8. Work chapter. 9. GitHub activity (data fetched at build, private repo names hidden). 10. About. 11. Contact scene and halftone footer. 12. Nav and loading sequence. Each: screenshots at both widths, reduced-motion check.
13. Critique: self-critique on real screenshots, then a `visual-designer` design review and a motion audit with a 0.25x clip. Fix the findings.
14. Go live: push to `main` with Harry's go. Verify: https://harryxie.me returns 200 with the new page.

## Change request (Harry, 2026-11-23, 19:20, after seeing the first whole-page demo)

His words: "portfolio has issues. remove the vulcan and claude animations, remove the trailer and 3d renders - keep it simple. add a computer mockup actually and port my image renders and projects/product reveals on there (like enigma but modern, mac os clean liquid like)". He also sent https://www.instagram.com/charles.unemployed/reel/DgF9OjDxYKD/ ("apply to anti ui vibe and load anti vibe ui everytime u design") and said "use sensible defaults".

Defaults taken (mine, not his words):
- R1. Remove the Vulcan card and the Clawd animation from the GitHub section. Remove the trailer. Remove the Night Market pinned reel as its own section.
- R2. Add one computer mockup (a laptop with a small macOS-style desktop, clean, glass panels) that replaces the Work section. Its screen shows the Night Market renders and the product reveals (the reveal film, Tidal Racing) as windows. "Enigma" is his own desktop project; borrow the idea of a desktop inside the page, not its look.
- R3. Add the reel's points to `~/.claude/reference/ui-anti-vibe.md` and make the design outline load that file on every design task. The reel has no captions; its points are on screen, so it must be downloaded and read frame by frame.

State, 2026-11-23 19:32: R1 DONE (commit `08d75fa`). R2 DONE as a first version (`desk.css`, `desk.js`): a laptop whose dock opens three windows, the reveal film, the four Night Market renders with a picker strip, and Tidal Racing with a "Play it" link; checked on screenshots at 1440 and 390 px, each window opened. R3 DONE: the 20 points are a section of `~/.claude/reference/ui-anti-vibe.md` and step 0 of `~/.claude/reference/design-outline.md` loads the file first. The page was then counted against the 20 points: the italic word in the hero sentence and the dot separators were removed; the ASCII hole and halftone hands (his own picks) are the two that remain. A design review by a second agent gave 14 findings; the 10 that still applied after R1 are fixed (commit `de7bfa7`).

Review, 2026-11-24: a design review (13 findings) and a real-input test in the cloud box (9 failures of 101 checks) were run on version 5; the fixes are in and the harness passes 131 of 131. Three findings are Harry's own picks and wait for him: the coastline video, the text of about.txt and the Terminal, the computer's size. A real render of the whole page in the cloud box (software WebGL) then found one major defect, a black screen of 129% of a viewport after the fall, fixed to 31%, and two minor ones, both fixed.

Open after this change: Harry has not seen versions 2 to 4 of the demo. The laptop is my reading of "like enigma but modern, mac os clean liquid like"; I did not open the Enigma project to compare. Windows cannot be dragged, and the three window buttons are drawn but do nothing. The slow-motion motion check was not run (a game was running on the PC).

## Change request 2 (Harry, 2026-11-24, after version 4 of the demo)

His words: "ur addigint oo many eyebrow lables and unnecessary stuff - load ui anti vibe", with two reels by Charles Liu: "20 AI Design Slop Indicators" (already in the rules) and "20 Ways to Unslop Your AI Designs" (new: delete filler badges, drop redundant labels, mono only where needed, remove embellishments, make headlines specific, and 15 more). Version 4 carried 3 heading sub-labels and 14 mono labels.

His 12 answers (AskUserQuestion, 2026-11-24):

| # | Question | Answer |
|---|---|---|
| 1 | The 3 sub-labels beside the chapter headings | Remove all 3 |
| 2 | Where mono type may appear | Only ASCII art and numbers |
| 3 | Hero hint ("or scroll to fall in") and distance readout | Remove both |
| 4 | Captions and the footer line | Keep none of the 3 captions; no footer option picked, so the footer line is removed too (my reading of "anything not picked is removed") |
| 5 | Blue band in the Aether chapter | "remove the band, keep the ocean ascii background" |
| 6 | GitHub and About repeat each other | Merge into one chapter |
| 7 | The laptop | "remake as a windows like os - make it like enigma's os, pixelated and cryptic. (change the laptop to a old computer ship and make it detailed on the outisde and add foliage covering it"; also "remove the tidal racing from the latop and make the laptop more advanced, like enigma's os" |
| 8 | Contact rows | Logo, name, handle |
| 9 | "old computer ship" | An old CRT desktop computer, overgrown |
| 10 | How the computer is drawn | Pixel art drawn in code |
| 11 | What the OS holds | The film, the renders, a notes file, a terminal window. Tidal Racing leaves the page |
| 12 | The label rule for every project | Headings stand alone; at most 2 small labels per screen |

Confirmed later the same day: the OS keeps the pixel look but uses plain words ("Pixel look, plain words"); he does not like cryptic statements.

Work order:
- C1. Remove the labels, hint, readout, captions, blue band and footer line; nav and buttons move from mono capitals to Newsreader. Merge GitHub and About into one About chapter (picture once, the name Elixir, the activity grid, 569 contributions, 12 public repositories, Follow). Contact rows become logo, name, handle; the Discord row copies the handle and shows "Copied" for 2 s.
- C2. Work: an overgrown CRT computer drawn as pixel art on a canvas (`crt-*.js`), its screen running a small Windows XP style desktop in plain JS (`os*.js`): draggable windows with working minimize, maximize and close, a taskbar with a real clock, four apps from one registry (Reveal film, Night Market, about.txt, Terminal). Three scene candidates for Harry to pick: A Windowsill, B Forest floor, C Root-bound.
- C3. Version 5 of the whole-page demo on the same artifact link; the three scenes on a candidates page.

State, 2026-11-24: C1 DONE. C2 DONE as a first version (11 small files: `crt-engine.js`, `crt-plants.js`, `crt-computer.js`, `crt-ground.js`, `crt-scenes.js`, `crt-scene.js`, `os-icons.js`, `os-apps.js`, `os.js`, `crt.css`, `crt-os.css`; built by a Sonnet 5.5 agent in three critique rounds, then checked by the controller on screenshots at 1440 and 390 px). C3 DONE: version 5 on the demo link, candidates at https://claude.ai/code/artifact/e2ea7a6d-5bf2-413b-8404-4a59c90ab52b.

He picked scene A, Windowsill, and asked for a bigger computer (2026-11-24: "window sill - make the pc bigger"): the rig is now up to 1480 px wide, capped at 135% of the viewport height. He confirmed "Yes, hands only" for the footer.

Open after this change: A real phone and Safari or Firefox were not tried (touch was emulated in Chrome). The phone now gets a close-up of scene A (screen 339 px wide at 390 px, was 256); viewports between about 483 and 560 px were not looked at. Next: his review of version 5, then step 4, the Next.js build.

## Out of scope

- A page per project, and any Aether product chapter.
- The Aether site itself.
- Email on the domain (Harry picked GitHub and Discord only).

## Risks and rollback

- Cinematic motion on phones can drop frames: the hero renders on a small character grid, pinned scenes get a simpler phone version, and reduced motion gets stills with gentle fades.
- WebGL off: a still ASCII frame is shown instead.
- Rollback: the holding page is commit `2733528`; `git revert` of the launch commit restores it.
