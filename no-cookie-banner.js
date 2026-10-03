/*!
 * no-cookie-banner.js v1.0.0
 *
 * Zeigt kurz einen Hinweis, dass die Website ohne Cookies auskommt.
 * Nach Ablauf der Anzeigedauer fährt ein stilisierter Mauszeiger zum
 * OK-Button und klickt den Hinweis "als Service" automatisch weg.
 *
 * Plain JavaScript, keine Abhängigkeiten, keine weiteren Dateien.
 * Das Script setzt selbst keine Cookies und speichert nichts im Browser.
 *
 * Lizenz: MIT, Copyright (c) 2026 joergzimmer
 * https://github.com/joergzimmer/no-cookie-banner
 *
 * ---------------------------------------------------------------------------
 * Einbindung
 * ---------------------------------------------------------------------------
 *
 *   <script src="no-cookie-banner.js" defer></script>
 *
 * Konfiguration über data-Attribute am Script-Tag:
 *
 *   <script src="no-cookie-banner.js" defer
 *           data-text="Diese Seite kommt komplett ohne Cookies aus."
 *           data-button-text="Alles klar"
 *           data-duration="2000"></script>
 *
 * oder über ein globales Objekt, das VOR dem Script definiert wird:
 *
 *   <script>
 *     window.NoCookieBannerConfig = {
 *       text: 'Diese Seite kommt komplett ohne Cookies aus.',
 *       buttonText: 'Alles klar',
 *       duration: 2000,
 *       onClose: function (reason) { console.log('Banner geschlossen:', reason); }
 *     };
 *   </script>
 *   <script src="no-cookie-banner.js" defer></script>
 *
 * oder manuell per API (dann data-auto-start="false" setzen):
 *
 *   NoCookieBanner.show({ text: 'Hallo!', duration: 3000 });
 *   NoCookieBanner.hide();
 *
 * Vorrang: Standardwerte < NoCookieBannerConfig < data-Attribute < show(options)
 *
 * ---------------------------------------------------------------------------
 * Optionen                                              data-Attribut
 * ---------------------------------------------------------------------------
 *
 *   text             Hinweistext im Banner              data-text
 *   buttonText       Beschriftung des Buttons           data-button-text
 *   duration         Anzeigedauer in ms bis zum         data-duration
 *                    automatischen Klick
 *                    (Standard 2000, mindestens 800)
 *   delay            Wartezeit in ms vor dem            data-delay
 *                    Einblenden (Standard 300)
 *   position         bottom | top | bottom-left |       data-position
 *                    bottom-right | top-left | top-right
 *   autoStart        Beim Laden automatisch anzeigen    data-auto-start
 *                    (Standard true)
 *   onlyOnEntry      Nur anzeigen, wenn der Besucher    data-only-on-entry
 *                    von außen kommt (Prüfung über den
 *                    Referrer, ohne Speicherung im
 *                    Browser; Standard false)
 *   showIcon         Schild-Symbol anzeigen             data-show-icon
 *                    (Standard true)
 *   background       Hintergrundfarbe des Banners       data-background
 *   textColor        Textfarbe                          data-text-color
 *   accentColor      Farbe von Button und Symbol        data-accent-color
 *   buttonTextColor  Textfarbe des Buttons              data-button-text-color
 *   zIndex           z-index (Standard 2147483000)      data-z-index
 *   nonce            CSP-Nonce für den Style-Fallback   (wird vom Script-Tag
 *                                                       übernommen)
 *   onClose          Callback(reason), reason ist       nur per JavaScript
 *                    'auto' | 'user' | 'api'
 */
