/*!
 * Click-to-load music players for one-lifemedia.com.
 * Spotify / Apple Music players set their own cookies, so each player only loads
 * when the visitor presses play (or has chosen "always load players").
 * Markup: <div class="embed" data-provider="spotify" data-type="artist" data-id="..." data-title="..." data-height="352"></div>
 */
(function () {
  'use strict';
  var KEY = 'olm-load-players';
  var NAMES = { spotify: 'Spotify', apple: 'Apple Music' };

  function always() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setAlways() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }

  function src(el) {
    var p = el.dataset.provider, t = el.dataset.type, id = encodeURIComponent(el.dataset.id || '');
    if (p === 'spotify') return 'https://open.spotify.com/embed/' + t + '/' + id + '?utm_source=generator&theme=0';
    if (p === 'apple') return 'https://embed.music.apple.com/gb/' + t + '/' + id;
    return '';
  }

  function load(el) {
    var url = src(el);
    if (!url || el.dataset.loaded) return;
    el.dataset.loaded = '1';
    var f = document.createElement('iframe');
    f.src = url;
    f.title = (el.dataset.title || 'Music player') + ' on ' + (NAMES[el.dataset.provider] || 'player');
    f.loading = 'lazy';
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    f.style.height = (el.dataset.height || 352) + 'px';
    el.innerHTML = '';
    el.appendChild(f);
    el.classList.add('embed-on');
  }

  function placeholder(el) {
    var name = NAMES[el.dataset.provider] || 'the player';
    el.style.minHeight = Math.min(Number(el.dataset.height || 352), 200) + 'px';
    el.innerHTML = '<div class="embed-ph"><p class="embed-title"></p>' +
      '<button type="button" class="embed-play">Play on ' + name + '</button>' +
      '<p class="embed-note">Loads ' + name + '\'s player, which sets its own cookies. ' +
      '<button type="button" class="embed-always">Always load players</button></p></div>';
    el.querySelector('.embed-title').textContent = el.dataset.title || '';
    el.querySelector('.embed-play').addEventListener('click', function () { load(el); });
    el.querySelector('.embed-always').addEventListener('click', function () { setAlways(); init(); });
  }

  function init(root) {
    var els = (root || document).querySelectorAll('.embed[data-provider]');
    for (var i = 0; i < els.length; i++) {
      if (els[i].dataset.loaded) continue;
      if (always()) load(els[i]); else if (!els[i].querySelector('.embed-ph')) placeholder(els[i]);
    }
  }

  window.olmEmbeds = { init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
