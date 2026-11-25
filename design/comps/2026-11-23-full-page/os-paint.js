/* Paint: a small pixel canvas. Pick an ink, draw with the mouse or a finger, clear the page. It adds itself to the app list. */
(function () {
  var W = 64, H = 40;
  var INKS = [["Navy", "--aether-navy"], ["Blue", "--aether-blue"], ["Sky", "--aether-sky"], ["Red", "--furnace-1"], ["Orange", "--furnace-2"], ["Amber", "--furnace-3"], ["Paper", "--aether-ice"]];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function paint(body) {
    var css = getComputedStyle(document.documentElement);
    var inks = INKS.map(function (i) { return { name: i[0], color: css.getPropertyValue(i[1]).trim() }; });
    var paper = inks[inks.length - 1].color, ink = inks[0].color, last = null, swatches = [];
    var stage = el("div", "app-easel"), cv = el("canvas", "app-canvas"), tools = el("div", "app-tools"), g = cv.getContext("2d");
    cv.width = W; cv.height = H;
    cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "Drawing page. Draw with a mouse or a finger.");
    function clear() { g.fillStyle = paper; g.fillRect(0, 0, W, H); }

    /* the page keeps its shape inside the window (object-fit: contain), so a pointer position is mapped through the same fit */
    function cell(e) {
      var r = cv.getBoundingClientRect(), k = Math.min(r.width / W, r.height / H);
      return { x: Math.floor((e.clientX - r.left - (r.width - W * k) / 2) / k), y: Math.floor((e.clientY - r.top - (r.height - H * k) / 2) / k) };
    }
    function stroke(a, b) {
      var dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y), sx = a.x < b.x ? 1 : -1, sy = a.y < b.y ? 1 : -1, err = dx - dy, x = a.x, y = a.y;
      g.fillStyle = ink;
      for (;;) {
        g.fillRect(x, y, 1, 1);
        if (x === b.x && y === b.y) break;
        var e2 = err * 2;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
    }
    cv.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || last) return;
      cv.setPointerCapture(e.pointerId); last = cell(e); last.id = e.pointerId; stroke(last, last); e.preventDefault();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!last || e.pointerId !== last.id) return;
      var now = cell(e); now.id = last.id; stroke(last, now); last = now;
    });
    function end(e) { if (last && e.pointerId === last.id) last = null; }
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);

    inks.forEach(function (i) {
      var b = el("button", "app-ink"); b.type = "button"; b.setAttribute("aria-label", i.name); b.style.background = i.color;
      b.onclick = function () { ink = i.color; mark(); };
      tools.appendChild(b); swatches.push(b);
    });
    function mark() { swatches.forEach(function (b, n) { b.setAttribute("aria-pressed", String(inks[n].color === ink)); }); }
    var wipe = el("button", "app-btn app-wipe", "Clear"); wipe.type = "button"; wipe.onclick = clear;
    tools.appendChild(wipe);

    body.className += " app-paint";
    stage.appendChild(cv); body.appendChild(tools); body.appendChild(stage);
    clear(); mark();
    return { focus: function () { swatches[0].focus({ preventScroll: true }); } };
  }

  (window.OSApps = window.OSApps || []).push({ id: "paint", title: "Paint", icon: "paint", size: [0.5, 0.8], build: paint });
})();
