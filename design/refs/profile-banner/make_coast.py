"""Coastline banner for the GitHub profile and harryxie.me. Usage: python make_coast.py <out.gif> <brightness> [preview.png]
Same build as the 2026-11-23 profile banner (build_banners.py, banner 1); only the photo brightness is a parameter (it was 0.45; 0.80 since 2026-11-23, Harry: "make it brighter"). coast-source.png is his picture and is not committed."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "coast-source.png")
LOGO = "C:/devprojects/Aether/assets/aether-logo.ico"
FONT = "C:/devprojects/aether-reveal/overlays/fonts/Newsreader.ttf"
W, H, N = 1280, 360, 16
INK = (238, 248, 250, 255)
out, bright = sys.argv[1], float(sys.argv[2])

def logo(size):
    im = Image.open(LOGO).convert("RGBA").resize((256, 256), Image.LANCZOS)
    for c in [(0, 0), (255, 0), (0, 255), (255, 255)]:
        if im.getpixel(c)[0] > 200 and im.getpixel(c)[1] > 200:
            ImageDraw.floodfill(im, c, (0, 0, 0, 0), thresh=60)
    return im.resize((size, size), Image.LANCZOS)

def lockup_row(canvas, logo_px, word_px, gap):
    f = ImageFont.truetype(FONT, word_px)
    d = ImageDraw.Draw(canvas)
    bb = d.textbbox((0, 0), "Aether", font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    x0 = (W - (logo_px + gap + tw)) // 2
    canvas.alpha_composite(logo(logo_px), (x0, (H - logo_px) // 2))
    d.text((x0 + logo_px + gap - bb[0], (H - th) // 2 - bb[1]), "Aether", font=f, fill=INK)

src = Image.open(SRC).convert("RGB")
sw, sh = src.size
band = round(sw * H / W)
top = (sh - band) // 2
base = np.asarray(src.crop((0, top, sw, top + band)).resize((W, H), Image.LANCZOS)).astype(np.float32) * bright
xs = np.arange(W, dtype=np.float32)[None, :, None]
ys = np.arange(H, dtype=np.float32)[:, None, None]
diag = xs + ys * 0.35
frames = []
for i in range(N):
    centre = -W * 0.3 + (W * 1.6) * i / N
    glint = 0.22 * np.exp(-((diag - centre) ** 2) / (2 * 90 ** 2))
    im = Image.fromarray(np.clip(base * (1 + glint), 0, 255).astype(np.uint8)).convert("RGBA")
    lockup_row(im, logo_px=170, word_px=170, gap=36)
    if i == 5 and len(sys.argv) > 3: im.convert("RGB").save(sys.argv[3])
    frames.append(im.convert("RGB").quantize(colors=128, method=Image.Quantize.MEDIANCUT))
frames[0].save(out, save_all=True, append_images=frames[1:], duration=110, loop=0, optimize=True, disposal=2)
print(out, bright, float(base.mean()))
