/*!
 * ChengetAI Labs — DSpace Widget Injector
 * Adds a floating "Ask AI" button to any page.
 * Load it with one script tag; it self-initialises.
 *
 * Usage (nginx sub_filter, DSpace community text, or any HTML):
 *   <script src="https://rag.chengetai.co.zw/widget-inject.js"></script>
 */
(function () {
  'use strict';
  if (window.__chengetai_loaded) return;
  window.__chengetai_loaded = true;

  /* ── CONFIG ──────────────────────────────────────────────────── */
  var API   = 'https://rag.chengetai.co.zw';
  var ROSE  = '#9b2248';
  var ROSE2 = '#c43060';
  var BG    = '#0f0d1a';
  var BG2   = '#1a1028';

  var SUGGESTIONS = [
    'climate-smart agriculture Zimbabwe',
    'food security Southern Africa',
    'renewable energy rural communities',
    'maternal health outcomes Zimbabwe',
  ];

  /* ── STYLES ──────────────────────────────────────────────────── */
  var css = [
    /* Floating button */
    '#_cai-btn{position:fixed;bottom:24px;right:24px;z-index:2147483647;',
      'width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;',
      'background:linear-gradient(135deg,'+ROSE+','+ROSE2+');',
      'box-shadow:0 4px 20px rgba(155,34,72,.5);',
      'display:flex;align-items:center;justify-content:center;',
      'transition:transform .2s,box-shadow .2s;}',
    '#_cai-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(155,34,72,.65);}',
    '#_cai-btn svg{width:26px;height:26px;fill:#fff;}',

    /* Badge */
    '#_cai-badge{position:fixed;bottom:72px;right:24px;z-index:2147483646;',
      'background:'+ROSE+';color:#fff;font-size:11px;font-weight:700;',
      'padding:3px 8px;border-radius:12px;white-space:nowrap;',
      'font-family:system-ui,sans-serif;pointer-events:none;',
      'opacity:0;transition:opacity .3s;letter-spacing:.02em;}',
    '#_cai-btn:hover ~ #_cai-badge{opacity:1;}',

    /* Overlay backdrop */
    '#_cai-overlay{position:fixed;inset:0;z-index:2147483645;',
      'background:rgba(0,0,0,.45);backdrop-filter:blur(3px);',
      'opacity:0;pointer-events:none;transition:opacity .25s;}',
    '#_cai-overlay.open{opacity:1;pointer-events:all;}',

    /* Panel */
    '#_cai-panel{position:fixed;right:0;top:0;bottom:0;z-index:2147483646;',
      'width:min(460px,100vw);',
      'background:'+BG+';',
      'display:flex;flex-direction:column;',
      'transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}',
    '#_cai-panel.open{transform:translateX(0);}',

    /* Panel header */
    '#_cai-head{display:flex;align-items:center;justify-content:space-between;',
      'padding:14px 16px;border-bottom:1px solid rgba(155,34,72,.25);',
      'background:rgba(0,0,0,.3);flex-shrink:0;}',
    '#_cai-logo{display:flex;align-items:center;gap:10px;}',
    '#_cai-icon{width:30px;height:30px;border-radius:7px;flex-shrink:0;',
      'background:linear-gradient(135deg,'+ROSE+','+ROSE2+');',
      'display:flex;align-items:center;justify-content:center;',
      'font-size:15px;font-weight:800;color:#fff;}',
    '#_cai-name{font-size:13px;font-weight:700;color:#f0eef8;line-height:1.2;}',
    '#_cai-sub{font-size:10px;color:#8a7fa0;}',
    '#_cai-close{background:none;border:none;cursor:pointer;padding:6px;',
      'color:#8a7fa0;font-size:20px;line-height:1;border-radius:6px;}',
    '#_cai-close:hover{color:#f0eef8;background:rgba(255,255,255,.08);}',

    /* Body */
    '#_cai-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}',

    /* Search box */
    '#_cai-form{display:flex;gap:8px;background:rgba(255,255,255,.06);',
      'border:1.5px solid rgba(155,34,72,.35);border-radius:10px;',
      'padding:4px 4px 4px 12px;transition:border-color .15s;}',
    '#_cai-form:focus-within{border-color:'+ROSE2+';}',
    '#_cai-input{flex:1;background:none;border:none;outline:none;',
      'color:#f0eef8;font-size:13px;padding:7px 0;}',
    '#_cai-input::placeholder{color:#7a6e8a;}',
    '#_cai-send{background:linear-gradient(135deg,'+ROSE+','+ROSE2+');',
      'color:#fff;border:none;border-radius:7px;padding:8px 14px;',
      'font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;}',
    '#_cai-send:disabled{opacity:.4;cursor:not-allowed;}',

    /* Chips */
    '#_cai-chips{display:flex;flex-wrap:wrap;gap:6px;}',
    '._cai-chip{font-size:11px;color:#9a8fb0;background:rgba(255,255,255,.04);',
      'border:1px solid rgba(255,255,255,.08);border-radius:16px;',
      'padding:4px 10px;cursor:pointer;transition:all .15s;}',
    '._cai-chip:hover{color:#f0eef8;border-color:'+ROSE+';background:rgba(155,34,72,.1);}',

    /* Status */
    '#_cai-status{display:none;align-items:center;gap:8px;color:#8a7fa0;font-size:12px;}',
    '#_cai-status.show{display:flex;}',
    '#_cai-spin{width:14px;height:14px;border:2px solid rgba(155,34,72,.25);',
      'border-top-color:'+ROSE+';border-radius:50%;',
      'animation:_cai-spin .7s linear infinite;flex-shrink:0;}',
    '@keyframes _cai-spin{to{transform:rotate(360deg)}}',

    /* Answer */
    '#_cai-answer{display:none;background:'+BG2+';border:1px solid rgba(155,34,72,.2);',
      'border-radius:10px;overflow:hidden;}',
    '#_cai-answer.show{display:block;}',
    '#_cai-ans-head{display:flex;justify-content:space-between;align-items:center;',
      'padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.06);}',
    '#_cai-ans-label{font-size:10px;color:#7a6e8a;font-weight:600;',
      'text-transform:uppercase;letter-spacing:.06em;}',
    '#_cai-trust{font-size:10px;font-weight:700;padding:2px 8px;',
      'border-radius:12px;border:1px solid;}',
    '#_cai-text{padding:14px 12px;font-size:13px;line-height:1.7;',
      'color:#d8d0f0;white-space:pre-wrap;max-height:280px;overflow-y:auto;}',
    '#_cai-cursor{display:inline-block;width:2px;height:12px;',
      'background:'+ROSE2+';animation:_cai-blink .7s step-end infinite;vertical-align:middle;}',
    '@keyframes _cai-blink{50%{opacity:0}}',

    /* Sources */
    '#_cai-sources{display:none;}',
    '#_cai-sources.show{display:block;}',
    '#_cai-src-label{font-size:10px;color:#7a6e8a;font-weight:600;',
      'text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;}',
    '._cai-src{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);',
      'border-radius:8px;padding:9px 11px;margin-bottom:6px;}',
    '._cai-src-doc{font-size:12px;font-weight:600;color:#e0d8f0;margin-bottom:3px;}',
    '._cai-src-exc{font-size:11px;color:#7a6e8a;line-height:1.5;}',

    /* Error */
    '#_cai-err{display:none;font-size:12px;color:#fca5a5;',
      'background:rgba(248,113,113,.06);border:1px solid rgba(248,113,113,.2);',
      'border-radius:8px;padding:10px 12px;}',
    '#_cai-err.show{display:block;}',

    /* DARE bar */
    '#_cai-dare{flex-shrink:0;display:flex;align-items:center;gap:7px;',
      'padding:10px 14px;border-top:1px solid rgba(255,255,255,.06);',
      'background:rgba(180,130,0,.06);font-size:11px;color:#a08040;}',
    '#_cai-dare a{color:#c8a84b;font-weight:600;text-decoration:none;}',

    /* Open platform link */
    '#_cai-openlink{font-size:11px;color:'+ROSE2+';text-decoration:none;',
      'font-weight:600;padding:5px 10px;border:1px solid rgba(212,78,114,.3);',
      'border-radius:5px;white-space:nowrap;}',
    '#_cai-openlink:hover{background:rgba(212,78,114,.1);}',
  ].join('');

  /* ── BUILD DOM ───────────────────────────────────────────────── */
  function el(tag, attrs, inner) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k){ e.setAttribute(k, attrs[k]); });
    if (inner !== undefined) e.innerHTML = inner;
    return e;
  }

  var style = el('style'); style.textContent = css; document.head.appendChild(style);

  /* Floating button */
  var btn = el('button', {id:'_cai-btn', title:'Ask ChengetAI'},
    '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 10H6V10h12v2zm0-3H6V7h12v2z"/></svg>'
  );
  var badge = el('div', {id:'_cai-badge'}, 'Ask AI about DARE research');
  document.body.appendChild(btn);
  document.body.appendChild(badge);

  /* Overlay */
  var overlay = el('div', {id:'_cai-overlay'});
  document.body.appendChild(overlay);

  /* Panel */
  var panel = el('div', {id:'_cai-panel'});
  panel.innerHTML = [
    '<div id="_cai-head">',
      '<div id="_cai-logo">',
        '<div id="_cai-icon">C</div>',
        '<div><div id="_cai-name">ChengetAI Labs</div>',
             '<div id="_cai-sub">AI layer · DARE Repository</div></div>',
      '</div>',
      '<div style="display:flex;align-items:center;gap:8px">',
        '<a id="_cai-openlink" href="'+API+'" target="_blank" rel="noopener">Open ↗</a>',
        '<button id="_cai-close" title="Close">×</button>',
      '</div>',
    '</div>',
    '<div id="_cai-body">',
      '<div id="_cai-form">',
        '<input id="_cai-input" type="text" placeholder="Ask a research question…" autocomplete="off"/>',
        '<button id="_cai-send">Ask</button>',
      '</div>',
      '<div id="_cai-chips"></div>',
      '<div id="_cai-status"><div id="_cai-spin"></div><span id="_cai-stxt">Searching…</span></div>',
      '<div id="_cai-err"></div>',
      '<div id="_cai-answer">',
        '<div id="_cai-ans-head">',
          '<span id="_cai-ans-label">AI Answer · DARE sources</span>',
          '<span id="_cai-trust"></span>',
        '</div>',
        '<div id="_cai-text"></div>',
      '</div>',
      '<div id="_cai-sources"><div id="_cai-src-label">Source documents</div><div id="_cai-src-list"></div></div>',
    '</div>',
    '<div id="_cai-dare">',
      '🔒 Grounded in <a href="https://dspace.dare.co.zw" target="_blank" rel="noopener">dspace.dare.co.zw</a> · DSpace 8.1',
    '</div>',
  ].join('');
  document.body.appendChild(panel);

  /* ── WIRE CHIPS ──────────────────────────────────────────────── */
  var chipsEl = document.getElementById('_cai-chips');
  SUGGESTIONS.forEach(function(s) {
    var c = el('button', {class:'_cai-chip'}, s);
    c.onclick = function(){ document.getElementById('_cai-input').value = s; ask(); };
    chipsEl.appendChild(c);
  });

  /* ── OPEN / CLOSE ────────────────────────────────────────────── */
  function open() { panel.classList.add('open'); overlay.classList.add('open'); }
  function close(){ panel.classList.remove('open'); overlay.classList.remove('open'); }

  btn.onclick     = open;
  overlay.onclick = close;
  document.getElementById('_cai-close').onclick = close;
  document.addEventListener('keydown', function(e){ if (e.key==='Escape') close(); });

  /* ── HELPERS ─────────────────────────────────────────────────── */
  function show(id){ document.getElementById(id).classList.add('show'); }
  function hide(id){ document.getElementById(id).classList.remove('show'); }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function setTrust(level) {
    var t = document.getElementById('_cai-trust');
    var map = {HIGH:['#4ade80','rgba(74,222,128,.3)'], MEDIUM:['#c8a84b','rgba(200,168,75,.3)'], LOW:['#f87171','rgba(248,113,113,.3)']};
    var c = map[level] || map.LOW;
    t.textContent = level;
    t.style.cssText = 'color:'+c[0]+';border-color:'+c[1]+';background:'+c[1].replace('.3','.08')+';';
  }

  function renderSources(sources) {
    if (!sources || !sources.length) return;
    var list = document.getElementById('_cai-src-list');
    list.innerHTML = '';
    sources.slice(0,4).forEach(function(s, i) {
      var d = el('div', {class:'_cai-src'});
      d.innerHTML = '<div class="_cai-src-doc">['+( i+1 )+'] '+esc(s.document)+'</div>'+
        '<div class="_cai-src-exc">'+esc((s.excerpt||s.chunk||'').slice(0,160))+'…</div>';
      list.appendChild(d);
    });
    show('_cai-sources');
  }

  /* ── ASK ─────────────────────────────────────────────────────── */
  document.getElementById('_cai-input').addEventListener('keydown', function(e){
    if (e.key==='Enter') ask();
  });
  document.getElementById('_cai-send').onclick = ask;

  function ask() {
    var q = document.getElementById('_cai-input').value.trim();
    if (!q) return;

    /* reset */
    hide('_cai-answer'); hide('_cai-sources'); hide('_cai-err');
    document.getElementById('_cai-text').innerHTML = '';
    document.getElementById('_cai-src-list').innerHTML = '';
    document.getElementById('_cai-send').disabled = true;
    document.getElementById('_cai-stxt').textContent = 'Searching DARE…';
    show('_cai-status');

    fetch(API+'/api/ask/stream', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({question: q, top_k: 5})
    }).then(function(resp) {
      if (!resp.ok) throw new Error('Server error '+resp.status);
      show('_cai-answer');
      var reader = resp.body.getReader();
      var dec = new TextDecoder();
      var buf = '';

      function pump() {
        return reader.read().then(function(r) {
          if (r.done) return;
          buf += dec.decode(r.value, {stream:true});
          var parts = buf.split('\n\n');
          buf = parts.pop();
          parts.forEach(function(part) {
            var line = part.trim();
            if (!line.startsWith('data: ')) return;
            var evt;
            try { evt = JSON.parse(line.slice(6)); } catch(e) { return; }
            var txt = document.getElementById('_cai-text');

            if (evt.type === 'meta') {
              document.getElementById('_cai-stxt').textContent = 'Generating answer…';
              renderSources(evt.sources);
              if (evt.trust) setTrust(evt.trust.trust_level);
            } else if (evt.type === 'token') {
              hide('_cai-status');
              var cur = txt.querySelector('#_cai-cursor');
              if (cur) cur.remove();
              txt.appendChild(document.createTextNode(evt.content));
              var c = el('span', {id:'_cai-cursor'}); txt.appendChild(c);
            } else if (evt.type === 'done') {
              var cur = txt.querySelector('#_cai-cursor');
              if (cur) cur.remove();
            } else if (evt.type === 'error') {
              hide('_cai-status');
              document.getElementById('_cai-err').textContent = 'Error: '+(evt.detail||'unknown');
              show('_cai-err');
            }
          });
          return pump();
        });
      }
      return pump();
    }).catch(function(err) {
      hide('_cai-answer'); hide('_cai-status');
      document.getElementById('_cai-err').textContent =
        err.message.indexOf('fetch') > -1
          ? 'Cannot reach '+API+' — is the backend running?'
          : err.message;
      show('_cai-err');
    }).finally(function() {
      document.getElementById('_cai-send').disabled = false;
      hide('_cai-status');
    });
  }

})();
