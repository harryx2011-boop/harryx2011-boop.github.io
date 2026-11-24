/* CRT scene engine: a fixed pixel grid, one named palette, a seeded random generator and the drawing primitives the scenes share. */
(function () {
  var HEX = {
    /* dusky plastic, light from the upper left, all darker than the screen */
    beige1: "#8a8470", beige2: "#6c675a", beige3: "#504c42", beige4: "#2f2d27",
    /* glass */
    glassDeep: "#04060a", glassEdge: "#0a1216", glassSheen: "#31444a",
    /* leaves: three night tones, two tones lit by the screen */
    leaf1: "#07110b", leaf2: "#0e2015", leaf3: "#17331f", leaf4: "#35693a", leaf5: "#6f9f4c",
    /* bark */
    bark1: "#17100b", bark2: "#2a1d14", bark3: "#3f2e20",
    /* moss */
    moss1: "#1b2c10", moss2: "#2d4418",
    /* the screen's spill on plastic: cool, then a little warmer toward the glass */
    spill1: "#34505e", spill2: "#5d7886",
    /* the one warm accent, the page's furnace tokens: the power light */
    furnace1: "#9a2c12", furnace2: "#e2541c", furnace3: "#ffab45",
    /* ground, near the page void */
    soil1: "#0a0a0b", soil2: "#101010", soil3: "#161513", soil4: "#1f1c18",
    /* mushrooms and cable */
    fungus1: "#a39b88", fungus2: "#5d5748", cable: "#121214"
  };
  var C = {};
  function pack(hex, alpha) {
    var n = parseInt(hex.slice(1), 16);
    return ((alpha << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
  }
  Object.keys(HEX).forEach(function (k) { C[k] = pack(HEX[k], 255); });
  C.glint = pack("#ffffff", 34);
  var LEAF = [C.leaf1, C.leaf2, C.leaf3, C.leaf4, C.leaf5];
  var BARK = [C.bark1, C.bark2, C.bark3];
  var PLASTIC = {};
  [C.beige1, C.beige2, C.beige3].forEach(function (c) { PLASTIC[c] = 1; });

  /* seeded generator: the same picture on every load */
  function rng(seed) {
    var s = seed >>> 0;
    function r() {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    r.range = function (a, b) { return a + (b - a) * r(); };
    r.int = function (a, b) { return Math.floor(a + (b - a + 1) * r()); };
    r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    return r;
  }
  function seedOf(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function Buf(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  Buf.prototype.put = function (x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  };
  Buf.prototype.get = function (x, y) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  };
  Buf.prototype.rect = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.put(x + i, y + j, c);
  };
  Buf.prototype.line = function (x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
    for (;;) {
      this.put(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  };
  Buf.prototype.ellipse = function (cx, cy, rx, ry, c, upperOnly) {
    for (var y = -ry; y <= (upperOnly ? 0 : ry); y++) {
      var half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      for (var x = -half; x <= half; x++) this.put(cx + x, cy + y, c);
    }
  };
  /* paint c on top of pixels that are cream plastic (shadows cast by plants) */
  Buf.prototype.shade = function (x, y, c) { if (PLASTIC[this.get(x, y)]) this.put(x, y, c); };
  Buf.prototype.flush = function (canvas) {
    canvas.width = this.w; canvas.height = this.h;
    var ctx = canvas.getContext("2d");
    ctx.putImageData(new ImageData(new Uint8ClampedArray(this.d.buffer), this.w, this.h), 0, 0);
  };

  window.CRT = { HEX: HEX, C: C, LEAF: LEAF, BARK: BARK, Buf: Buf, rng: rng, seedOf: seedOf, scenes: {}, light: { x: 0, y: 0, w: 0, h: 0 } };
  /* how much the screen lights a point: 2 beside the glass, 1 a little further, 0 beyond */
  CRT.boost = function (x, y) {
    var s = CRT.light, dx = Math.max(s.x - x, 0, x - (s.x + s.w)), dy = Math.max(s.y - y, 0, y - (s.y + s.h));
    var d = Math.sqrt(dx * dx + dy * dy);
    return d < 10 ? 2 : d < 26 ? 1 : 0;
  };
})();
