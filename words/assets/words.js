/* words: the word finder (data files by first two letters, searched in the browser), word of the day, Listen, list filter */
(function () {
  'use strict';
  var d = document, SYG = window.SYG, cache = {}, POS = { n: 'Noun', v: 'Verb', a: 'Adjective', r: 'Adverb' };
  function shard(p) { return cache[p] ? Promise.resolve(cache[p]) : SYG.json('/words/data/d/' + p + '.json').then(function (j) { cache[p] = j; return j; }, function () { cache[p] = {}; return {}; }); }

  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-say]');
    if (b) {
      if (!window.speechSynthesis) { SYG.toast('This browser cannot read aloud'); return; }
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(b.getAttribute('data-say')), v = speechSynthesis.getVoices().filter(function (x) { return /^en/i.test(x.lang); });
      var best = v.filter(function (x) { return /IN/.test(x.lang); })[0] || v.filter(function (x) { return /GB/.test(x.lang); })[0] || v[0];
      if (best) { u.voice = best; u.lang = best.lang; } else u.lang = 'en-IN';
      u.rate = 0.85; speechSynthesis.speak(u);
    }
  });
  if (window.speechSynthesis) speechSynthesis.getVoices();

  var f = d.querySelector('[data-filter]');
  if (f) {
    var rows = d.querySelectorAll('.tbl tbody tr, .cw > li');
    f.addEventListener('input', function () {
      var w = f.value.toLowerCase().trim();
      rows.forEach(function (r) { r.hidden = w && r.textContent.toLowerCase().indexOf(w) < 0; });
    });
  }

  var q = d.querySelector('[data-find]');
  if (!q) return;
  var out = d.querySelector('[data-out]'), tm;
  function show(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length < 2) { out.innerHTML = ''; return; }
    shard(word.slice(0, 2)).then(function (j) {
      if (q.value.toLowerCase().replace(/[^a-z]/g, '') !== word) return;
      var e = j[word];
      if (!e) {
        var near = Object.keys(j).filter(function (k) { return k.indexOf(word) === 0; }).slice(0, 12);
        if (!near.length && word.length > 3) near = Object.keys(j).filter(function (k) { return k.indexOf(word.slice(0, 3)) === 0; }).slice(0, 12);
        out.innerHTML = '<div class="res"><p><b>' + SYG.esc(word) + '</b> is not in the word finder' + (near.length ? '. Did you mean:' : '. Check the spelling, or try the basic form of the word (for example "run", not "running").') + '</p>' +
          (near.length ? '<p class="sugg">' + near.map(function (k) { return '<button type="button" data-go="' + k + '">' + k + '</button>'; }).join('') + '</p>' : '') + '</div>';
        return;
      }
      var by = {}, order = [];
      e[0].forEach(function (s) { if (!by[s[0]]) { by[s[0]] = []; order.push(s[0]); } by[s[0]].push(s); });
      var h = '<div class="res"><h2>' + SYG.esc(word) + '</h2>' + (e[2] ? '<p lang="hi">' + SYG.esc(e[2]) + '</p>' : '');
      order.forEach(function (p) {
        h += '<h3>' + POS[p] + '</h3><ol>' + by[p].map(function (s) {
          return '<li>' + SYG.esc(s[1].charAt(0).toUpperCase() + s[1].slice(1)) + '.' + (s[3] ? '<p class="ex">&ldquo;' + SYG.esc(s[3]) + '&rdquo;</p>' : '') +
            (s[2].length ? '<p class="syn">' + s[2].map(function (w) { return /^[a-z]+$/.test(w) ? '<button type="button" data-go="' + w + '">' + w + '</button>' : SYG.esc(w); }).join(' ') + '</p>' : '') + '</li>';
        }).join('') + '</ol>';
      });
      h += '<div class="acts"><button class="btn sm" type="button" data-say="' + SYG.esc(word) + '">Listen</button>' + (e[1] ? '<a class="btn sm ghost" href="/words/word/' + word + '/">Full page: opposites, phrases, word family</a>' : '') + '</div>' +
        '<p class="hint">Definitions and examples: WordNet 3.0. See About.</p></div>';
      out.innerHTML = h;
    });
  }
  q.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { show(q.value); }, 150); });
  out.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) { q.value = b.getAttribute('data-go'); show(q.value); q.scrollIntoView({ block: 'center' }); } });
  var m = /[?&]q=([a-z]+)/i.exec(location.search); if (m) { q.value = m[1]; show(m[1]); }

  /* word of the day: the same word for everyone on a given date, taken from the list of word pages */
  var box = d.querySelector('[data-wotd]');
  if (box) SYG.json('/words/data/pages.json').then(function (list) {
    var day = Math.floor(Date.now() / 864e5), w = list[(day * 7919) % list.length];
    return shard(w.slice(0, 2)).then(function (j) {
      if (!j[w]) return;
      var a = box.querySelector('[data-wotd-link]'); a.textContent = w; a.href = '/words/word/' + w + '/';
      var s = j[w][0][0][1];
      box.querySelector('[data-wotd-def]').textContent = s.charAt(0).toUpperCase() + s.slice(1) + '.' + (j[w][2] ? '  ' + j[w][2] : '');
      box.hidden = false;
    });
  }).catch(function () {});
})();
