/* namein: the tool. Needs engine.js (window.NameIn) and /data/names.json. */
(function () {
  'use strict';
  var d = document, SYG = window.SYG, root = d.querySelector('[data-namein]');
  if (!root || !window.NameIn) return;
  var meta = JSON.parse(root.getAttribute('data-scripts'));
  var input = root.querySelector('input[type=text]'), list = root.querySelector('[data-cards]');
  var tm = null;
  var cards = {};
  meta.forEach(function (m) {
    var li = d.createElement('li');
    li.className = 'oc'; li.setAttribute('data-s', m.id);
    li.innerHTML = '<div class="oh"><b>' + SYG.esc(m.name) + '</b><span class="on" lang="' + m.lang + '"' + (m.rtl ? ' dir="rtl"' : '') + '>' + SYG.esc(m.native) + '</span></div>' +
      '<p class="out" data-s="' + m.id + '" lang="' + m.lang + '"' + (m.rtl ? ' dir="rtl"' : '') + '></p>' +
      '<div class="ob"><button type="button" data-act="copy">Copy</button><button type="button" data-act="pic">Save picture</button><button type="button" data-act="wa">WhatsApp</button><a href="/namein/script/' + m.id + '/">About this script</a></div>';
    list.appendChild(li); cards[m.id] = li;
  });
  function run() {
    var name = input.value.trim();
    meta.forEach(function (m) {
      var o = cards[m.id].querySelector('.out');
      var t = name ? NameIn.convert(name, m.id) : '';
      o.textContent = t || (name ? '' : 'Type a name above');
      o.classList.toggle('empty', !t);
      cards[m.id].hidden = false;
    });
    root.querySelector('[data-note]').hidden = !name;
    try { var u = new URL(location.href); if (name) u.searchParams.set('n', name); else u.searchParams.delete('n'); history.replaceState(null, '', u.toString()); } catch (e) { /* ignore */ }
  }
  input.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(run, 120); });
  root.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); run(); });
  d.querySelectorAll('[data-try]').forEach(function (b) { b.addEventListener('click', function () { input.value = b.getAttribute('data-try'); run(); input.focus(); }); });

  function picture(m, text, name) {
    var W = 1080, H = 1080, c = d.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'), fam = '"' + m.font + '", "Noto Sans", sans-serif';
    function draw() {
      var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b1d17'); g.addColorStop(1, '#0f3d2e');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = '#25D366'; x.fillRect(0, 0, W, 14);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = m.rtl ? 'rtl' : 'ltr';
      x.fillStyle = '#9fb7ad'; x.font = '600 40px Inter, sans-serif'; x.direction = 'ltr';
      x.fillText('My name in ' + m.name, W / 2, 150);
      var size = 220; x.fillStyle = '#ffffff'; x.direction = m.rtl ? 'rtl' : 'ltr';
      do { x.font = '600 ' + size + 'px ' + fam; size -= 8; } while (x.measureText(text).width > W - 140 && size > 40);
      x.fillText(text, W / 2, H / 2 + 10);
      x.direction = 'ltr'; x.fillStyle = '#9fb7ad'; x.font = '500 38px Inter, sans-serif';
      x.fillText(name, W / 2, H - 230);
      x.fillStyle = '#25D366'; x.font = '600 34px Inter, sans-serif';
      x.fillText('words.shareyourgroup.com/namein', W / 2, H - 100);
      x.fillStyle = '#6f8a7f'; x.font = '400 26px Inter, sans-serif';
      x.fillText('Written by sound, approximate', W / 2, H - 55);
      c.toBlob(function (b) {
        var a = d.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'my-name-' + m.id + '.png';
        d.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      }, 'image/png');
    }
    var load = d.fonts && d.fonts.load ? d.fonts.load('600 60px "' + m.font + '"', text) : Promise.resolve();
    Promise.race([load, new Promise(function (r) { setTimeout(r, 2500); })]).then(draw, draw);
  }
  list.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var li = b.closest('li'), id = li.getAttribute('data-s'), m = meta.filter(function (x) { return x.id === id; })[0];
    var t = li.querySelector('.out').textContent, name = input.value.trim();
    if (!name || li.querySelector('.out').classList.contains('empty')) { SYG.toast('Type a name first'); return; }
    var a = b.getAttribute('data-act');
    if (a === 'copy') SYG.copy(t, 'Copied');
    else if (a === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent('My name in ' + m.name + ': ' + t + '\nhttps://words.shareyourgroup.com/namein/'), '_blank', 'noopener');
    else picture(m, t, name);
  });
  var q = new URLSearchParams(location.search).get('n');
  if (q) input.value = q;
  SYG.json('/namein/data/names.json').then(function (n) { NameIn.setNames(n); run(); }, run);
})();
