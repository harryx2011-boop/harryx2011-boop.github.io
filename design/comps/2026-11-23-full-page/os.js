/* The screen's desktop: windows, a taskbar and a clock. mount(host) builds one desktop in any element, so a page can hold several.
   It starts empty: nothing opens until an icon is used. Windows open and close at once; drag, resize and icon moves use pointer capture
   and stay inside the desktop; Esc closes the focused window. */
(function () {
  var NARROW_BELOW = 420, EDGES = ["n", "e", "s", "w", "ne", "nw", "se", "sw"];
  var MIN_EM = { w: 12, h: 7 }, SLOP = 5;
  var apps = window.OSApps || [], byId = {};
  apps.forEach(function (a) { byId[a.id] = a; });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), Math.max(lo, hi)); }
  function glyphButton(cls, label, glyph) {
    var b = el("button", "xp-cap " + cls);
    b.type = "button"; b.setAttribute("aria-label", label); b.innerHTML = OSIcons.glyph(glyph);
    return b;
  }

  function mount(host) {
    var root = el("div", "xp"), desk = el("div", "xp-desk"), layer = el("div", "xp-wins"), bar = el("div", "xp-bar");
    var tasks = el("div", "xp-tasks"), clock = el("time", "xp-clock");
    var wins = [], focused = null, z = 0, narrow = false, inView = true, icons = {}, refits = [], em = 16;
    root.style.setProperty("--wall", OSIcons.wallpaper());
    bar.appendChild(tasks); bar.appendChild(clock);
    root.appendChild(desk); root.appendChild(layer); root.appendChild(bar);
    host.appendChild(root);
    em = parseFloat(getComputedStyle(root).fontSize) || em;

    apps.forEach(function (a) {
      var b = el("button", "xp-icon"); b.type = "button";
      b.innerHTML = '<span class="xp-art">' + OSIcons.app(a.icon) + "</span>";
      b.appendChild(el("span", "xp-label", a.title));
      b.onclick = function () { open(a.id, true); };
      desk.appendChild(b); icons[a.id] = b; refits.push(movable(b));
    });

    function deskSize() { return { w: layer.clientWidth, h: layer.clientHeight }; }
    function visibleTop() {
      return wins.filter(function (w) { return !w.min; }).reduce(function (t, w) { return !t || w.z > t.z ? w : t; }, null);
    }
    function notify() {
      wins.forEach(function (w) { if (w.ctl && w.ctl.update) w.ctl.update(!w.min && inView); });
    }

    /* the box a window shows now: clamped to the desktop for the style only, so a resize and back keeps the size it had */
    function fit(w, d) {
      var ww = Math.min(w.w, d.w), hh = Math.min(w.h, d.h);
      return { w: ww, h: hh, x: clamp(w.x, 0, d.w - ww), y: clamp(w.y, 0, d.h - hh) };
    }
    function place(w, d) {
      var f = fit(w, d), s = w.el.style;
      s.left = f.x + "px"; s.top = f.y + "px"; s.width = f.w + "px"; s.height = f.h + "px";
    }

    function sync() {
      var d = deskSize();
      wins.forEach(function (w) {
        place(w, d);
        w.el.style.zIndex = w.z;
        w.el.classList.toggle("is-active", w === focused);
        w.el.classList.toggle("is-max", w.max);
        w.el.hidden = w.min; w.el.inert = w.min;
        var maxBtn = w.el.querySelector("[data-act=max]");
        maxBtn.setAttribute("aria-label", w.max ? "Restore" : "Maximize");
        maxBtn.innerHTML = OSIcons.glyph(w.max ? "restore" : "max");
      });
      renderTasks(); notify();
    }
    function renderTasks() {
      var had = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-task");
      tasks.textContent = "";
      wins.forEach(function (w) {
        var b = el("button", "xp-task"); b.type = "button"; b.setAttribute("data-task", w.id);
        b.setAttribute("aria-pressed", String(w === focused && !w.min));
        b.innerHTML = '<span class="xp-art">' + OSIcons.app(w.app.icon) + "</span>";
        b.appendChild(el("span", "xp-name", w.app.title));
        b.onclick = function () {
          if (w.min) focus(w, true);
          else if (w === focused) { minimize(w); var again = tasks.querySelector('[data-task="' + w.id + '"]'); if (again) again.focus({ preventScroll: true }); }
          else focus(w, true);
        };
        tasks.appendChild(b);
        if (had === w.id) b.focus({ preventScroll: true });
      });
    }

    function focus(w, moveDom) {
      w.min = false; w.z = ++z; focused = w; sync();
      if (moveDom) { if (w.ctl && w.ctl.focus) w.ctl.focus(); else w.el.focus({ preventScroll: true }); }
    }
    function minimize(w) {
      w.min = true;
      if (focused === w) focused = visibleTop();
      sync();
    }
    function close(w) {
      var i = wins.indexOf(w);
      if (i < 0) return;
      wins.splice(i, 1); w.el.remove();
      if (focused === w) focused = visibleTop();
      sync();
      if (icons[w.app.id]) icons[w.app.id].focus({ preventScroll: true });
    }

    function open(id, moveDom) {
      var existing = wins.filter(function (w) { return w.app.id === id; })[0];
      if (existing) { focus(existing, moveDom); return existing; }
      var app = byId[id], d = deskSize(), n = wins.length;
      var w = { id: id + "-" + (++z), app: app, min: false, max: false, z: ++z };
      /* windows open to the right of the icon columns (where the icons were laid out, not where they were dragged to), each one a step lower than the last */
      var left = narrow ? 0 : 8 + Math.max.apply(null, apps.map(function (a) { return icons[a.id].offsetLeft + icons[a.id].offsetWidth; }));
      w.w = Math.min(Math.round(d.w * app.size[0]), d.w - left - 8); w.h = Math.round(d.h * app.size[1]);
      w.x = left + Math.round(d.w * 0.035 * n); w.y = Math.round(d.h * (0.06 + 0.06 * n));
      w.el = el("div", "xp-win"); w.el.setAttribute("role", "dialog"); w.el.setAttribute("aria-label", app.title); w.el.tabIndex = -1;
      var title = el("div", "xp-title");
      title.innerHTML = '<span class="xp-art">' + OSIcons.app(app.icon) + "</span>";
      title.appendChild(el("span", "xp-name", app.title));
      var bMin = glyphButton("", "Minimize", "min"), bMax = glyphButton("", "Maximize", "max"), bX = glyphButton("xp-x", "Close", "close");
      bMax.setAttribute("data-act", "max");
      bMin.onclick = function () { minimize(w); var t = tasks.querySelector('[data-task="' + w.id + '"]'); if (t) t.focus({ preventScroll: true }); };
      bMax.onclick = function () { w.max = !w.max; sync(); };
      bX.onclick = function () { close(w); };
      title.appendChild(bMin); title.appendChild(bMax); title.appendChild(bX);
      title.ondblclick = function (e) { if (!narrow && !e.target.closest("button")) { w.max = !w.max; sync(); } };
      drag(title, w);
      w.el.appendChild(title);
      var body = el("div", "xp-body"); w.el.appendChild(body);
      resize(w);
      w.el.addEventListener("pointerdown", function () { if (focused !== w) { w.z = ++z; focused = w; sync(); } }, true);
      layer.appendChild(w.el);
      /* a window with a fixed picture shape is as tall as its share of the desktop allows, and as wide as that height needs */
      if (app.ratio) {
        var chrome = title.offsetHeight + 4;
        w.w = Math.min(w.w, Math.round((w.h - chrome) / app.ratio) + 4);
        w.h = Math.round(chrome + (w.w - 4) * app.ratio);
      }
      w.ctl = app.build(body, { close: function () { close(w); } }) || {};
      wins.push(w); focus(w, moveDom);
      return w;
    }

    /* drag by the title bar: tracking writes transform only; the position commits on release */
    function drag(handle, w) {
      var st = null;
      handle.addEventListener("pointerdown", function (e) {
        if (narrow || w.max || st || e.button !== 0 || e.target.closest("button")) return;
        var d = deskSize(), f = fit(w, d);
        st = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: f.x, y: f.y, mx: d.w - f.w, my: d.h - f.h, dx: 0, dy: 0 };
        handle.setPointerCapture(e.pointerId); w.el.classList.add("is-drag");
      });
      handle.addEventListener("pointermove", function (e) {
        if (!st || e.pointerId !== st.id) return;
        st.dx = clamp(st.x + e.clientX - st.sx, 0, st.mx) - st.x; st.dy = clamp(st.y + e.clientY - st.sy, 0, st.my) - st.y;
        w.el.style.transform = "translate(" + st.dx + "px," + st.dy + "px)";
      });
      function end(e) {
        if (!st || e.pointerId !== st.id) return;
        w.x = st.x + st.dx; w.y = st.y + st.dy; st = null;
        w.el.style.transform = ""; w.el.classList.remove("is-drag"); sync();
      }
      handle.addEventListener("pointerup", end); handle.addEventListener("pointercancel", end);
    }

    /* resize from any edge or corner: the box follows the pointer, stays inside the desktop and keeps room for a title bar and a few lines */
    function resize(w) {
      EDGES.forEach(function (dir) {
        var h = el("div", "xp-rs xp-rs-" + dir), st = null;
        h.addEventListener("pointerdown", function (e) {
          if (narrow || w.max || st || e.button !== 0) return;
          var d = deskSize();
          st = { id: e.pointerId, sx: e.clientX, sy: e.clientY, f: fit(w, d), d: d, minW: Math.min(MIN_EM.w * em, d.w), minH: Math.min(MIN_EM.h * em, d.h) };
          h.setPointerCapture(e.pointerId); e.preventDefault();
        });
        h.addEventListener("pointermove", function (e) {
          if (!st || e.pointerId !== st.id) return;
          var dx = e.clientX - st.sx, dy = e.clientY - st.sy, x = st.f.x, y = st.f.y, r = x + st.f.w, b = y + st.f.h;
          if (dir.indexOf("e") >= 0) r = clamp(r + dx, x + st.minW, st.d.w);
          if (dir.indexOf("w") >= 0) x = clamp(x + dx, 0, r - st.minW);
          if (dir.indexOf("s") >= 0) b = clamp(b + dy, y + st.minH, st.d.h);
          if (dir.indexOf("n") >= 0) y = clamp(y + dy, 0, b - st.minH);
          w.x = x; w.y = y; w.w = r - x; w.h = b - y; place(w, st.d);
        });
        function end(e) { if (!st || e.pointerId !== st.id) return; st = null; sync(); }
        h.addEventListener("pointerup", end); h.addEventListener("pointercancel", end);
        w.el.appendChild(h);
      });
    }

    /* a desktop icon can be moved: its offset from its grid slot is kept in px and clamped to the desktop. A move does not open the app.
       Returns the function that re-clamps it after the desktop changes size. */
    function movable(b) {
      var st = null, off = { x: 0, y: 0 }, moved = false;
      function limit(x, y) {
        var d = desk.getBoundingClientRect(), r = b.getBoundingClientRect(), bx = r.left - off.x, by = r.top - off.y;
        return { x: clamp(x, d.left - bx, d.right - r.width - bx), y: clamp(y, d.top - by, d.bottom - r.height - by) };
      }
      function show() { b.style.translate = !narrow && (off.x || off.y) ? off.x + "px " + off.y + "px" : ""; }
      b.addEventListener("pointerdown", function (e) {
        if (narrow || st || e.button !== 0) return;
        st = { id: e.pointerId, sx: e.clientX - off.x, sy: e.clientY - off.y }; moved = false;
      });
      b.addEventListener("pointermove", function (e) {
        if (!st || e.pointerId !== st.id) return;
        var x = e.clientX - st.sx, y = e.clientY - st.sy;
        if (!moved && Math.abs(x - off.x) + Math.abs(y - off.y) < SLOP) return;
        if (!moved) { moved = true; b.setPointerCapture(e.pointerId); b.classList.add("is-drag"); }
        off = limit(x, y); show();
      });
      function end(e) { if (!st || e.pointerId !== st.id) return; st = null; b.classList.remove("is-drag"); }
      b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end);
      b.addEventListener("click", function (e) { if (moved) { moved = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
      return function () { if (!narrow) off = limit(off.x, off.y); show(); };
    }

    root.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && focused && !e.defaultPrevented) { e.preventDefault(); close(focused); }
    });

    function tick() {
      var t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      if (clock.textContent !== t) clock.textContent = t;
    }
    tick(); setInterval(tick, 10000);

    function measure() {
      var n = root.clientWidth > 0 && root.clientWidth < NARROW_BELOW;
      if (n !== narrow) { narrow = n; root.classList.toggle("is-narrow", n); }
      refits.forEach(function (f) { f(); });
      sync();
    }
    if ("ResizeObserver" in window) { var ro = new ResizeObserver(measure); ro.observe(root); ro.observe(layer); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; notify(); }, { threshold: 0.15 }).observe(host);
    }
    document.addEventListener("visibilitychange", function () { inView = !document.hidden; notify(); });
    measure();
    return { open: open };
  }

  window.OS = { mount: mount };
  document.querySelectorAll(".crt-screen").forEach(function (h) { h.OS = mount(h); });
})();
