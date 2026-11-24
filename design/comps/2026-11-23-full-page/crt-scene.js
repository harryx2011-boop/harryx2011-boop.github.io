/* CRT mount: draws a scene into every .crt element at load, sizes the screen from the drawing, and redraws when the grid width changes. */
(function () {
  var NARROW_AT = 560, NARROW = 224;

  function sceneOf(el) { return CRT.scenes[el.getAttribute("data-scene")] || CRT.scenes.a; }
  function gridWidth(el) { return el.clientWidth && el.clientWidth < NARROW_AT ? NARROW : (sceneOf(el).W || 288); }

  /* a glare along the curve of the glass corner: one light arc, no texture */
  function glare(F, m) {
    var c = CRT.C.glint, cx = m.x + 9, cy = m.y + 9, r = 6.5;
    for (var a = Math.PI * 1.02; a < Math.PI * 1.5; a += 0.07) {
      var x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
      F.put(x, y, c); F.put(x + 1, y, c); F.put(x, y + 1, c);
    }
  }

  function draw(el) {
    var id = el.getAttribute("data-scene") || "a", scene = sceneOf(el);
    var W = gridWidth(el), H = scene.H;
    var B = new CRT.Buf(W, H), F = new CRT.Buf(W, H);
    var m = scene.draw(B, F, W, H, CRT.rng(CRT.seedOf(id + W)));
    glare(F, m);
    B.flush(el.querySelector(".crt-back"));
    F.flush(el.querySelector(".crt-front"));
    var s = el.style;
    s.setProperty("--w", W); s.setProperty("--h", H);
    s.setProperty("--sx", (m.x / W * 100) + "%"); s.setProperty("--sy", (m.y / H * 100) + "%");
    s.setProperty("--sw", (m.w / W * 100) + "%"); s.setProperty("--sh", (m.h / H * 100) + "%");
    el.setAttribute("data-grid", W);
    el.setAttribute("data-ready", "");
  }

  CRT.mount = function (el) {
    draw(el);
    if (!("ResizeObserver" in window)) return;
    new ResizeObserver(function () { if (String(gridWidth(el)) !== el.getAttribute("data-grid")) draw(el); }).observe(el);
  };
  document.querySelectorAll(".crt").forEach(CRT.mount);
})();
