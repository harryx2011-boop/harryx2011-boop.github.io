/* CRT mount: draws a scene into every .crt element at load, sizes the screen from the drawing, and redraws when the grid width changes. */
(function () {
  var NARROW_AT = 900, NARROW = 224;

  function sceneOf(el) { return CRT.scenes[el.getAttribute("data-scene")] || CRT.scenes.a; }
  /* the grid a scene draws on: a container up to NARROW_AT wide (a phone, a tablet held upright) gets a smaller one, or the scene's own close-up (scene.narrow = { W, H }) */
  function gridOf(el) {
    var scene = sceneOf(el);
    if (el.clientWidth && el.clientWidth <= NARROW_AT) return scene.narrow || { W: NARROW, H: scene.H };
    return { W: scene.W || 288, H: scene.H };
  }

  /* a glare along the curve of the glass corner: one light arc, no texture */
  function glare(F, m) {
    var c = CRT.C.glint, cx = m.x + 9, cy = m.y + 9, r = 6.5;
    for (var a = Math.PI * 1.02; a < Math.PI * 1.5; a += 0.07) {
      var x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
      F.put(x, y, c); F.put(x + 1, y, c); F.put(x, y + 1, c);
    }
  }

  /* how many pixel rows of plants hang down over the top of the glass, counted from the top edge until a clear stretch.
     The desktop keeps its windows and icons below this so a title bar is never under a leaf. */
  function overhang(F, m) {
    var x0 = Math.round(m.x), x1 = Math.round(m.x + m.w), y0 = Math.round(m.y), run = 0, gap = 0;
    for (var y = y0; y < m.y + m.h / 2 && gap <= 2; y++) {
      var hit = false;
      for (var x = x0; x < x1 && !hit; x++) hit = F.get(x, y) !== 0;
      if (hit) { run = y - y0 + 1; gap = 0; } else gap++;
    }
    return run;
  }

  function draw(el) {
    var id = el.getAttribute("data-scene") || "a", scene = sceneOf(el);
    var grid = gridOf(el), W = grid.W, H = grid.H;
    var B = new CRT.Buf(W, H), F = new CRT.Buf(W, H);
    var m = scene.draw(B, F, W, H, CRT.rng(CRT.seedOf(id + W)));
    var over = overhang(F, m);
    glare(F, m);
    B.flush(el.querySelector(".crt-back"));
    F.flush(el.querySelector(".crt-front"));
    var s = el.style;
    s.setProperty("--w", W); s.setProperty("--h", H);
    s.setProperty("--sx", (m.x / W * 100) + "%"); s.setProperty("--sy", (m.y / H * 100) + "%");
    s.setProperty("--sw", (m.w / W * 100) + "%"); s.setProperty("--sh", (m.h / H * 100) + "%");
    s.setProperty("--st", (over / m.h * 100) + "%");
    el.setAttribute("data-grid", W);
    el.setAttribute("data-ready", "");
  }

  CRT.mount = function (el) {
    draw(el);
    if (!("ResizeObserver" in window)) return;
    new ResizeObserver(function () { if (String(gridOf(el).W) !== el.getAttribute("data-grid")) draw(el); }).observe(el);
  };
  document.querySelectorAll(".crt").forEach(CRT.mount);
})();
