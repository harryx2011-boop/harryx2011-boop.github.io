(function () {
  var P = window.Page;
  var desk = document.getElementById("desk");
  if (!desk) return;
  var wins = Array.prototype.slice.call(desk.querySelectorAll(".win"));
  var apps = Array.prototype.slice.call(desk.querySelectorAll(".dock button"));
  var title = document.getElementById("desk-title");
  var clock = document.getElementById("desk-clock");
  var inView = false;

  function film(win, on) {
    var v = win.querySelector("video");
    if (!v) return;
    if (on && inView && !P.reduce) { var run = v.play(); if (run && run.catch) run.catch(function () {}); }
    else v.pause();
  }

  function open(name) {
    wins.forEach(function (w) {
      var on = w.dataset.win === name;
      w.classList.toggle("on", on);
      w.inert = !on;
      film(w, on);
    });
    apps.forEach(function (b) {
      var on = b.dataset.open === name;
      b.setAttribute("aria-pressed", String(on));
      if (on) title.textContent = b.getAttribute("aria-label");
    });
  }
  apps.forEach(function (b) { b.addEventListener("click", function () { open(b.dataset.open); }); });

  /* the Night Market window: the strip picks which render fills it */
  var shots = Array.prototype.slice.call(desk.querySelectorAll(".shot"));
  var picks = Array.prototype.slice.call(desk.querySelectorAll(".strip button"));
  var caption = document.getElementById("market-title");
  picks.forEach(function (b, i) {
    b.addEventListener("click", function () {
      shots.forEach(function (s, j) { s.classList.toggle("on", i === j); });
      picks.forEach(function (p, j) { p.setAttribute("aria-pressed", String(i === j)); });
      caption.textContent = "Night Market, " + b.getAttribute("aria-label");
    });
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      wins.forEach(function (w) { film(w, w.classList.contains("on")); });
    }, { threshold: 0.3 }).observe(desk);
  }
  if (P.reduce) desk.querySelectorAll("video").forEach(function (v) { v.controls = true; });

  function tick() { clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  tick();
  setInterval(tick, 30000);
  open("reveal");
})();
