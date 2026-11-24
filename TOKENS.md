# Tokens (harryxie.me)

The only colours, sizes, radii and easings the site may use. Source of truth in code: `:root` in `design/comps/2026-11-23-full-page/base.css` until the Next.js build has its own token file. Values marked "measured" come from `design/refs/study/notes.md`.

## Colour

| Token | Value | Use |
|---|---|---|
| `--void` | `#070708` | page ground, pill fill |
| `--panel` | `#0f0f11` | the one raised surface (the Clawd card) |
| `--line` | `#26252a` | 1 px frame and divider lines |
| `--faint` | `#3b393f` | empty days in the activity grid, window buttons |
| `--bezel`, `--metal` | `#151517`, `#2c2c31` | the laptop frame and base |
| `--ink` | `#ece8e0` | all text, pill borders |
| `--dim` | `#918d86` | secondary text |
| `--furnace-1..4` | `#9a2c12`, `#e2541c`, `#ffab45`, `#fff3dc` | the hole, the activity grid, the dot between the hands. Focus rings are `--ink` |
| `--aether-ice`, `-sky`, `-blue`, `-navy` | `#eef8fa`, `#71b1d7`, `#1c5a8b`, `#0a1930` | the four faces of the Aether mark |
| `--aether-deep` to `--aether-blue` | `#0b1d36` to `#1c5a8b` | the blue banner band (sampled from `banner-blue.png`) |

Dark only. No pure black or white for text or ground.

### The overgrown computer (pixel scene only, `crt-engine.js`)

A night grade: everything outside the screen stays near `--void`, and only what faces the screen gets the lit tones.

| Group | Values | Use |
|---|---|---|
| beige 1 to 4 | `#8a8470`, `#6c675a`, `#504c42`, `#2f2d27` | the monitor shell, keyboard and tower |
| glass | `#04060a`, `#0a1216`, `#31444a` | the tube behind the screen, its edge and sheen |
| leaf 1 to 5 | `#07110b`, `#0e2015`, `#17331f`, `#35693a`, `#6f9f4c` | plants; 4 and 5 only next to the screen |
| bark 1 to 3 | `#17100b`, `#2a1d14`, `#3f2e20` | vines, roots, the plank |
| moss | `#1b2c10`, `#2d4418` | moss on the case and ground |
| spill | `#34505e`, `#5d7886` | screen light on the inner bezel and keys |
| soil 1 to 4 | `#0a0a0b`, `#101010`, `#161513`, `#1f1c18` | ground fading into the void |
| fungus | `#a39b88`, `#5d5748` | mushrooms in scene B |
| cable | `#121214` | cords |
| power light | `--furnace-1..3` | the one warm point outside the screen |

The screen's desktop uses only the Aether blues, `--ink` and `--void`. No dithering, scanlines or blur in the scene.

## Type

| Token | Value | Use |
|---|---|---|
| `--serif` | Newsreader, light 300 for display, 400 for the wordmark and titles | sentence, chapter words, titles, note |
| `--mono` | IBM Plex Mono 400 and 500 | the glyph field, the activity grid, numbers. Never word labels (Harry, 2026-11-24) |
| `--pixel` | Pixelify Sans 400 to 700 | text inside the old computer's screen only |
| `--t-say` | `clamp(28px, min(3.1vw, 5svh), 44.64px)`, line 1.14, tracking -0.015em | hero sentence (measured: 44.64 px light) |
| `--t-head` | `clamp(64px, 11vw, 168px)`, line 0.92, tracking -0.035em, italic | chapter words |
| `--t-note` | `clamp(24px, 2.5vw, 36px)`, line 1.25 | About note |
| `--t-title` | `28px`, line 1.1 | work titles, channel names |
| `--t-label` | `17px` (16 px under 720 px), Newsreader, sentence case, line 1 | nav links, buttons, handles, the units of the two counts |
| `--t-mono` | `15px`, line 1.6 | mono body (raised from the measured 13 px so prose is not smaller than labels) |
| `--t-word`, `--t-drawer` | `22px`, `35px` | the name in the header; phone menu links (measured) |

Never Inter, Geist, Space Grotesk or JetBrains Mono for display.

## Space and shape

- Scale: `--s-1..8` = 8, 16, 24, 32, 48, 64, 96, 128 px.
- Side gutter `--pad`: 48 px, 16 px under 720 px. Header `--bar`: 96 px, 72 px under 720 px (measured).
- Between chapters `--gap-chapter`: `clamp(96px, 14vw, 192px)`.
- Radius: 999 px for pills only. Media frames have none. The Vulcan and Clawd cards share one radius, 3.6% of the card width (baked into the Vulcan file).
- Touch targets: 44 px or more.

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | entrances, press |
| `--ease-hover` | `cubic-bezier(0.5, 1, 0.89, 1)`, 300 ms | hover colour and opacity (measured) |
| press | `scale(0.97)`, 160 ms | every pressable control |
| letters | 700 ms move, 500 ms fade, 35 ms stagger | chapter words, once per visit |
| scenes | scrubbed by scroll, no duration | fall, mark, reel, pull-back |

Only `transform`, `opacity` and `clip-path` move. Hover effects sit behind `(hover: hover) and (pointer: fine)`. Reduced motion: the camera holds still, scenes show their final state, fades stay.
