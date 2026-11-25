/* The apps on the screen: one registry, one entry per app. build(body) fills the window and may return { update(visible), focus() }.
   To add an app, add one entry: id, title (also the desktop label), icon, size (share of the desktop), optional ratio (height per width of the content), build. */
(function () {
  var reduce = window.Page ? window.Page.reduce : matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function button(cls, label, text) {
    var b = el("button", cls, text);
    b.type = "button"; b.setAttribute("aria-label", label);
    return b;
  }

  /* Reveal film: plays only while its window is showing and the section is on screen */
  function film(body) {
    var v = el("video", "app-video"), paused = false;
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.poster = "media/reveal-poster.jpg"; v.src = "media/reveal-loop.mp4";
    v.setAttribute("aria-label", "The Aether reveal film, a silent loop");
    body.className += " app-film"; body.appendChild(v);
    var toggle = null;
    function play() { var run = v.play(); if (run && run.catch) run.catch(function () {}); }
    if (reduce) v.controls = true;
    else {
      toggle = button("app-btn", "Pause the film", "Pause");
      body.appendChild(el("div", "app-bar")).appendChild(toggle);
      toggle.onclick = function () {
        paused = !paused;
        if (paused) v.pause(); else play();
      };
      v.addEventListener("play", function () { toggle.textContent = "Pause"; toggle.setAttribute("aria-label", "Pause the film"); });
      v.addEventListener("pause", function () { toggle.textContent = "Play"; toggle.setAttribute("aria-label", "Play the film"); });
    }
    return {
      update: function (visible) { if (visible && !paused && !reduce) play(); else v.pause(); },
      focus: function () { (toggle || v).focus({ preventScroll: true }); }
    };
  }

  /* Night Market: four renders, previous and next, a thumbnail strip, arrow keys */
  var SHOTS = [
    { src: "media/nm-market-1849.jpg", alt: "A lantern-lit market street at dusk" },
    { src: "media/nm-plaza-1849.jpg", alt: "A plaza under a cherry tree at dusk" },
    { src: "media/nm-riverside-1630.jpg", alt: "A red bridge over a river in afternoon light" },
    { src: "media/nm-shrine-2030.jpg", alt: "A shrine gate at night with lanterns" }
  ];
  function market(body) {
    var i = 0, stage = el("div", "app-stage"), img = el("img", "app-shot"), strip = el("div", "app-strip"), thumbs = [];
    var prev = button("app-nav app-prev", "Previous render", "<"), next = button("app-nav app-next", "Next render", ">");
    body.className += " app-market"; body.tabIndex = 0;
    img.width = 960; img.height = 540;
    stage.appendChild(img); stage.appendChild(prev); stage.appendChild(next);
    SHOTS.forEach(function (s, n) {
      var t = button("app-thumb", s.alt), th = el("img"); th.src = s.src; th.alt = ""; th.loading = "lazy";
      t.appendChild(th); t.onclick = function () { show(n); }; strip.appendChild(t); thumbs.push(t);
    });
    function show(n) {
      i = (n + SHOTS.length) % SHOTS.length;
      img.src = SHOTS[i].src; img.alt = SHOTS[i].alt;
      thumbs.forEach(function (t, k) { if (k === i) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current"); });
    }
    prev.onclick = function () { show(i - 1); };
    next.onclick = function () { show(i + 1); };
    body.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(i - 1); e.preventDefault(); }
      else if (e.key === "ArrowRight") { show(i + 1); e.preventDefault(); }
    });
    body.appendChild(stage); body.appendChild(strip); show(0);
    return { focus: function () { body.focus({ preventScroll: true }); } };
  }

  function notes(body) {
    var page = el("div", "app-note", "Hi. I'm Elixir and I am the founder of Aether, an AI research lab contributing to the next frontier.");
    page.tabIndex = 0; body.appendChild(page);
    return { focus: function () { page.focus({ preventScroll: true }); } };
  }

  /* Terminal: four lines already printed, then a real prompt */
  function terminal(body) {
    var out = el("div", "app-out"), row = el("label", "app-prompt"), input = el("input", "app-input");
    var facts = { whoami: "Harry Xie, also Elixir", role: "Founder of Aether", github: "harryx2011-boop", discord: "ogexr." };
    var cmds = {
      help: "help, whoami, work, contact, clear",
      whoami: facts.whoami,
      work: "Reveal film, Night Market, about.txt, Paint",
      contact: "Discord: ogexr."
    };
    body.className += " app-term"; out.setAttribute("role", "log");
    function line(text) { out.appendChild(el("div", "app-line", text)); }
    ["whoami", "role", "github", "discord"].forEach(function (k) { line("> " + k); line(facts[k]); });
    row.appendChild(el("span", "app-caret", ">")); row.appendChild(input);
    input.setAttribute("aria-label", "Command"); input.autocomplete = "off"; input.spellcheck = false;
    input.setAttribute("autocapitalize", "off"); input.setAttribute("autocorrect", "off");
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var cmd = input.value.trim().toLowerCase(); input.value = "";
      if (!cmd) return;
      line("> " + cmd);
      if (cmd === "clear") out.textContent = "";
      else line(Object.prototype.hasOwnProperty.call(cmds, cmd) ? cmds[cmd] : "Unknown command. Type help.");
      out.scrollTop = out.scrollHeight;
    });
    body.addEventListener("click", function () { if (!String(getSelection())) input.focus({ preventScroll: true }); });
    body.appendChild(out); body.appendChild(row);
    return { focus: function () { input.focus({ preventScroll: true }); } };
  }

  window.OSApps = [
    { id: "film", title: "Reveal film", icon: "film", size: [0.78, 0.92], ratio: 9 / 16, build: film },
    { id: "market", title: "Night Market", icon: "picture", size: [0.7, 0.86], build: market },
    { id: "notes", title: "about.txt", icon: "text", size: [0.6, 0.46], build: notes },
    { id: "terminal", title: "Terminal", icon: "terminal", size: [0.68, 0.58], build: terminal }
  ];
})();
