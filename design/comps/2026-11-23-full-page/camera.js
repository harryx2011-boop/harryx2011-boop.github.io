(function () {
  var P = window.Page;
  var PHONE = 720;
  var HERO = {
    wide: { elev: 0.055, dist: 13, roll: -0.6, cx: 0.86, cy: 0.25, aspect: 1.6 },
    phone: { elev: 0.055, dist: 26, roll: -0.5, cx: 0.2, cy: 0.36, aspect: 390 / 844 }
  };
  var CONTACT = {
    wide: { elev: 0.055, dist: 13, roll: 0.6, cx: 0.8, cy: 0.3, aspect: 1.6 },
    phone: { elev: 0.055, dist: 26, roll: 0.5, cx: 0.2, cy: 0.36, aspect: 390 / 844 }
  };
  var DEEP = { elev: 0.3, dist: 3.1 };
  function glide(t) { return P.lerp(t, P.easeInOut(t), 0.35); }

  var stage = document.getElementById("stage");
  var copy = document.getElementById("hero-copy");
  var wordname = document.getElementById("wordname");
  var readout = document.getElementById("readout");
  var readoutR = document.getElementById("readout-r");
  var preset = { elev: 0.055, dist: 13, roll: -0.6, cx: 0.86, cy: 0.25, spin: -1 };
  var shown = "";

  var hole = window.createHole(stage, {
    preset: preset,
    palette: { dop: 0.3, ramp: new Float32Array([1, 2, 3, 4].reduce(function (a, i) { return a.concat(P.rgb("--furnace-" + i)); }, [])) },
    ink: P.rgb("--ink"), voidColor: P.rgb("--void"),
    reduce: P.reduce,
    pointer: matchMedia("(hover: hover) and (pointer: fine)").matches,
    pointerTarget: window
  });

  function aim(from, e) {
    var k = (window.innerWidth / window.innerHeight) / from.aspect;
    preset.dist = from.dist * Math.pow(DEEP.dist / from.dist, e);
    preset.elev = P.lerp(from.elev, DEEP.elev, e);
    preset.roll = P.lerp(from.roll, 0, e);
    preset.cx = P.lerp(from.cx * k, 0, e);
    preset.cy = P.lerp(from.cy, 0, e);
  }

  P.scene(function (tracks) {
    var size = window.innerWidth < PHONE ? "phone" : "wide";
    var h = tracks.hero.p, c = tracks.contact.approach;
    var leaving = c > 0;
    var opacity;

    if (!leaving) {
      aim(HERO[size], P.reduce ? 0 : glide(P.band(h, 0.03, 0.92)));
      opacity = 1 - P.band(h, P.reduce ? 0.3 : 0.9, P.reduce ? 0.7 : 0.99);
    } else {
      aim(CONTACT[size], P.reduce ? 0 : 1 - P.easeOut(P.band(c, 0.4, 0.85)));
      opacity = P.band(c, 0.4, 0.6) * (1 - tracks.contact.exit);
    }
    stage.style.opacity = opacity.toFixed(3);

    var gone = P.band(h, 0.03, 0.2);
    copy.style.opacity = (1 - gone).toFixed(3);
    copy.style.transform = P.reduce ? "" : "translate3d(0," + (-48 * gone).toFixed(1) + "px,0)";
    copy.inert = gone >= 1;
    wordname.style.opacity = (1 - gone).toFixed(3);
    wordname.style.pointerEvents = gone >= 1 ? "none" : "";
    readout.style.opacity = (1 - P.band(h, 0.86, 0.96)).toFixed(3);
    var text = preset.dist.toFixed(1);
    if (text !== shown) { shown = text; readoutR.textContent = text; }

    if (hole) { hole.paused = opacity <= 0.002; hole.dirty = true; }
  });

  P.everyFrame(function (now) { if (hole && hole.active()) hole.draw(now); });

  if (hole && document.fonts && document.fonts.load) {
    document.fonts.load('500 16px "IBM Plex Mono"').then(function (faces) {
      if (faces.length) hole.setFont(P.token("--mono"));
    }).catch(function () {});
  }
})();
