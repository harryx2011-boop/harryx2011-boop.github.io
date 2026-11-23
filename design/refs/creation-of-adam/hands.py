import sys, math, base64
from PIL import Image, ImageFilter, ImageDraw
src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
c = im.crop((800, 480, 2000, 860)).resize((720, 228), Image.LANCZOS)
W, H = c.size
px = c.load()
def ss(v, a, b):
    t = max(0.0, min(1.0, (v - a) / (b - a))); return t * t * (3 - 2 * t)
mask = Image.new('L', (W, H)); mp = mask.load()
lumi = Image.new('L', (W, H)); lp = lumi.load()
for y in range(H):
    for x in range(W):
        r, g, b = px[x, y]
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        warm = r - b
        m = ss(warm, 42, 72) * ss(lum, 78, 120)
        mp[x, y] = int(255 * m)
        lp[x, y] = int(255 * max(0.0, min(1.0, (lum - 96) / 140.0)) ** 1.9)
mask = mask.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
mp = mask.load()
out = Image.new('L', (W, H)); op = out.load()
for y in range(H):
    for x in range(W):
        op[x, y] = int(mp[x, y] / 255.0 * lp[x, y])
binary = out.point(lambda v: 255 if v > 20 else 0)
bd = ImageDraw.Draw(binary)
for (x0, y0, x1, y1) in [(0.725, 0.70, 0.805, 1.0), (0.74, 0.0, 0.875, 0.345), (0.0, 0.90, 0.24, 1.0), (0.88, 0.72, 1.0, 1.0)]:
    bd.rectangle((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)), fill=0)
bp = binary.load()
def seed(fx, fy):
    cx, cy = int(fx * W), int(fy * H)
    for rad in range(0, 40):
        for dy in range(-rad, rad + 1):
            for dx in range(-rad, rad + 1):
                x, y = cx + dx, cy + dy
                if 0 <= x < W and 0 <= y < H and bp[x, y] == 255: return (x, y)
    return None
for fx, fy in [(0.305, 0.525), (0.555, 0.62), (0.12, 0.725), (0.70, 0.525)]:
    sd = seed(fx, fy)
    if sd and bp[sd[0], sd[1]] == 255: ImageDraw.floodfill(binary, sd, 128)
keep = binary.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.6))
kp = keep.load()
for y in range(H):
    for x in range(W):
        fx, fy = x / W, y / H
        vg = ss(fx, 0.0, 0.07) * (1 - ss(fx, 0.92, 1.0)) * ss(fy, 0.0, 0.08) * (1 - ss(fy, 0.9, 1.0))
        op[x, y] = int(op[x, y] * kp[x, y] / 255.0 * vg)
small = out.resize((360, 114), Image.LANCZOS)
small.save(outdir + '/hands-map.png')
open(outdir + '/hands-map.b64', 'w').write(base64.b64encode(small.tobytes()).decode())
# halftone preview, 45 degree lattice, light dots on black
PW = 1440; PH = int(PW * H / W); pitch = 7.0
prev = Image.new('RGB', (PW * 2, PH * 2), (8, 8, 9)); d = ImageDraw.Draw(prev)
sp = small.load(); SW, SH = small.size
n = int((PW + PH) / pitch) + 4
for i in range(-n, n):
    for j in range(-n, n):
        x = (i - j) * pitch * 0.7071 + PW / 2; y = (i + j) * pitch * 0.7071 + PH / 2
        if x < 0 or y < 0 or x >= PW or y >= PH: continue
        v = sp[min(SW - 1, int(x / PW * SW)), min(SH - 1, int(y / PH * SH))] / 255.0
        rad = pitch * 0.62 * math.sqrt(v)
        if rad < 0.35: continue
        d.ellipse((2 * (x - rad), 2 * (y - rad), 2 * (x + rad), 2 * (y + rad)), fill=(236, 232, 224))
prev.resize((PW, PH), Image.LANCZOS).save(outdir + '/halftone-preview.png')
print(small.size, len(small.tobytes()))
