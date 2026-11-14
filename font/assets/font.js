/* font: live converter, copy, WhatsApp */
(function () {
  'use strict';
  var d = document, SYG = window.SYG, data = null;
  function conv(s, st) {
    var out = '', i, c, ch = Array.from(s);
    if (st.t === 'map') { for (i = 0; i < ch.length; i++) { c = ch[i]; out += st.m.hasOwnProperty(c) ? st.m[c] : c; } return out; }
    if (st.t === 'comb') { for (i = 0; i < ch.length; i++) { c = ch[i]; out += /\s/.test(c) ? c : c + st.c; } return out; }
    if (st.t === 'flip') { for (i = ch.length - 1; i >= 0; i--) { c = ch[i].toLowerCase(); out += st.m.hasOwnProperty(c) ? st.m[c] : ch[i]; } return out; }
    return s;
  }
  var inp = d.querySelector('[data-in]'); if (!inp) return;
  var list = d.querySelector('[data-styles]');
  function render() {
    var v = inp.value || inp.placeholder;
    list.querySelectorAll('li[data-s]').forEach(function (li) {
      var st = data[li.getAttribute('data-s')]; if (!st) return;
      li.querySelector('output').textContent = conv(v, st);
    });
  }
  SYG.json('/font/data/styles.json').then(function (j) { data = j; render(); });
  inp.addEventListener('input', function () { if (data) render(); });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c],[data-w]'); if (!b) return;
    var t = b.closest('li').querySelector('output').textContent;
    if (b.hasAttribute('data-c')) SYG.copy(t, 'Copied'); else window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener');
  });
})();
