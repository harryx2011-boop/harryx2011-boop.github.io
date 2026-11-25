/* CRT environment: ground mound, wooden sill, moss banks and patches, big dark leaves at the edges. */
(function () {
  var C = CRT.C, P = CRT.plants, E = CRT.env = {};

  /* the ground is a low mound: it slopes away toward both edges so the scene ends in the void, not in a box */
  E.gy = function (x, y0, W) {
    var e = Math.min(x, W - 1 - x), drop = Math.pow(Math.max(0, 44 - e) / 44, 2) * 60;
    return Math.round(y0 + drop + 3 * Math.sin(x / 21) + 2 * Math.sin(x / 8.3 + 1));
  };
  /* soil in four flat bands that darken to the void, a moss ridge on top, a few bark chips */
  E.ground = function (B, W, H, y0, rnd) {
    var x, y, jit = 0, h = 0, run = 0, i;
    for (x = 0; x < W; x++) {
      if (x % 4 === 0) jit = rnd.int(-1, 1);
      var g = E.gy(x, y0, W);
      var edge = Math.max(0, 30 - Math.min(x, W - 1 - x));
      for (y = g; y < H; y++) { var d = y - g + jit + edge * 1.2; B.put(x, y, d < 2 ? C.soil4 : d < 9 ? C.soil3 : d < 22 ? C.soil2 : C.soil1); }
      if (--run <= 0) { run = rnd.int(2, 5); h = rnd.int(1, 4); }
      var lit = CRT.boost(x, g);
      for (var j = 0; j < h; j++) B.put(x, g - 1 - j, j === h - 1 ? (lit ? C.leaf4 : C.moss2) : (lit ? C.moss2 : C.moss1));
    }
    for (i = 0; i < 16; i++) {
      var cx = rnd.int(14, W - 18), cy = rnd.int(y0 + 10, H - 12);
      B.rect(cx, cy, 4, 2, C.bark2); B.rect(cx + 1, cy - 1, 2, 1, C.bark3); B.rect(cx, cy + 2, 3, 1, C.bark1);
    }
  };
  /* a wooden sill: lit top face with grain, a front lip, an end face, then dark to the void */
  E.sill = function (B, W, H, y0, y1, rnd) {
    var y, x, i, a = 10, w = W - 20;
    B.rect(a, y0, w, y1 - y0, C.bark2); B.rect(a, y0, w, 2, C.bark3);
    for (i = 0; i < 26; i++) { var gx = rnd.int(a, W - 40); B.rect(gx, rnd.int(y0 + 3, y1 - 2), Math.min(rnd.int(10, 40), W - a - gx), 1, C.bark1); }
    for (i = 0; i < 10; i++) B.rect(rnd.int(a, W - 30), rnd.int(y0 + 3, y1 - 2), rnd.int(6, 18), 1, C.bark3);
    B.rect(a, y1, w, 2, C.bark3); B.rect(a, y1 + 2, w, 6, C.bark1);
    B.rect(a, y0, 2, y1 - y0 + 8, C.bark1); B.rect(W - a - 2, y0, 2, y1 - y0 + 8, C.bark1);
    for (y = y1 + 8; y < H; y++) for (x = a; x < W - a; x++) B.put(x, y, y < y1 + 12 ? C.soil3 : y < y1 + 16 ? C.soil2 : C.soil1);
  };
  /* a bank of moss rising from yBase; profile(t) is 0..1 across x0..x1. Light top, darker toward the soil, flat clumps in between */
  E.bank = function (B, x0, x1, yBase, hMax, profile, rnd) {
    var x = x0, run, h, clump, cy, cw, i, j;
    while (x < x1) {
      run = rnd.int(3, 5); h = Math.round(hMax * profile((x - x0) / (x1 - x0)) * rnd.range(0.88, 1.04));
      cy = rnd.int(3, Math.max(4, h - 3)); cw = rnd.int(2, run);
      for (i = 0; i < run && x < x1; i++, x++) {
        var lit = CRT.boost(x, yBase - h);
        for (j = 0; j < h; j++) {
          var d = h - 1 - j, c = d < 2 ? (lit ? C.leaf3 : C.moss2) : (i < cw && d >= cy && d < cy + 2) ? C.moss2 : d > h * 0.62 ? C.leaf2 : C.moss1;
          B.put(x, yBase - 1 - j, c);
        }
      }
    }
  };
  /* a moss patch hugging a corner: rows of random width, a lighter top edge */
  E.patch = function (B, x, y, w, h, rnd, fromRight) {
    for (var j = 0; j < h; j++) {
      var len = Math.max(2, Math.round(w * (1 - j / h) * rnd.range(0.75, 1.05)));
      for (var i = 0; i < len; i++) B.put(fromRight ? x + w - 1 - i : x + i, y + j, j < 2 ? C.moss2 : C.moss1);
    }
  };
  /* big dark leaves in front of everything, hanging in from the four corners: the viewer looks through foliage */
  E.edgeLeaves = function (F, W, H, rnd) {
    var pi = Math.PI, small = W < 260, k = small ? 0.55 : 1;
    var list = [[5, 3, 1.05, 66, 34], [W - 5, 3, pi - 1.05, 72, 36], [5, H - 3, -1.0, 70, 34], [W - 5, H - 3, -pi + 1.0, 66, 32]];
    if (!small) list.push([5, 74, 0.35, 44, 22], [W - 5, 84, pi - 0.3, 46, 22]);
    list.forEach(function (l) {
      P.leaf(F, { x: l[0], y: l[1], len: l[3] * k, wid: l[4] * k, ang: l[2], shape: "ivy", flip: rnd() < 0.5, base: 0, boost: 0, dark: true });
    });
  };
})();
