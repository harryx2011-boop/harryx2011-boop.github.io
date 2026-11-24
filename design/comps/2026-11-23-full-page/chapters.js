(function () {
  var P = window.Page;

  /* Aether: four faces fly in and lock, the tile fades in behind them, the wordmark wipes in */
  var faces = Array.prototype.slice.call(document.querySelectorAll(".gem-tile .face"));
  var tile = document.getElementById("gem-bg");
  var wordmark = document.getElementById("wordmark");
  var lockup = document.querySelector(".lockup");
  var THROW = 150, TURN = 26;

  /* half the wordmark plus half the gap: measured at load and on resize, not every scroll frame (reading it there forces a layout) */
  var room = 0;
  function measureRoom() { room = (wordmark.offsetWidth + parseFloat(getComputedStyle(lockup).columnGap || 0)) / 2; P.invalidate(); }
  measureRoom();
  window.addEventListener("resize", measureRoom);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureRoom);

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
    lockup.style.transform = "translate3d(" + ((1 - w) * room).toFixed(1) + "px,0,0)";
  });
})();
