(function () {
  var P = window.Page;

  /* Aether: four faces fly in and lock, the tile fades in behind them, the wordmark wipes in */
  var faces = Array.prototype.slice.call(document.querySelectorAll(".gem-tile .face"));
  var tile = document.getElementById("gem-bg");
  var wordmark = document.getElementById("wordmark");
  var line = document.getElementById("lockup-line");
  var THROW = 150, TURN = 26;

  P.scene(function (tracks) {
    var p = P.reduce ? 1 : tracks.aether.p;
    faces.forEach(function (face, i) {
      var e = P.easeOut(P.band(p, 0.02 + 0.06 * i, 0.34 + 0.06 * i));
      var away = 1 - e;
      var dx = Number(face.dataset.dx) * THROW * away, dy = Number(face.dataset.dy) * THROW * away;
      face.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) rotate(" + ((i % 2 ? 1 : -1) * TURN * away).toFixed(1) + "deg)";
      face.style.opacity = P.band(e, 0, 0.35).toFixed(3);
    });
    tile.style.opacity = P.band(p, 0.4, 0.52).toFixed(3);
    var w = P.easeOut(P.band(p, 0.46, 0.68));
    wordmark.style.clipPath = "inset(-10% " + ((1 - w) * 100).toFixed(1) + "% -20% 0)";
    wordmark.style.transform = "translate3d(" + (-28 * (1 - w)).toFixed(1) + "px,0,0)";
    line.style.opacity = P.band(p, 0.62, 0.74).toFixed(3);
  });

  /* Night Market: each render wipes up over the last inside one frame */
  var reel = document.getElementById("reel");
  var shots = Array.prototype.slice.call(reel.querySelectorAll("img"));
  var label = document.getElementById("reel-label");
  var count = document.getElementById("reel-n");
  var current = -1;

  P.scene(function (tracks) {
    var p = tracks.market.p;
    var seg = 1 / (shots.length - 1);
    var top = 0;
    shots.forEach(function (img, i) {
      var e = i === 0 ? 1 : P.easeInOut(P.band(p, (i - 1) * seg + 0.07, i * seg - 0.05));
      if (i > 0) img.style.clipPath = "inset(" + ((1 - e) * 100).toFixed(1) + "% 0 0 0)";
      if (!P.reduce) img.style.transform = "scale(" + (1.06 - 0.06 * e).toFixed(4) + ")";
      if (e > 0.5) top = i;
    });
    if (top !== current) {
      current = top;
      label.textContent = shots[top].dataset.label;
      count.textContent = String(top + 1);
    }
  });
})();
