/*!
 * InBlaq beat catalogue for one-lifemedia.com/beats
 * Reads beats and licence tiers from the InBlaq Beat Licensing Apps Script.
 * Until API_URL is set, it shows beats.json in preview mode with buying switched off.
 */
(function () {
  'use strict';

  // Paste the Apps Script web app URL here once it is deployed (ends in /exec).
  var API_URL = 'https://script.google.com/macros/s/AKfycbxQy4N_wHcPeZsOwt04MtIpj6d3Ue30HM_iUlM0Uk7HjC1BZOKuavdB2oHtVlbLzRUMnA/exec';
  var PAGE_SIZE = 20;

  var listEl = document.getElementById('beat-list');
  if (!listEl) return;
  var countEl = document.getElementById('beat-count');
  var pagerEl = document.getElementById('beat-pager');
  var noticeEl = document.getElementById('beat-notice');
  var tierEl = document.getElementById('tier-strip');
  var q = document.getElementById('f-search');
  var fGenre = document.getElementById('f-genre');
  var fMood = document.getElementById('f-mood');
  var fSort = document.getElementById('f-sort');

  var state = { beats: [], tiers: [], live: false, page: 0, streams: {} };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { n = Number(n); return '£' + (n % 1 ? n.toFixed(2) : n); }
  function cap(t) { return t.exclusive ? 'unlimited streams' : Number(t.streamCap).toLocaleString('en-GB') + ' streams'; }

  // Spotify / Apple Music links for beats that are released on streaming (beats/streaming.json).
  function loadStreams() {
    return fetch('streaming.json').then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { state.streams = d || {}; }).catch(function () { state.streams = {}; });
  }

  function load() {
    var url = API_URL ? API_URL + '?action=catalogue' : 'beats.json';
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) throw new Error(d.error || 'Catalogue unavailable');
      state.beats = d.beats || [];
      state.tiers = d.tiers || [];
      state.live = !!API_URL;
      if (!state.live || !state.beats.length) {
        noticeEl.hidden = false;
        noticeEl.innerHTML = '<strong>Preview.</strong> Licences go on sale soon. Want one now? Email <a href="mailto:info@one-lifemedia.com">info@one-lifemedia.com</a>.';
      }
      fillFilters();
      renderTiers();
      loadStreams().then(render);
    }).catch(function () {
      listEl.innerHTML = '';
      noticeEl.hidden = false;
      noticeEl.textContent = 'The catalogue could not be loaded just now. Please refresh, or email info@one-lifemedia.com.';
    });
  }

  function fillFilters() {
    function opts(sel, field, label) {
      var vals = {};
      state.beats.forEach(function (b) { if (b[field]) vals[b[field]] = 1; });
      sel.innerHTML = '<option value="">' + label + '</option>' + Object.keys(vals).sort().map(function (v) {
        return '<option>' + esc(v) + '</option>';
      }).join('');
    }
    opts(fGenre, 'genre', 'All genres');
    opts(fMood, 'mood', 'All moods');
  }

  function renderTiers() {
    if (!tierEl || !state.tiers.length) return;
    tierEl.innerHTML = state.tiers.map(function (t) {
      return '<div class="tier-card"><h3>' + esc(t.name) + '</h3><div class="tier-price">' +
        (t.exclusive ? 'from ' : '') + money(t.price) + '</div><p>' + esc(t.files) + ' · ' + cap(t) + '</p></div>';
    }).join('');
  }

  function filtered() {
    var term = (q.value || '').toLowerCase().trim();
    var out = state.beats.filter(function (b) {
      if (fGenre.value && b.genre !== fGenre.value) return false;
      if (fMood.value && b.mood !== fMood.value) return false;
      if (!term) return true;
      return [b.title, b.genre, b.mood, b.key, b.bpm, b.description].join(' ').toLowerCase().indexOf(term) > -1;
    });
    var s = fSort.value;
    out.sort(function (a, b) {
      if (s === 'bpm-asc') return Number(a.bpm) - Number(b.bpm);
      if (s === 'bpm-desc') return Number(b.bpm) - Number(a.bpm);
      if (s === 'title') return a.title.localeCompare(b.title);
      return 0; // sheet order = newest first if you add new beats at the top
    });
    return out;
  }

  function beatHtml(b) {
    var player = b.bandcampTrackId
      ? '<iframe class="beat-player" loading="lazy" title="Listen to ' + esc(b.title) + '" src="https://bandcamp.com/EmbeddedPlayer/track=' +
        encodeURIComponent(b.bandcampTrackId) + '/size=small/bgcol=151414/linkcol=d52c1f/transparent=true/"></iframe>'
      : (b.bandcampUrl ? '<a class="beat-listen" href="' + esc(b.bandcampUrl) + '" rel="noopener">Listen on Bandcamp</a>' : '');
    var st = state.streams[b.id] || {};
    var spotifyId = b.spotifyTrackId || st.spotifyTrackId;
    var appleUrl = b.appleMusicUrl || st.appleMusicUrl;
    var stream = spotifyId
      ? '<div class="embed beat-stream" data-provider="spotify" data-type="track" data-id="' + esc(spotifyId) + '" data-title="Also on Spotify: ' + esc(b.title) + '" data-height="80"></div>'
      : '';
    if (appleUrl) stream += '<p class="beat-stems"><a href="' + esc(appleUrl) + '" rel="noopener">Also on Apple Music</a></p>';
    var buttons = state.tiers.map(function (t) {
      return '<button class="buy-btn" data-beat="' + esc(b.id) + '" data-tier="' + esc(t.id) + '"' + (state.live ? '' : ' disabled') +
        '>' + esc(t.name) + '<span class="bp">' + money(t.price) + '</span></button>';
    }).join('');
    return '<li class="beat" id="' + esc(b.id) + '"><div class="beat-head"><h2 class="beat-title">' + esc(b.title) + '</h2>' +
      '<span class="beat-meta">' + [b.genre, b.mood, b.bpm ? b.bpm + ' BPM' : '', b.key, b.length].filter(Boolean).map(esc).join(' · ') + '</span></div>' +
      '<p class="beat-desc">' + esc(b.description) + '</p>' +
      (b.stems ? '<p class="beat-stems">Stems: ' + esc(b.stems) + '</p>' : '') +
      player + stream + '<div class="beat-buy">' + buttons + '</div></li>';
  }

  function render() {
    var items = filtered();
    var pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (state.page >= pages) state.page = pages - 1;
    var slice = items.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE);
    countEl.textContent = items.length + (items.length === 1 ? ' beat' : ' beats');
    listEl.innerHTML = slice.length ? slice.map(beatHtml).join('') : '<li class="beat"><p>No beats match. Try clearing the filters.</p></li>';
    pagerEl.innerHTML = pages > 1
      ? '<button class="buy-btn" data-page="-1"' + (state.page ? '' : ' disabled') + '>Previous</button>' +
        '<span class="beat-meta">Page ' + (state.page + 1) + ' of ' + pages + '</span>' +
        '<button class="buy-btn" data-page="1"' + (state.page < pages - 1 ? '' : ' disabled') + '>Next</button>'
      : '';
    if (window.olmEmbeds) window.olmEmbeds.init(listEl);
  }

  function buy(btn) {
    if (!state.live) return;
    var label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Opening secure checkout…';
    fetch(API_URL + '?action=checkout&beat=' + encodeURIComponent(btn.dataset.beat) + '&tier=' + encodeURIComponent(btn.dataset.tier))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok || !d.url) throw new Error(d.error || 'Checkout unavailable');
        window.location.href = d.url;
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.innerHTML = label;
        alertBox(err.message);
      });
  }

  function alertBox(msg) {
    noticeEl.hidden = false;
    noticeEl.innerHTML = '<strong>Sorry, that didn\'t work.</strong> ' + esc(msg) + ' Please try again, or email <a href="mailto:info@one-lifemedia.com">info@one-lifemedia.com</a>.';
    noticeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-beat]');
    if (btn) buy(btn);
  });
  pagerEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-page]');
    if (!btn) return;
    state.page += Number(btn.dataset.page);
    render();
    listEl.scrollIntoView({ behavior: 'smooth' });
  });
  [q, fGenre, fMood, fSort].forEach(function (el) {
    el.addEventListener('input', function () { state.page = 0; render(); });
  });

  load();
})();
