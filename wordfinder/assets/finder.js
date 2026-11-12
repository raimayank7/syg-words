/* wordfinder.shareyourgroup.com: word finder, anagram solver, pattern finder and word checker. The word list (SCOWL, sizes 10 to 70)
   is fetched from /data/ on the first search and everything runs in the browser. Also filters the static list pages. */
(function () {
  'use strict';
  var d = document, SYG = window.SYG || {}, cache = {};
  function $(s, r) { return (r || d).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clean(s, extra) { return (s || '').toLowerCase().replace(new RegExp('[^a-z' + (extra || '') + ']', 'g'), ''); }

  /* words: [{w, t}] where t = 0 common, 1 less common, 2 rare */
  function load(name) {
    if (!cache[name]) cache[name] = fetch('/wordfinder/data/' + name + '.txt').then(function (r) { if (!r.ok) throw new Error('load'); return r.text(); }).then(function (txt) {
      var out = []; txt.split('\n\n').forEach(function (blk, t) { blk.split('\n').forEach(function (w) { if (w) out.push({ w: w, t: t }); }); }); return out;
    });
    return cache[name];
  }
  function words(maxLen) { return maxLen > 8 ? Promise.all([load('short'), load('long')]).then(function (a) { return a[0].concat(a[1]); }) : load('short'); }

  function canMake(word, counts, blanks) {
    var c = counts.slice(), b = blanks;
    for (var i = 0; i < word.length; i++) { var k = word.charCodeAt(i) - 97; if (c[k] > 0) c[k]--; else if (b > 0) b--; else return false; }
    return true;
  }
  function countsOf(letters) { var c = new Array(26).fill(0), b = 0; for (var i = 0; i < letters.length; i++) { if (letters[i] === '?') b++; else c[letters.charCodeAt(i) - 97]++; } return { c: c, b: b }; }

  var LABEL = ['', ' less common', ' rare'];
  function render(box, list, opts) {
    opts = opts || {};
    if (!list.length) { box.innerHTML = '<p class="note">' + (opts.none || 'No words found. Check the letters, or try fewer filters.') + '</p>'; return; }
    var by = {}, lens = [];
    list.forEach(function (x) { (by[x.w.length] = by[x.w.length] || []).push(x); });
    lens = Object.keys(by).map(Number).sort(function (a, b) { return b - a; });
    var h = '<p class="wf-sum"><b>' + list.length + ' word' + (list.length > 1 ? 's' : '') + '</b>' + (opts.sum ? ' ' + opts.sum : '') + ' <button class="btn sm ghost" type="button" data-copy="' + esc(list.map(function (x) { return x.w; }).join(', ')) + '" data-done="Words copied">Copy all</button></p>' +
      '<p class="hint wf-key"><b>bold</b> = everyday word · plain = less common · <i>italic</i> = rare or technical</p>';
    lens.forEach(function (n) {
      var g = by[n].sort(function (a, b) { return a.t - b.t || (a.w < b.w ? -1 : 1); }), cap = 240;
      h += '<section class="wf-g"><h3>' + n + ' letters <small>' + g.length + '</small></h3><p class="wf-words">' + g.slice(0, cap).map(function (x) { return '<span class="t' + x.t + '">' + x.w + '</span>'; }).join(' ') +
        (g.length > cap ? ' <button class="btn sm ghost" type="button" data-more="' + n + '">Show all ' + g.length + '</button>' : '') + '</p></section>';
    });
    box.innerHTML = h;
    box.onclick = function (e) {
      var b = e.target.closest('[data-more]'); if (!b) return;
      var n = +b.getAttribute('data-more'); b.parentNode.innerHTML = by[n].map(function (x) { return '<span class="t' + x.t + '">' + x.w + '</span>'; }).join(' ');
    };
  }
  function busy(box) { box.hidden = false; box.innerHTML = '<p class="hint">Searching the word list...</p>'; }
  function fail(box) { box.innerHTML = '<p class="note">The word list could not be loaded. Check your connection and try again.</p>'; }

  function tool(root) {
    var mode = root.getAttribute('data-wf'), q = $('.wf-q', root), out = $('.wf-out', root), form = $('form', root);
    function val(cls) { var e = $(cls, root); return e ? e.value : ''; }
    function run() {
      var common = $('.wf-common', root) && $('.wf-common', root).checked, keep = function (x) { return !common || x.t === 0; };
      if (mode === 'make' || mode === 'anagram') {
        var letters = clean(q.value, '?').slice(0, 15); q.value = letters;
        if (letters.length < 2) { out.hidden = false; out.innerHTML = '<p class="note">Type at least two letters. Use ? for a blank that can be any letter.</p>'; return; }
        var k = countsOf(letters), st = clean(val('.wf-starts')), en = clean(val('.wf-ends')), co = clean(val('.wf-has')), len = +val('.wf-len') || 0;
        busy(out);
        words(letters.length).then(function (W) {
          var res = W.filter(function (x) {
            var w = x.w;
            if (w.length > letters.length || (mode === 'anagram' && w.length !== letters.length) || (len && w.length !== len)) return false;
            if (st && w.indexOf(st) !== 0 || en && w.slice(-en.length) !== en || co && w.indexOf(co) < 0) return false;
            return keep(x) && canMake(w, k.c, k.b);
          });
          if (mode === 'anagram') res = res.filter(function (x) { return x.w !== letters; });
          render(out, res, { sum: mode === 'anagram' ? 'that use all ' + letters.length + ' letters of "' + esc(letters) + '"' : 'from "' + esc(letters) + '"',
            none: mode === 'anagram' ? 'No other word in our list uses exactly these letters. Try the <a href="/wordfinder/#q=' + esc(letters) + '">word finder</a> for shorter words made from them.' : null });
          try { history.replaceState(null, '', '#q=' + letters); } catch (e) { }
        }).catch(function () { fail(out); });
      } else if (mode === 'pattern') {
        var p = (q.value || '').toLowerCase().replace(/[ _.*-]/g, '?').replace(/[^a-z?]/g, '').slice(0, 15), not = clean(val('.wf-not')), has = clean(val('.wf-has'));
        q.value = p;
        if (p.length < 2 || p.indexOf('?') < 0 && p.length < 2) { out.hidden = false; out.innerHTML = '<p class="note">Type the letters you know and a ? for each letter you do not, for example c?n?le.</p>'; return; }
        var re = new RegExp('^' + p.replace(/\?/g, not ? '[^' + not + ']' : '[a-z]') + '$');
        busy(out);
        words(p.length).then(function (W) {
          render(out, W.filter(function (x) { if (x.w.length !== p.length || !re.test(x.w) || !keep(x)) return false; for (var i = 0; i < has.length; i++) if (x.w.indexOf(has[i]) < 0) return false; return true; }), { sum: 'fit ' + esc(p) });
          try { history.replaceState(null, '', '#q=' + p); } catch (e) { }
        }).catch(function () { fail(out); });
      } else if (mode === 'check') {
        var w = clean(q.value).slice(0, 15); q.value = w;
        if (w.length < 2) { out.hidden = false; out.innerHTML = '<p class="note">Type a word of 2 to 15 letters.</p>'; return; }
        busy(out);
        words(w.length).then(function (W) {
          var hit = null, key = w.split('').sort().join(''), ana = [];
          W.forEach(function (x) { if (x.w === w) hit = x; else if (x.w.length === w.length && x.w.split('').sort().join('') === key) ana.push(x.w); });
          out.innerHTML = '<div class="result"><p class="big">' + esc(w) + '</p><p>' + (hit ? '<b class="ok">Yes.</b> "' + esc(w) + '" is in our word list, as ' + ['an everyday word', 'a less common word', 'a rare or technical word'][hit.t] + '.' :
            '<b class="no">Not found.</b> "' + esc(w) + '" is not in our word list. That does not prove it is not a word: the list leaves out names, abbreviations, very rare words and words with capitals, hyphens or apostrophes.') + '</p>' +
            (ana.length ? '<p>Anagrams: ' + ana.map(esc).join(', ') + '</p>' : '<p>No other word in the list uses exactly the same letters.</p>') +
            '<p class="hint">' + w.length + ' letters. <a href="/wordfinder/#q=' + esc(w) + '">Find all words made from these letters</a></p></div>';
        }).catch(function () { fail(out); });
      }
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    var m = /^#q=([a-z?]{2,15})$/.exec(location.hash); if (m) { q.value = m[1]; run(); }
  }

  /* static list pages: filter box over .wl span items */
  function lists() {
    var box = $('#wl-q'); if (!box) return;
    var items = [].slice.call(d.querySelectorAll('.wl span, .wl li')), count = $('#wl-count'), secs = [].slice.call(d.querySelectorAll('.wl-sec'));
    box.addEventListener('input', function () {
      var v = clean(box.value), n = 0;
      items.forEach(function (s) { var on = !v || (s.getAttribute('data-w') || s.textContent).indexOf(v) > -1; s.hidden = !on; if (on) n++; });
      secs.forEach(function (s) { s.hidden = !s.querySelector('.wl span:not([hidden]), .wl li:not([hidden])'); });
      if (count) count.textContent = v ? n + ' match' + (n === 1 ? '' : 'es') : '';
    });
  }
  function init() { [].forEach.call(d.querySelectorAll('[data-wf]'), tool); lists(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
