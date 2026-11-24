(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TALL = 1700;
  var css = getComputedStyle(document.documentElement);
  var tracks = {};
  var scenes = [];
  var drawers = [];
  var dirty = true;

  document.documentElement.classList.add("js");
  document.querySelectorAll("[data-track]").forEach(function (el) {
    tracks[el.dataset.track] = { el: el, top: 0, span: 1, p: 0, approach: 0, exit: 0 };
  });

  function clamp(x, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, x)); }

  function measure() {
    var vh = window.innerHeight;
    Object.keys(tracks).forEach(function (k) {
      var t = tracks[k], r = t.el.getBoundingClientRect();
      t.top = r.top + window.scrollY;
      t.span = Math.max(1, r.height - vh);
    });
    dirty = true;
  }

  function read() {
    var vh = window.innerHeight, y = window.scrollY, still = vh > TALL;
    Object.keys(tracks).forEach(function (k) {
      var t = tracks[k];
      t.p = still ? (k === "aether" ? 1 : 0) : clamp((y - t.top) / t.span);
      t.approach = still ? 0 : clamp((y - (t.top - vh)) / (t.span + vh));
      t.exit = still ? 0 : clamp((y - (t.top + t.span)) / (vh * 0.6));
    });
  }

  function frame(now) {
    if (dirty) {
      read();
      for (var i = 0; i < scenes.length; i++) scenes[i](tracks);
      dirty = false;
    }
    for (var j = 0; j < drawers.length; j++) drawers[j](now);
    requestAnimationFrame(frame);
  }

  window.Page = {
    reduce: reduce,
    tracks: tracks,
    clamp: clamp,
    lerp: function (a, b, t) { return a + (b - a) * t; },
    band: function (p, a, b) { return clamp((p - a) / (b - a)); },
    easeOut: function (t) { return 1 - Math.pow(1 - t, 3); },
    easeInOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    token: function (name) { return css.getPropertyValue(name).trim(); },
    rgb: function (name) {
      var n = parseInt(css.getPropertyValue(name).trim().replace("#", ""), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    },
    scene: function (fn) { scenes.push(fn); dirty = true; },
    everyFrame: function (fn) { drawers.push(fn); },
    invalidate: function () { dirty = true; }
  };

  window.addEventListener("scroll", function () { dirty = true; }, { passive: true });
  window.addEventListener("resize", measure);
  new ResizeObserver(measure).observe(document.body);
  measure();
  requestAnimationFrame(frame);
})();
