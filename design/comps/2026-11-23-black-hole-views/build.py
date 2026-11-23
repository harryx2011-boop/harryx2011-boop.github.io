import sys
comp, refs, scratch = sys.argv[1], sys.argv[2], sys.argv[3]
src = open(comp + '/src.html', encoding='utf-8').read()
b64 = open(refs + '/hands-map.b64').read().strip()
assert '__HANDS_B64__' in src
out = src.replace('__HANDS_B64__', b64)
open(comp + '/black-hole-views.html', 'w', encoding='utf-8', newline='\n').write(out)
head = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font-size:14px}img{max-width:100%}</style></head><body>'
open(scratch + '/wrapped.html', 'w', encoding='utf-8', newline='\n').write(head + out + '</body></html>')
open(scratch + '/frame390.html', 'w', encoding='utf-8').write('<!doctype html><html><body style="margin:0;background:#222"><iframe src="wrapped.html" style="width:390px;height:3300px;border:0;display:block"></iframe></body></html>')
print('built', len(out))
