#!/usr/bin/env bash
# Assemble the demo into ./out from the comp folder and the data.js saved from the published artifact.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
COMP="/c/devprojects/harryxie.me/design/comps/2026-11-23-full-page"
DATA="$1"
OUT="$HERE/out"
mkdir -p "$OUT/media"
cp "$COMP"/*.css "$COMP"/*.js "$OUT"/
cp "$DATA" "$OUT/data.js"
cp "$COMP/page.html" "$OUT/index.html"
for m in $(grep -ohE 'media/[A-Za-z0-9._-]+' "$COMP/page.html" "$COMP"/os-apps.js | sort -u); do [ -f "$COMP/$m" ] && cp "$COMP/$m" "$OUT/$m"; done; true
{ printf '%s' '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'; cat "$COMP/page.html"; printf '%s' '</body></html>'; } > "$OUT/test.html"
echo built "$OUT"
