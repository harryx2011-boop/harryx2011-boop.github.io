"""Assemble the full-page demo. Usage: python -I build.py <comp dir> <refs dir> <contrib.json> <out dir>
Copies the page, styles, scripts and media to <out dir>, writes data.js (contribution counts and the hands map),
and writes test.html and test-390.html (doctype-wrapped copies for local screenshots)."""
import json, os, shutil, sys

comp, refs, contrib, out = sys.argv[1:5]
os.makedirs(out + '/media', exist_ok=True)
for name in ['page.html', 'base.css', 'chapters.css', 'hole.js', 'engine.js', 'camera.js', 'chapters.js', 'github.js', 'hands.js', 'ui.js']:
    shutil.copy(comp + '/' + name, out + '/' + name)
for name in os.listdir(comp + '/media'):
    shutil.copy(comp + '/media/' + name, out + '/media/' + name)

counts = json.load(open(contrib, encoding='utf-8'))
hands = open(refs + '/creation-of-adam/hands-map.b64', encoding='utf-8').read().strip()
open(out + '/data.js', 'w', encoding='utf-8', newline='\n').write(
    'window.CONTRIB = ' + json.dumps(counts, separators=(',', ':')) + ';\nwindow.HANDS_B64 = "' + hands + '";\n')

page = open(comp + '/page.html', encoding='utf-8').read()
head = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
open(out + '/test.html', 'w', encoding='utf-8', newline='\n').write(head + page + '</body></html>')
print('built', out, len(page))
