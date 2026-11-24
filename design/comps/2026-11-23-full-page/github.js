(function () {
  var data = window.CONTRIB;
  var el = document.getElementById("activity");
  var cap = document.getElementById("activity-cap");
  if (!data || !el) return;

  var WEEKS = 16;
  var GLYPHS = ".:-=+*#%@";
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var weeks = data.weeks.slice(-WEEKS);
  var first = new Date(data.end + "T00:00:00Z");
  var days = weeks.reduce(function (n, w) { return n + w.length; }, 0);
  first.setUTCDate(first.getUTCDate() - (days - 1));
  var max = Math.max.apply(null, weeks.map(function (w) { return Math.max.apply(null, w); }));
  var total = 0, n = 0;

  function fmt(d) { return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()]; }

  weeks.forEach(function (week) {
    for (var d = 0; d < 7; d++) {
      var cell = document.createElement("span");
      if (d < week.length) {
        var c = week[d];
        var day = new Date(first); day.setUTCDate(first.getUTCDate() + n); n++;
        total += c;
        var k = c ? Math.sqrt(c / max) : 0;
        cell.textContent = c ? GLYPHS[Math.min(GLYPHS.length - 1, Math.round(k * (GLYPHS.length - 1)))] : "·";
        if (c) cell.className = k > 0.66 ? "h3" : k > 0.33 ? "h2" : "h1";
        cell.title = fmt(day) + ": " + c + (c === 1 ? " contribution" : " contributions");
      } else {
        cell.textContent = " ";
      }
      el.appendChild(cell);
    }
  });

  var last = new Date(data.end + "T00:00:00Z");
  el.setAttribute("aria-label", total + " contributions between " + fmt(first) + " and " + fmt(last) + " " + last.getUTCFullYear() + ", drawn as one character per day");
  cap.textContent = fmt(first) + " to " + fmt(last) + " " + last.getUTCFullYear() + ". One character is one day. A denser, hotter character means more contributions; the busiest day had " + max + ".";
  var stat = document.getElementById("stat-contrib");
  if (stat) stat.textContent = String(data.total);
})();
