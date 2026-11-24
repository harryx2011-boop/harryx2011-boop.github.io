/* CRT computer: the beige monitor, keyboard, mouse and tower, drawn with flat tone clusters and one light from the upper left. */
(function () {
  var C = CRT.C, K = CRT.computer = {};
  var SHELL_W = 208, SHELL_H = 164, SCREEN_W = 160, SCREEN_H = 120;
  K.SCREEN_W = SCREEN_W; K.SCREEN_H = SCREEN_H; K.SHELL_W = SHELL_W; K.SHELL_H = SHELL_H;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  /* inside a rounded rectangle of size w by h and corner radius r */
  function inRR(dx, dy, w, h, r) {
    var qx = clamp(dx + 0.5, r, w - r), qy = clamp(dy + 0.5, r, h - r), ex = dx + 0.5 - qx, ey = dy + 0.5 - qy;
    return ex * ex + ey * ey <= r * r;
  }
  /* a beveled plate: outline, light on the top and left, shade on the bottom and right */
  function plate(B, x, y, w, h, r, t) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      if (!inRR(i, j, w, h, r)) continue;
      var edge = !inRR(i - 1, j, w, h, r) || !inRR(i + 1, j, w, h, r) || !inRR(i, j - 1, w, h, r) || !inRR(i, j + 1, w, h, r) || i === 0 || j === 0 || i === w - 1 || j === h - 1;
      var c = edge ? t.out : (j <= 1 || i <= 1) ? t.hi : (j >= h - 3 || i >= w - 3) ? t.lo : t.mid;
      B.put(x + i, y + j, c);
    }
  }
  var BEIGE = { out: C.beige4, hi: C.beige1, mid: C.beige2, lo: C.beige3 };
  var SUNK = { out: C.beige4, hi: C.beige4, mid: C.beige3, lo: C.beige1 };
  K.plate = plate; K.BEIGE = BEIGE;

  K.monitor = function (B, cx, top, rnd) {
    var x = cx - SHELL_W / 2, sx = cx - SCREEN_W / 2, sy = top + 16, i, j;
    /* the tube's back, stepped, seen from slightly above; vents cut into it */
    [[62, 12, 4], [80, 8, 4], [94, 4, 6]].forEach(function (l) {
      B.rect(cx - l[0] - 1, top - l[1] - 1, l[0] * 2 + 2, l[2] + 2, C.beige4);
      B.rect(cx - l[0], top - l[1], l[0] * 2, l[2], C.beige2);
      B.rect(cx - l[0], top - l[1], l[0] * 2, 2, C.beige1);
      B.rect(cx + l[0] - 3, top - l[1] + 2, 3, l[2] - 2, C.beige3);
    });
    for (i = 0; i < 5; i++) { B.rect(cx - 48 + i * 20, top - 10, 14, 1, C.beige4); B.rect(cx - 48 + i * 20, top - 6, 14, 1, C.beige4); }
    /* front shell and the sunken ring around the glass */
    plate(B, x, top, SHELL_W, SHELL_H, 7, BEIGE);
    plate(B, sx - 7, sy - 7, SCREEN_W + 14, SCREEN_H + 14, 11, SUNK);
    plate(B, sx - 2, sy - 2, SCREEN_W + 4, SCREEN_H + 4, 9, { out: C.glassEdge, hi: C.glassEdge, mid: C.glassDeep, lo: C.glassEdge });
    /* chin: blank badge plate, two dials, vents, power button and light */
    var cy = sy + SCREEN_H + 12, right = x + SHELL_W;
    B.rect(x + 14, cy, 28, 8, C.beige4); B.rect(x + 15, cy + 1, 26, 6, C.beige3); B.rect(x + 15, cy + 7, 26, 1, C.beige1);
    for (i = 0; i < 8; i++) { B.rect(x + 56 + i * 3, cy, 1, 8, C.beige4); B.put(x + 57 + i * 3, cy, C.beige1); }
    B.rect(x + 59, cy + 1, 1, 6, C.moss2); B.rect(x + 62, cy + 3, 1, 4, C.moss1); B.rect(x + 74, cy + 2, 1, 5, C.moss2);
    [right - 66, right - 54].forEach(function (dx) {
      B.ellipse(dx + 3, cy + 4, 3, 3, C.beige4); B.ellipse(dx + 3, cy + 4, 2, 2, C.beige3);
      B.put(dx + 2, cy + 3, C.beige1); B.put(dx + 3, cy + 3, C.beige1); B.line(dx + 3, cy + 4, dx + 4, cy + 6, C.beige4);
    });
    B.rect(right - 38, cy, 14, 8, C.beige4); B.rect(right - 37, cy + 1, 12, 6, C.beige3); B.rect(right - 37, cy + 1, 12, 1, C.beige1); B.rect(right - 37, cy + 7, 12, 1, C.beige4);
    B.rect(right - 18, cy + 2, 4, 4, C.furnace1); B.rect(right - 17, cy + 3, 2, 2, C.furnace2); B.put(right - 17, cy + 3, C.furnace3);
    /* wear: scuffs, grime, a crack from the top right corner */
    for (i = 0; i < 16; i++) {
      var wx = x + 6 + rnd.int(0, SHELL_W - 12), wy = top + 3 + rnd.int(0, SHELL_H - 8);
      if (wx > sx - 8 && wx < sx + SCREEN_W + 8 && wy > sy - 8 && wy < sy + SCREEN_H + 8) continue;
      var c = rnd() < 0.5 ? C.beige1 : C.beige3, n = rnd.int(2, 5);
      for (j = 0; j < n; j++) B.put(wx + j, wy + (j >> 1), c);
    }
    [[x + 6, top + SHELL_H - 9, 9, 3], [x + SHELL_W - 40, top + SHELL_H - 8, 14, 2], [x + 80, top + SHELL_H - 6, 10, 2], [x + 4, top + 40, 2, 7]].forEach(function (g) { B.rect(g[0], g[1], g[2], g[3], C.beige3); });
    var px = right - 9, py = top + 4;
    for (i = 0; i < 18; i++) { px -= rnd.int(0, 1); py += 1; B.put(px, py, C.beige4); if (i === 8) B.line(px, py, px + 4, py + 4, C.beige4); }
    /* neck and swivel base */
    B.rect(cx - 27, top + SHELL_H - 1, 54, 5, C.beige4); B.rect(cx - 26, top + SHELL_H - 1, 52, 4, C.beige3); B.rect(cx - 26, top + SHELL_H - 1, 52, 1, C.beige4);
    plate(B, cx - 58, top + SHELL_H + 3, 116, 9, 3, { out: C.beige4, hi: C.beige1, mid: C.beige2, lo: C.beige3 });
    return { x: sx, y: sy, w: SCREEN_W, h: SCREEN_H, shell: { x: x, y: top, w: SHELL_W, h: SHELL_H }, floor: top + SHELL_H + 12 };
  };

  /* keyboard: a trapezoid seen from above; the back edge is narrower than the front */
  K.keyboard = function (B, cx, y, rnd, bh, fh) {
    var H = 22, r, i, rowsY = [];
    bh = bh || 84; fh = fh || 94;
    function half(yy) { return bh + (fh - bh) * (yy - y) / H; }
    for (var yy = y; yy < y + H + 4; yy++) {
      var hf = Math.round(half(Math.min(yy, y + H)));
      B.rect(cx - hf - 1, yy, hf * 2 + 2, 1, yy >= y + H ? (yy === y + H + 3 ? C.beige4 : C.beige3) : C.beige4);
      if (yy < y + H) B.rect(cx - hf, yy, hf * 2, 1, C.beige3);
    }
    B.rect(cx - Math.round(half(y)), y, Math.round(half(y)) * 2, 1, C.beige2);
    for (r = 0; r < 5; r++) {
      var ry = y + 2 + r * 4, hf2 = Math.round(half(ry)) - 3, n = Math.floor(hf2 * 2 / 6);
      for (i = 0; i < n; i++) {
        var kx = cx - hf2 + i * 6 + Math.round((hf2 * 2 - n * 6 + 1) / 2);
        if (r === 4 && i >= Math.floor(n / 2) - 3 && i <= Math.floor(n / 2) + 3) continue;
        var broken = rnd() < 0.04;
        var near = Math.abs(kx - cx) < 74;
        B.rect(kx, ry, 5, 3, broken ? C.beige4 : C.beige2);
        if (!broken) { B.rect(kx, ry, 5, 1, near && r === 0 ? C.spill1 : C.beige1); B.put(kx + 4, ry + 2, C.beige3); }
        else B.rect(kx + 1, ry, 3, 1, C.moss2);
      }
      if (r === 4) { var sw = 36; B.rect(cx - sw / 2, ry, sw, 3, C.beige2); B.rect(cx - sw / 2, ry, sw, 1, C.beige1); B.rect(cx + sw / 2 - 1, ry + 1, 1, 2, C.beige3); }
    }
    for (i = 0; i < 6; i++) B.put(cx - 70 + rnd.int(0, 140), y + H + 1, C.beige4);
    return { y: y, front: y + H + 4 };
  };

  /* the screen lights the plastic around the glass: cool next to it, fainter further out, stronger below than above */
  K.spill = function (B, m) {
    for (var y = m.y - 9; y < m.y + m.h + 10; y++) for (var x = m.x - 9; x < m.x + m.w + 10; x++) {
      var dx = Math.max(m.x - x, 0, x - (m.x + m.w - 1)), dy = Math.max(m.y - y, 0, y - (m.y + m.h - 1)), d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 2.5 || d > 8.5 || !isBeige(B.get(x, y))) continue;
      var above = y < m.y;
      if (above) continue;
      B.put(x, y, d <= 4.5 ? (y >= m.y + m.h - 4 ? C.spill2 : C.spill1) : (y >= m.y + m.h ? C.spill1 : B.get(x, y)));
    }
  };
  function isBeige(c) { return c === C.beige1 || c === C.beige2 || c === C.beige3 || c === C.beige4; }

  /* a cable seen as a dark line with a light edge; pts go through CRT.plants.path */
  K.cable = function (B, pts) {
    CRT.plants.path(pts).forEach(function (q) { B.put(q[0], q[1] + 1, C.beige4); B.put(q[0], q[1], C.cable); });
  };

  K.mouse = function (B, x, y) {
    plate(B, x, y, 14, 10, 4, BEIGE);
    B.rect(x + 2, y + 4, 10, 1, C.beige4); B.rect(x + 7, y + 1, 1, 4, C.beige4);
  };

  /* tower case: bays, floppy slot, power button, vents with moss */
  K.tower = function (B, x, y, w, h) {
    var i;
    B.rect(x + 3, y - 6, w - 6, 6, C.beige4); B.rect(x + 4, y - 5, w - 8, 5, C.beige1); B.rect(x + 4, y - 5, w - 8, 1, C.beige2);
    plate(B, x, y, w, h, 3, BEIGE);
    B.rect(x + w - 6, y + 2, 4, h - 5, C.beige3);
    [[10, 12], [26, 12]].forEach(function (b) {
      B.rect(x + 7, y + b[0], w - 18, b[1], C.beige4); B.rect(x + 8, y + b[0] + 1, w - 20, b[1] - 2, C.beige3);
      B.rect(x + 8, y + b[0] + b[1] - 2, w - 20, 1, C.beige1); B.rect(x + 11, y + b[0] + 5, w - 26, 1, C.beige4);
    });
    B.rect(x + 7, y + 44, w - 18, 14, C.beige4); B.rect(x + 8, y + 45, w - 20, 12, C.beige2); B.rect(x + 8, y + 45, w - 20, 1, C.beige1);
    B.rect(x + 11, y + 50, w - 26, 2, C.glassDeep); B.rect(x + w - 16, y + 54, 4, 2, C.beige1); B.put(x + 11, y + 54, C.furnace1);
    plate(B, x + 10, y + 66, 12, 8, 3, { out: C.beige4, hi: C.beige1, mid: C.beige3, lo: C.beige3 });
    for (i = 0; i < 9; i++) { B.rect(x + 8, y + h - 34 + i * 3, w - 20, 1, C.beige4); B.rect(x + 9, y + h - 33 + i * 3, w - 20, 1, C.beige1); }
    B.rect(x + 14, y + h - 33, 5, 2, C.moss2); B.rect(x + 20, y + h - 24, 6, 2, C.moss1);
    B.rect(x + 3, y + h, 6, 3, C.beige4); B.rect(x + w - 9, y + h, 6, 3, C.beige4);
    B.rect(x + 8, y + 82, 14, 5, C.beige4); B.rect(x + 9, y + 83, 12, 3, C.beige3);
  };
})();
