/**
 * RoseRAG — DSpace Home Page Integration
 * Embeds an AI-powered search section into the DSpace home page.
 *
 * Inject via nginx sub_filter on the DSpace server:
 *   sub_filter '</head>' '<script src="https://roserag.dare.co.zw/dspace-home-inject.js" defer></script></head>';
 *
 * Or run the one-command installer:
 *   curl -fsSL https://roserag.dare.co.zw/dspace-inject.sh | bash
 */
(function () {
  'use strict';

  if (window.__roserag_home_loaded) return;
  window.__roserag_home_loaded = true;

  /* ── Config ─────────────────────────────────────────────────── */

  var API   = 'https://roserag.dare.co.zw';
  var ID    = '_rr-home';
  var CHIPS = ['food security Zimbabwe', 'climate change Southern Africa', 'maternal health outcomes', 'renewable energy rural'];

  /* ── Routing helpers ────────────────────────────────────────── */

  function isHome() {
    var p = location.pathname.replace(/^\/[a-z]{2}(\/|$)/, '/'); // strip /en/, /fr/ etc.
    return p === '/' || p === '' || p === '/home' || p === '/home/';
  }

  function removeBanner() {
    var el = document.getElementById(ID);
    if (el) el.remove();
  }

  /* ── Styles ─────────────────────────────────────────────────── */

  var CSS = [
    '#' + ID + ' {',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    '  background: linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #1a0a14 100%);',
    '  color: #fff;',
    '  padding: 40px 20px 36px;',
    '  position: relative;',
    '  overflow: hidden;',
    '  box-sizing: border-box;',
    '  width: 100%;',
    '}',
    '#' + ID + ' * { box-sizing: border-box; }',

    /* ambient glow */
    '#' + ID + '::before {',
    '  content: "";',
    '  position: absolute;',
    '  top: -60px; left: 50%; transform: translateX(-50%);',
    '  width: 600px; height: 300px;',
    '  background: radial-gradient(ellipse, rgba(225,29,72,0.12) 0%, transparent 70%);',
    '  pointer-events: none;',
    '}',

    '._rr-inner {',
    '  max-width: 760px;',
    '  margin: 0 auto;',
    '  position: relative;',
    '  z-index: 1;',
    '}',

    /* header row */
    '._rr-header {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 10px;',
    '  margin-bottom: 20px;',
    '}',
    '._rr-logo-icon {',
    '  width: 32px; height: 32px;',
    '  background: #e11d48;',
    '  border-radius: 8px;',
    '  display: flex; align-items: center; justify-content: center;',
    '  font-size: 14px; font-weight: 900; color: #fff;',
    '  flex-shrink: 0;',
    '}',
    '._rr-logo-text { font-size: 15px; font-weight: 800; letter-spacing: -0.3px; }',
    '._rr-logo-text span:first-child { color: #fb7185; }',
    '._rr-logo-text span:last-child  { color: #fff; }',
    '._rr-tagline {',
    '  margin-left: 8px;',
    '  font-size: 11px; color: rgba(255,255,255,0.35);',
    '  border-left: 1px solid rgba(255,255,255,0.12);',
    '  padding-left: 10px;',
    '  line-height: 1;',
    '}',

    /* heading */
    '._rr-heading {',
    '  font-size: clamp(18px, 3vw, 26px);',
    '  font-weight: 800;',
    '  line-height: 1.2;',
    '  margin: 0 0 6px;',
    '  letter-spacing: -0.5px;',
    '}',
    '._rr-heading em { color: #fb7185; font-style: normal; }',
    '._rr-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0 0 20px; }',

    /* search row */
    '._rr-search-row {',
    '  display: flex;',
    '  gap: 8px;',
    '  margin-bottom: 12px;',
    '}',
    '._rr-input {',
    '  flex: 1;',
    '  background: rgba(255,255,255,0.06);',
    '  border: 1px solid rgba(255,255,255,0.12);',
    '  border-radius: 12px;',
    '  padding: 13px 16px;',
    '  font-size: 14px;',
    '  color: #fff;',
    '  outline: none;',
    '  transition: border-color 0.15s, background 0.15s;',
    '}',
    '._rr-input::placeholder { color: rgba(255,255,255,0.3); }',
    '._rr-input:focus {',
    '  border-color: rgba(225,29,72,0.6);',
    '  background: rgba(255,255,255,0.09);',
    '}',
    '._rr-btn {',
    '  background: #e11d48;',
    '  color: #fff;',
    '  border: none;',
    '  border-radius: 10px;',
    '  padding: 0 22px;',
    '  font-size: 13px;',
    '  font-weight: 700;',
    '  cursor: pointer;',
    '  transition: background 0.15s;',
    '  white-space: nowrap;',
    '}',
    '._rr-btn:hover:not(:disabled) { background: #be123c; }',
    '._rr-btn:disabled { opacity: 0.55; cursor: not-allowed; }',

    /* chips */
    '._rr-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 0; }',
    '._rr-chip {',
    '  background: rgba(255,255,255,0.06);',
    '  border: 1px solid rgba(255,255,255,0.1);',
    '  border-radius: 99px;',
    '  padding: 5px 12px;',
    '  font-size: 11px;',
    '  color: rgba(255,255,255,0.5);',
    '  cursor: pointer;',
    '  transition: all 0.15s;',
    '}',
    '._rr-chip:hover {',
    '  background: rgba(255,255,255,0.1);',
    '  color: rgba(255,255,255,0.85);',
    '  border-color: rgba(255,255,255,0.2);',
    '}',

    /* results box */
    '._rr-results {',
    '  margin-top: 20px;',
    '  background: rgba(255,255,255,0.04);',
    '  border: 1px solid rgba(255,255,255,0.1);',
    '  border-radius: 14px;',
    '  overflow: hidden;',
    '  display: none;',
    '}',
    '._rr-results._rr-visible { display: block; }',

    '._rr-res-header {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  padding: 12px 16px;',
    '  border-bottom: 1px solid rgba(255,255,255,0.08);',
    '}',
    '._rr-res-label {',
    '  font-size: 11px;',
    '  font-weight: 700;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.08em;',
    '  color: rgba(255,255,255,0.35);',
    '}',
    '._rr-res-close {',
    '  background: none; border: none; cursor: pointer;',
    '  color: rgba(255,255,255,0.3); font-size: 18px; line-height: 1;',
    '  padding: 0; transition: color 0.1s;',
    '}',
    '._rr-res-close:hover { color: rgba(255,255,255,0.7); }',

    '._rr-res-body { padding: 16px; }',

    '._rr-answer {',
    '  font-size: 14px;',
    '  line-height: 1.7;',
    '  color: rgba(255,255,255,0.85);',
    '  white-space: pre-wrap;',
    '  min-height: 24px;',
    '}',
    '._rr-cursor::after {',
    '  content: "▋";',
    '  animation: _rr-blink 1s step-end infinite;',
    '  color: #e11d48;',
    '}',
    '@keyframes _rr-blink { 0%,100%{opacity:1} 50%{opacity:0} }',

    '._rr-sources {',
    '  margin-top: 14px;',
    '  border-top: 1px solid rgba(255,255,255,0.08);',
    '  padding-top: 12px;',
    '}',
    '._rr-sources-label {',
    '  font-size: 10px;',
    '  font-weight: 700;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.1em;',
    '  color: rgba(255,255,255,0.3);',
    '  margin-bottom: 8px;',
    '}',
    '._rr-source-item {',
    '  display: flex;',
    '  align-items: flex-start;',
    '  gap: 8px;',
    '  padding: 8px 10px;',
    '  border-radius: 8px;',
    '  margin-bottom: 4px;',
    '  transition: background 0.12s;',
    '  text-decoration: none;',
    '}',
    'a._rr-source-item:hover { background: rgba(255,255,255,0.06); }',
    '._rr-source-num {',
    '  flex-shrink: 0;',
    '  width: 18px; height: 18px;',
    '  background: #e11d48;',
    '  border-radius: 50%;',
    '  display: flex; align-items: center; justify-content: center;',
    '  font-size: 9px; font-weight: 700; color: #fff;',
    '}',
    '._rr-source-info { flex: 1; min-width: 0; }',
    '._rr-source-title {',
    '  font-size: 12px; font-weight: 600;',
    '  color: rgba(255,255,255,0.85);',
    '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
    '}',
    '._rr-source-meta { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }',

    '._rr-open-link {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '  margin-top: 14px;',
    '  font-size: 12px;',
    '  color: #fb7185;',
    '  font-weight: 600;',
    '  text-decoration: none;',
    '  transition: color 0.12s;',
    '}',
    '._rr-open-link:hover { color: #fda4af; }',

    '._rr-error {',
    '  font-size: 13px;',
    '  color: rgba(255,100,100,0.85);',
    '  padding: 4px 0;',
    '}',

    '._rr-spinner {',
    '  display: inline-block;',
    '  width: 16px; height: 16px;',
    '  border: 2px solid rgba(225,29,72,0.3);',
    '  border-top-color: #e11d48;',
    '  border-radius: 50%;',
    '  animation: _rr-spin 0.7s linear infinite;',
    '  vertical-align: middle;',
    '  margin-right: 8px;',
    '}',
    '@keyframes _rr-spin { to { transform: rotate(360deg); } }',

    /* responsive */
    '@media (max-width: 600px) {',
    '  #' + ID + ' { padding: 28px 16px 24px; }',
    '  ._rr-search-row { flex-direction: column; }',
    '  ._rr-btn { padding: 13px; }',
    '}',
  ].join('\n');

  /* ── DOM builders ───────────────────────────────────────────── */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'className') node.className = attrs[k];
      else if (k === 'textContent') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    });
    return node;
  }

  function buildBanner() {
    /* style tag */
    var style = document.createElement('style');
    style.textContent = CSS;

    /* logo */
    var logoIcon = el('div', { className: '_rr-logo-icon' }, ['R']);
    var logoText = document.createElement('div');
    logoText.className = '_rr-logo-text';
    logoText.innerHTML = '<span>ROSE</span><span>RAG</span>';
    var tagline = el('span', { className: '_rr-tagline' }, ['AI Research Intelligence']);
    var header = el('div', { className: '_rr-header' }, [logoIcon, logoText, tagline]);

    /* heading */
    var heading = document.createElement('h2');
    heading.className = '_rr-heading';
    heading.innerHTML = 'Ask anything about <em>DARE Research</em>';
    var sub = el('p', { className: '_rr-sub' }, ['Get cited AI answers from the DARE institutional repository — powered by RoseRAG.']);

    /* search */
    var input = el('input', {
      className: '_rr-input',
      type: 'text',
      id: '_rr-q',
      placeholder: 'e.g. food security trends in Zimbabwe…',
      autocomplete: 'off',
    });
    var btn = el('button', { className: '_rr-btn', id: '_rr-go', type: 'button' }, ['Ask AI']);
    var searchRow = el('div', { className: '_rr-search-row' }, [input, btn]);

    /* chips */
    var chips = el('div', { className: '_rr-chips' });
    CHIPS.forEach(function (c) {
      var chip = el('button', { className: '_rr-chip', type: 'button' });
      chip.textContent = c;
      chip.addEventListener('click', function () { input.value = c; doSearch(c); });
      chips.appendChild(chip);
    });

    /* results */
    var resClose = el('button', { className: '_rr-res-close', type: 'button', title: 'Close', 'aria-label': 'Close results' }, ['×']);
    var resLabel = el('span', { className: '_rr-res-label' }, ['AI Answer']);
    var resHeader = el('div', { className: '_rr-res-header' }, [resLabel, resClose]);
    var answerEl = el('div', { className: '_rr-answer', id: '_rr-answer' });
    var sourcesEl = el('div', { className: '_rr-sources', id: '_rr-sources', style: 'display:none' });
    var openLink = el('a', {
      className: '_rr-open-link',
      href: API + '/app/search',
      target: '_blank',
      rel: 'noopener noreferrer',
      id: '_rr-open',
      style: 'display:none',
    }, ['Open full search  →']);
    var resBody = el('div', { className: '_rr-res-body' }, [answerEl, sourcesEl, openLink]);
    var results = el('div', { className: '_rr-results', id: '_rr-results' }, [resHeader, resBody]);

    resClose.addEventListener('click', function () {
      results.classList.remove('_rr-visible');
      answerEl.textContent = '';
      answerEl.classList.remove('_rr-cursor');
      sourcesEl.style.display = 'none';
      sourcesEl.innerHTML = '';
      openLink.style.display = 'none';
    });

    /* assemble */
    var inner = el('div', { className: '_rr-inner' }, [header, heading, sub, searchRow, chips, results]);
    var banner = el('div', { id: ID });
    banner.appendChild(style);
    banner.appendChild(inner);

    return banner;
  }

  /* ── Search logic ───────────────────────────────────────────── */

  function doSearch(query) {
    if (!query || !query.trim()) return;

    var results = document.getElementById('_rr-results');
    var answerEl = document.getElementById('_rr-answer');
    var sourcesEl = document.getElementById('_rr-sources');
    var openLink = document.getElementById('_rr-open');
    var btn = document.getElementById('_rr-go');

    if (!results || !answerEl) return;

    /* reset */
    answerEl.innerHTML = '<span class="_rr-spinner"></span>Searching DARE repository…';
    answerEl.classList.remove('_rr-cursor');
    sourcesEl.innerHTML = '';
    sourcesEl.style.display = 'none';
    openLink.style.display = 'none';
    results.classList.add('_rr-visible');
    btn.disabled = true;

    /* scroll banner into view on mobile */
    var banner = document.getElementById(ID);
    if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'start' });

    var es = new EventSource(API + '/api/ask/stream?q=' + encodeURIComponent(query));
    var fullText = '';
    var started = false;
    var sourcesData = [];

    es.addEventListener('token', function (e) {
      if (!started) {
        answerEl.textContent = '';
        answerEl.classList.add('_rr-cursor');
        started = true;
      }
      fullText += e.data;
      answerEl.textContent = fullText;
    });

    es.addEventListener('sources', function (e) {
      try { sourcesData = JSON.parse(e.data); } catch (_) {}
    });

    es.addEventListener('done', function () {
      es.close();
      btn.disabled = false;
      answerEl.classList.remove('_rr-cursor');

      if (sourcesData.length > 0) {
        sourcesEl.style.display = 'block';
        var label = el('div', { className: '_rr-sources-label' }, ['Sources']);
        sourcesEl.appendChild(label);

        sourcesData.slice(0, 5).forEach(function (s, i) {
          var num = el('div', { className: '_rr-source-num' }, [String(i + 1)]);
          var title = el('div', { className: '_rr-source-title' }, [s.title || 'Untitled']);
          var meta = el('div', { className: '_rr-source-meta' }, [
            (s.author ? s.author + ' · ' : '') + (s.year || ''),
          ]);
          var info = el('div', { className: '_rr-source-info' }, [title, meta]);
          var item = el('a', {
            className: '_rr-source-item',
            href: s.url || (API + '/app/search'),
            target: '_blank',
            rel: 'noopener noreferrer',
          }, [num, info]);
          sourcesEl.appendChild(item);
        });
      }

      openLink.href = API + '/app/search?q=' + encodeURIComponent(query);
      openLink.style.display = 'inline-flex';
    });

    es.addEventListener('error', function () {
      es.close();
      btn.disabled = false;
      answerEl.classList.remove('_rr-cursor');
      if (!fullText) {
        answerEl.innerHTML = '<span class="_rr-error">Could not connect to RoseRAG. Please try again.</span>';
      }
    });
  }

  /* ── Injection ──────────────────────────────────────────────── */

  var injected = false;
  var observer = null;

  function injectBanner() {
    if (!isHome()) {
      removeBanner();
      injected = false;
      return;
    }
    if (injected || document.getElementById(ID)) return;

    /* Find where to inject: before ds-home-page, ds-search-form, or main */
    var anchor =
      document.querySelector('ds-home-page') ||
      document.querySelector('ds-search-form') ||
      document.querySelector('main') ||
      document.querySelector('[role="main"]');

    if (!anchor) return; /* Angular hasn't rendered yet — observer will retry */

    var banner = buildBanner();
    anchor.parentNode.insertBefore(banner, anchor);
    injected = true;

    /* wire up search input */
    var input = document.getElementById('_rr-q');
    var btn = document.getElementById('_rr-go');
    if (input && btn) {
      btn.addEventListener('click', function () { doSearch(input.value.trim()); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doSearch(input.value.trim());
      });
    }
  }

  function setupObserver() {
    if (observer) return;
    observer = new MutationObserver(function () {
      if (isHome() && !document.getElementById(ID)) {
        injectBanner();
      } else if (!isHome() && document.getElementById(ID)) {
        removeBanner();
        injected = false;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ── SPA routing: patch history.pushState ───────────────────── */

  var _push = history.pushState.bind(history);
  history.pushState = function () {
    _push.apply(history, arguments);
    injected = false;
    setTimeout(injectBanner, 400);
  };
  window.addEventListener('popstate', function () {
    injected = false;
    setTimeout(injectBanner, 400);
  });

  /* ── Boot ───────────────────────────────────────────────────── */

  function boot() {
    setupObserver();
    injectBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
