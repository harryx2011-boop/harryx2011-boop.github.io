/* The screen's desktop: windows, a taskbar and a clock. mount(host) builds one desktop in any element, so a page can hold several.
   Windows open and close at once; drag uses pointer capture and stays inside the desktop; Esc closes the focused window. */
(function () {
  var NARROW_BELOW = 420;
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
    var wins = [], focused = null, z = 0, narrow = false, inView = true, icons = {};
    root.style.setProperty("--wall", OSIcons.wallpaper());
    bar.appendChild(tasks); bar.appendChild(clock);
    root.appendChild(desk); root.appendChild(layer); root.appendChild(bar);
    host.appendChild(root);

    apps.forEach(function (a) {
      var b = el("button", "xp-icon"); b.type = "button";
      b.innerHTML = '<span class="xp-art">' + OSIcons.app(a.icon) + "</span>";
      b.appendChild(el("span", "xp-label", a.title));
      b.onclick = function () { open(a.id, true); };
      desk.appendChild(b); icons[a.id] = b;
    });

    function deskSize() { return { w: layer.clientWidth, h: layer.clientHeight }; }
    function visibleTop() {
      return wins.filter(function (w) { return !w.min; }).reduce(function (t, w) { return !t || w.z > t.z ? w : t; }, null);
    }
    function notify() {
      wins.forEach(function (w) { if (w.ctl && w.ctl.update) w.ctl.update(!w.min && inView); });
    }

    function sync() {
      var d = deskSize();
      wins.forEach(function (w) {
        w.w = Math.min(w.w, d.w); w.h = Math.min(w.h, d.h);
        w.x = clamp(w.x, 0, d.w - w.w); w.y = clamp(w.y, 0, d.h - w.h);
        var s = w.el.style;
        s.zIndex = w.z; s.left = w.x + "px"; s.top = w.y + "px"; s.width = w.w + "px"; s.height = w.h + "px";
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
      /* windows open to the right of the icon column, each one a step lower than the last */
      var left = narrow ? 0 : Math.ceil(desk.lastElementChild.getBoundingClientRect().right - layer.getBoundingClientRect().left + 8);
      w.w = Math.min(Math.round(d.w * app.size[0]), d.w - left - 8); w.h = Math.round(d.h * app.size[1]);
      w.x = left + Math.round(d.w * 0.035 * n); w.y = Math.round(d.h * (0.14 + 0.06 * n));
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
      w.el.addEventListener("pointerdown", function () { if (focused !== w) { w.z = ++z; focused = w; sync(); } }, true);
      layer.appendChild(w.el);
      if (app.ratio) w.h = Math.round(title.offsetHeight + 4 + (w.w - 4) * app.ratio);
      w.ctl = app.build(body, { close: function () { close(w); } }) || {};
      wins.push(w); focus(w, moveDom);
      return w;
    }

    /* drag by the title bar: tracking writes transform only; the position commits on release */
    function drag(handle, w) {
      var st = null;
      handle.addEventListener("pointerdown", function (e) {
        if (narrow || w.max || st || e.button !== 0 || e.target.closest("button")) return;
        var d = deskSize();
        st = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: w.x, y: w.y, mx: d.w - w.w, my: d.h - w.h, dx: 0, dy: 0 };
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
      sync();
    }
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(root);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; notify(); }, { threshold: 0.15 }).observe(host);
    }
    document.addEventListener("visibilitychange", function () { inView = !document.hidden; notify(); });
    narrow = root.clientWidth > 0 && root.clientWidth < NARROW_BELOW; root.classList.toggle("is-narrow", narrow);
    open("film", false);
    return { open: open };
  }

  window.OS = { mount: mount };
  document.querySelectorAll(".crt-screen").forEach(function (h) { h.OS = mount(h); });
})();
