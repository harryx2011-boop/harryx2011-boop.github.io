window.T = {
  r: function (el) { var b = el.getBoundingClientRect(); return { x: +b.left.toFixed(2), y: +b.top.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) }; },
  q: function (sel) { var e = document.querySelector(sel); return e ? T.r(e) : null; },
  find: function (sel, label) {
    var l = [].slice.call(document.querySelectorAll(sel)).filter(function (e) { return T.label(e) === label; })[0];
    return l ? T.r(l) : null;
  },
  screen: function () { return T.q('.crt-screen'); },
  layer: function () { return T.q('.xp-wins'); },
  label: function (el) { return el.getAttribute('aria-label') || (el.textContent || '').trim(); },
  desc: function (el) {
    if (!el) return null;
    if (el === document.body) return 'body';
    var c = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '';
    return el.tagName.toLowerCase() + c + '[' + (T.label(el) || '').slice(0, 30) + ']';
  },
  wins: function () {
    return [].slice.call(document.querySelectorAll('.xp-win')).map(function (w) {
      return { label: w.getAttribute('aria-label'), r: T.r(w), hidden: w.hidden, inert: w.inert, active: w.classList.contains('is-active'),
        max: w.classList.contains('is-max'), z: +w.style.zIndex, dragging: w.classList.contains('is-drag'), transform: w.style.transform,
        display: getComputedStyle(w).display };
    });
  },
  leafPixels: function (r) {
    var cv = document.querySelector('.crt-front'), cr = cv.getBoundingClientRect(), k = cv.width / cr.width;
    var x0 = Math.max(0, Math.round((r.x - cr.x) * k)), y0 = Math.max(0, Math.round((r.y - cr.y) * k));
    var x1 = Math.min(cv.width, Math.round((r.x + r.w - cr.x) * k)), y1 = Math.min(cv.height, Math.round((r.y + r.h - cr.y) * k));
    if (x1 <= x0 || y1 <= y0) return 0;
    var d = cv.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data, n = 0;
    for (var i = 3; i < d.length; i += 4) if (d[i] === 255) n++;
    return n;
  },
  win: function (label) { return T.wins().filter(function (w) { return w.label === label; })[0] || null; },
  tasks: function () {
    return [].slice.call(document.querySelectorAll('.xp-task')).map(function (b) { return { name: b.textContent.trim(), pressed: b.getAttribute('aria-pressed'), r: T.r(b) }; });
  },
  active: function () { return T.desc(document.activeElement); },
  activeWin: function () { var w = document.activeElement && document.activeElement.closest && document.activeElement.closest('.xp-win'); return w ? w.getAttribute('aria-label') : null; },
  ring: function () {
    var a = document.activeElement;
    if (!a || a === document.body || a === document.documentElement) return null;
    var cs = getComputedStyle(a), r = a.getBoundingClientRect();
    var ow = parseFloat(cs.outlineWidth) || 0, off = parseFloat(cs.outlineOffset) || 0;
    var outlineOn = cs.outlineStyle !== 'none' && ow > 0 && !/,\s*0\)$/.test(cs.outlineColor);
    var ext = outlineOn ? ow + off : 0, clipped = [];
    var R = { l: r.left - ext, t: r.top - ext, r: r.right + ext, b: r.bottom + ext };
    for (var p = a.parentElement; p && p !== document.body; p = p.parentElement) {
      var ps = getComputedStyle(p);
      if (ps.overflowX === 'visible' && ps.overflowY === 'visible') continue;
      var pr = p.getBoundingClientRect();
      var bl = parseFloat(ps.borderLeftWidth) || 0, bt = parseFloat(ps.borderTopWidth) || 0, br = parseFloat(ps.borderRightWidth) || 0, bb = parseFloat(ps.borderBottomWidth) || 0;
      var o = { l: Math.max(0, pr.left + bl - R.l), t: Math.max(0, pr.top + bt - R.t), r: Math.max(0, R.r - (pr.right - br)), b: Math.max(0, R.b - (pr.bottom - bb)) };
      if (o.l > 0.4 || o.t > 0.4 || o.r > 0.4 || o.b > 0.4) clipped.push(T.desc(p) + ' clips ' + JSON.stringify(o));
    }
    var w = a.closest('.xp-win');
    return { el: T.desc(a), fv: a.matches(':focus-visible'), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, offset: cs.outlineOffset,
      shadow: cs.boxShadow.slice(0, 90), ringOn: outlineOn, clipped: clipped,
      win: w ? { label: w.getAttribute('aria-label'), hidden: w.hidden, inert: w.inert } : null, r: T.r(a) };
  },
  hit: function (el) {
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    function own(n) { return n && (n === el || el.contains(n)); }
    function ext(dx, dy) { var a = 0; for (var t = 0; t < 80; t += 0.5) { var n = document.elementFromPoint(cx + dx * t, cy + dy * t); if (!own(n)) break; a = t; } return a; }
    var L = ext(-1, 0), Rr = ext(1, 0), U = ext(0, -1), D = ext(0, 1);
    var ps = getComputedStyle(el, '::before'), pseudo = null;
    if (ps.content !== 'none' && ps.position === 'absolute') pseudo = { w: parseFloat(ps.width), h: parseFloat(ps.height), inset: ps.top + ' ' + ps.right + ' ' + ps.bottom + ' ' + ps.left };
    return { box: { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, pseudo: pseudo, hit: { w: L + Rr, h: U + D }, L: L, R: Rr, U: U, D: D };
  },
  measure: function (sel) {
    return [].slice.call(document.querySelectorAll(sel)).filter(function (e) {
      var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]');
    }).map(function (e) { var h = T.hit(e); h.name = T.desc(e); h.leaf = T.leafPixels(T.r(e)); return h; });
  }
};
