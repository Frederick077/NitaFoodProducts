"""Deterministic white-matte removal; never redraws artwork. Requires Pillow/numpy."""
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/logo-verification'
OUT.mkdir(parents=True, exist_ok=True)
source = ROOT / 'public/assets/nita-logo.jpeg'
if not (OUT / 'nita-logo-original.jpeg').exists():
    copy2(source, OUT / 'nita-logo-original.jpeg')
if not (OUT / 'favicon-original.png').exists():
    copy2(ROOT / 'public/favicon.png', OUT / 'favicon-original.png')
rgb = np.asarray(Image.open(source).convert('RGB')).astype(float)
# Dark, saturated artwork supplies actual neighboring edge colors. Neutral JPEG
# noise belongs to the white matte. White counters/leaf gaps are negative space.
chroma = rgb.max(2) - rgb.min(2)
background = (rgb.min(2) > 235) | (chroma < 18)
solid = (rgb.min(2) < 65) & (chroma > 25)
known = solid.copy()
nearest = rgb.copy()
for _ in range(40):
    if np.all(known | background):
        break
    old = known.copy()
    for dy, dx in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
        neighbor = np.roll(old, (dy, dx), (0, 1))
        take = ~known & neighbor
        nearest[take] = np.roll(nearest, (dy, dx), (0, 1))[take]
        known[take] = True
assert np.all(known | background), 'Unresolved artwork pixels: inspect source'
direction = 255 - nearest
alpha = np.clip(((255-rgb)*direction).sum(2) / np.maximum((direction**2).sum(2), 1), 0, 1)
alpha[solid] = 1
alpha[background] = 0
clean = np.clip(255 - (255-rgb)/np.maximum(alpha[..., None], 1/255), 0, 255)
rgba = np.dstack([np.rint(clean), np.rint(alpha*255)]).astype('uint8')
logo = Image.fromarray(rgba)
logo.save(ROOT / 'public/assets/nita-logo-transparent.png')
assert logo.size == Image.open(source).size == (900, 391)
assert np.array_equal(rgba[solid, :3], rgb[solid].astype('uint8'))
assert np.all(rgba[0, :, 3] == 0) and np.all(rgba[-1, :, 3] == 0)
# Crop only the existing orange/green leaf symbol; no new symbol or lettering.
symbol = logo.crop((60, 64, 375, 294))
square = Image.new('RGBA', (335, 335))
square.alpha_composite(symbol, ((335-symbol.width)//2, (335-symbol.height)//2))
square.resize((64, 64), Image.Resampling.LANCZOS).save(ROOT / 'public/favicon.png')
square.save(ROOT / 'public/favicon.ico', sizes=[(16,16), (32,32), (48,48)])
sheet = Image.new('RGB', (960, 680), 'white')
draw = ImageDraw.Draw(sheet)
for i, bg in enumerate(['#ffffff', '#f3f4f6', '#175437', '#f3e8d7']):
    x, y = (i % 2)*480, (i//2)*340
    draw.rectangle((x, y, x+479, y+339), fill=bg)
    draw.text((x+16, y+12), bg, fill='#f97316' if i == 2 else '#222222')
    sheet.paste(logo.resize((450,196), Image.Resampling.LANCZOS), (x+15,y+45), logo.resize((450,196), Image.Resampling.LANCZOS))
    for j, size in enumerate([16,32,48,64]):
        icon = square.resize((size,size), Image.Resampling.LANCZOS)
        sheet.paste(icon, (x+20+j*100,y+260), icon)
sheet.save(OUT / 'background-and-favicon-check.png')
print('PASS: dimensions, unchanged solid artwork RGB, transparent perimeter; favicon 16/32/48 ICO + 64 PNG')

for relative in ['src/components/Navbar.tsx', 'src/components/Footer.tsx', 'index.html']:
    path = ROOT / relative
    data = path.read_bytes().replace(b'/assets/nita-logo.jpeg', b'/assets/nita-logo-transparent.png')
    if relative == 'index.html' and b'href="/favicon.png"' in data:
        data = data.replace(b'href="/favicon.png"', b'sizes="64x64" href="/favicon.png?v=nita-transparent-20261029"')
        data = data.replace(b'    <link rel="icon"', b'    <link rel="icon" href="/favicon.ico?v=nita-transparent-20261029" sizes="16x16 32x32 48x48" />\n    <link rel="icon"', 1)
    path.write_bytes(data)
