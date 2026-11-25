/* About: the Enigma eye. Its pupil follows the pointer; a click opens the video in a full-screen dialog. If the file cannot play, the dialog says so. */
(function () {
  var btn = document.getElementById("eye-open"), gaze = document.getElementById("eye-gaze");
  var reel = document.getElementById("eye-reel"), video = document.getElementById("eye-video"), note = document.getElementById("eye-note");
  if (!btn || !reel || !video) return;
  var REACH_X = 16, REACH_Y = 5, FULL = 280, EASE = 0.22;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var x = 0, y = 0, toX = 0, toY = 0, frame = 0;

  function step() {
    frame = 0;
    x += (toX - x) * EASE; y += (toY - y) * EASE;
    gaze.setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ")");
    if (Math.abs(toX - x) > 0.02 || Math.abs(toY - y) > 0.02) frame = requestAnimationFrame(step);
  }
  function aim(dx, dy) {
    var d = Math.hypot(dx, dy) || 1, pull = Math.min(1, d / FULL);
    toX = dx / d * REACH_X * pull; toY = dy / d * REACH_Y * pull;
    if (!frame) frame = requestAnimationFrame(step);
  }
  if (gaze && !reduce) {
    window.addEventListener("pointermove", function (e) {
      var b = btn.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight) return;
      aim(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
    }, { passive: true });
    document.addEventListener("mouseleave", function () { aim(0, 0); });
  }

  function missing() { video.hidden = true; note.hidden = false; }
  video.addEventListener("error", missing);
  btn.addEventListener("click", function () {
    video.hidden = false; note.hidden = true;
    reel.showModal();
    var run = video.play();
    if (run && run.catch) run.catch(function () { if (video.error || video.networkState === 3) missing(); });
  });
  document.getElementById("eye-close").addEventListener("click", function () { reel.close(); });
  reel.addEventListener("close", function () { video.pause(); btn.focus({ preventScroll: true }); });
})();
