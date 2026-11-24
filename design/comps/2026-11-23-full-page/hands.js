(function () {
  var P = window.Page;
  var MAP_W = 480, MAP_H = 171;
  var GAP = { x: 212.5 / 480, y: 93 / 171 };
  var hands = document.getElementById("hands");
  if (!hands || !window.HANDS_B64) return;
  var bytes = Uint8Array.from(atob(window.HANDS_B64), function (c) { return c.charCodeAt(0); });

  function sample(fx, fy) {
    var x = Math.min(MAP_W - 1.001, Math.max(0, fx * (MAP_W - 1)));
    var y = Math.min(MAP_H - 1.001, Math.max(0, fy * (MAP_H - 1)));
    var x0 = Math.floor(x), y0 = Math.floor(y), dx = x - x0, dy = y - y0;
    var i = y0 * MAP_W + x0;
    return ((bytes[i] * (1 - dx) + bytes[i + 1] * dx) * (1 - dy) +
            (bytes[i + MAP_W] * (1 - dx) + bytes[i + MAP_W + 1] * dx) * dy) / 255;
  }

  function draw() {
    var w = hands.parentElement.clientWidth - parseFloat(getComputedStyle(hands.parentElement).paddingLeft) - parseFloat(getComputedStyle(hands.parentElement).paddingRight);
    if (!(w > 0)) return;
    var h = Math.round((w * MAP_H) / MAP_W);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    hands.width = Math.round(w * dpr); hands.height = Math.round(h * dpr);
    hands.style.aspectRatio = MAP_W + " / " + MAP_H;
    var x = hands.getContext("2d");
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    x.fillStyle = P.token("--ink");
    var pitch = Math.min(6.4, Math.max(2.6, w / 240));
    var s = pitch * Math.SQRT1_2;
    var n = Math.ceil((w + h) / pitch) + 2;
    x.beginPath();
    for (var i = -n; i <= n; i++) {
      for (var j = -n; j <= n; j++) {
        var px = (i - j) * s + w / 2, py = (i + j) * s + h / 2;
        if (px < 0 || py < 0 || px > w || py > h) continue;
        var r = pitch * 0.66 * Math.sqrt(sample(px / w, py / h));
        if (r < 0.28) continue;
        x.moveTo(px + r, py);
        x.arc(px, py, r, 0, 6.2832);
      }
    }
    x.fill();
    x.fillStyle = P.token("--furnace-3");
    x.beginPath();
    x.arc(GAP.x * w, GAP.y * h, pitch * 0.8, 0, 6.2832);
    x.fill();
  }

  new ResizeObserver(draw).observe(hands.parentElement);
  draw();
})();
