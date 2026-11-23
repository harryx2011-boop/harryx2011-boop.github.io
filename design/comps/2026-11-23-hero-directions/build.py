"""Inline hole.js into src.html. Usage: python -I build.py <comp dir> [<dir for a doctype-wrapped test copy>]
Writes hero-directions.html (the artifact file, no doctype) and, when a second dir is given, dir-wrapped.html for local screenshots."""
import sys
comp = sys.argv[1]
src = open(comp + '/src.html', encoding='utf-8').read()
js = open(comp + '/hole.js', encoding='utf-8').read()
assert src.count('/*__HOLE_JS__*/') == 1
out = src.replace('/*__HOLE_JS__*/', js)
open(comp + '/hero-directions.html', 'w', encoding='utf-8', newline='\n').write(out)
if len(sys.argv) > 2:
    head = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font-size:14px}img{max-width:100%}</style></head><body>'
    open(sys.argv[2] + '/dir-wrapped.html', 'w', encoding='utf-8', newline='\n').write(head + out + '</body></html>')
    open(sys.argv[2] + '/dir-frame390.html', 'w', encoding='utf-8').write('<!doctype html><html><body style="margin:0;background:#222"><iframe src="dir-wrapped.html" style="width:390px;height:5200px;border:0;display:block"></iframe></body></html>')
print('built', len(out))
