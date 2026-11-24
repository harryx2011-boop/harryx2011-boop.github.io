(function () {
  var crt = document.querySelector('.crt'), cv = document.querySelector('.crt-front');
  var W = cv.width, H = cv.height, ctx = cv.getContext('2d'), d = ctx.getImageData(0, 0, W, H).data;
  var cs = getComputedStyle(crt);
  function pct(n) { return parseFloat(crt.style.getPropertyValue(n)) / 100; }
  var sx = Math.round(pct('--sx') * W), sy = Math.round(pct('--sy') * H), sw = Math.round(pct('--sw') * W), sh = Math.round(pct('--sh') * H);
  var rows = [];
  for (var y = sy; y < sy + 44; y++) {
    var cnt = 0, minx = 1e9, maxx = -1;
    for (var x = sx; x < sx + sw; x++) { var a = d[(y * W + x) * 4 + 3]; if (a === 255) { cnt++; if (x < minx) minx = x; if (x > maxx) maxx = x; } }
    rows.push((y - sy) + ':' + cnt + (cnt ? '[' + (minx - sx) + '-' + (maxx - sx) + ']' : ''));
  }
  return { W: W, H: H, screen: [sx, sy, sw, sh], over: crt.style.getPropertyValue('--st'), rows: rows.join(' ') };
})()
