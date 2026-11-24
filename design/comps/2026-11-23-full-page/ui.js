(function () {
  var P = window.Page;

  /* chapter words: split into letters, play once when they come into view */
  document.querySelectorAll(".split").forEach(function (el) {
    var text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    Array.prototype.forEach.call(text, function (ch, i) {
      var s = document.createElement("span");
      s.textContent = ch; s.style.setProperty("--i", i); s.setAttribute("aria-hidden", "true");
      el.appendChild(s);
    });
  });
  if ("IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); seen.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll(".split").forEach(function (el) { seen.observe(el); });

    /* loops play only while on screen */
    var play = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { var run = en.target.play(); if (run && run.catch) run.catch(function () {}); }
        else en.target.pause();
      });
    }, { threshold: 0.25 });
    document.querySelectorAll("video[data-autoplay]").forEach(function (v) {
      if (P.reduce) v.controls = true; else play.observe(v);
    });

    /* the nav shows which chapter is on screen */
    var links = document.querySelectorAll(".navpill a");
    var here = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var name = en.target.dataset.nav || en.target.id;
        links.forEach(function (a) { a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + name)); });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll("main > section").forEach(function (s) { here.observe(s); });
  } else {
    document.querySelectorAll(".split").forEach(function (el) { el.classList.add("in"); });
  }

  /* phone menu */
  var drawer = document.getElementById("drawer");
  document.getElementById("menu-open").addEventListener("click", function () { drawer.showModal(); });
  document.getElementById("menu-close").addEventListener("click", function () { drawer.close(); });
  drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { drawer.close(); }); });

  /* Discord has no public profile link for a handle, so the row copies it */
  var copy = document.getElementById("copy-discord");
  var handle = document.getElementById("discord-handle");
  var timer = 0;
  var name = handle.textContent;
  function say(text) {
    handle.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(function () { handle.textContent = name; }, 2000);
  }
  copy.addEventListener("click", function () {
    var fallback = function () {
      clearTimeout(timer); handle.textContent = name;
      var range = document.createRange(); range.selectNodeContents(handle);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(name).then(function () { say("Copied"); }, fallback);
    else fallback();
  });
})();
