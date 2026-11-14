/* groupnames: generator, filter, copy */
(function () {
  'use strict';
  var d = document, SYG = window.SYG;
  var f = d.querySelector('[data-filter]');
  if (f) {
    var items = d.querySelectorAll('[data-item]'), none = d.querySelector('[data-none]');
    f.addEventListener('input', function () {
      var w = f.value.toLowerCase().split(/\s+/).filter(Boolean), n = 0;
      items.forEach(function (x) { var t = x.textContent.toLowerCase(), ok = w.every(function (y) { return t.indexOf(y) > -1; }); x.hidden = !ok; if (ok) n++; });
      if (none) none.hidden = n > 0;
    });
  }
  var g = d.querySelector('[data-gen]');
  if (g) {
    var data = null, sel = g.querySelector('select'), out = g.querySelector('.big');
    var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
    var run = function () {
      var t = data[sel.value]; if (!t) return;
      var r = Math.random(), name = r < 0.5 ? pick(t.names) : pick(t.a) + ' ' + pick(t.b);
      out.textContent = name;
      g.setAttribute('data-name', name);
    };
    SYG.json('/groupnames/data/themes.json').then(function (j) { data = j; run(); });
    g.querySelector('[data-next]').addEventListener('click', function () { if (data) run(); });
    sel.addEventListener('change', function () { if (data) run(); });
    g.querySelector('[data-copy-it]').addEventListener('click', function () { SYG.copy(g.getAttribute('data-name') || '', 'Copied'); });
    g.querySelector('[data-wa-it]').addEventListener('click', function () { window.open('https://wa.me/?text=' + encodeURIComponent('Group name idea: ' + (g.getAttribute('data-name') || '')), '_blank', 'noopener'); });
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c],[data-w]'); if (!b) return;
    var t = b.closest('li').querySelector('b').textContent;
    if (b.hasAttribute('data-c')) SYG.copy(t, 'Copied'); else window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener');
  });
})();
