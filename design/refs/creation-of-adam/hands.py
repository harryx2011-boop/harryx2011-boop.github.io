"""Build the halftone brightness map for the footer from the Creation of Adam scan.
Usage: python -I hands.py <scan.jpg> <out dir>
Writes hands-map.png, hands-map.b64 (raw 8-bit rows, MAP_W x MAP_H) and halftone-preview.png."""
import sys, math, base64
from PIL import Image, ImageFilter, ImageDraw

CROP = (960, 560, 1800, 860)
WORK = (1400, 500)
MAP = (480, 171)
SEEDS = [(430, 220), (860, 270), (120, 300), (1150, 220)]
CUTS = [(1185, 300, 1400, 500), (1215, 0, 1400, 98), (0, 425, 130, 500)]
BACKGROUND = [(700, 6), (700, 494), (350, 494), (1000, 494), (600, 250), (200, 60), (1000, 60)]

def ss(v, a, b):
    t = max(0.0, min(1.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)

def nearest(px, x0, y0, want, w, h):
    for rad in range(0, 60):
        for dy in range(-rad, rad + 1):
            for dx in range(-rad, rad + 1):
                x, y = x0 + dx, y0 + dy
                if 0 <= x < w and 0 <= y < h and px[x, y] == want:
                    return (x, y)
    return None

src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB').crop(CROP).resize(WORK, Image.LANCZOS)
W, H = WORK
soft = im.filter(ImageFilter.GaussianBlur(1.4)).load()
skin = Image.new('L', WORK); sp = skin.load()
for y in range(H):
    for x in range(W):
        r, g, b = soft[x, y]
        warm = r - b
        ratio = (g - b) / warm if warm > 1 else 0.0
        sp[x, y] = 255 if ss(warm, 34, 54) * ss(ratio, 0.2, 0.32) > 0.5 else 0
skin = skin.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
sp = skin.load()
for bx, by in BACKGROUND:
    pt = nearest(sp, bx, by, 0, W, H)
    if pt: ImageDraw.floodfill(skin, pt, 100)
filled = skin.point(lambda v: 0 if v == 100 else 255)
cut = ImageDraw.Draw(filled)
for box in CUTS:
    cut.rectangle(box, fill=0)
fp = filled.load()
for sx, sy in SEEDS:
    pt = nearest(fp, sx, sy, 255, W, H)
    if pt: ImageDraw.floodfill(filled, pt, 200)
mask = filled.point(lambda v: 255 if v == 200 else 0).filter(ImageFilter.MedianFilter(9)).filter(ImageFilter.GaussianBlur(1.6))
mp = mask.load()
tone = im.filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2)).load()
out = Image.new('L', WORK); op = out.load()
for y in range(H):
    for x in range(W):
        r, g, b = tone[x, y]
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        t = max(0.0, min(1.0, (lum - 62) / 172.0)) ** 1.5
        fx, fy = x / W, y / H
        vg = ss(fx, 0.0, 0.12) * (1 - ss(fx, 0.86, 1.0)) * ss(fy, 0.0, 0.06) * (1 - ss(fy, 0.92, 1.0))
        op[x, y] = int(255 * (mp[x, y] / 255.0) * (0.05 + 0.95 * t) * vg)
small = out.resize(MAP, Image.LANCZOS)
small.save(outdir + '/hands-map.png')
open(outdir + '/hands-map.b64', 'w').write(base64.b64encode(small.tobytes()).decode())

PW = 1440; PH = int(PW * MAP[1] / MAP[0]); pitch = PW / 240.0
prev = Image.new('RGB', (PW * 2, PH * 2), (7, 7, 8)); d = ImageDraw.Draw(prev)
mpx = small.load(); SW, SH = MAP
n = int((PW + PH) / pitch) + 4
for i in range(-n, n):
    for j in range(-n, n):
        x = (i - j) * pitch * 0.7071 + PW / 2; y = (i + j) * pitch * 0.7071 + PH / 2
        if x < 0 or y < 0 or x >= PW or y >= PH: continue
        v = mpx[min(SW - 1, int(x / PW * SW)), min(SH - 1, int(y / PH * SH))] / 255.0
        rad = pitch * 0.66 * math.sqrt(v)
        if rad < 0.3: continue
        d.ellipse((2 * (x - rad), 2 * (y - rad), 2 * (x + rad), 2 * (y + rad)), fill=(236, 232, 224))
prev.resize((PW, PH), Image.LANCZOS).save(outdir + '/halftone-preview.png')
print(MAP, len(small.tobytes()))
