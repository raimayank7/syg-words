/* rhymes: finder */
(function () {
  'use strict';
  var d = document, SYG = window.SYG, D = null;
  var form = d.querySelector('[data-form]'), inp = d.querySelector('[data-in]'), out = d.querySelector('[data-out]');
  if (!form) return;
  function lists(ws, cap) {
    var by = { 1: [], 2: [], 3: [] }, h = '', names = { 1: 'One syllable', 2: 'Two syllables', 3: 'Three or more syllables' };
    ws.forEach(function (r) { by[Math.min(r[3], 3)].push(r[0]); });
    [1, 2, 3].forEach(function (n) {
      if (!by[n].length) return;
      h += '<h3>' + names[n] + '</h3><ul class="wl">' + by[n].slice(0, cap).map(function (w) { return '<li>' + SYG.esc(w) + '</li>'; }).join('') + '</ul>' + (by[n].length > cap ? '<p class="more">and ' + (by[n].length - cap) + ' more words</p>' : '');
    });
    return h;
  }
  function find(q) {
    q = q.toLowerCase().replace(/[^a-z]/g, '');
    if (!q) { out.innerHTML = '<p>Type a word and press Find rhymes.</p>'; return; }
    var me = null;
    for (var i = 0; i < D.w.length; i++) if (D.w[i][0] === q) { me = D.w[i]; break; }
    var h;
    if (me) {
      var pf = D.w.filter(function (r) { return r[1] === me[1] && r[2] !== me[2] && r[0] !== q; });
      var nr = D.w.filter(function (r) { return r[4] === me[4] && r[1] !== me[1] && r[2] !== me[2] && r[0] !== q; });
      h = '<h2>Perfect rhymes for ' + SYG.esc(q) + ' (' + pf.length + ')</h2>' + (pf.length ? lists(pf, 120) : '<p>No perfect rhyme in our list.</p>') +
          '<h2>Near rhymes (' + nr.length + ')</h2>' + (nr.length ? lists(nr, 60) : '<p>No near rhyme in our list.</p>');
    } else {
      var e = q.slice(-3), g = D.w.filter(function (r) { return r[0] !== q && r[0].slice(-3) === e; });
      h = '<p class="note">"' + SYG.esc(q) + '" is not in our list of common words, so we cannot tell how it sounds. Here are words that end with the same letters ("' + SYG.esc(e) + '"); they may or may not rhyme, because spelling and sound differ.</p>' + (g.length ? lists(g, 80) : '<p>No word ends the same way.</p>');
    }
    out.innerHTML = h;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var word = inp.value.toLowerCase().replace(/[^a-z]/g, '');
    if (!out) { if (word) location.href = '/rhymes/rhymes-with/' + word + '/'; return; }
    if (D) find(inp.value); else SYG.json('/rhymes/data/words.json').then(function (j) { D = j; find(inp.value); });
  });
  var q = new URLSearchParams(location.search).get('q');
  if (q && out) { inp.value = q; SYG.json('/rhymes/data/words.json').then(function (j) { D = j; find(q); }); }
})();
