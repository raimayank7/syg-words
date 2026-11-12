/* idioms: filter on a page, search on the home page (one small data file), practice quiz */
(function () {
  'use strict';
  var d = document, SYG = window.SYG;
  function norm(s) { return String(s).toLowerCase().replace(/[़ँं]/g, '').replace(/['’]/g, ''); }

  /* filter the entries of a theme page */
  var f = d.querySelector('[data-filter]');
  if (f) {
    var items = d.querySelectorAll('.idl > li'), none = d.querySelector('[data-none]');
    f.addEventListener('input', function () {
      var w = norm(f.value).split(/\s+/).filter(Boolean), n = 0;
      items.forEach(function (li) { var t = norm(li.textContent), ok = w.every(function (x) { return t.indexOf(x) > -1; }); li.hidden = !ok; if (ok) n++; });
      if (none) none.hidden = n > 0;
    });
  }

  var all = null;
  function load() { return all ? Promise.resolve(all) : SYG.json('/idioms/data/all.json').then(function (j) { all = j; return j; }); }

  /* home search: idiom, muhavara, roman reading or meaning */
  var q = d.querySelector('[data-search]');
  if (q) {
    var box = d.querySelector('[data-results]'), t;
    q.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var w = norm(q.value).split(/\s+/).filter(Boolean);
        if (!w.length) { box.innerHTML = ''; return; }
        load().then(function (j) {
          var hit = j.filter(function (r) { var s = norm(r.join(' ')); return w.every(function (x) { return s.indexOf(x) > -1; }); }).slice(0, 25);
          box.innerHTML = hit.length ? hit.map(function (r) {
            return '<li><a href="' + r[3] + '"><b' + (r[4] ? ' lang="hi"' : '') + '>' + SYG.esc(r[0]) + '</b><small>' + SYG.esc(r[2]) + (r[1] ? ' · ' + SYG.esc(r[1]) : '') + '</small></a></li>';
          }).join('') : '<li class="hint">Nothing matches. Try one word, such as "eye", "आँख" or "paani".</li>';
        });
      }, 120);
    });
  }

  /* practice quiz: meaning of an idiom, four choices */
  var z = d.querySelector('[data-quiz]');
  if (z) {
    var set = 'en', pool = [], cur, score = 0, asked = 0;
    var elQ = z.querySelector('.q'), elO = z.querySelector('.opts'), elS = z.querySelector('.sc'), elN = z.querySelector('[data-next]'), elX = z.querySelector('.ex');
    function pick() {
      load().then(function (j) {
        pool = j.filter(function (r) { return set === 'hi' ? r[4] === 1 : !r[4]; });
        cur = pool[Math.floor(Math.random() * pool.length)];
        var opts = [cur];
        while (opts.length < 4) { var o = pool[Math.floor(Math.random() * pool.length)]; if (opts.every(function (x) { return x[2] !== o[2]; })) opts.push(o); }
        opts.sort(function () { return Math.random() - 0.5; });
        elQ.textContent = cur[0]; elQ.lang = set === 'hi' ? 'hi' : 'en';
        elX.hidden = true; elN.hidden = true;
        elO.innerHTML = opts.map(function (o) { return '<button type="button"' + (set === 'hi' ? ' lang="hi"' : '') + ' data-a="' + (o === cur ? 1 : 0) + '">' + SYG.esc(o[2]) + '</button>'; }).join('');
      });
    }
    elO.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || elO.getAttribute('data-done')) return;
      elO.setAttribute('data-done', '1'); asked++;
      if (b.getAttribute('data-a') === '1') { score++; b.className = 'ok'; } else { b.className = 'no'; elO.querySelector('[data-a="1"]').className = 'ok'; }
      elS.textContent = 'Score: ' + score + ' of ' + asked;
      elX.innerHTML = 'See it with a sentence: <a href="' + cur[3] + '">' + SYG.esc(cur[0]) + '</a>'; elX.hidden = false; elN.hidden = false; elN.focus();
    });
    elN.addEventListener('click', function () { elO.removeAttribute('data-done'); pick(); });
    z.querySelectorAll('[data-set]').forEach(function (b) {
      b.addEventListener('click', function () {
        set = b.getAttribute('data-set'); score = asked = 0; elS.textContent = 'Score: 0 of 0';
        z.querySelectorAll('[data-set]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        elO.removeAttribute('data-done'); pick();
      });
    });
    pick();
  }
})();
