/* =========================================================
   一盅兩件 — 遊戲邏輯
   純前端、無模組、無 fetch；雙擊 index.html 即可運行。
   ========================================================= */
(function () {
  'use strict';

  var DATA = window.YC_DATA;
  var THEMES = DATA.themes;
  var SAVE_KEY = 'yumcha.v1';
  var AUTOTEST = /[?&]autotest=1/.test(window.location.search);

  /* ---------------- 語言 ---------------- */
  function currentLang() {
    return state.settings.lang || 'zh-Hant';
  }

  function t(key, vars) {
    var L = currentLang();
    var dict = (window.YC_I18N && window.YC_I18N.ui[L]) ||
      (window.YC_I18N && window.YC_I18N.ui['zh-Hant']) || {};
    var s = dict[key];
    if (typeof s === 'undefined') s = key;
    if (vars) {
      for (var k in vars) {
        if (Object.prototype.hasOwnProperty.call(vars, k)) {
          s = s.split('{' + k + '}').join(vars[k]);
        }
      }
    }
    return s;
  }

  function tCard(name) {
    if (currentLang() === 'zh-Hant') return name;
    var m = window.YC_I18N && window.YC_I18N.cards[currentLang()];
    return (m && m[name]) || name;
  }

  function tMemory(pair) {
    if (!pair) return '';
    if (currentLang() === 'zh-Hant') return pair.memory;
    var m = window.YC_I18N && window.YC_I18N.memories[currentLang()];
    return (m && m[pair.id]) || pair.memory;
  }

  function tHint(pair) {
    if (!pair) return '';
    if (currentLang() === 'zh-Hant') return pair.hint;
    var m = window.YC_I18N && window.YC_I18N.hints[currentLang()];
    return (m && m[pair.hint]) || pair.hint;
  }

  function tLevel(n) {
    var L = currentLang();
    var arr = (window.YC_I18N && window.YC_I18N.levels[L]) ||
      (window.YC_I18N && window.YC_I18N.levels['zh-Hant']) || [];
    return arr[n - 1] || '';
  }

  function tTheme(id) {
    var L = currentLang();
    var m = (window.YC_I18N && window.YC_I18N.themes[L]) ||
      (window.YC_I18N && window.YC_I18N.themes['zh-Hant']) || {};
    return m[id] || id;
  }

  function quote(text) {
    return currentLang() === 'en' ? '“' + text + '”' : '「' + text + '」';
  }

  var LEVELS = [
    { pairs: 3, cols: 3, title: '同款點心', rule: '相同' },
    { pairs: 4, cols: 4, title: '同類點心', rule: '同類' },
    { pairs: 4, cols: 4, title: '一盅兩件', rule: '相襯' },
    { pairs: 5, cols: 5, title: '舊時茶樓', rule: '混合' },
    { pairs: 5, cols: 5, title: '擺滿一枱', rule: '混合' }
  ];

  var state = {
    screen: 'home',
    theme: 'teahouse',
    mode: 'solo',
    level: 1,
    pairs: [],
    matchedIds: {},
    first: null,
    lock: false,
    matched: 0,
    hints: 0,
    mistakes: 0,
    failStreak: 0,
    hintTier: 0,
    turn: 0,
    elapsed: 0,
    startAt: 0,
    totalSeconds: 0,
    totalStartAt: 0,
    timerId: null,
    stars: 0,
    levelMemory: [],
    lastFocus: null,
    settingsPaused: false,
    settings: {
      scale: 1,
      contrast: false,
      reduce: false,
      voice: true,
      sound: true,
      showTimer: false,
      volume: 0.6,
      lang: 'zh-Hant'
    },
    save: {
      theme: 'teahouse',
      levels: { teahouse: 1, market: 1, park: 1 },
      totals: { teahouse: 0, market: 0, park: 0 },
      stars: {},
      album: []
    }
  };

  var el = {};
  var coachTimer = null;
  var actx = null;
  var voices = [];
  var pendingStart = null;

  /* ---------------- 小工具 ---------------- */
  function $(id) { return document.getElementById(id); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sample(arr, n) { return shuffle(arr).slice(0, n); }

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var mm = m < 10 ? '0' + m : '' + m;
    var ss = s < 10 ? '0' + s : '' + s;
    return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
  }

  function getTheme(id) {
    for (var i = 0; i < THEMES.length; i++) { if (THEMES[i].id === id) return THEMES[i]; }
    return THEMES[0];
  }

  function findPair(id) {
    for (var i = 0; i < state.pairs.length; i++) { if (state.pairs[i].id === id) return state.pairs[i]; }
    return null;
  }

  function namesOf(p) { return [p.a.name, p.b.name]; }

  /* ---------------- 插畫 ---------------- */
  function artAvailable() {
    return window.YC_ART_AVAILABLE || { cards: {}, themes: {}, hero: false, coach: false, cardback: false };
  }

  function cardArt(name) {
    var av = artAvailable();
    if (!av.cards || !av.cards[name]) return '';
    var m = (window.YC_ART && window.YC_ART.cards) || {};
    return m[name] || '';
  }

  function themeArt(id) {
    var av = artAvailable();
    if (!av.themes || !av.themes[id]) return '';
    var m = (window.YC_ART && window.YC_ART.themes) || {};
    return m[id] || '';
  }

  function uiArt(key) {
    var av = artAvailable();
    if (!av[key]) return '';
    return (window.YC_ART && window.YC_ART[key]) || '';
  }

  /* ---------------- 存檔 ---------------- */
  function load() {
    var s = {
      theme: 'teahouse',
      levels: { teahouse: 1, market: 1, park: 1 },
      totals: { teahouse: 0, market: 0, park: 0 },
      stars: {},
      album: [],
      settings: null
    };
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          if (o.theme) s.theme = o.theme;
          if (o.levels && typeof o.levels === 'object') {
            for (var t = 0; t < THEMES.length; t++) {
              var id = THEMES[t].id;
              if (o.levels[id]) s.levels[id] = Math.min(5, Math.max(1, o.levels[id]));
            }
          } else if (o.level) {
            s.levels[s.theme] = Math.min(5, Math.max(1, o.level));
          }
          if (o.stars && typeof o.stars === 'object') s.stars = o.stars;
          if (o.album && Array.isArray(o.album)) s.album = o.album;
          if (o.totals && typeof o.totals === 'object') {
            for (var tt = 0; tt < THEMES.length; tt++) {
              var tid = THEMES[tt].id;
              s.totals[tid] = Math.max(0, Number(o.totals[tid]) || 0);
            }
          }
          if (o.settings) s.settings = o.settings;
        }
      }
    } catch (e) { /* 私隱模式：照玩，不存檔 */ }

    state.save = s;
    state.theme = s.theme;
    state.totalSeconds = s.totals[s.theme] || 0;
    state.totalStartAt = 0;
    if (s.settings) {
      var keys = ['scale', 'contrast', 'reduce', 'voice', 'sound', 'showTimer', 'volume', 'lang'];
      for (var i = 0; i < keys.length; i++) {
        if (typeof s.settings[keys[i]] !== 'undefined') state.settings[keys[i]] = s.settings[keys[i]];
      }
    }
  }

  function persist() {
    state.save.theme = state.theme;
    state.save.settings = state.settings;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        theme: state.save.theme,
        levels: state.save.levels,
        totals: state.save.totals,
        stars: state.save.stars,
        album: state.save.album,
        settings: state.settings
      }));
    } catch (e) { /* 忽略 */ }
  }

  /* ---------------- 設定 ---------------- */
  function applySettings() {
    var st = state.settings;
    document.documentElement.style.fontSize = (16 * st.scale) + 'px';
    document.documentElement.classList.toggle('fs-large', st.scale > 1.01);
    document.documentElement.classList.toggle('hc', !!st.contrast);
    document.documentElement.classList.toggle('rm', !!st.reduce);
    updateSettingsUI();
    updateSoundBtn();
  }

  function updateSettingsUI() {
    var st = state.settings;
    if (el.setScale) {
      var btns = el.setScale.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var v = parseFloat(btns[i].dataset.v);
        btns[i].classList.toggle('active', Math.abs(v - st.scale) < 0.01);
      }
    }
    setSwitch(el.setContrast, st.contrast);
    setSwitch(el.setReduce, st.reduce);
    setSwitch(el.setVoice, st.voice);
    setSwitch(el.setSound, st.sound);
    setSwitch(el.setTimer, st.showTimer);
    if (el.setVolume) el.setVolume.value = Math.round(st.volume * 100);
  }

  function setSwitch(btn, on) {
    if (!btn) return;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = t(on ? 'on' : 'off');
  }

  function updateSoundBtn() {
    if (!el.soundBtn) return;
    el.soundBtn.textContent = (state.settings.sound ? '🔊 ' : '🔇 ') + t(state.settings.sound ? 'soundOn' : 'soundOff');
    el.soundBtn.setAttribute('aria-pressed', state.settings.sound ? 'true' : 'false');
  }

  function updateLangSwitch() {
    if (!el.langSwitch) return;
    var btns = el.langSwitch.querySelectorAll('[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].dataset.lang === currentLang();
      btns[i].classList.toggle('active', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function applyLanguage(lang, refresh) {
    var allowed = { 'zh-Hant': 1, 'zh-Hans': 1, en: 1 };
    if (!allowed[lang]) lang = 'zh-Hant';
    state.settings.lang = lang;

    document.documentElement.lang = lang;
    document.title = t('appTitle');
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = t('appDesc');

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].dataset.i18n);
    }
    var arias = document.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < arias.length; j++) {
      arias[j].setAttribute('aria-label', t(arias[j].dataset.i18nAria));
    }

    updateLangSwitch();
    updateSettingsUI();
    updateSoundBtn();
    updateTotalClock();

    if (!refresh) return;
    showTutStep(tutStep);
    if (state.screen === 'home') renderHome();
    else if (state.screen === 'game') { renderTop(); setCoach(t('coachIdle'), 0); }
    else if (state.screen === 'result') renderResult(state.elapsed);
    else if (state.screen === 'album') renderAlbum();
    else if (state.screen === 'final') showFinal();
  }

  /* ---------------- 音效與語音 ---------------- */
  function audioCtx() {
    if (!state.settings.sound) return null;
    try {
      if (!actx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        actx = new C();
      }
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
  }

  function tone(freq, dur, type, vol, delay) {
    var c = audioCtx();
    if (!c) return;
    try {
      var t0 = c.currentTime + (delay || 0);
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      var peak = Math.max(0.0002, vol * state.settings.volume);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.03);
    } catch (e) { /* 忽略 */ }
  }

  function sfx(name) {
    if (!state.settings.sound) return;
    if (name === 'flip') tone(320, 0.08, 'triangle', 0.12);
    else if (name === 'match') { tone(660, 0.14, 'sine', 0.18); tone(880, 0.18, 'sine', 0.14, 0.1); }
    else if (name === 'miss') tone(190, 0.22, 'sine', 0.12);
    else if (name === 'hint') tone(520, 0.12, 'triangle', 0.12);
    else if (name === 'win') { tone(523, 0.16, 'sine', 0.16); tone(659, 0.16, 'sine', 0.14, 0.14); tone(784, 0.26, 'sine', 0.14, 0.28); }
    else if (name === 'start') tone(440, 0.1, 'sine', 0.1);
  }

  function loadVoices() {
    try {
      if ('speechSynthesis' in window) voices = window.speechSynthesis.getVoices() || [];
    } catch (e) { voices = []; }
  }

  function speak(text) {
    if (!state.settings.voice || !text) return;
    if (!('speechSynthesis' in window)) return;
    try {
      var L = currentLang();
      var target = L === 'en' ? 'en-US' : (L === 'zh-Hans' ? 'zh-CN' : 'zh-HK');
      var re = L === 'en' ? /^en/i : (L === 'zh-Hans' ? /^zh[-_]CN/i : /^zh[-_]HK/i);
      var voice = null;
      for (var v = 0; v < voices.length; v++) {
        if (re.test(voices[v].lang)) { voice = voices[v]; break; }
      }
      if (!voice && L === 'zh-Hans') {
        for (var k = 0; k < voices.length; k++) {
          if (/^zh/i.test(voices[k].lang)) { voice = voices[k]; break; }
        }
      }
      if (voices.length && !voice) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = voice ? voice.lang : target;
      u.rate = L === 'en' ? 0.95 : 0.9;
      u.pitch = 1;
      u.volume = state.settings.volume;
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 忽略 */ }
  }

  function announce(text) {
    if (el.live) el.live.textContent = text || '';
  }

  /* ---------------- 畫面 ---------------- */
  function show(name) {
    state.screen = name;
    var names = ['home', 'game', 'result', 'album', 'final'];
    for (var i = 0; i < names.length; i++) {
      var sec = $('screen-' + names[i]);
      if (sec) sec.classList.toggle('active', names[i] === name);
    }
    if (name !== 'game' && el.topCenter) el.topCenter.innerHTML = '';
    if (el.totalClockWrap) {
      el.totalClockWrap.hidden = !(name === 'game' || name === 'result' || name === 'final');
    }
    updateTotalClock();
    document.body.classList.remove('modal-open');
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  }

  function setCoach(text, ms, raw) {
    if (!el.coachText) return;
    var gap = currentLang() === 'en' ? ' ' : '';
    el.coachText.innerHTML = raw ? text : '<b>' + t('coachLabel') + '</b>' + gap + text;
    announce(text);
    if (coachTimer) { clearTimeout(coachTimer); coachTimer = null; }
    if (ms) {
      coachTimer = setTimeout(function () {
        setCoach(t('coachIdle'), 0);
      }, ms);
    }
  }

  function renderTop() {
    if (state.screen !== 'game') { el.topCenter.innerHTML = ''; return; }
    var lv = LEVELS[state.level - 1];
    var html = '<span class="chip">' + t('levelChip', { n: state.level, title: tLevel(state.level) }) + '</span>';
    if (state.mode === 'duo') {
      html += '<span class="turn">' + t('turn', { name: t(state.turn === 0 ? 'player1' : 'player2') }) + '</span>';
    }
    if (state.settings.showTimer) {
      html += '<span class="timer" id="timer">' + fmt(state.elapsed) + '</span>';
    }
    html += '<div class="ticket" id="ticket" aria-label="' + t('ticketAria') + '"></div>';
    el.topCenter.innerHTML = html;
    buildTicket();
  }

  function buildTicket() {
    var t = $('ticket');
    if (!t) return;
    t.innerHTML = '';
    for (var i = 0; i < state.pairs.length; i++) {
      var p = state.pairs[i];
      var s = document.createElement('span');
      s.className = 'stamp' + (state.matchedIds[p.id] ? ' on' : '');
      s.dataset.pair = p.id;
      s.textContent = tCard(p.a.name).charAt(0);
      t.appendChild(s);
    }
  }

  function markStamp(pair) {
    var s = el.topCenter.querySelector('.stamp[data-pair="' + pair.id + '"]');
    if (s) s.classList.add('on');
  }

  /* ---------------- 首頁 ---------------- */
  function renderHome() {
    if (!el.themeRow) return;
    el.themeRow.innerHTML = '';
    for (var i = 0; i < THEMES.length; i++) {
      (function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'theme' + (state.theme === t.id ? ' active' : '');
        b.setAttribute('aria-pressed', state.theme === t.id ? 'true' : 'false');
        var themeSrc = themeArt(t.id);
        var iconHtml = themeSrc
          ? '<img class="t-img" src="' + themeSrc + '" alt="" draggable="false">'
          : '<span class="t-emoji" aria-hidden="true">' + t.icon + '</span>';
        b.innerHTML = iconHtml + '<b>' + tTheme(t.id) + '</b>';
        var timg = b.querySelector('.t-img');
        if (timg) {
          timg.addEventListener('error', function () {
            var s = document.createElement('span');
            s.className = 't-emoji';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = t.icon;
            timg.parentNode.replaceChild(s, timg);
          });
        }
        b.addEventListener('click', function () {
          state.theme = t.id;
          renderHome();
        });
        el.themeRow.appendChild(b);
      })(THEMES[i]);
    }

    var nextLevel = state.save.levels[state.theme] || 1;
    var canContinue = nextLevel > 1;
    el.continueBtn.hidden = !canContinue;
    if (el.continueDot) el.continueDot.hidden = !canContinue;

    var lv = LEVELS[0];
    el.homeFoot.textContent = t('homeFoot', { level: 1, pairs: lv.pairs });
    show('home');
  }

  /* ---------------- 關卡 ---------------- */
  function buildLevel(themeId, level) {
    var pool = getTheme(themeId).pairs.slice();
    var n = LEVELS[level - 1].pairs;
    var picked;

    if (level === 1) {
      picked = sample(pool.filter(function (p) { return p.kind === 'same'; }), n);
    } else if (level === 2) {
      picked = pickUniqueGroups(pool.filter(function (p) { return p.kind === 'cat'; }), n);
    } else if (level === 3) {
      picked = sample(pool.filter(function (p) { return p.kind === 'assoc'; }), n);
    } else {
      picked = pickUniqueNames(pool, n);
    }

    if (picked.length < n) {
      var extra = pickUniqueNames(pool, n);
      picked = extra;
    }
    return picked;
  }

  /* 測試用：強制指定卡牌（?debug=game&pairs=t01,t02,t03） */
  function forcePairs(ids) {
    var theme = getTheme(state.theme);
    var list = [];
    for (var i = 0; i < ids.length; i++) {
      for (var j = 0; j < theme.pairs.length; j++) {
        if (theme.pairs[j].id === ids[i]) { list.push(theme.pairs[j]); break; }
      }
    }
    if (!list.length) return;
    state.pairs = list;
    state.matched = 0;
    state.matchedIds = {};
    state.first = null;
    state.lock = false;
    state.levelMemory = [];
    state.hints = 0;
    state.mistakes = 0;
    renderBoard();
    renderTop();
  }

  function pickUniqueGroups(pool, n) {    var shuffled = shuffle(pool);
    var seen = {};
    var out = [];
    for (var i = 0; i < shuffled.length && out.length < n; i++) {
      var p = shuffled[i];
      if (!seen[p.group]) { seen[p.group] = 1; out.push(p); }
    }
    return out;
  }

  function pickUniqueNames(pool, n) {
    var shuffled = shuffle(pool);
    var used = {};
    var out = [];
    for (var i = 0; i < shuffled.length && out.length < n; i++) {
      var p = shuffled[i];
      var ns = namesOf(p);
      var ok = true;
      for (var j = 0; j < ns.length; j++) { if (used[ns[j]]) { ok = false; break; } }
      if (ok) {
        for (var m = 0; m < ns.length; m++) { used[ns[m]] = 1; }
        out.push(p);
      }
    }
    return out;
  }

  function renderBoard() {
    var theme = getTheme(state.theme);
    var lv = LEVELS[state.level - 1];
    el.board.className = 'board cols-' + lv.cols;
    el.board.classList.toggle('dense', state.pairs.length >= 5);
    el.board.innerHTML = '';

    var cardback = uiArt('cardback');
    if (cardback) {
      var cardbackUrl = new URL(cardback, window.location.href).href;
      el.board.style.setProperty('--cardback', 'url("' + cardbackUrl + '")');
      el.board.classList.add('has-cardback');
    } else {
      el.board.style.removeProperty('--cardback');
      el.board.classList.remove('has-cardback');
    }

    var deck = [];
    for (var i = 0; i < state.pairs.length; i++) {
      var p = state.pairs[i];
      deck.push({ pair: p, card: p.a });
      deck.push({ pair: p, card: p.b });
    }
    deck = shuffle(deck);

    for (var d = 0; d < deck.length; d++) {
      (function (item) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'card';
        b.dataset.pair = item.pair.id;
        b.dataset.name = tCard(item.card.name);
        b.setAttribute('aria-label', t('unopenedCard'));

        var artSrc = cardArt(item.card.name);
        var iconHtml = artSrc
          ? '<span class="icon has-img"><img src="' + artSrc + '" alt="" draggable="false"></span>'
          : '<span class="icon">' + item.card.icon + '</span>';

        b.innerHTML =
          '<span class="card-inner">' +
            '<span class="face back"><span class="kanji">' + theme.mark + '</span></span>' +
            '<span class="face front">' + iconHtml + '<span class="name">' + tCard(item.card.name) + '</span></span>' +
          '</span>';

        var img = b.querySelector('.icon img');
        if (img) {
          img.addEventListener('error', function () {
            var wrap = img.parentNode;
            wrap.classList.remove('has-img');
            wrap.textContent = item.card.icon;
          });
        }

        b.addEventListener('click', function () { onCard(b); });
        el.board.appendChild(b);
      })(deck[d]);
    }
  }

  function startGame(level, themeId) {
    if (themeId) state.theme = themeId;
    state.level = Math.max(1, Math.min(5, level || 1));
    if (!state.save.totals) state.save.totals = { teahouse: 0, market: 0, park: 0 };
    if (state.level === 1) {
      state.totalSeconds = 0;
      state.save.totals[state.theme] = 0;
      persist();
    } else {
      state.totalSeconds = Math.max(0, Number(state.save.totals[state.theme]) || 0);
    }
    state.totalStartAt = 0;
    state.pairs = buildLevel(state.theme, state.level);
    state.matchedIds = {};
    state.first = null;
    state.lock = false;
    state.matched = 0;
    state.hints = 0;
    state.mistakes = 0;
    state.failStreak = 0;
    state.hintTier = 0;
    state.turn = 0;
    state.elapsed = 0;
    state.startAt = 0;
    state.levelMemory = [];
    state.stars = 0;
    state.settingsPaused = false;

    renderBoard();
    show('game');
    renderTop();
    startTimer();
    setCoach(t('coachStart'), 0);
    try { el.board.focus({ preventScroll: true }); } catch (e) { el.board.focus(); }
    sfx('start');
  }

  function onCard(card) {
    if (state.lock) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    card.setAttribute('aria-label', t('cardOpened', { name: card.dataset.name }));
    sfx('flip');

    if (!state.first) {
      state.first = card;
      announce(t('flipAnnounce', { name: card.dataset.name }));
      return;
    }

    var a = state.first;
    var b = card;
    state.first = null;
    state.lock = true;

    if (a.dataset.pair === b.dataset.pair) {
      setTimeout(function () { onMatch(a, b); }, AUTOTEST ? 5 : 420);
    } else {
      setTimeout(function () { onMismatch(a, b); }, AUTOTEST ? 20 : 950);
    }
  }

  function onMatch(a, b) {
    a.classList.add('matched');
    b.classList.add('matched');
    a.setAttribute('aria-label', t('cardMatched', { name: a.dataset.name }));
    b.setAttribute('aria-label', t('cardMatched', { name: b.dataset.name }));

    state.matched++;
    state.failStreak = 0;
    state.hintTier = 0;

    var pair = findPair(a.dataset.pair);
    if (pair) {
      state.matchedIds[pair.id] = 1;
      state.levelMemory.push(pair);
      markStamp(pair);
    }

    sfx('match');
    setCoach(t('coachMatch', { memory: tMemory(pair) }), 4500);
    speak(tMemory(pair));

    if (state.mode === 'duo') {
      state.turn = 1 - state.turn;
      renderTop();
    }

    state.lock = false;

    if (state.matched >= state.pairs.length) {
      stopTimer();
      setTimeout(finishLevel, AUTOTEST ? 20 : 1100);
    }
  }

  function onMismatch(a, b) {
    state.mistakes++;
    state.failStreak++;
    sfx('miss');
    setCoach(t('coachMismatch'), 1800);

    a.classList.remove('flipped');
    b.classList.remove('flipped');
    a.setAttribute('aria-label', t('unopenedCard'));
    b.setAttribute('aria-label', t('unopenedCard'));

    if (state.mode === 'duo') {
      state.turn = 1 - state.turn;
      renderTop();
    }

    state.lock = false;

    if (state.failStreak >= 2) {
      state.failStreak = 0;
      setTimeout(function () { hint(true); }, 700);
    }
  }

  /* ---------------- 提示 ---------------- */
  function hint(free) {
    if (state.screen !== 'game' || state.lock) return;
    var pair = state.first ? findPair(state.first.dataset.pair) : randomUnmatchedPair();
    if (!pair) return;
    if (!free) state.hints++;

    var tier = Math.min(3, state.hintTier + 1);
    state.hintTier = tier;
    var text;

    if (tier === 1) {
      var cards = cardsOfPair(pair.id);
      var sameRow = cards.length === 2 && Math.abs(cards[0].offsetTop - cards[1].offsetTop) < 8;
      text = sameRow
        ? t('hintRow')
        : t('hintCol');
    } else if (tier === 2) {
      text = tHint(pair);
    } else {
      var target = pickHintCard(pair.id);
      if (target) {
        target.classList.add('hint-glow');
        setTimeout(function () { target.classList.remove('hint-glow'); }, 2800);
      }
      text = t('hintTier3');
      state.hintTier = 0;
    }

    setCoach(text, 4800);
    speak(text);
    sfx('hint');
  }

  function cardsOfPair(id) {
    var out = [];
    var cards = el.board.querySelectorAll('.card');
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].dataset.pair === id) out.push(cards[i]);
    }
    return out;
  }

  function pickHintCard(id) {
    var cards = cardsOfPair(id);
    for (var i = 0; i < cards.length; i++) {
      if (!cards[i].classList.contains('flipped') && !cards[i].classList.contains('matched')) return cards[i];
    }
    return cards[0] || null;
  }

  function randomUnmatchedPair() {
    var left = state.pairs.filter(function (p) { return !state.matchedIds[p.id]; });
    if (!left.length) return null;
    return left[Math.floor(Math.random() * left.length)];
  }

  /* ---------------- 計時 ---------------- */
  function totalNow() {
    return state.totalSeconds + (state.totalStartAt ? (Date.now() - state.totalStartAt) / 1000 : 0);
  }

  function updateTotalClock() {
    var txt = fmtClock(totalNow());
    if (el.totalClock) el.totalClock.textContent = txt;
    if (el.totalClockWrap) {
      el.totalClockWrap.setAttribute('aria-label', t('totalTimeAria', { time: txt }));
    }
  }

  function startTimer() {
    stopTimer(true);
    state.startAt = Date.now() - state.elapsed * 1000;
    state.totalStartAt = Date.now();
    state.timerId = setInterval(function () {
      state.elapsed = (Date.now() - state.startAt) / 1000;
      var t = $('timer');
      if (t) t.textContent = fmt(state.elapsed);
      updateTotalClock();
    }, 500);
    updateTotalClock();
  }

  function stopTimer(keep) {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    if (!keep && state.startAt) {
      state.elapsed = (Date.now() - state.startAt) / 1000;
      state.startAt = 0;
    }
    if (state.totalStartAt) {
      state.totalSeconds += (Date.now() - state.totalStartAt) / 1000;
      state.totalStartAt = 0;
      if (!state.save.totals) state.save.totals = { teahouse: 0, market: 0, park: 0 };
      state.save.totals[state.theme] = state.totalSeconds;
      if (!keep) persist();
    }
    updateTotalClock();
  }

  /* ---------------- 完成 ---------------- */
  function finishLevel() {
    stopTimer();
    forceCloseModals();
    state.settingsPaused = false;
    var secs = state.elapsed;
    var stars = (state.hints <= 1 && state.mistakes <= 4) ? 3 : (state.hints <= 3 ? 2 : 1);
    state.stars = stars;

    var key = state.theme + '-' + state.level;
    if (!state.save.stars[key] || state.save.stars[key] < stars) state.save.stars[key] = stars;

    for (var i = 0; i < state.levelMemory.length; i++) {
      var id = state.levelMemory[i].id;
      if (state.save.album.indexOf(id) < 0) state.save.album.push(id);
    }

    state.save.theme = state.theme;
    state.save.levels[state.theme] = Math.min(5, state.level + 1);
    persist();

    renderResult(secs);
    show('result');
    sfx('win');
    speak(t('completeSpeak'));
    if (el.nextBtn) el.nextBtn.focus();
  }

  function renderResult(secs) {
    var total = state.pairs.length;
    el.resKicker.textContent = t('resultKicker', { n: state.level });
    el.resTitle.textContent = t('resultTitle');
    el.paperHead.textContent = t('paperHead', { n: state.level });
    el.paperGrid.innerHTML = '';
    el.paperGrid.style.gridTemplateColumns = 'repeat(' + total + ', 1fr)';

    for (var i = 0; i < state.pairs.length; i++) {
      var p = state.pairs[i];
      var d = document.createElement('div');
      d.className = 'slot';
      var nm = tCard(p.a.name);
      d.innerHTML = '<span class="seal">' + nm.charAt(0) + '</span><small>' + nm + '</small>';
      el.paperGrid.appendChild(d);
    }

    el.paperFoot.textContent = t('paperFoot', { total: total });
    el.stars.textContent = repeatChar('★', state.stars) + repeatChar('☆', 3 - state.stars);
    el.stars.setAttribute('aria-label', t('starsAria', { n: state.stars }));
    el.statTime.textContent = fmt(secs);
    el.statPairs.textContent = total + ' / ' + total;
    el.statHints.textContent = t('hintsCount', { n: state.hints });
    el.resultTotal.textContent = fmtClock(state.totalSeconds);

    var last = state.levelMemory[state.levelMemory.length - 1];
    el.memoryQuote.textContent = quote(last ? tMemory(last) : t('memoryDefault'));

    el.nextBtn.textContent = t(state.level < 5 ? 'next' : 'done');
  }

  function repeatChar(ch, n) {
    var s = '';
    for (var i = 0; i < n; i++) s += ch;
    return s;
  }

  function showFinal() {
    var sum = 0;
    var prefix = state.theme + '-';
    for (var k in state.save.stars) {
      if (Object.prototype.hasOwnProperty.call(state.save.stars, k) && k.indexOf(prefix) === 0) {
        sum += state.save.stars[k];
      }
    }
    el.finalCount.textContent = state.save.album.length;
    el.finalTimeValue.textContent = fmtClock(state.totalSeconds);
    el.finalStars.textContent = '★ ' + sum + ' / 15';
    el.finalStars.setAttribute('aria-label', t('finalStarsAria') + ' ' + sum + ' / 15');
    show('final');
    sfx('win');
  }

  /* ---------------- 相簿 ---------------- */
  function renderAlbum() {
    var all = [];
    for (var i = 0; i < THEMES.length; i++) {
      for (var j = 0; j < THEMES[i].pairs.length; j++) {
        all.push({ theme: THEMES[i], pair: THEMES[i].pairs[j] });
      }
    }

    var got = all.filter(function (x) { return state.save.album.indexOf(x.pair.id) >= 0; });
    el.albumSub.textContent = t('albumSub', { n: got.length, total: all.length });
    el.albumGrid.innerHTML = '';

    if (!got.length) {
      var empty = document.createElement('p');
      empty.className = 'album-sub';
      empty.textContent = t('albumEmpty');
      el.albumGrid.appendChild(empty);
    }

    for (var g = 0; g < got.length; g++) {
      (function (x) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'album-card';
        var aName = tCard(x.pair.a.name);
        var bName = tCard(x.pair.b.name);
        var both = aName === bName ? aName : aName + ' · ' + bName;
        var sealChar = tCard(x.pair.a.name).charAt(0);
        b.innerHTML =
          '<div class="ac-seal" aria-hidden="true">' + sealChar + '</div>' +
          '<div class="ac-name">' + both + '</div>' +
          '<div class="ac-memory">' + quote(tMemory(x.pair)) + '</div>' +
          '<span class="ac-tag">' + tTheme(x.theme.id) + '</span>';
        b.addEventListener('click', function () { speak(tMemory(x.pair)); sfx('flip'); });
        el.albumGrid.appendChild(b);
      })(got[g]);
    }

    show('album');
  }

  /* ---------------- 彈窗 ---------------- */
  function openModal(id) {
    var m = $(id);
    if (!m) return;
    state.lastFocus = document.activeElement;
    var stage = document.querySelector('.stage');
    if (stage) stage.inert = true;
    m.hidden = false;
    document.body.classList.add('modal-open');
    var btn = m.querySelector('[data-autofocus]') || m.querySelector('button, input');
    if (btn) btn.focus();
  }

  function closeModal(id) {
    var m = $(id);
    if (!m) return;
    m.hidden = true;
    var anyOpen = document.querySelector('.modal:not([hidden])');
    if (!anyOpen) {
      document.body.classList.remove('modal-open');
      var stage = document.querySelector('.stage');
      if (stage) stage.inert = false;
    }
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
      try { state.lastFocus.focus(); } catch (e) { /* ignore */ }
    }
  }

  function forceCloseModals() {
    var ids = ['modal-settings', 'modal-tutorial', 'modal-pause', 'modal-quick'];
    for (var i = 0; i < ids.length; i++) {
      var m = $(ids[i]);
      if (m) m.hidden = true;
    }
    document.body.classList.remove('modal-open');
    var stage = document.querySelector('.stage');
    if (stage) stage.inert = false;
  }

  function renderQuick() {
    if (!el.fontOptions) return;
    var opts = el.fontOptions.querySelectorAll('.font-opt');
    for (var i = 0; i < opts.length; i++) {
      var v = parseFloat(opts[i].dataset.scale);
      opts[i].setAttribute('aria-pressed', Math.abs(v - state.settings.scale) < 0.01 ? 'true' : 'false');
    }
    setSwitch(el.quickContrast, state.settings.contrast);
  }

  function requestStart(level, theme) {
    pendingStart = { level: level || 1, theme: theme || state.theme };
    renderQuick();
    openModal('modal-quick');
  }

  function confirmQuick() {
    var p = pendingStart || { level: 1, theme: state.theme };
    pendingStart = null;
    closeModal('modal-quick');
    startGame(p.level, p.theme);
  }

  function cancelQuick() {
    pendingStart = null;
    closeModal('modal-quick');
  }

  function openSettings() {
    if (state.screen === 'game' && !state.settingsPaused) {
      state.lock = true;
      stopTimer();
      state.settingsPaused = true;
    }
    openModal('modal-settings');
  }

  function closeSettings() {
    closeModal('modal-settings');
    if (state.settingsPaused) {
      state.settingsPaused = false;
      state.lock = false;
      startTimer();
    }
  }

  function openPause() {
    if (state.screen !== 'game') return;
    state.lock = true;
    stopTimer();
    openModal('modal-pause');
  }

  function resumeGame() {
    closeModal('modal-pause');
    state.lock = false;
    startTimer();
  }

  function goHome() {
    stopTimer();
    state.lock = false;
    state.settingsPaused = false;
    renderHome();
  }

  var tutStep = 1;
  function showTutStep(n) {
    tutStep = Math.max(1, Math.min(3, n));
    var steps = document.querySelectorAll('.tut-step');
    for (var i = 0; i < steps.length; i++) {
      steps[i].hidden = parseInt(steps[i].dataset.step, 10) !== tutStep;
    }
    el.tutDots.textContent = ['● ○ ○', '○ ● ○', '○ ○ ●'][tutStep - 1];
    el.tutPrev.style.visibility = tutStep === 1 ? 'hidden' : 'visible';
    el.tutNext.textContent = tutStep === 3 ? t('tutStart') : t('tutNext');
  }

  /* ---------------- 綁定 ---------------- */
  function bind() {
    el.startBtn.addEventListener('click', function () { requestStart(1, state.theme); });
    el.continueBtn.addEventListener('click', function () {
      requestStart(state.save.levels[state.theme] || 1, state.theme);
    });
    el.howBtn.addEventListener('click', function () {
      showTutStep(1);
      openModal('modal-tutorial');
    });
    el.albumBtn.addEventListener('click', renderAlbum);
    el.settingsBtn.addEventListener('click', openSettings);
    if (el.langSwitch) {
      el.langSwitch.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-lang]') : null;
        if (!b) return;
        var lang = b.dataset.lang;
        if (lang === currentLang()) return;
        applyLanguage(lang, true);
        persist();
      });
    }
    el.brandBtn.addEventListener('click', function () {
      if (state.screen === 'game') openPause();
      else goHome();
    });

    var modes = document.querySelectorAll('.mode');
    for (var i = 0; i < modes.length; i++) {
      modes[i].addEventListener('click', function () {
        state.mode = this.dataset.mode;
        for (var j = 0; j < modes.length; j++) {
          modes[j].classList.toggle('active', modes[j] === this);
          modes[j].setAttribute('aria-pressed', modes[j] === this ? 'true' : 'false');
        }
      });
    }

    el.hintBtn.addEventListener('click', function () { hint(false); });
    el.pauseBtn.addEventListener('click', openPause);
    el.soundBtn.addEventListener('click', function () {
      state.settings.sound = !state.settings.sound;
      applySettings();
      persist();
      if (state.settings.sound) sfx('flip');
    });

    el.nextBtn.addEventListener('click', function () {
      if (state.level < 5) startGame(state.level + 1, state.theme);
      else showFinal();
    });
    el.replayBtn.addEventListener('click', function () { startGame(state.level, state.theme); });
    el.homeBtn2.addEventListener('click', goHome);

    el.albumBack.addEventListener('click', goHome);
    el.finalAlbum.addEventListener('click', renderAlbum);
    el.finalAgain.addEventListener('click', function () {
      state.save.levels[state.theme] = 1;
      persist();
      startGame(1, state.theme);
    });
    el.finalHome.addEventListener('click', goHome);

    el.settingsClose.addEventListener('click', closeSettings);

    el.quickStart.addEventListener('click', confirmQuick);
    el.quickBack.addEventListener('click', cancelQuick);
    el.quickContrast.addEventListener('click', function () {
      state.settings.contrast = !state.settings.contrast;
      applySettings();
      persist();
      renderQuick();
    });
    el.fontOptions.addEventListener('click', function (e) {
      var b = e.target.closest('.font-opt');
      if (!b) return;
      state.settings.scale = parseFloat(b.dataset.scale);
      applySettings();
      persist();
      renderQuick();
    });

    el.setScale.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      state.settings.scale = parseFloat(b.dataset.v);
      applySettings();
      persist();
    });

    el.setContrast.addEventListener('click', function () {
      state.settings.contrast = !state.settings.contrast;
      applySettings();
      persist();
    });
    el.setReduce.addEventListener('click', function () {
      state.settings.reduce = !state.settings.reduce;
      applySettings();
      persist();
    });
    el.setVoice.addEventListener('click', function () {
      state.settings.voice = !state.settings.voice;
      applySettings();
      persist();
      if (state.settings.voice) speak(t('voiceOn'));
    });
    el.setSound.addEventListener('click', function () {
      state.settings.sound = !state.settings.sound;
      applySettings();
      persist();
      if (state.settings.sound) sfx('flip');
    });
    el.setTimer.addEventListener('click', function () {
      state.settings.showTimer = !state.settings.showTimer;
      applySettings();
      persist();
      if (state.screen === 'game') renderTop();
    });
    el.setVolume.addEventListener('input', function () {
      state.settings.volume = parseInt(el.setVolume.value, 10) / 100;
      persist();
    });

    el.tutPrev.addEventListener('click', function () { showTutStep(tutStep - 1); });
    el.tutNext.addEventListener('click', function () {
      if (tutStep < 3) showTutStep(tutStep + 1);
      else {
        closeModal('modal-tutorial');
        requestStart(1, state.theme);
      }
    });

    el.pauseResume.addEventListener('click', resumeGame);
    el.pauseRestart.addEventListener('click', function () {
      closeModal('modal-pause');
      startGame(state.level, state.theme);
    });
    el.pauseHome.addEventListener('click', function () {
      closeModal('modal-pause');
      goHome();
    });

    var modals = document.querySelectorAll('.modal');
    for (var m = 0; m < modals.length; m++) {
      modals[m].addEventListener('click', function (e) {
        if (e.target !== this) return;
        if (this.id === 'modal-settings') closeSettings();
        else if (this.id === 'modal-pause') resumeGame();
        else if (this.id === 'modal-quick') cancelQuick();
        else closeModal(this.id);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!el.modalQuick.hidden) cancelQuick();
      else if (!el.modalSettings.hidden) closeSettings();
      else if (!el.modalTutorial.hidden) closeModal('modal-tutorial');
      else if (!el.modalPause.hidden) resumeGame();
    });
  }

  /* ---------------- 無頭測試用 ---------------- */
  function autoPlay() {
    if (state.screen !== 'game') return;
    if (state.lock) { setTimeout(autoPlay, 400); return; }
    var cards = Array.prototype.slice.call(el.board.querySelectorAll('.card:not(.matched):not(.flipped)'));
    if (!cards.length) return;
    var first = cards[0];
    var mate = null;
    for (var i = 1; i < cards.length; i++) {
      if (cards[i].dataset.pair === first.dataset.pair) { mate = cards[i]; break; }
    }
    if (!mate) { setTimeout(autoPlay, 400); return; }
    first.click();
    setTimeout(function () { mate.click(); }, 300);
    setTimeout(autoPlay, 1500);
  }

  function runAutotest() {
    document.documentElement.classList.add('rm');
    state.settings.sound = false;
    state.settings.voice = false;
    var qlang = new URLSearchParams(window.location.search).get('lang');
    if (qlang) applyLanguage(qlang, true);

    var report = [];
    var themes = ['teahouse', 'market', 'park'];
    var ti = 0;
    var li = 1;
    var interactionOk = false;

    function interactionTest(cb) {
      startGame(1, 'teahouse');
      setTimeout(function () {
        var cards = Array.prototype.slice.call(el.board.querySelectorAll('.card'));
        var a = cards[0];
        var b = null;
        for (var i = 1; i < cards.length; i++) {
          if (cards[i].dataset.pair !== a.dataset.pair) { b = cards[i]; break; }
        }
        if (!b) { cb(false); return; }
        a.click();
        b.click();
        setTimeout(function () {
          var flipped = el.board.querySelectorAll('.card.flipped').length;
          var ok1 = state.mistakes >= 1 && flipped === 0;
          el.hintBtn.click();
          setTimeout(function () {
            cb(ok1 && state.hints >= 1);
          }, 60);
        }, 80);
      }, 60);
    }

    function done() {
      var finalOk = false;
      if (state.screen === 'result' && state.level === 5) {
        el.nextBtn.click();
        finalOk = state.screen === 'final';
      }
      var pass = report.length === 15 && report.every(function (r) { return r.ok; }) && finalOk && interactionOk;
      var lines = report.map(function (r) {
        return [r.theme, 'L' + r.level, r.ok ? 'PASS' : 'FAIL',
          'stars=' + r.stars, 'pairs=' + r.pairs, 'hints=' + r.hints,
          'mistakes=' + r.mistakes, 'missingArt=' + r.missingArt,
          'ms=' + r.ms].join(' ');
      });
      var pre = document.createElement('pre');
      pre.id = 'autotest-report';
      pre.textContent = (pass ? 'AUTOTEST PASS' : 'AUTOTEST FAIL') + '\n' + lines.join('\n') +
        '\ninteraction=' + (interactionOk ? 'PASS' : 'FAIL') +
        '\nfinalScreen=' + (finalOk ? 'PASS' : 'FAIL');
      document.body.appendChild(pre);
      document.title = pass ? 'AUTOTEST PASS' : 'AUTOTEST FAIL';
    }

    function playLevel(theme, level, cb) {
      var started = Date.now();
      var guard = setTimeout(function () {
        cb({ theme: theme, level: level, ok: false, stars: 0, pairs: 0, hints: 0, mistakes: 0, missingArt: -1, ms: Date.now() - started });
      }, 12000);

      function tick() {
        if (state.screen === 'result') {
          clearTimeout(guard);
          var total = state.pairs.length;
          var cards = el.board.querySelectorAll('.card');
          var missing = 0;
          for (var i = 0; i < cards.length; i++) {
            if (!cards[i].querySelector('.icon.has-img')) missing++;
          }
          cb({
            theme: theme, level: level,
            ok: state.matched === total && missing === 0 && cards.length === total * 2,
            stars: state.stars, pairs: total, hints: state.hints,
            mistakes: state.mistakes, missingArt: missing, ms: Date.now() - started
          });
          return;
        }
        if (state.screen !== 'game') { setTimeout(tick, 20); return; }
        if (!state.lock) {
          var cards = Array.prototype.slice.call(el.board.querySelectorAll('.card:not(.matched):not(.flipped)'));
          if (cards.length >= 2) {
            var a = cards[0];
            var b = null;
            for (var j = 1; j < cards.length; j++) {
              if (cards[j].dataset.pair === a.dataset.pair) { b = cards[j]; break; }
            }
            if (b) {
              a.click();
              (function (mate) {
                setTimeout(function () { mate.click(); }, 5);
              })(b);
            }
          }
        }
        setTimeout(tick, 25);
      }
      tick();
    }

    function nextLevel() {
      if (ti >= themes.length) { done(); return; }
      if (li > 5) { ti++; li = 1; nextLevel(); return; }
      var theme = themes[ti];
      var level = li;
      startGame(level, theme);
      setTimeout(function () {
        playLevel(theme, level, function (res) {
          report.push(res);
          li++;
          setTimeout(nextLevel, 20);
        });
      }, 30);
    }

    interactionTest(function (ok) {
      interactionOk = ok;
      nextLevel();
    });
  }

  function debugStart() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('autotest') === '1') { runAutotest(); return; }
    if (params.get('lang')) applyLanguage(params.get('lang'), true);
    if (params.has('debug')) {
      window.addEventListener('error', function (e) {
        document.title = 'ERR ' + (e.message || 'unknown');
      });
    }
    var sc = parseFloat(params.get('scale') || '');
    if (sc === 1 || sc === 1.1 || sc === 1.25) { state.settings.scale = sc; applySettings(); }
    if (params.get('hc') === '1') { state.settings.contrast = true; applySettings(); }
    if (params.get('rm') === '1') { state.settings.reduce = true; applySettings(); }

    var d = params.get('debug');
    if (!d) {
      if (params.get('auto') === '1') {
        startGame(1, state.theme);
        setTimeout(autoPlay, 900);
      }
      return;
    }
    if (d === 'game') {
      startGame(parseInt(params.get('level') || '2', 10), params.get('theme') || 'teahouse');
      if (params.get('pairs')) forcePairs(params.get('pairs').split(','));
      if (params.get('flip') === '1') {
        setTimeout(function () {
          document.documentElement.classList.add('rm');
          var cards = el.board.querySelectorAll('.card');
          for (var i = 0; i < cards.length; i++) cards[i].classList.add('flipped');
        }, 350);
      }
    } else if (d === 'result') {
      startGame(parseInt(params.get('level') || '2', 10), 'teahouse');
      if (params.get('pairs')) forcePairs(params.get('pairs').split(','));
      stopTimer();
      for (var i = 0; i < state.pairs.length; i++) state.matchedIds[state.pairs[i].id] = 1;
      state.matched = state.pairs.length;
      state.hints = 1;
      state.mistakes = 1;
      state.elapsed = 204;
      state.stars = 3;
      state.levelMemory = state.pairs.slice();
      renderResult(204);
      show('result');
    } else if (d === 'album') {
      if (!state.save.album.length) state.save.album = ['t01', 't07', 'm11', 'p04'];
      renderAlbum();
    } else if (d === 'final') {
      showFinal();
    } else if (d === 'settings') {
      openSettings();
    } else if (d === 'quick') {
      requestStart(1, 'teahouse');
    } else if (d === 'quickgo') {
      requestStart(1, 'teahouse');
      setTimeout(confirmQuick, 600);
    } else if (d === 'tutorial') {
      showTutStep(1);
      openModal('modal-tutorial');
    } else if (d === 'duo') {
      state.mode = 'duo';
      startGame(2, 'teahouse');
    } else if (d === 'pause') {
      startGame(2, 'teahouse');
      setTimeout(openPause, 400);
    } else if (d === 'hint') {
      startGame(3, 'teahouse');
      setTimeout(function () { hint(false); }, 700);
    }
    if (params.get('auto') === '1') setTimeout(autoPlay, 900);
  }

  /* ---------------- 初始化 ---------------- */
  function cacheEl() {
    el.themeRow = $('themeRow');
    el.homeFoot = $('homeFoot');
    el.langSwitch = $('langSwitch');
    el.startBtn = $('startBtn');
    el.continueBtn = $('continueBtn');
    el.continueDot = $('continueDot');
    el.howBtn = $('howBtn');
    el.albumBtn = $('albumBtn');
    el.settingsBtn = $('settingsBtn');
    el.brandBtn = $('brandBtn');
    el.topCenter = $('topCenter');
    el.totalClockWrap = $('totalClockWrap');
    el.totalClock = $('totalClock');

    el.board = $('board');
    el.coachText = $('coachText');
    el.hintBtn = $('hintBtn');
    el.pauseBtn = $('pauseBtn');
    el.soundBtn = $('soundBtn');

    el.resKicker = $('resKicker');
    el.resTitle = $('resTitle');
    el.paperHead = $('paperHead');
    el.paperGrid = $('paperGrid');
    el.paperFoot = $('paperFoot');
    el.stars = $('stars');
    el.statTime = $('statTime');
    el.statPairs = $('statPairs');
    el.statHints = $('statHints');
    el.memoryQuote = $('memoryQuote');
    el.resultTotal = $('resultTotal');
    el.nextBtn = $('nextBtn');
    el.replayBtn = $('replayBtn');
    el.homeBtn2 = $('homeBtn2');

    el.albumSub = $('albumSub');
    el.albumGrid = $('albumGrid');
    el.albumBack = $('albumBack');

    el.finalCount = $('finalCount');
    el.finalTimeValue = $('finalTimeValue');
    el.finalStars = $('finalStars');
    el.finalAlbum = $('finalAlbum');
    el.finalAgain = $('finalAgain');
    el.finalHome = $('finalHome');

    el.modalSettings = $('modal-settings');
    el.modalTutorial = $('modal-tutorial');
    el.modalPause = $('modal-pause');
    el.modalQuick = $('modal-quick');
    el.fontOptions = $('fontOptions');
    el.quickStart = $('quickStart');
    el.quickBack = $('quickBack');
    el.quickContrast = $('quickContrast');
    el.settingsClose = $('settingsClose');
    el.setScale = $('setScale');
    el.setContrast = $('setContrast');
    el.setReduce = $('setReduce');
    el.setVoice = $('setVoice');
    el.setSound = $('setSound');
    el.setTimer = $('setTimer');
    el.setVolume = $('setVolume');

    el.tutPrev = $('tutPrev');
    el.tutNext = $('tutNext');
    el.tutDots = $('tutDots');
    el.pauseResume = $('pauseResume');
    el.pauseRestart = $('pauseRestart');
    el.pauseHome = $('pauseHome');

    el.live = $('live');
  }

  function applyUIImages() {
    var heroSrc = uiArt('hero');
    var hero = document.querySelector('.basket');
    if (hero && heroSrc) {
      var img = new Image();
      img.onload = function () {
        hero.textContent = '';
        img.className = 'hero-img';
        img.alt = '';
        hero.appendChild(img);
      };
      img.src = heroSrc;
    }
    var coachSrc = uiArt('coach');
    var coach = document.querySelector('.coach-avatar');
    if (coach && coachSrc) {
      var ci = new Image();
      ci.onload = function () {
        coach.textContent = '';
        ci.className = 'coach-img';
        ci.alt = '';
        coach.appendChild(ci);
      };
      ci.src = coachSrc;
    }
  }

  function init() {
    cacheEl();
    load();
    applySettings();
    applyLanguage(state.settings.lang, false);
    bind();
    window.addEventListener('pagehide', function () {
      if (state.totalStartAt) stopTimer();
    });
    showTutStep(1);
    applyUIImages();
    renderHome();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
    debugStart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