(function (window, document) {
  'use strict';

  if (window.NoCookieBanner) return;

  var VERSION = '1.0.0';

  var DEFAULTS = {
    text: 'Diese Website verwendet keine Cookies und respektiert Ihre Privatsphäre.',
    buttonText: 'OK',
    duration: 2000,
    delay: 300,
    position: 'bottom',
    autoStart: true,
    onlyOnEntry: false,
    showIcon: true,
    background: '#1f2933',
    textColor: '#f5f7fa',
    accentColor: '#3ecf8e',
    buttonTextColor: '#0b1f14',
    zIndex: 2147483000,
    nonce: '',
    onClose: null
  };

  var MIN_DURATION = 800;
  var PRESS_TIME = 140;               // ms, die der Zeiger den Button gedrückt hält
  var CURSOR_TIP = { x: 4, y: 3 };    // Spitze des Zeigers im 32x32-SVG

  var SVG_NS = 'http://www.w3.org/2000/svg';

  var CSS = [
    ':host { all: initial; }',

    '.wrap {',
    '  position: fixed; left: 0; right: 0; z-index: var(--ncb-z);',
    '  display: flex; justify-content: center;',
    '  box-sizing: border-box; padding: 16px;',
    '  pointer-events: none;',
    '}',
    '.wrap.bottom { bottom: 0; padding-bottom: max(16px, env(safe-area-inset-bottom)); }',
    '.wrap.top { top: 0; padding-top: max(16px, env(safe-area-inset-top)); }',
    '.wrap.left { justify-content: flex-start; }',
    '.wrap.right { justify-content: flex-end; }',

    '.banner {',
    '  pointer-events: auto; box-sizing: border-box;',
    '  display: flex; align-items: center; gap: 14px;',
    '  width: 100%; max-width: 560px; margin: 0; padding: 12px 12px 12px 16px;',
    '  background: var(--ncb-bg); color: var(--ncb-fg);',
    '  border-radius: 14px;',
    '  box-shadow: 0 12px 32px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.18);',
    '  font: 15px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
    '  opacity: 0; transform: translateY(16px);',
    '  transition: opacity .3s ease, transform .35s cubic-bezier(.2,.8,.2,1);',
    '}',
    '.wrap.left .banner, .wrap.right .banner { max-width: 420px; }',
    '.wrap.top .banner { transform: translateY(-16px); }',
    '.wrap .banner.is-visible { opacity: 1; transform: none; }',
    '.wrap .banner.is-hiding { opacity: 0; transform: translateY(6px) scale(.97); pointer-events: none; }',
    '.wrap.top .banner.is-hiding { transform: translateY(-6px) scale(.97); }',

    '.icon { flex: none; width: 26px; height: 26px; color: var(--ncb-accent); }',
    '.text { flex: 1 1 auto; margin: 0; }',

    '.btn {',
    '  flex: none; margin: 0; -webkit-appearance: none; appearance: none;',
    '  border: 0; border-radius: 10px; padding: 9px 20px;',
    '  background: var(--ncb-accent); color: var(--ncb-btn-fg);',
    '  font: inherit; font-weight: 600; letter-spacing: .01em;',
    '  cursor: pointer;',
    '  transition: transform .12s ease, filter .12s ease;',
    '}',
    '.btn:hover { filter: brightness(1.06); }',
    '.btn:focus-visible { outline: 2px solid var(--ncb-fg); outline-offset: 2px; }',
    '.btn.is-pressed { transform: scale(.93); filter: brightness(.88); }',

    '.cursor {',
    '  position: fixed; left: 0; top: 0; z-index: var(--ncb-z);',
    '  width: 32px; height: 32px; pointer-events: none;',
    '  opacity: 0; transition: opacity .2s ease;',
    '  will-change: transform, opacity;',
    '}',
    '.cursor.is-visible { opacity: 1; }',
    '.cursor-y { position: relative; width: 100%; height: 100%; will-change: transform; }',
    '.pointer {',
    '  position: relative; display: block; width: 100%; height: 100%; overflow: visible;',
    '  filter: drop-shadow(0 2px 3px rgba(0,0,0,.35));',
    '  transform-origin: 4px 3px; transition: transform .1s ease;',
    '}',
    '.cursor.is-pressed .pointer { transform: scale(.82); }',
    '.ripple {',
    '  position: absolute; left: -14px; top: -15px; width: 36px; height: 36px;',
    '  border-radius: 50%; background: var(--ncb-accent);',
    '  opacity: 0; transform: scale(.2);',
    '}',
    '.cursor.is-clicking .ripple { animation: ncb-ripple .5s ease-out; }',
    '@keyframes ncb-ripple {',
    '  from { opacity: .6; transform: scale(.2); }',
    '  to { opacity: 0; transform: scale(1.4); }',
    '}',

    '@media (max-width: 480px) {',
    '  .banner { font-size: 14px; gap: 10px; }',
    '  .btn { padding: 8px 16px; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .banner { transform: none !important; }',
    '}'
  ].join('\n');

  var script = document.currentScript;
  var active = null;

  var baseConfig = extend({}, DEFAULTS,
    { nonce: (script && script.nonce) || '' },
    window.NoCookieBannerConfig,
    readDataAttributes(script));

  function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      for (var key in src) {
        if (Object.prototype.hasOwnProperty.call(src, key) && src[key] !== undefined) {
          target[key] = src[key];
        }
      }
    }
    return target;
  }

  // data-button-text -> buttonText usw., Werte werden passend zum Standardwert umgewandelt
  function readDataAttributes(el) {
    var cfg = {};
    if (!el || !el.dataset) return cfg;
    for (var key in DEFAULTS) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key) || !(key in el.dataset)) continue;
      var raw = el.dataset[key];
      var def = DEFAULTS[key];
      if (typeof def === 'number') {
        var num = parseFloat(raw);
        if (isFinite(num)) cfg[key] = num;
      } else if (typeof def === 'boolean') {
        cfg[key] = !/^(false|0|no|off)$/i.test(raw);
      } else if (typeof def === 'string') {
        cfg[key] = raw;
      }
    }
    return cfg;
  }

  function cameFromSameSite() {
    var origin = window.location.origin;
    return !!document.referrer && document.referrer.indexOf(origin + '/') === 0;
  }

  function h(tag, className) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function svg(tag, attrs, children) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var name in attrs) el.setAttribute(name, attrs[name]);
    (children || []).forEach(function (child) { el.appendChild(child); });
    return el;
  }

  function shieldIcon() {
    return svg('svg', {
      'class': 'icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true'
    }, [
      svg('path', { d: 'M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z' }),
      svg('path', { d: 'M8.5 12.2l2.4 2.4 4.6-4.8' })
    ]);
  }

  function pointerIcon() {
    return svg('svg', { 'class': 'pointer', viewBox: '0 0 32 32', width: '32', height: '32' }, [
      svg('path', {
        d: 'M4 3 L4 25.5 L9.6 20.3 L13.5 28.8 L17 27.3 L13.2 18.9 L20.9 18.9 Z',
        fill: '#fff', stroke: '#111', 'stroke-width': '1.6', 'stroke-linejoin': 'round'
      })
    ]);
  }

  // Constructable Stylesheets laufen auch unter strikter CSP; sonst <style> mit Nonce
  function applyStyles(root, nonce) {
    if ('adoptedStyleSheets' in root) {
      try {
        var sheet = new CSSStyleSheet();
        sheet.replaceSync(CSS);
        root.adoptedStyleSheets = [sheet];
        return;
      } catch (e) { /* Fallback unten */ }
    }
    var style = h('style');
    if (nonce) style.setAttribute('nonce', nonce);
    style.textContent = CSS;
    root.appendChild(style);
  }

  function show(options) {
    if (active || !document.body || !Element.prototype.attachShadow) return;

    var cfg = extend({}, baseConfig, options);
    if (cfg.onlyOnEntry && cameFromSameSite()) return;

    var duration = Math.max(MIN_DURATION, Number(cfg.duration) || DEFAULTS.duration);
    var delay = Math.max(0, Number(cfg.delay) || 0);
    var position = String(cfg.position || DEFAULTS.position);
    var vertical = position.indexOf('top') !== -1 ? 'top' : 'bottom';
    var horizontal = position.indexOf('left') !== -1 ? 'left'
      : position.indexOf('right') !== -1 ? 'right' : 'center';
    var reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var timers = [];
    var closed = false;
    var controller = { close: close };
    active = controller;

    // --- DOM aufbauen (in einem Shadow Root, damit Seiten-CSS nichts verändert) ---
    var host = h('div');
    host.setAttribute('data-no-cookie-banner', '');
    var vars = {
      '--ncb-bg': cfg.background,
      '--ncb-fg': cfg.textColor,
      '--ncb-accent': cfg.accentColor,
      '--ncb-btn-fg': cfg.buttonTextColor,
      '--ncb-z': parseInt(cfg.zIndex, 10) || DEFAULTS.zIndex
    };
    for (var name in vars) host.style.setProperty(name, String(vars[name]));

    var root = host.attachShadow({ mode: 'open' });
    applyStyles(root, cfg.nonce);

    var wrap = h('div', 'wrap ' + vertical + ' ' + horizontal);
    var banner = h('div', 'banner');
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    if (cfg.showIcon) banner.appendChild(shieldIcon());

    var text = h('p', 'text');
    text.textContent = String(cfg.text);
    var button = h('button', 'btn');
    button.type = 'button';
    button.textContent = String(cfg.buttonText);
    button.addEventListener('click', function () { close('user'); });

    banner.appendChild(text);
    banner.appendChild(button);
    wrap.appendChild(banner);

    // Zwei verschachtelte Ebenen mit unterschiedlichem Easing für X und Y
    // ergeben eine leicht gebogene, natürlich wirkende Mausbewegung.
    var cursorX = h('div', 'cursor');
    cursorX.setAttribute('aria-hidden', 'true');
    var cursorY = h('div', 'cursor-y');
    cursorY.appendChild(h('span', 'ripple'));
    cursorY.appendChild(pointerIcon());
    cursorX.appendChild(cursorY);

    root.appendChild(wrap);
    root.appendChild(cursorX);

    function later(fn, ms) {
      timers.push(setTimeout(fn, ms));
    }

    function placeCursor(point) {
      cursorX.style.transform = 'translate3d(' + (point.x - CURSOR_TIP.x) + 'px,0,0)';
      cursorY.style.transform = 'translate3d(0,' + (point.y - CURSOR_TIP.y) + 'px,0)';
    }

    function buttonTarget() {
      var r = button.getBoundingClientRect();
      return { x: r.left + r.width * 0.55, y: r.top + r.height * 0.6 };
    }

    function close(reason) {
      if (closed) return;
      closed = true;
      while (timers.length) clearTimeout(timers.pop());
      if (active === controller) active = null;

      banner.classList.remove('is-visible');
      banner.classList.add('is-hiding');
      setTimeout(function () {
        cursorX.classList.remove('is-visible');
      }, reason === 'auto' ? 250 : 0);
      setTimeout(function () {
        if (host.parentNode) host.parentNode.removeChild(host);
      }, 600);

      if (typeof cfg.onClose === 'function') cfg.onClose(reason);
    }

    // --- Ablauf ---
    // Zeiger erscheint, fährt zum Button, drückt und klickt exakt nach `duration` ms.
    var travel = reduceMotion ? 0 : Math.min(800, Math.max(300, duration * 0.4));
    var moveAt = duration - PRESS_TIME - travel;
    var appearAt = Math.max(0, moveAt - 200);

    later(function () {
      document.body.appendChild(host);
      void banner.offsetWidth; // Reflow, damit die Einblend-Transition greift
      banner.classList.add('is-visible');

      later(function () {
        var target = buttonTarget();
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        var start = reduceMotion ? target : {
          x: target.x + (target.x + 180 < vw ? 180 : -180),
          y: target.y + (target.y + 140 < vh ? 140 : -140)
        };
        cursorX.style.transition = 'none';
        cursorY.style.transition = 'none';
        placeCursor(start);
        void cursorX.offsetWidth;
        cursorX.style.transition = '';
        cursorX.classList.add('is-visible');
      }, appearAt);

      later(function () {
        cursorX.style.transition = 'transform ' + travel + 'ms cubic-bezier(.3,.1,.25,1), opacity .2s ease';
        cursorY.style.transition = 'transform ' + travel + 'ms cubic-bezier(.55,0,.2,1)';
        placeCursor(buttonTarget());
      }, moveAt);

      later(function () {
        cursorX.classList.add('is-pressed');
        button.classList.add('is-pressed');
      }, duration - PRESS_TIME);

      later(function () {
        cursorX.classList.remove('is-pressed');
        cursorX.classList.add('is-clicking');
        button.classList.remove('is-pressed');
        close('auto');
      }, duration);
    }, delay);
  }

  function hide() {
    if (active) active.close('api');
  }

  window.NoCookieBanner = { show: show, hide: hide, version: VERSION };

  if (baseConfig.autoStart) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { show(); });
    } else {
      show();
    }
  }
})(window, document);
