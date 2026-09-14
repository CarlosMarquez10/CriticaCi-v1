/**
 * Cliente para sitios embebidos en Viernes CI (GoodTime y siguientes).
 *
 * En el HTML de la app:
 *   <script src="https://viernesci.web.app/viernes-embed.js"></script>
 *
 * En el servidor de la app, quitar X-Frame-Options: SAMEORIGIN y enviar:
 *   Content-Security-Policy: frame-ancestors 'self' https://viernesci.web.app https://viernesci.firebaseapp.com http://localhost:5173 http://127.0.0.1:5173
 *
 * Sin este script, cualquiera que conozca la URL puede usar la app fuera de Viernes.
 */
(function (global) {
  'use strict';

  var VERIFY_URL = 'https://serverViernes.asolounbit.com/api/auth/verify-token';
  var PARENT_SOURCE = 'viernes-ci';
  var APP_SOURCE = 'viernes-app';
  var SESSION_TYPE = 'VIERNES_SESSION';
  var READY_TYPE = 'VIERNES_APP_READY';

  function defaultOrigins() {
    return {
      'https://viernesci.web.app': true,
      'https://viernesci.firebaseapp.com': true,
      'http://localhost:5173': true,
      'http://127.0.0.1:5173': true,
      'http://localhost:4173': true,
      'http://127.0.0.1:4173': true,
    };
  }

  function isLocalDev(origin) {
    try {
      var u = new URL(origin);
      return (u.hostname === 'localhost' || u.hostname === '127.0.0.1') &&
        (u.protocol === 'http:' || u.protocol === 'https:');
    } catch (e) {
      return false;
    }
  }

  function parentOriginHint() {
    try {
      if (global.location.ancestorOrigins && global.location.ancestorOrigins.length) {
        return global.location.ancestorOrigins[0];
      }
    } catch (e) { /* Safari / Firefox */ }
    try {
      if (document.referrer) return new URL(document.referrer).origin;
    } catch (e2) { /* ignore */ }
    return '';
  }

  function allowedOrigin(origin, extra) {
    if (!origin) return false;
    if (defaultOrigins()[origin]) return true;
    if (extra && extra[origin]) return true;
    if (isLocalDev(origin)) return true;
    try {
      var host = new URL(origin).hostname;
      if (host === 'viernesci.web.app' || host === 'viernesci.firebaseapp.com') return true;
      if (/\.asolounbit\.com$/i.test(host) && /viernes/i.test(host)) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function blockStandalone() {
    var wrap = document.createElement('div');
    wrap.setAttribute('style',
      'min-height:100vh;display:flex;align-items:center;justify-content:center;' +
      'font-family:system-ui,sans-serif;background:#111827;color:#f9fafb;padding:24px;text-align:center;');
    wrap.innerHTML =
      '<div><h1 style="font-size:1.4rem;margin:0 0 8px">Acceso solo desde Viernes CI</h1>' +
      '<p style="margin:0;opacity:.8">Inicia sesión en Viernes y abre esta aplicación desde el menú Apps.</p></div>';
    document.documentElement.innerHTML = '';
    document.documentElement.appendChild(wrap);
  }

  function inIframe() {
    try {
      return global.self !== global.top;
    } catch (e) {
      return true;
    }
  }

  function verifyToken(token, verifyUrl) {
    return fetch(verifyUrl, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    }).then(function (res) {
      if (!res.ok) throw new Error('Sesión de Viernes no válida');
      return res.json();
    });
  }

  function init(options) {
    options = options || {};
    var extra = {};
    (options.origins || []).forEach(function (o) { extra[o] = true; });
    var verifyUrl = options.verifyUrl || VERIFY_URL;
    var timeoutMs = options.timeoutMs || 8000;

    if (!inIframe()) {
      if (options.allowStandalone) return Promise.resolve(null);
      blockStandalone();
      return Promise.reject(new Error('Esta app solo se usa dentro de Viernes CI'));
    }

    try { document.documentElement.classList.add('is-viernes-embed'); } catch (e) { /* ignore */ }

    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error('No se recibió la sesión de Viernes'));
      }, timeoutMs);

      function finish(session) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        global.ViernesEmbed.session = session;
        try {
          global.dispatchEvent(new CustomEvent('viernes-session', { detail: session }));
        } catch (e) { /* IE */ }
        resolve(session);
      }

      global.addEventListener('message', function (event) {
        if (!allowedOrigin(event.origin, extra)) return;
        var data = event.data || {};
        if (data.source !== PARENT_SOURCE || data.type !== SESSION_TYPE) return;
        if (!data.token) return;

        verifyToken(data.token, verifyUrl).then(function (verified) {
          finish({
            token: data.token,
            user: data.user || (verified && verified.data) || null,
            verified: true,
          });
        }).catch(function () {
          finish({
            token: data.token,
            user: data.user || null,
            verified: false,
          });
        });
      });

      var target = parentOriginHint();
      try {
        global.parent.postMessage(
          { source: APP_SOURCE, type: READY_TYPE },
          target && allowedOrigin(target, extra) ? target : '*'
        );
      } catch (e) {
        global.parent.postMessage({ source: APP_SOURCE, type: READY_TYPE }, '*');
      }
    });
  }

  var api = { init: init, session: null };
  global.ViernesEmbed = api;

  if (document.currentScript && document.currentScript.getAttribute('data-auto') !== 'false') {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
