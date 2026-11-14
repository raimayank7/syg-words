/* surnames: search any surname in the 2010 Census list (shard by first two letters) */
(function () {
  'use strict';
  var d = document, SYG = window.SYG, f = d.getElementById('q'), out = d.querySelector('[data-out]'), cache = {}, tm;
  if (!f) return;
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function card(r) {
    var g = [['White', r[4]], ['Black', r[5]], ['Asian or Pacific Islander', r[6]], ['American Indian or Alaska Native', r[7]], ['Two or more races', r[8]], ['Hispanic or Latino', r[9]]];
    var bars = g.map(function (x) { return x[1] === null ? '' : '<div class="bar"><span>' + x[0] + '</span><i style="width:' + Math.max(1, x[1]) * 2 + 'px"></i> ' + x[1] + '%</div>'; }).join('');
    return '<div class="res"><h3>' + SYG.esc(r[0]) + '</h3><p>Rank <b>' + fmt(r[1]) + '</b> in the 2010 Census, <b>' + fmt(r[2]) + '</b> people, about ' + r[3] + ' in every 100,000 people in the United States.</p><div class="bars">' + bars + '</div></div>';
  }
  function show(q) {
    q = q.toUpperCase().replace(/[^A-Z'\- ]/g, '').trim();
    if (q.length < 2) { out.innerHTML = '<p>Type at least two letters of a surname.</p>'; return; }
    var key = q.slice(0, 2).replace(/[^A-Z]/g, '_');
    var go = function (rows) {
      var ex = rows.filter(function (r) { return r[0] === q; }), pre = rows.filter(function (r) { return r[0] !== q && r[0].indexOf(q) === 0; }).slice(0, 12);
      out.innerHTML = ex.map(card).join('') + (pre.length ? '<h3>Surnames starting with ' + SYG.esc(q) + '</h3>' + pre.map(card).join('') : '') ||
        '<p>Not found. The list holds surnames that at least 100 people had in 2010, so rarer names are missing.</p>';
      if (!ex.length && !pre.length) out.innerHTML = '<p>Not found. The list holds surnames that at least 100 people had in 2010, so rarer names are missing.</p>';
    };
    if (cache[key]) go(cache[key]); else SYG.json('/surnames/data/s/' + key + '.json').then(function (j) { cache[key] = j; go(j); }, function () { out.innerHTML = '<p>Not found. The list holds surnames that at least 100 people had in 2010.</p>'; });
  }
  f.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { show(f.value); }, 200); });
})();
