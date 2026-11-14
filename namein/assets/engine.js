/* namein engine: writes a Latin-letter name in other scripts by sound. Rule based, approximate. Used by the page and by build.py (through node). */
(function (root) {
  'use strict';
  var NAMES = {};

  /* ---------- helpers ---------- */
  function words(s) { return String(s || '').toLowerCase().replace(/[^a-z' -]/g, '').replace(/'/g, '').split(/[\s-]+/).filter(Boolean); }
  function tokenize(w, table, singles) {
    var out = [], i = 0, keys = table;
    while (i < w.length) {
      var hit = null;
      for (var k = 0; k < keys.length; k++) { if (w.substr(i, keys[k][0].length) === keys[k][0]) { hit = keys[k]; break; } }
      if (hit) { out.push(hit); i += hit[0].length; } else { out.push([w[i], 'x']); i++; }
    }
    return out;
  }
  var VOW = 'aeiou';
  function isV(c) { return VOW.indexOf(c) > -1; }

  /* ---------- Indic (Devanagari core, other Indic blocks by code offset) ---------- */
  var DC = [['ksh', 'क्ष'], ['chh', 'छ'], ['shh', 'श'], ['gy', 'ज्ञ'], ['ch', 'च'], ['kh', 'ख'], ['gh', 'घ'], ['jh', 'झ'], ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'],
    ['k', 'क'], ['g', 'ग'], ['c', 'क'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'], ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'],
    ['s', 'स'], ['h', 'ह'], ['f', 'फ़'], ['z', 'ज़'], ['q', 'क'], ['x', 'क्स']];
  var DV = [['aa', 'आ', 'ा'], ['ai', 'ऐ', 'ै'], ['au', 'औ', 'ौ'], ['ee', 'ई', 'ी'], ['ii', 'ई', 'ी'], ['oo', 'ऊ', 'ू'], ['uu', 'ऊ', 'ू'],
    ['a', 'अ', ''], ['e', 'ए', 'े'], ['i', 'इ', 'ि'], ['o', 'ओ', 'ो'], ['u', 'उ', 'ु']];
  var STOPS = 'k kh g gh ch chh j jh t th d dh p ph b bh'.split(' ');
  var DEVTOK = DV.concat(DC).sort(function (a, b) { return b[0].length - a[0].length; });

  function devanagari(w) {
    w = w.replace(/ia$/, 'iyaa').replace(/([^aeiou])a$/, '$1aa');
    var tk = [], i = 0;
    while (i < w.length) {
      var hit = null;
      for (var k = 0; k < DEVTOK.length; k++) { if (w.substr(i, DEVTOK[k][0].length) === DEVTOK[k][0]) { hit = DEVTOK[k]; break; } }
      if (!hit) { i++; continue; }
      i += hit[0].length;
      var isVow = hit.length === 3;
      tk.push({ k: isVow ? 'V' : 'C', r: hit[0], d: hit[1], m: hit[2] });
    }
    var out = '', prevC = false;
    for (var j = 0; j < tk.length; j++) {
      var t = tk[j];
      if (t.k === 'C') {
        var nx = tk[j + 1], pv = tk[j - 1];
        if ((t.r === 'n' || t.r === 'm') && pv && pv.k === 'V' && nx && nx.k === 'C' && STOPS.indexOf(nx.r) > -1) { out += 'ं'; prevC = false; continue; }
        if (prevC) out += '्';
        out += t.d; prevC = true;
      } else {
        if (prevC) out += t.m; else out += t.d;
        prevC = false;
      }
    }
    return out;
  }
  var INDIC = { deva: 0, bengali: 0x80, gurmukhi: 0x100, gujarati: 0x180, telugu: 0x300, kannada: 0x380, malayalam: 0x400 };
  function indic(deva, script, keepBare) {
    var off = INDIC[script], out = '';
    for (var i = 0; i < deva.length; i++) {
      var c = deva.charCodeAt(i);
      if (off === 0 || c < 0x0900 || c > 0x097F) { out += deva[i]; continue; }
      if (c === 0x093C && (script === 'malayalam')) continue;
      if (script === 'bengali' && c === 0x0935) { out += 'ব'; continue; }
      if (script === 'bengali' && c === 0x092F) { out += 'য়'; continue; }
      if (script === 'gurmukhi' && c === 0x0902) { out += 'ੰ'; continue; }
      out += String.fromCharCode(c + off);
    }
    if (!keepBare && (script === 'telugu' || script === 'kannada' || script === 'malayalam')) {
      var last = out.charCodeAt(out.length - 1) - off;
      if (last >= 0x0915 && last <= 0x0939) out += String.fromCharCode(0x094D + off);
    }
    return out;
  }
  function viaDeva(script) {
    return function (w) {
      var d = NAMES[w] || devanagari(w);
      return indic(d, script, !!NAMES[w] && /a$/.test(w));
    };
  }

  /* ---------- Cyrillic ---------- */
  var CY = [['shch', 'щ'], ['sh', 'ш'], ['ch', 'ч'], ['zh', 'ж'], ['kh', 'х'], ['ts', 'ц'], ['ph', 'ф'], ['th', 'т'], ['yu', 'ю'], ['ya', 'я'], ['yo', 'ё'], ['ye', 'е'],
    ['aa', 'а'], ['ee', 'и'], ['ii', 'и'], ['oo', 'у'], ['uu', 'у'], ['a', 'а'], ['b', 'б'], ['c', 'к'], ['d', 'д'], ['e', 'е'], ['f', 'ф'], ['g', 'г'], ['h', 'х'], ['i', 'и'], ['j', 'дж'], ['k', 'к'],
    ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['q', 'к'], ['r', 'р'], ['s', 'с'], ['t', 'т'], ['u', 'у'], ['v', 'в'], ['w', 'в'], ['x', 'кс'], ['y', 'й'], ['z', 'з']];
  function cyrillic(w) {
    w = w.replace(/c([eiy])/g, 's$1');
    var tk = tokenize(w, CY), out = '';
    for (var i = 0; i < tk.length; i++) out += tk[i][1] === 'x' ? '' : tk[i][1];
    out = out.replace(/йа/g, 'я').replace(/йу/g, 'ю');
    return out;
  }

  /* ---------- Greek ---------- */
  var GR = [['th', 'θ'], ['ph', 'φ'], ['sh', 'σ'], ['ch', 'τσ'], ['kh', 'χ'], ['ps', 'ψ'], ['ng', 'γγ'], ['aa', 'α'], ['ee', 'ι'], ['ii', 'ι'], ['oo', 'ου'], ['uu', 'ου'], ['a', 'α'], ['b', 'β'], ['c', 'κ'], ['d', 'δ'], ['e', 'ε'],
    ['f', 'φ'], ['g', 'γ'], ['h', 'χ'], ['i', 'ι'], ['j', 'τζ'], ['k', 'κ'], ['l', 'λ'], ['m', 'μ'], ['n', 'ν'], ['o', 'ο'], ['p', 'π'], ['q', 'κ'], ['r', 'ρ'], ['s', 'σ'], ['t', 'τ'], ['u', 'ου'],
    ['v', 'β'], ['w', 'ου'], ['x', 'ξ'], ['y', 'υ'], ['Y', 'γι'], ['z', 'ζ']];
  function greek(w) {
    w = w.replace(/y(?=[aeiou])/g, 'Y');
    var tk = tokenize(w, GR), out = '';
    for (var i = 0; i < tk.length; i++) out += tk[i][1] === 'x' ? '' : tk[i][1];
    return out.replace(/σ$/, 'ς');
  }

  /* ---------- Japanese ---------- */
  var KROWS = { '': 'アイウエオ', k: 'カキクケコ', g: 'ガギグゲゴ', s: 'サシスセソ', z: 'ザジズゼゾ', t: 'タティトゥテト', d: 'ダディドゥデド', n: 'ナニヌネノ', h: 'ハヒフヘホ', b: 'バビブベボ', p: 'パピプペポ',
    m: 'マミムメモ', r: 'ラリルレロ', f: 'ファフィフフェフォ', v: 'ヴァヴィヴヴェヴォ', j: 'ジャジジュジェジョ', sh: 'シャシシュシェショ', ch: 'チャチチュチェチョ', w: 'ワウィウウェウォ', ts: 'ツァツィツツェツォ' };
  var KY = { k: 'キャキュキョ', g: 'ギャギュギョ', n: 'ニャニュニョ', h: 'ヒャヒュヒョ', b: 'ビャビュビョ', p: 'ピャピュピョ', m: 'ミャミュミョ', r: 'リャリュリョ' };
  var VOWI = { a: 0, i: 1, u: 2, e: 3, o: 4 };
  function kana(row, v) {
    var s = KROWS[row];
    if (row === 'f' || row === 'v' || row === 'w' || row === 'ts' || row === 'j' || row === 'sh' || row === 'ch') {
      var seq = { f: ['ファ', 'フィ', 'フ', 'フェ', 'フォ'], v: ['ヴァ', 'ヴィ', 'ヴ', 'ヴェ', 'ヴォ'], w: ['ワ', 'ウィ', 'ウ', 'ウェ', 'ウォ'], ts: ['ツァ', 'ツィ', 'ツ', 'ツェ', 'ツォ'],
        j: ['ジャ', 'ジ', 'ジュ', 'ジェ', 'ジョ'], sh: ['シャ', 'シ', 'シュ', 'シェ', 'ショ'], ch: ['チャ', 'チ', 'チュ', 'チェ', 'チョ'] }[row];
      if (row === 'j' || row === 'sh' || row === 'ch') return seq[{ a: 0, i: 1, u: 2, e: 3, o: 4 }[v]];
      return seq[VOWI[v]];
    }
    return s[VOWI[v]];
  }
  var TD = { t: ['タ', 'ティ', 'トゥ', 'テ', 'ト'], d: ['ダ', 'ディ', 'ドゥ', 'デ', 'ド'] };
  var JT = [['ts', 'ts'], ['sh', 'sh'], ['ch', 'ch'], ['kh', 'k'], ['gh', 'g'], ['dh', 'd'], ['th', 't'], ['bh', 'b'], ['jh', 'j'], ['ph', 'f'], ['ng', 'ng']];
  function katakana(w) {
    w = w.replace(/mm/g, 'm').replace(/c([eiy])/g, 's$1').replace(/c/g, 'k').replace(/q/g, 'k').replace(/l/g, 'r').replace(/x/g, 'ks').replace(/aa/g, 'a-').replace(/ee/g, 'i-').replace(/ii/g, 'i-').replace(/oo/g, 'o-').replace(/uu/g, 'u-');
    var out = '', i = 0;
    function vowelOf(ch) { return VOWI[ch] !== undefined ? ch : null; }
    while (i < w.length) {
      var ch = w[i];
      if (ch === '-') { out += 'ー'; i++; continue; }
      if (isV(ch)) { out += KROWS[''][VOWI[ch]]; i++; continue; }
      var cons = null;
      for (var k = 0; k < JT.length; k++) { if (w.substr(i, JT[k][0].length) === JT[k][0]) { cons = JT[k]; break; } }
      var len = cons ? cons[0].length : 1, row = cons ? cons[1] : ch;
      if (row === 'ng') { out += 'ン'; i += 2; if (w[i] && isV(w[i])) { out += KROWS.g[VOWI[w[i]]]; i++; } else if (i >= w.length || !isV(w[i])) { out += 'グ'; } continue; }
      if (w[i + len] === row && 'kgsztdbpmrfjh'.indexOf(row) > -1 && !cons) { out += 'ッ'; i++; continue; }
      var nx = w[i + len];
      if (row === 'y') { if (nx && isV(nx)) { var yv = { a: 'ヤ', u: 'ユ', o: 'ヨ', e: 'イェ', i: 'イ' }[nx]; out += yv; i += len + 1; } else { out += 'イ'; i += len; } continue; }
      if (row === 'n' || row === 'm') {
        if (nx && isV(nx)) { out += KROWS[row][VOWI[nx]]; i += len + 1; continue; }
        if (nx === 'y') { var ny = KY[row]; var after = w[i + len + 1]; if (after && 'aou'.indexOf(after) > -1) { out += ny[{ a: 0, u: 1, o: 2 }[after]]; i += len + 2; continue; } }
        if (row === 'n' || i + 1 >= w.length || 'bpm'.indexOf(nx) > -1) { out += row === 'n' ? 'ン' : (nx && 'bpm'.indexOf(nx) > -1 ? 'ン' : 'ム'); i += len; continue; }
        out += 'ム'; i += len; continue;
      }
      if (nx === 'y' && KY[row] && w[i + len + 1] && 'aou'.indexOf(w[i + len + 1]) > -1) { out += KY[row][{ a: 0, u: 1, o: 2 }[w[i + len + 1]]]; i += len + 2; continue; }
      if (nx && isV(nx)) {
        if (row === 't' || row === 'd') out += TD[row][VOWI[nx]]; else out += kana(row, nx) || KROWS[row][VOWI[nx]];
        i += len + 1; continue;
      }
      if (KROWS[row] || row === 'f' || row === 'v' || row === 'w' || row === 'ts' || row === 'j' || row === 'sh' || row === 'ch') {
        var fin = { t: 'ト', d: 'ド', ch: 'チ', sh: 'シュ', j: 'ジ', ts: 'ツ', s: 'ス', h: 'フ', f: 'フ', v: 'ヴ', w: 'ウ' }[row];
        out += fin || (row === 'z' ? 'ズ' : kana(row, 'u') || KROWS[row][2]);
        i += len; continue;
      }
      i++;
    }
    return out;
  }
  function hiragana(w) {
    return katakana(w).replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
  }

  /* ---------- Korean ---------- */
  var HI = { g: 0, n: 2, d: 3, r: 5, l: 5, m: 6, b: 7, s: 9, j: 12, ch: 14, k: 15, t: 16, p: 17, h: 18, f: 17, v: 7, z: 12 };
  var HV = { a: 0, e: 5, i: 20, o: 8, u: 13 };
  var HF = { n: 4, l: 8, r: 8, m: 16, ng: 21 };
  var HDEF = { g: 18 };
  function syl(i, v, f) { return String.fromCharCode(0xAC00 + (i * 21 + v) * 28 + (f || 0)); }
  function hangul(w) {
    w = w.replace(/c([eiy])/g, 's$1').replace(/c/g, 'k').replace(/q/g, 'k').replace(/aa/g, 'a').replace(/ee|ii/g, 'i').replace(/oo|uu/g, 'u').replace(/x/g, 'ks')
      .replace(/kh/g, 'k').replace(/gh/g, 'g').replace(/dh/g, 'd').replace(/bh/g, 'b').replace(/jh/g, 'j').replace(/ph/g, 'p').replace(/th/g, 't');
    var out = [], i = 0, n = w.length;
    function vow(at) {
      var c = w[at];
      if (c === 'y' && at + 1 < n && isV(w[at + 1])) { var m = { a: 2, e: 7, o: 12, u: 17, i: 20 }; return [m[w[at + 1]], 2]; }
      if (c === 'w' && at + 1 < n && isV(w[at + 1])) { var q = { a: 9, e: 15, i: 16, o: 14, u: 13 }; return [q[w[at + 1]], 2]; }
      if (isV(c)) return [HV[c], 1];
      return null;
    }
    while (i < n) {
      var c = w[i], v = vow(i);
      if (v) { out.push({ i: 11, v: v[0], f: 0 }); i += v[1]; continue; }
      var cons, len = 1;
      if (w.substr(i, 2) === 'sh') { cons = 's'; len = 2; var shv = w[i + 2]; var sm = { a: 2, e: 7, o: 12, u: 17, i: 20 }; if (shv && isV(shv)) { out.push({ i: 9, v: sm[shv], f: 0 }); i += 3; } else { out.push({ i: 9, v: 20, f: 0 }); i += 2; } continue; }
      if (w.substr(i, 2) === 'ch') { cons = 'ch'; len = 2; } else if (w.substr(i, 2) === 'ng' && !(w[i + 2] && isV(w[i + 2]))) { cons = 'ng'; len = 2; } else cons = c;
      var nv = w[i + len] ? vow(i + len) : null;
      if (cons === 'ng') { if (out.length && out[out.length - 1].f === 0) out[out.length - 1].f = 21; else out.push({ i: 11, v: 18, f: 21 }); i += 2; continue; }
      if (HI[cons] === undefined) { i += len; continue; }
      if (nv) {
        var ini = HI[cons];
        out.push({ i: ini, v: nv[0], f: 0 }); i += len + nv[1]; continue;
      }
      // consonant without a vowel
      if (HF[cons] !== undefined && out.length && out[out.length - 1].f === 0 && !(cons === 'r' && false)) { out[out.length - 1].f = HF[cons]; i += len; continue; }
      var dv = cons === 'ch' ? 20 : 18;
      out.push({ i: HI[cons], v: dv, f: 0 }); i += len;
    }
    return out.map(function (s) { return syl(s.i, s.v, s.f); }).join('');
  }

  /* ---------- Arabic and Urdu (consonant writing: short vowels are left out) ---------- */
  var AR = { b: 'ب', p: 'ب', t: 'ت', th: 'ث', j: 'ج', h: 'ه', kh: 'خ', d: 'د', dh: 'ذ', r: 'ر', z: 'ز', s: 'س', sh: 'ش', f: 'ف', v: 'ف', q: 'ق', k: 'ك', g: 'ج', l: 'ل', m: 'م', n: 'ن', w: 'و', y: 'ي', ch: 'تش', c: 'ك', x: 'كس' };
  var UR = { b: 'ب', p: 'پ', t: 'ت', th: 'تھ', j: 'ج', h: 'ہ', kh: 'کھ', d: 'د', dh: 'دھ', r: 'ر', z: 'ز', s: 'س', sh: 'ش', f: 'ف', v: 'و', q: 'ق', k: 'ک', g: 'گ', l: 'ل', m: 'م', n: 'ن', w: 'و', y: 'ی', ch: 'چ', c: 'ک', x: 'کس', gh: 'گھ', bh: 'بھ', ph: 'پھ', jh: 'جھ' };
  var CON2 = ['th', 'kh', 'dh', 'sh', 'ch', 'gh', 'bh', 'ph', 'jh'];
  function skeleton(w, M, alif, yaa, waw, ayn) {
    var out = '', i = 0, first = true;
    while (i < w.length) {
      var d = w.substr(i, 2), c = w[i];
      if (isV(c)) {
        var two = w.substr(i, 2);
        if (two === 'aa') { out += first ? alif.init : alif.long; i += 2; }
        else if (two === 'ee' || two === 'ii') { out += (first ? alif.init : '') + yaa; i += 2; }
        else if (two === 'oo' || two === 'uu') { out += (first ? alif.init : '') + waw; i += 2; }
        else if (two === 'ai' || two === 'ay') { out += (first ? alif.init : '') + yaa; i += 2; }
        else if (two === 'au' || two === 'aw') { out += (first ? alif.init : '') + waw; i += 2; }
        else { if (first) out += (c === 'a' ? alif.init : alif.init); else if (i === w.length - 1 && c === 'a') out += (M === AR ? 'ة' : 'ہ'); else if (i === w.length - 1 && (c === 'i' || c === 'e')) out += yaa; i++; }
        first = false; continue;
      }
      var key = CON2.indexOf(d) > -1 ? d : c;
      if (M[key] === undefined) { key = c; }
      if (M[key] !== undefined) { out += M[key]; i += key.length; } else i++;
      first = false;
    }
    return out;
  }
  function arabic(w) { return skeleton(w, AR, { init: 'ا', long: 'ا' }, 'ي', 'و'); }
  function urdu(w) {
    var s = skeleton(w, UR, { init: 'ا', long: 'ا' }, 'ی', 'و');
    return s.replace(/^ا(?=[ب-ي])/, 'ا');
  }

  /* ---------- Runes (Elder Futhark), Morse, Braille ---------- */
  var RN = [['th', 'ᚦ'], ['ng', 'ᛜ'], ['a', 'ᚨ'], ['b', 'ᛒ'], ['c', 'ᚲ'], ['d', 'ᛞ'], ['e', 'ᛖ'], ['f', 'ᚠ'], ['g', 'ᚷ'], ['h', 'ᚺ'], ['i', 'ᛁ'], ['j', 'ᛃ'], ['k', 'ᚲ'], ['l', 'ᛚ'], ['m', 'ᛗ'], ['n', 'ᚾ'],
    ['o', 'ᛟ'], ['p', 'ᛈ'], ['q', 'ᚲ'], ['r', 'ᚱ'], ['s', 'ᛊ'], ['t', 'ᛏ'], ['u', 'ᚢ'], ['v', 'ᚹ'], ['w', 'ᚹ'], ['x', 'ᚲᛊ'], ['y', 'ᛁ'], ['z', 'ᛉ']];
  function runes(w) { return tokenize(w, RN).map(function (t) { return t[1] === 'x' ? '' : t[1]; }).join(''); }
  var MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..' };
  function morse(w) { return w.split('').map(function (c) { return MORSE[c] || ''; }).filter(Boolean).join(' '); }
  var BR = { a: '1', b: '12', c: '14', d: '145', e: '15', f: '124', g: '1245', h: '125', i: '24', j: '245', k: '13', l: '123', m: '134', n: '1345', o: '135', p: '1234', q: '12345', r: '1235', s: '234', t: '2345', u: '136', v: '1236', w: '2456', x: '1346', y: '13456', z: '1356' };
  function braille(w) {
    var out = '';
    w.split('').forEach(function (c, i) {
      var d = BR[c]; if (!d) return;
      var code = 0; d.split('').forEach(function (n) { code |= 1 << (+n - 1); });
      out += (i === 0 ? '⠠' : '') + String.fromCharCode(0x2800 + code);
    });
    return out;
  }

  var SCRIPTS = {
    deva: viaDeva('deva'), gurmukhi: viaDeva('gurmukhi'), gujarati: viaDeva('gujarati'), bengali: viaDeva('bengali'), telugu: viaDeva('telugu'), kannada: viaDeva('kannada'), malayalam: viaDeva('malayalam'),
    urdu: urdu, arabic: arabic, cyrillic: cyrillic, greek: greek, katakana: katakana, hiragana: hiragana, hangul: hangul, runes: runes, morse: morse, braille: braille
  };
  function convert(name, script) {
    var f = SCRIPTS[script], sep = script === 'runes' ? '᛫' : script === 'morse' ? '  /  ' : script === 'katakana' || script === 'hiragana' ? '・' : ' ';
    return words(name).map(function (w) { return f(w); }).filter(Boolean).join(sep);
  }
  root.NameIn = { convert: convert, scripts: Object.keys(SCRIPTS), setNames: function (n) { NAMES = n || {}; }, devanagari: devanagari, words: words };
  if (typeof module !== 'undefined') module.exports = root.NameIn;
})(typeof window !== 'undefined' ? window : globalThis);
