/* names: filter and home search */
(function () {
  'use strict';
  var d = document, SYG = window.SYG;
  var f = d.querySelector('[data-filter]');
  if (f && !d.querySelector('[data-search-all]')) {
    var items = d.querySelectorAll('[data-item]'), none = d.querySelector('[data-none]');
    f.addEventListener('input', function () {
      var w = f.value.toLowerCase().split(/\s+/).filter(Boolean), n = 0;
      items.forEach(function (x) { var t = x.textContent.toLowerCase(), ok = w.every(function (y) { return t.indexOf(y) > -1; }); x.hidden = !ok; if (ok) n++; });
      if (none) none.hidden = n > 0;
    });
  }
  var box = d.querySelector('[data-search-all]');
  if (box) {
    var out = d.querySelector('[data-results]'), data = null, tm;
    var run = function () {
      var w = f.value.toLowerCase().split(/\s+/).filter(Boolean);
      if (!w.length) { out.innerHTML = ''; return; }
      var hits = [];
      Object.keys(data).forEach(function (k) {
        data[k].rows.forEach(function (r) {
          var t = (r.n + ' ' + r.r + ' ' + r.m.join(' ') + ' ' + r.p.join(' ')).toLowerCase();
          if (w.every(function (y) { return t.indexOf(y) > -1; })) hits.push([k, data[k], r]);
        });
      });
      out.innerHTML = hits.slice(0, 60).map(function (h) {
        var r = h[2];
        return '<li><div class="nm"><b>' + SYG.esc(r.r) + '</b><span lang="' + h[1].lang + '">' + SYG.esc(r.n) + '</span></div><p>' + SYG.esc(r.m.concat(r.p).slice(0, 2).join('; ')) + '</p><p class="of">' + SYG.esc(h[1].name) + (r.f ? ' · from ' + SYG.esc(r.f) : '') + '</p></li>';
      }).join('') || '<li><p>Nothing found. Try another word or spelling.</p></li>';
    };
    f.addEventListener('input', function () {
      clearTimeout(tm);
      tm = setTimeout(function () { if (data) run(); else SYG.json('/names/data/names.json').then(function (j) { data = j; run(); }); }, 150);
    });
  }
})();
