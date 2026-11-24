/* CRT plants: leaves from four shapes with flips, vines with thickness and shadow, moss, ferns, mushrooms. */
(function () {
  var C = CRT.C, LEAF = CRT.LEAF, BARK = CRT.BARK;
  var P = CRT.plants = {};
  var WIDTH = {
    oval: function (u) { return Math.sin(Math.PI * Math.pow(u, 0.75)); },
    lance: function (u) { return Math.pow(Math.sin(Math.PI * u), 1.3) * 0.85; },
    round: function (u) { return Math.pow(Math.sin(Math.PI * Math.pow(u, 0.55)), 0.7); },
    ivy: function (u) { return u < 0.55 ? Math.pow(Math.sin(Math.PI * u / 1.1), 0.8) : Math.pow(Math.cos(Math.PI * (u - 0.55) / 0.9), 1.2) * 0.98; }
  };
  P.shapes = ["oval", "lance", "round", "ivy"];

  /* o: x,y base, len, wid, ang (radians, base to tip), shape, flip, base tone 0..2 */
  P.leaf = function (B, o, shadow) {
    var cs = Math.cos(o.ang), sn = Math.sin(o.ang), wf = WIDTH[o.shape || "oval"], half = o.wid / 2, flip = o.flip ? -1 : 1;
    var boost = o.boost === undefined ? CRT.boost(o.x + cs * o.len / 2, o.y + sn * o.len / 2) : o.boost;
    var r = Math.ceil(o.len) + 2;
    function sample(px, py) {
      var dx = px - o.x, dy = py - o.y, u = (dx * cs + dy * sn) / o.len, v = (-dx * sn + dy * cs) * flip;
      if (u < 0 || u > 1) return null;
      var w = wf(u) * half;
      if (Math.abs(v) > w + 0.35) return null;
      return { u: u, v: v, w: w };
    }
    var x, y, s, i, base = Math.min(2, (o.base || 0) + boost);
    for (y = -r; y <= r; y++) for (x = -r; x <= r; x++) {
      var px = Math.round(o.x) + x, py = Math.round(o.y) + y;
      s = sample(px, py);
      if (!s) continue;
      if (shadow) { B.shade(px + 1, py + 2, C.beige4); continue; }
      var edge = !sample(px + 1, py) || !sample(px - 1, py) || !sample(px, py + 1) || !sample(px, py - 1);
      if (o.dark) { B.put(px, py, edge || s.v >= 0 ? LEAF[0] : LEAF[1]); continue; }
      if (edge) { B.put(px, py, LEAF[Math.min(4, base + (boost > 1 ? 1 : 0))]); continue; }
      if (Math.abs(s.v) < 0.55 && s.u > 0.12 && s.u < 0.88) { B.put(px, py, LEAF[Math.min(4, base + 2 + (boost ? 1 : 0))]); continue; }
      B.put(px, py, s.v < 0 ? LEAF[Math.min(4, base + 2)] : LEAF[Math.min(4, base + 1)]);
    }
  };

  /* Catmull-Rom samples, one per pixel of length */
  P.path = function (pts) {
    var out = [], n = pts.length;
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      var steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
      for (var s = 0; s < steps; s++) {
        var t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[n - 1]);
    return out;
  };

  /* a vine plan: the sampled path and the leaves that grow along it. o: thick, leaf (len), gap, base, seed */
  P.vine = function (pts, o, rnd) {
    var path = P.path(pts), leaves = [], gap = o.gap || 9, k = rnd.int(2, gap), side = rnd() < 0.5 ? 1 : -1;
    for (var i = 2; i < path.length - 1; i++) {
      if (!o.leaf || --k > 0) continue;
      k = rnd.int(gap - 3, gap + 4);
      var a = path[i - 2], b = path[i + 1], tang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      side = -side;
      var len = o.leaf * rnd.range(0.8, 1.2);
      leaves.push({ x: path[i][0], y: path[i][1], len: len, wid: len * rnd.range(0.55, 0.8), ang: tang + side * rnd.range(0.7, 1.5),
        shape: rnd.pick(o.shapes || P.shapes), flip: rnd() < 0.5, base: o.base || 0 });
    }
    return { path: path, leaves: leaves, thick: o.thick || 2, wood: o.wood !== false };
  };
  P.paintVine = function (B, plan, shadow) {
    var t = plan.thick, i, p, c;
    if (shadow) {
      if (t >= 5) { plan.path.forEach(function (q) { for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++) B.shade(q[0] + t * 0.4 + a + 2, q[1] + t * 0.4 + b + 3, C.beige4); }); return; }
      plan.path.forEach(function (q) { for (var d = 0; d < t; d++) B.shade(q[0] + d + 1, q[1] + 2, C.beige4); });
      plan.leaves.forEach(function (l) { P.leaf(B, l, true); });
      return;
    }
    if (t >= 5) { P.paintTube(B, plan, t); return; }
    plan.path.forEach(function (q) { B.rect(Math.round(q[0]) - 1 + 1, Math.round(q[1]) + 1, t, t, BARK[0]); });
    plan.path.forEach(function (q) { B.rect(Math.round(q[0]) - 1, Math.round(q[1]) - 1, t, t, BARK[1]); });
    if (t > 1) plan.path.forEach(function (q) { B.put(Math.round(q[0]) - 1, Math.round(q[1]) - 1, BARK[2]); });
    plan.leaves.forEach(function (l) { P.leaf(B, l); });
  };

  /* a trunk or root: a shaded tube, three bark tones in flat clusters, a few cracks */
  P.paintTube = function (B, plan, t) {
    var r = t / 2, n = 0;
    plan.path.forEach(function (q) { B.ellipse(Math.round(q[0]) + 1, Math.round(q[1]) + 1, r, r, BARK[0]); });
    plan.path.forEach(function (q) { B.ellipse(Math.round(q[0]), Math.round(q[1]), r, r, BARK[1]); });
    plan.path.forEach(function (q) { B.ellipse(Math.round(q[0] - r * 0.3), Math.round(q[1] - r * 0.3), Math.max(1, Math.round(r * 0.5)), Math.max(1, Math.round(r * 0.5)), BARK[2]); });
    plan.path.forEach(function (q) {
      if (++n % 9 === 0) { B.rect(q[0] - 1, q[1] + 1, 3, 1, BARK[0]); B.put(q[0] + 2, q[1], BARK[0]); }
    });
    plan.leaves.forEach(function (l) { P.leaf(B, l); });
  };

  /* hanging strand: a thin vine that sways down, with small leaves */
  P.strand = function (x, y, len, rnd, o) {
    var pts = [[x, y]], sway = rnd.range(-6, 6), i;
    for (i = 1; i <= 4; i++) pts.push([x + Math.sin(i * 1.3 + sway) * 3 + sway * i * 0.25, y + len * i / 4]);
    return P.vine(pts, { thick: 1, leaf: (o && o.leaf) || 8, gap: 6, base: (o && o.base) || 0, shapes: ["oval", "round", "ivy"] }, rnd);
  };

  /* moss along a top edge: chunky bumps, lit where the screen reaches */
  P.moss = function (B, x0, x1, y, depth, rnd, lit) {
    var x = x0;
    while (x < x1) {
      var run = rnd.int(2, 5), h = Math.max(1, Math.round(depth * rnd.range(0.4, 1)));
      for (var i = 0; i < run && x < x1; i++, x++) {
        var bright = lit && lit(x, y) > 0;
        for (var j = 0; j < h; j++) B.put(x, y - 1 - j, j === h - 1 ? (bright ? C.leaf4 : C.moss2) : (bright ? C.moss2 : C.moss1));
      }
    }
  };

  /* fern: a curved stem with pairs of narrow leaflets that shrink toward the tip */
  P.fern = function (B, x, y, ang, len, rnd, o) {
    var n = Math.round(len / 3.2), px = x, py = y, a = ang, i;
    var curve = rnd.range(0.02, 0.05) * (rnd() < 0.5 ? -1 : 1), base = (o && o.base) || 0;
    for (i = 0; i < n; i++) {
      var f = 1 - i / n, ll = 4 + 9 * Math.sin(Math.PI * Math.min(1, f * 1.15)) * 0.9 + 2;
      var nx = px + Math.cos(a) * 3.2, ny = py + Math.sin(a) * 3.2;
      B.line(px, py, nx, ny, LEAF[base]);
      if (i > 1) {
        P.leaf(B, { x: px, y: py, len: ll, wid: ll * 0.42, ang: a - 1.15, shape: "lance", flip: false, base: base });
        P.leaf(B, { x: px, y: py, len: ll, wid: ll * 0.42, ang: a + 1.15, shape: "lance", flip: true, base: base });
      }
      px = nx; py = ny; a += curve;
    }
    P.leaf(B, { x: px, y: py, len: 6, wid: 3, ang: a, shape: "lance", flip: false, base: base });
  };

  /* mushroom: pale stem, domed cap with a shaded rim */
  P.mushroom = function (B, x, y, s) {
    B.rect(x - Math.floor(s / 4), y - s, Math.max(2, Math.round(s / 2)), s, C.fungus2);
    B.rect(x - Math.floor(s / 4), y - s, 1, s, C.fungus1);
    B.ellipse(x, y - s, s, Math.round(s * 0.7), C.fungus2, true);
    B.ellipse(x - 1, y - s - 1, s - 1, Math.round(s * 0.7) - 1, C.fungus1, true);
    B.rect(x - s, y - s, s * 2 + 1, 1, C.bark2);
  };
})();
