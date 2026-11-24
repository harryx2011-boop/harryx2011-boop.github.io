/* Pixel icons for the screen: 16 by 16 maps drawn as crisp SVG rects. Four app icons and the window-control glyphs. */
(function () {
  var COLOR = { k: "#0a1930", w: "#eef8fa", b: "#1c5a8b", s: "#71b1d7", d: "#0b1d36", y: "#ffab45" };
  function wrap(pre, inner, post) { return inner.map(function (r) { return pre + r + post; }); }
  var ROWS = {
    film: [].concat(["................", ".kkkkkkkkkkkkkk.", ".kwkwkwkwkwkwkk.", ".kkkkkkkkkkkkkk."],
      wrap(".k", ["bbbbbbbbbbbb", "bbbwbbbbbbbb", "bbbwwbbbbbbb", "bbbwwwbbbbbb", "bbbwwwwbbbbb", "bbbwwwbbbbbb", "bbbwwbbbbbbb", "bbbwbbbbbbbb", "bbbbbbbbbbbb"], "k."),
      [".kkkkkkkkkkkkkk.", ".kwkwkwkwkwkwkk.", ".kkkkkkkkkkkkkk."]),
    picture: [].concat(["................", ".kkkkkkkkkkkkkk."],
      wrap(".k", ["ssssssssssss", "sssssssssyys", "sssssssssyys", "swwsssssssss", "wwwwssssssss", "sssssbbsssss", "ssssbbbbssss", "sssbbbbbbbbs", "bbbddbbbbbbb", "bdddddbbbbbb", "dddddddbbbbb"], "k."),
      [".kkkkkkkkkkkkkk.", "................", "................"]),
    text: [].concat(["................"], ["...kkkkkkkkkk..."],
      wrap("...k", ["wwwwwwww", "wbbbbbbw", "wwwwwwww", "wbbbbbbw", "wwwwwwww", "wbbbbwww", "wwwwwwww", "wbbbbbbw", "wwwwwwww", "wbbbwwww", "wwwwwwww", "wwwwwwww"], "k..."),
      ["...kkkkkkkkkk...", "................"]),
    terminal: [].concat(["................", "................", ".kkkkkkkkkkkkkk."],
      wrap(".k", ["ssssssssssss", "dddddddddddd", "dwdddddddddd", "ddwddddddddd", "dwdddddyyydd", "dddddddddddd", "dddddddddddd", "dddddddddddd", "dddddddddddd", "dddddddddddd"], "k."),
      [".kkkkkkkkkkkkkk.", "................", "................"])
  };
  /* window-control glyphs on an 8 by 8 grid, drawn in currentColor */
  var GLYPH = {
    min: ["........", "........", "........", "........", "........", "........", "xxxxxx..", "xxxxxx.."],
    max: ["xxxxxxxx", "xxxxxxxx", "x......x", "x......x", "x......x", "x......x", "x......x", "xxxxxxxx"],
    restore: ["..xxxxxx", "..xxxxxx", "..x....x", "xxxxxx.x", "xxxxxx.x", "x....xxx", "x....x..", "xxxxxx.."],
    close: ["xx....xx", "xxx..xxx", ".xxxxxx.", "..xxxx..", "..xxxx..", ".xxxxxx.", "xxx..xxx", "xx....xx"]
  };
  function build(rows, n, fill) {
    var out = "";
    rows.forEach(function (row, y) {
      var x = 0;
      while (x < row.length) {
        var ch = row.charAt(x), run = 1;
        while (x + run < row.length && row.charAt(x + run) === ch) run++;
        if (ch !== "." && fill(ch)) out += '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + fill(ch) + '"/>';
        x += run;
      }
    });
    return '<svg viewBox="0 0 ' + n + " " + n + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + out + "</svg>";
  }
  window.OSIcons = {
    app: function (name) { return build(ROWS[name], 16, function (c) { return COLOR[c]; }); },
    glyph: function (name) { return build(GLYPH[name], 8, function () { return "currentColor"; }); },
    wallpaper: function () {
      var far = [34, 33, 31, 30, 29, 29, 30, 32, 34, 35, 35, 34, 33, 31, 30, 30], near = [42, 41, 40, 40, 41, 43, 44, 44, 43, 42, 41, 40, 40, 41, 42, 43], s = "";
      far.forEach(function (y, i) { s += '<rect x="' + i * 4 + '" y="' + y + '" width="4" height="48" fill="' + COLOR.b + '"/>'; });
      near.forEach(function (y, i) { s += '<rect x="' + i * 4 + '" y="' + y + '" width="4" height="48" fill="' + COLOR.d + '"/>'; });
      s += '<rect x="30" y="3" width="12" height="2" fill="#eef8fa"/><rect x="33" y="1" width="6" height="2" fill="#eef8fa"/>';
      s += '<rect x="50" y="5" width="10" height="2" fill="#eef8fa"/><rect x="52" y="3" width="5" height="2" fill="#eef8fa"/>';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" preserveAspectRatio="none" shape-rendering="crispEdges"><rect width="64" height="48" fill="#71b1d7"/>' + s + "</svg>";
      return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
    },
    names: ["film", "picture", "text", "terminal"]
  };
})();
