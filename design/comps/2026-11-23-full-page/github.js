/* About: the contribution count comes from the build's data file; the number in the markup is the fallback. */
(function () {
  var data = window.CONTRIB, stat = document.getElementById("stat-contrib");
  if (data && stat && typeof data.total === "number") stat.textContent = String(data.total);
})();
