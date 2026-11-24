/* CRT scenes: three compositions of the same computer. Each entry draws into a back buffer (ground, computer, plants behind) and a front buffer (leaves that overlap the case and the glass). */
(function () {
  var C = CRT.C, P = CRT.plants, K = CRT.computer, E = CRT.env;
  var SH = K.SHELL_H;

  function light(cx, top) { CRT.light = { x: cx - K.SCREEN_W / 2, y: top + 16, w: K.SCREEN_W, h: K.SCREEN_H }; }
  function wide(W) { return W >= 280; }
  /* vines: plan once, shadow on the plastic in the back buffer, paint in the front buffer */
  function vines(B, F, list, rnd) {
    list.forEach(function (v) { var plan = P.vine(v[0], v[1], rnd); P.paintVine(B, plan, true); P.paintVine(F, plan); });
  }
  /* lo and hi bound the strand length in grid pixels; the windowsill keeps them short so nothing hangs far down the glass */
  function strands(B, F, xs, y, rnd, lo, hi) {
    xs.forEach(function (x) { var plan = P.strand(x, y, rnd.int(lo || 18, hi || 44), rnd); P.paintVine(B, plan, true); P.paintVine(F, plan); });
  }
  function topMoss(B, cx, top, rnd) {
    var lit = CRT.boost;
    P.moss(B, cx - 62, cx + 62, top - 12, 3, rnd, lit); P.moss(B, cx - 80, cx - 62, top - 8, 3, rnd, lit); P.moss(B, cx + 62, cx + 80, top - 8, 3, rnd, lit);
    P.moss(B, cx - 94, cx - 80, top - 4, 3, rnd, lit); P.moss(B, cx + 80, cx + 94, top - 4, 3, rnd, lit);
    P.moss(B, cx - 98, cx - 70, top + 1, 2, rnd, lit); P.moss(B, cx + 40, cx + 96, top + 1, 2, rnd, lit);
    E.patch(B, cx - 104, top + 2, 26, 10, rnd, false); E.patch(B, cx + 66, top + 2, 38, 12, rnd, true);
  }
  function backLeaves(B, cx, y, rnd, n, spread) {
    for (var i = 0; i < n; i++) {
      var len = rnd.range(14, 24);
      P.leaf(B, { x: cx + rnd.range(-spread, spread), y: y + rnd.range(0, 8), len: len, wid: len * rnd.range(0.5, 0.75), ang: -Math.PI / 2 + rnd.range(-1.1, 1.1), shape: rnd.pick(P.shapes), flip: rnd() < 0.5, base: 0 });
    }
  }
  function frontFern(F, x, y, lean, rnd, n, spread) {
    for (var i = 0; i < n; i++) P.fern(F, x + rnd.int(-3, 3), y, -Math.PI / 2 + lean + rnd.range(-spread, spread), rnd.range(40, 62), rnd, { base: 0 });
  }
  /* leaves resting on the keys */
  function onKeys(F, cx, y, rnd, n) {
    for (var i = 0; i < n; i++) {
      var x = cx + rnd.range(-72, 72), len = rnd.range(10, 14);
      P.leaf(F, { x: x, y: y + rnd.range(3, 17), len: len, wid: len * 0.6, ang: rnd.range(-0.6, 0.6) + (rnd() < 0.5 ? 0 : Math.PI), shape: rnd.pick(["oval", "ivy", "round"]), flip: rnd() < 0.5, base: 0, boost: Math.abs(x - cx) < 46 ? 1 : 0 });
    }
  }

  /* A: front on, a wooden sill, ivy pouring from above */
  CRT.scenes.a = {
    name: "Windowsill", H: 240,
    draw: function (B, F, W, H, rnd) {
      var cx = W / 2, top = 18; light(cx, top);
      E.sill(B, W, H, 190, 228, rnd);
      backLeaves(B, cx, top - 6, rnd, 9, 54);
      B.rect(cx - 62, 190, 124, 3, C.bark1);
      K.cable(B, [[cx + 8, 200], [cx + 30, 194], [cx + 50, 188], [cx + 30, 184]]);
      var m = K.monitor(B, cx, top, rnd), kb = wide(W) ? [84, 94] : [76, 86];
      K.spill(B, m);
      B.rect(cx - kb[1] - 3, 219, kb[1] * 2 + 6, 6, C.bark1);
      K.keyboard(B, cx, 197, rnd, kb[0], kb[1]);
      var mx = Math.min(cx + 106, W - 24); K.cable(B, [[mx + 7, 204], [mx + 8, 198], [cx + 90, 192]]); K.mouse(B, mx, 204);
      topMoss(B, cx, top, rnd);
      E.patch(B, cx - 104, top + SH - 26, 48, 26, rnd, false); E.patch(B, cx + 54, top + SH - 22, 50, 22, rnd, true);
      P.moss(B, cx - kb[0] + 8, cx - 20, 197, 2, rnd, CRT.boost); P.moss(B, cx + 30, cx + 62, 197, 2, rnd, CRT.boost);
      vines(B, F, [
        [[[cx - 96, -8], [cx - 100, 14], [cx - 90, 34], [cx - 106, 62], [cx - 98, 96], [cx - 108, 128], [cx - 100, 160], [cx - 106, 192]], { thick: 3, leaf: 14, gap: 8, base: 0 }],
        [[[cx + 88, -10], [cx + 98, 10], [cx + 86, 30], [cx + 104, 58], [cx + 96, 92], [cx + 108, 126], [cx + 98, 160], [cx + 104, 194]], { thick: 3, leaf: 14, gap: 8, base: 0 }],
        [[[cx - 20, -8], [cx - 30, 6], [cx - 24, 18], [cx - 44, 28], [cx - 62, 30]], { thick: 2, leaf: 12, gap: 7, base: 0 }],
        [[[cx + 30, -6], [cx + 36, 10], [cx + 28, 24], [cx + 50, 34], [cx + 68, 32]], { thick: 2, leaf: 12, gap: 7, base: 0 }],
        /* a belt that goes round the case: out past the left edge, across the chin, out past the right */
        [[[cx - 124, top + 96], [cx - 112, top + 126], [cx - 88, top + 148], [cx - 56, top + 156], [cx - 20, top + 150], [cx + 18, top + 160], [cx + 54, top + 152], [cx + 92, top + 138], [cx + 116, top + 112]], { thick: 3, leaf: 12, gap: 8, base: 0 }],
        [[[-8, 208], [26, 216], [56, 207], [cx - 100, 214], [cx - 108, 204]], { thick: 2, leaf: 13, gap: 8, base: 0 }],
        [[[W + 6, 214], [W - 28, 220], [cx + 112, 210], [cx + 102, 200]], { thick: 2, leaf: 13, gap: 8, base: 0 }],
        [[[cx - 112, 206], [cx - 76, 212], [cx - 36, 205], [cx + 6, 213]], { thick: 2, leaf: 11, gap: 7, base: 0 }]
      ], rnd);
      strands(B, F, [cx - 70, cx - 8, cx + 14, cx + 60, cx + 82], top - 2, rnd, 12, 22);
      onKeys(F, cx, 197, rnd, 7);
      E.edgeLeaves(F, W, H, rnd);
      return m;
    }
  };

  /* B: the monitor sunk into moss, ferns and mushrooms around it, a low ground line */
  CRT.scenes.b = {
    name: "Forest floor", H: 240,
    draw: function (B, F, W, H, rnd) {
      var cx = W / 2, top = 22, i; light(cx, top);
      frontFern(B, cx - 128, 192, -0.3, rnd, 4, 0.5); frontFern(B, cx + 128, 192, 0.3, rnd, 4, 0.5);
      E.ground(B, W, H, 186, rnd);
      var m = K.monitor(B, cx, top, rnd), kb = wide(W) ? [84, 94] : [76, 86];
      K.spill(B, m);
      K.keyboard(B, cx + (wide(W) ? 14 : 4), 204, rnd, kb[0], kb[1]);
      topMoss(B, cx, top, rnd);
      /* moss climbs the lower third of the case on the left and eats the right corner; the power light stays clear */
      E.bank(B, cx - 138, cx - 18, 192, 74, function (t) { return Math.min(1, t * 9) * (t < 0.3 ? 0.78 + t * 0.7 : Math.max(0.12, 1 - (t - 0.3) * 1.1)); }, rnd);
      E.bank(B, cx - 20, cx + 138, 192, 58, function (t) { return Math.min(1, (1 - t) * 9) * (t < 0.62 ? 0.2 : 0.2 + Math.pow((t - 0.62) / 0.38, 1.5) * 0.8); }, rnd);
      E.patch(B, cx - 104, top + 70, 34, 30, rnd, false);
      vines(B, F, [
        [[[cx + 112, 200], [cx + 100, 168], [cx + 110, 130], [cx + 98, 92], [cx + 106, 56], [cx + 94, 30]], { thick: 2, leaf: 12, gap: 7, base: 0 }],
        [[[cx - 112, 200], [cx - 98, 160], [cx - 108, 126], [cx - 96, 96], [cx - 104, 66]], { thick: 2, leaf: 11, gap: 7, base: 0 }],
        [[[cx - 124, 120], [cx - 100, 108], [cx - 70, 118], [cx - 52, 110]], { thick: 2, leaf: 11, gap: 7, base: 0 }],
        [[[cx - 30, 236], [cx - 70, 226], [cx - 100, 232]], { thick: 2, leaf: 12, gap: 7, base: 0 }]
      ], rnd);
      strands(B, F, [cx - 28, cx + 40, cx + 70], top - 2, rnd);
      for (i = 0; i < 6; i++) B.ellipse(cx - 70 + i * 28, 232 + (i % 2), 18, 8, i % 2 ? C.moss1 : C.moss2, true);
      P.moss(F, cx - 100, cx + 110, 230, 3, rnd, CRT.boost);
      onKeys(F, cx + 14, 204, rnd, 5);
      frontFern(F, cx - 112, top + SH + 2, 0.3, rnd, 4, 0.3);
      frontFern(F, cx + 112, top + SH + 4, -0.3, rnd, 3, 0.3);
      P.mushroom(F, cx + 118, 222, 7); P.mushroom(F, cx + 130, 226, 5); P.mushroom(F, cx + 108, 227, 4); P.mushroom(F, cx - 120, 224, 6); P.mushroom(F, cx - 130, 228, 4);
      frontFern(F, 16, H - 4, 0.4, rnd, 3, 0.5); frontFern(F, W - 16, H - 4, -0.4, rnd, 3, 0.5);
      E.edgeLeaves(F, W, H, rnd);
      return m;
    }
  };

  /* C: trunk-thick roots grip the case, a young tree grows out of a split in its top, a tower stands beside it */
  CRT.scenes.c = {
    name: "Root-bound", H: 292, W: 320,
    draw: function (B, F, W, H, rnd) {
      var big = wide(W), cx = big ? W - 136 : W / 2, top = 74, gnd = 250; light(cx, top);
      E.ground(B, W, H, gnd, rnd);
      if (big) K.tower(B, 14, gnd - 128, 54, 128);
      var m = K.monitor(B, cx, top, rnd), kb = big ? [84, 94] : [76, 86];
      K.spill(B, m);
      K.keyboard(B, cx, 256, rnd, kb[0], kb[1]);
      topMoss(B, cx, top, rnd);
      if (big) { P.moss(B, 16, 64, gnd - 130, 3, rnd, CRT.boost); E.patch(B, 14, gnd - 34, 30, 22, rnd, false); }
      E.patch(B, cx - 60, top + SH - 14, 60, 14, rnd, false);
      /* the split in the case top, then the trunk and its crown */
      B.rect(cx + 28, top - 12, 5, 4, C.bark1); B.rect(cx + 29, top - 8, 5, 4, C.bark1); B.rect(cx + 30, top - 4, 4, 8, C.bark1); B.rect(cx + 27, top - 11, 1, 3, C.beige1);
      var trunk = P.vine([[cx + 32, top - 6], [cx + 36, top - 20], [cx + 31, top - 34], [cx + 35, top - 48]], { thick: 5, leaf: 0 }, rnd);
      var limbs = [P.vine([[cx + 33, top - 30], [cx + 50, top - 38], [cx + 58, top - 52]], { thick: 3, leaf: 14, gap: 6, base: 0, shapes: ["oval", "round"] }, rnd),
                   P.vine([[cx + 32, top - 24], [cx + 16, top - 34], [cx + 10, top - 46]], { thick: 3, leaf: 14, gap: 6, base: 0, shapes: ["oval", "round"] }, rnd)];
      P.paintVine(B, trunk, true); P.paintVine(F, trunk); limbs.forEach(function (l) { P.paintVine(F, l); });
      for (var i = 0; i < 9; i++) {
        var a = -Math.PI / 2 + (i - 4) * 0.42 + rnd.range(-0.12, 0.12);
        P.leaf(F, { x: cx + 35 + Math.cos(a) * 3, y: top - 50, len: rnd.range(15, 21), wid: rnd.range(10, 13), ang: a, shape: i % 3 ? "oval" : "round", flip: i % 2 === 0, base: 0 });
      }
      var root = { thick: 11, leaf: 0 }, mid = { thick: 7, leaf: 0 }, thin = { thick: 3, leaf: 9, gap: 8, base: 0 };
      var list = [
        [[[cx - 128, 272], [cx - 112, 246], [cx - 110, 218], [cx - 98, 196], [cx - 110, 170], [cx - 96, 148]], root],
        [[[cx - 108, 222], [cx - 84, 236], [cx - 58, 230], [cx - 34, 238]], mid],
        [[[cx + 130, 276], [cx + 114, 248], [cx + 110, 220], [cx + 96, 198], [cx + 112, 170], [cx + 98, 150]], root],
        [[[cx + 110, 224], [cx + 84, 238], [cx + 58, 232]], mid],
        [[[cx - 60, 262], [cx - 20, 254], [cx + 30, 262]], thin]
      ];
      if (big) list.push(
        [[[6, 278], [32, 256], [20, 230], [50, 206], [22, 180], [54, 156], [28, 138]], root],
        [[[60, 268], [84, 252], [cx - 120, 262]], mid],
        [[[28, 228], [52, 220], [64, 232]], thin],
        [[[62, 176], [36, 194], [58, 214], [30, 238], [50, 252]], mid],
        [[[22, gnd - 132], [16, gnd - 114], [26, gnd - 98], [20, gnd - 82]], { thick: 2, leaf: 11, gap: 6, base: 0 }],
        [[[56, gnd - 132], [62, gnd - 112], [54, gnd - 96]], { thick: 2, leaf: 10, gap: 6, base: 0 }]);
      vines(B, F, list, rnd);
      frontFern(F, big ? 100 : 14, H - 4, 0.3, rnd, 3, 0.5);
      E.edgeLeaves(F, W, H, rnd);
      return m;
    }
  };
})();
