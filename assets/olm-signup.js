/*!
 * One-Life Media sign-up popup and inline box
 * Usage: <script src="https://one-lifemedia.com/assets/olm-signup.js" data-site="home|content|inblaq|colourzoo" defer></script>
 * Optional: put <div data-olm-signup></div> where the inline box should sit.
 * If no placeholder exists, the inline box is added just before the page footer.
 */
(function () {
  'use strict';

  // ---- Google Form wiring: responses go to the 'One-Life Media sign-ups' Sheet ----
  var FORM = {
    action: 'https://docs.google.com/forms/d/e/1FAIpQLSf9T7PuhX583O_ahraXyslfeyrpfrfJiRP5SeDjbvkHC3gS2g/formResponse',
    email: 'entry.995862042',
    name: 'entry.625175679',
    source: 'entry.1488793218'
  };

  var PRIVACY = 'https://one-lifemedia.com/privacy.html';
  var DELAY_MS = 30000;        // show popup after 30 seconds...
  var SCROLL_SHARE = 0.5;      // ...or after half the page is read
  var SNOOZE_DAYS = 30;        // don't show again for 30 days after closing

  var SITES = {
    home: {
      label: 'One-Life Media',
      eyebrow: 'Studio notes',
      title: 'New work, first.',
      body: 'Once a month we send what we\'ve been making across Content, InBlaq Music and Colourzoo. No noise, just the work.',
      button: 'Sign me up',
      done: 'You\'re on the list. Thanks for signing up.',
      bg: '#0b0b0c', panel: '#111113', text: '#f4f3f0', muted: '#a8a7ac',
      accent: '#fb5b0f', accentText: '#0b0b0c',
      titleFont: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif", titleSize: '44px', titleCase: 'uppercase',
      bodyFont: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif",
      fonts: 'Bebas+Neue&family=Manrope:wght@400;600'
    },
    content: {
      label: 'Content by One-Life Media',
      eyebrow: 'The how',
      title: 'Get the breakdown.',
      body: 'Kit lists, AI workflows and the settings that worked, sent whenever we publish something new.',
      button: 'Send me the how',
      done: 'You\'re on the list. The next breakdown is on its way.',
      bg: '#151414', panel: '#063d61', text: '#ffffff', muted: '#b9d6ea',
      accent: '#1c92e2', accentText: '#ffffff', titleColor: '#7fbae2',
      titleFont: "Gruppo, 'Century Gothic', sans-serif", titleSize: '38px', titleCase: 'none',
      bodyFont: "Arial, Helvetica, sans-serif",
      fonts: 'Gruppo'
    },
    inblaq: {
      label: 'InBlaq Music',
      eyebrow: 'InBlaq Music',
      title: 'Hear it first.',
      body: 'New releases, artist news and show dates from Auxx Wrld, 2106, Harmony and S Naay, straight to your inbox.',
      button: 'Put me on the list',
      done: 'You\'re on the list. New music lands in your inbox first.',
      bg: '#151414', panel: '#000000', text: '#eeeeee', muted: '#9a9a9a',
      accent: '#d52c1f', accentText: '#ffffff',
      titleFont: "Gruppo, 'Century Gothic', sans-serif", titleSize: '40px', titleCase: 'uppercase',
      bodyFont: "'Courier New', Courier, monospace",
      fonts: 'Gruppo'
    },
    colourzoo: {
      label: 'Colourzoo',
      eyebrow: 'Colourzoo',
      title: 'New collections, first.',
      body: 'Colourzoo, the photography studio of One-Life Media, sends new images and licensing offers when each collection goes live.',
      button: 'Join the list',
      done: 'You\'re on the list. New collections will come to you first.',
      bg: '#000000', panel: '#840c15', text: '#ffffff', muted: '#d9b3b6',
      accent: '#eb0012', accentText: '#ffffff',
      titleFont: "Gruppo, 'Century Gothic', sans-serif", titleSize: '38px', titleCase: 'none',
      bodyFont: "'Courier New', Courier, monospace",
      fonts: 'Gruppo'
    }
  };

  var me = document.currentScript;
  var siteKey = (me && me.getAttribute('data-site')) || 'home';
  var S = SITES[siteKey] || SITES.home;
  var KEY = 'olmSignup_' + siteKey;

  // ---- storage helpers (never let storage errors break the page) ----
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function subscribed() { return get(KEY + '_done') === '1'; }
  function snoozed() {
    var t = parseInt(get(KEY + '_closed') || '0', 10);
    return t && (Date.now() - t) < SNOOZE_DAYS * 864e5;
  }

  // ---- styles ----
  function css() {
    var p = '.olm-su';
    return [
      p + '{--bg:' + S.bg + ';--panel:' + S.panel + ';--tx:' + S.text + ';--mu:' + S.muted + ';--ac:' + S.accent + ';--act:' + S.accentText + ';--tt:' + (S.titleColor || S.text) + ';font-family:' + S.bodyFont + ';color:var(--tx);box-sizing:border-box}',
      p + ' *{box-sizing:border-box}',
      p + '-eyebrow{display:inline-block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ac);margin:0 0 10px;font-weight:600}',
      p + '-title{font-family:' + S.titleFont + ';font-size:' + S.titleSize + ';line-height:1.05;text-transform:' + S.titleCase + ';color:var(--tt);margin:0 0 12px;font-weight:400;letter-spacing:.01em}',
      p + '-body{font-size:15px;line-height:1.6;color:var(--mu);margin:0 0 20px}',
      p + '-form{display:flex;flex-wrap:wrap;gap:10px}',
      p + '-in{flex:1 1 160px;min-width:0;height:48px;padding:0 14px;border-radius:6px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:var(--tx);font:inherit;font-size:15px;outline:none;transition:border-color .2s,background .2s}',
      p + '-in::placeholder{color:var(--mu);opacity:.8}',
      p + '-in:focus{border-color:var(--ac);background:rgba(255,255,255,.1)}',
      p + '-btn{flex:1 1 100%;height:48px;border:0;border-radius:6px;background:var(--ac);color:var(--act);font:inherit;font-size:15px;font-weight:700;letter-spacing:.02em;cursor:pointer;transition:transform .15s,filter .2s}',
      p + '-btn:hover{filter:brightness(1.1)}',
      p + '-btn:active{transform:translateY(1px)}',
      p + '-btn[disabled]{opacity:.6;cursor:wait}',
      p + '-fine{flex:1 1 100%;font-size:12px;line-height:1.5;color:var(--mu);margin:4px 0 0}',
      p + '-fine a{color:var(--tx);text-decoration:underline;text-underline-offset:2px}',
      p + '-msg{font-size:15px;line-height:1.6;color:var(--tx);margin:0;padding:14px 16px;border-left:3px solid var(--ac);background:rgba(255,255,255,.05);border-radius:4px}',
      p + '-err{flex:1 1 100%;font-size:13px;color:#ff8a80;margin:0;min-height:0}',
      // popup
      p + '-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .3s}',
      p + '-ov.on{opacity:1}',
      p + '-pop{position:relative;width:100%;max-width:460px;background:var(--bg);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);transform:translateY(16px) scale(.98);transition:transform .35s cubic-bezier(.2,.8,.2,1)}',
      p + '-ov.on ' + p + '-pop{transform:none}',
      p + '-band{height:6px;background:linear-gradient(90deg,var(--ac),var(--panel))}',
      p + '-inner{padding:32px 28px 28px}',
      p + '-x{position:absolute;top:14px;right:14px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:var(--tx);font-size:20px;line-height:36px;text-align:center;cursor:pointer;padding:0}',
      p + '-x:hover{background:rgba(255,255,255,.16)}',
      '@media (max-width:760px){' + p + '-ov{align-items:flex-end;padding:0 10px 78px;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;pointer-events:none}' + p + '-pop{pointer-events:auto;max-width:420px;margin:0 auto;border-radius:12px;transform:translateY(40px)}' + p + '-inner{padding:18px 16px 16px}' + p + '-title{font-size:calc(' + S.titleSize + ' * .6);margin-bottom:6px}' + p + '-body{font-size:13px;margin-bottom:12px}' + p + '-x{top:8px;right:8px;width:32px;height:32px;line-height:32px}' + p + '-in,' + p + '-btn{height:42px}}',
      // inline box
      p + '-box{background:var(--panel);background:linear-gradient(135deg,var(--panel),var(--bg));border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:32px 28px;margin:40px auto;max-width:1100px;display:grid;grid-template-columns:1.1fr 1fr;gap:28px;align-items:center}',
      p + '-box ' + p + '-btn{flex:0 1 auto;padding:0 22px}',
      p + '-box ' + p + '-eyebrow{color:var(--tx);opacity:.85}',
      '@media (max-width:760px){' + p + '-box{grid-template-columns:1fr;padding:26px 20px;margin:28px 16px}' + p + '-box ' + p + '-btn{flex:1 1 100%}}',
      '@media (prefers-reduced-motion:reduce){' + p + '-ov,' + p + '-pop{transition:none}}'
    ].join('');
  }

  function addStyles() {
    if (document.getElementById('olm-su-css')) return;
    if (S.fonts) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + S.fonts + '&display=swap';
      document.head.appendChild(l);
    }
    var s = document.createElement('style');
    s.id = 'olm-su-css';
    s.textContent = css();
    document.head.appendChild(s);
  }

  // ---- form ----
  var uid = 0;
  function formHTML(where) {
    var id = 'olm-su-' + (++uid);
    return '' +
      '<form class="olm-su-form" novalidate data-where="' + where + '">' +
        '<label class="olm-sr" for="' + id + 'n" style="position:absolute;left:-9999px">First name</label>' +
        '<input class="olm-su-in" id="' + id + 'n" name="name" type="text" autocomplete="given-name" placeholder="First name">' +
        '<label class="olm-sr" for="' + id + 'e" style="position:absolute;left:-9999px">Email address</label>' +
        '<input class="olm-su-in" id="' + id + 'e" name="email" type="email" autocomplete="email" required placeholder="Email address">' +
        '<input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">' +
        '<button class="olm-su-btn" type="submit">' + S.button + '</button>' +
        '<p class="olm-su-err" role="alert"></p>' +
        '<p class="olm-su-fine">We only email you about ' + S.label + '. Unsubscribe any time. <a href="' + PRIVACY + '">Privacy policy</a></p>' +
      '</form>';
  }

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function wire(root, onDone) {
    var f = root.querySelector('form');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = f.querySelector('.olm-su-err');
      var email = f.email.value.trim();
      if (f.company.value) return;                       // bot trap
      if (!validEmail(email)) { err.textContent = 'Please check your email address.'; f.email.focus(); return; }
      err.textContent = '';
      var btn = f.querySelector('button');
      btn.disabled = true; btn.textContent = 'Sending...';
      var data = new FormData();
      data.append(FORM.email, email);
      data.append(FORM.name, f.name.value.trim());
      data.append(FORM.source, siteKey + ' / ' + f.getAttribute('data-where') + ' / ' + location.pathname);
      fetch(FORM.action, { method: 'POST', mode: 'no-cors', body: data })
        .then(function () {
          set(KEY + '_done', '1');
          f.outerHTML = '<p class="olm-su-msg" role="status">' + S.done + '</p>';
          if (onDone) onDone();
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = S.button;
          err.textContent = 'That didn\'t go through. Please try again in a moment.';
        });
    });
  }

  // ---- inline box ----
  function inline() {
    var slot = document.querySelector('[data-olm-signup]');
    if (!slot) {
      var foot = document.querySelector('footer, .footer, #footer, .footer-outer');
      if (!foot || !foot.parentNode) return;
      slot = document.createElement('div');
      foot.parentNode.insertBefore(slot, foot);
    }
    slot.className = 'olm-su olm-su-box';
    slot.innerHTML = subscribed()
      ? '<div><span class="olm-su-eyebrow">' + S.eyebrow + '</span><h2 class="olm-su-title">' + S.title + '</h2></div><p class="olm-su-msg">You\'re already on the list. Thank you.</p>'
      : '<div><span class="olm-su-eyebrow">' + S.eyebrow + '</span><h2 class="olm-su-title">' + S.title + '</h2><p class="olm-su-body" style="margin:0">' + S.body + '</p></div><div>' + formHTML('inline') + '</div>';
    if (!subscribed()) wire(slot);
  }

  // ---- popup ----
  var shown = false;
  function popup() {
    if (shown || subscribed() || snoozed()) return;
    shown = true;
    var last = document.activeElement;
    var ov = document.createElement('div');
    ov.className = 'olm-su olm-su-ov';
    ov.innerHTML =
      '<div class="olm-su-pop" role="dialog" aria-modal="true" aria-labelledby="olm-su-pt">' +
        '<div class="olm-su-band"></div>' +
        '<button class="olm-su-x" type="button" aria-label="Close">&times;</button>' +
        '<div class="olm-su-inner">' +
          '<span class="olm-su-eyebrow">' + S.eyebrow + '</span>' +
          '<h2 class="olm-su-title" id="olm-su-pt">' + S.title + '</h2>' +
          '<p class="olm-su-body">' + S.body + '</p>' +
          formHTML('popup') +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('on'); });

    function close() {
      set(KEY + '_closed', String(Date.now()));
      ov.classList.remove('on');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { ov.remove(); if (last && last.focus) last.focus(); }, 300);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {                              // keep focus inside the popup
        var els = ov.querySelectorAll('button, input:not([tabindex="-1"]), a');
        var first = els[0], lastEl = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    }
    ov.querySelector('.olm-su-x').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey);
    if (window.matchMedia && window.matchMedia('(min-width: 761px)').matches) setTimeout(function () { var i = ov.querySelector('input[type=email]'); if (i) i.focus({ preventScroll: true }); }, 350);
    wire(ov, function () { setTimeout(close, 2600); });
  }

  function arm() {
    if (subscribed() || snoozed()) return;
    var t = setTimeout(popup, DELAY_MS);
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && window.scrollY / h >= SCROLL_SHARE) {
        window.removeEventListener('scroll', onScroll);
        clearTimeout(t);
        popup();
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function start() {
    addStyles();
    inline();
    if (!(me && me.hasAttribute('data-no-popup'))) arm();
    window.OLMSignup = { open: function () { shown = false; set(KEY + '_closed', '0'); popup(); } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
