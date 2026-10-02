/*
 * Freally Capture — the docs site's only script, ported from Freally Flipcopy's
 * (itself taken from Freally Oscillate's), dark-only like the family: there is
 * no theme button.
 *
 * ⛔⛔ NO THIRD-PARTY SCRIPT, NO ANALYTICS, NO TRACKER, NO CDN. This file,
 * `search.js` and the generated catalogue and index scripts are the whole of
 * the docs pages' JavaScript, and `scripts/site.test.mjs` fails on any
 * `<script src>` pointing off this origin. (The guest's `join.html` also loads
 * its vendored PeerJS, from this site.)
 *
 * ⛔ **A catalogue is a `<script>` from this site, added when its language is
 * chosen — never a `fetch`, never all seventeen at once.**
 *   · `i18n/<code>.js` holds one language's page strings;
 *   · a long page — the changelog, the manual — names its own bundle in
 *     `<html data-i18n-bundles="…">`, and `i18n/<bundle>/<code>.js` is loaded
 *     beside it, so no other page carries those blocks;
 *   · a script tag works from `file://`, so anybody reviewing the site from a
 *     checkout sees the real thing;
 *   · ⚠ the cost: a reader in another language sees the English markup until
 *     their catalogue arrives (a same-origin file, milliseconds). `lang` and
 *     `dir` change only together with the text.
 *
 * ⚠ **The page ships in English in the markup.** Every translatable node
 * carries `data-i18n` (text) or `data-i18n-html` (a block with its bold, code
 * and links); this replaces them when a different locale is chosen. A reader
 * with JavaScript off gets the English site.
 */

(function () {
  'use strict';

  /**
   * ⛔⛔ NO DOWNLOADS. The owner (2026-10-02): no download page, link or button
   * anywhere on this site; `scripts/check-no-downloads.mjs` refuses one.
   */

  /** ⛔ English first, the other seventeen alphabetically by code. Always. */
  var LOCALES = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية', rtl: true },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'pl', name: 'Polski' },
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'ru', name: 'Русский' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'uk', name: 'Українська' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'zh-CN', name: '简体中文' },
  ];

  var STORE_LOCALE = 'capture.docs.locale';

  function stored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // ⚠ A private window, or storage blocked. The site works; it just does
      // not remember.
      return null;
    }
  }

  function remember(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* see `stored` */
    }
  }

  function known(code) {
    for (var i = 0; i < LOCALES.length; i += 1) {
      if (LOCALES[i].code === code) return LOCALES[i];
    }
    return null;
  }

  /**
   * ⚠ **The stored choice wins over the browser's**, and ⛔ only the picker
   * stores a language: a language guessed from the browser is followed, never
   * stored. An unshipped language falls back to English.
   */
  function initialLocale() {
    var saved = stored(STORE_LOCALE);
    if (saved !== null && known(saved) !== null) return saved;

    var wanted = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < wanted.length; i += 1) {
      var tag = String(wanted[i]);
      if (known(tag) !== null) return tag;
      var base = tag.split('-')[0];
      // ⚠ `pt` matches `pt-BR` and `zh` matches `zh-CN`: the only variants shipped.
      for (var j = 0; j < LOCALES.length; j += 1) {
        if (LOCALES[j].code.split('-')[0] === base) return LOCALES[j].code;
      }
    }
    return 'en';
  }

  /**
   * `data-i18n-attr="placeholder:search.placeholder"` as `[[attribute, key]]` —
   * ⚠ one parser, both halves trimmed (`scripts/site.test.mjs` reads it the
   * same way).
   */
  function attrPairs(el) {
    var out = [];
    var pairs = el.getAttribute('data-i18n-attr').split(',');
    for (var p = 0; p < pairs.length; p += 1) {
      var split = pairs[p].split(':');
      out.push([split[0].trim(), split[1].trim()]);
    }
    return out;
  }

  /**
   * ⛔ Each node's English, recorded the first time this script sees the node,
   * before anything can overwrite it — per node, so a node a script builds
   * later (the search's empty row) has its own English to go back to.
   */
  var ENGLISH_TEXT = new WeakMap();
  var ENGLISH_HTML = new WeakMap();
  var ENGLISH_ATTRS = new WeakMap();

  function englishText(node) {
    if (!ENGLISH_TEXT.has(node)) ENGLISH_TEXT.set(node, node.textContent);
    return ENGLISH_TEXT.get(node);
  }

  function englishHtml(node) {
    if (!ENGLISH_HTML.has(node)) ENGLISH_HTML.set(node, node.innerHTML);
    return ENGLISH_HTML.get(node);
  }

  function englishAttr(node, attribute) {
    var attrs = ENGLISH_ATTRS.get(node);
    if (attrs === undefined) {
      attrs = {};
      ENGLISH_ATTRS.set(node, attrs);
    }
    if (!(attribute in attrs)) attrs[attribute] = node.getAttribute(attribute) || '';
    return attrs[attribute];
  }

  /** A loaded language's strings, or `undefined` while its scripts have not all arrived. */
  var ready = {};
  function catalogue(code) {
    return ready[code] === true ? (window.CAPTURE_I18N || {})[code] : undefined;
  }

  /** The long-page bundles this page shows (`<html data-i18n-bundles="changelog">`). */
  function bundles() {
    var named = document.documentElement.getAttribute('data-i18n-bundles') || '';
    return named.split(/\s+/).filter(function (name) {
      return /^[a-z]+$/.test(name);
    });
  }

  /**
   * Runs `then` once all of `code`'s scripts for this page are here, adding
   * them the first time. English is the markup and needs nothing.
   *
   * ⚠ `then` also runs when a script fails to load (an offline copy):
   * `apply` checks for the catalogue itself and leaves the page as it is.
   */
  var waiting = {};
  function load(code, then) {
    if (code === 'en' || ready[code] === true) {
      then();
      return;
    }
    if (waiting[code] !== undefined) {
      waiting[code].push(then);
      return;
    }
    waiting[code] = [then];
    var sources = ['i18n/' + code + '.js'];
    var named = bundles();
    for (var b = 0; b < named.length; b += 1) sources.push('i18n/' + named[b] + '/' + code + '.js');
    var pending = sources.length;
    var failed = false;
    var settle = function (ok) {
      if (!ok) failed = true;
      pending -= 1;
      if (pending > 0) return;
      if (!failed && (window.CAPTURE_I18N || {})[code] !== undefined) ready[code] = true;
      var callbacks = waiting[code];
      delete waiting[code];
      for (var i = 0; i < callbacks.length; i += 1) callbacks[i]();
    };
    for (var s = 0; s < sources.length; s += 1) {
      var script = document.createElement('script');
      script.src = sources[s];
      script.onload = function () {
        settle(true);
      };
      script.onerror = function () {
        settle(false);
      };
      document.head.appendChild(script);
    }
  }

  /** Which language is on the page right now — what was last written into the nodes. */
  var painted = 'en';

  /** The latest choice: a catalogue that arrives after a newer one was chosen is not painted. */
  var wanted = 'en';

  function apply(code) {
    var locale = known(code) || known('en');
    wanted = locale.code;

    var picker = document.querySelector('select.locale');
    if (picker !== null) picker.value = locale.code;

    load(locale.code, function () {
      if (wanted !== locale.code) return;
      // ⚠ The catalogue did not load: stay in the language on the page rather
      // than label English text with another language's `lang` and `dir`.
      if (locale.code !== 'en' && catalogue(locale.code) === undefined) {
        if (picker !== null) picker.value = painted;
        return;
      }

      document.documentElement.lang = locale.code;
      // ⛔ RTL is real: `dir` on the root mirrors every logical property in
      // `styles.css`.
      document.documentElement.dir = locale.rtl === true ? 'rtl' : 'ltr';

      if (locale.code !== painted) {
        translateWithin(document, locale.code);
        painted = locale.code;
      }
      // A page that writes its own text (the guest's join page) repaints it.
      document.dispatchEvent(new CustomEvent('capture:locale', { detail: painted }));
    });
  }

  /** Writes `code`'s strings into every translatable node inside `root`. */
  function translateWithin(root, code) {
    var strings = code === 'en' ? null : catalogue(code) || {};

    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      var english = englishText(nodes[i]);
      var text = strings === null ? english : strings[nodes[i].getAttribute('data-i18n')];
      // ⚠ A missing key leaves what is there in place; the site gate is what
      // makes a gap impossible rather than quiet.
      if (typeof text === 'string' && text !== '') nodes[i].textContent = text;
    }

    // ⛔ The long pages, in every language: their blocks keep their bold, code
    // and links, so they carry HTML — written by `scripts/build-docs-site.mjs`
    // from this site's own translated Markdown (escaped, `http(s)` and
    // relative links only), never from anything a reader typed.
    var rich = root.querySelectorAll('[data-i18n-html]');
    for (var r = 0; r < rich.length; r += 1) {
      var englishMarkup = englishHtml(rich[r]);
      var markup = strings === null ? englishMarkup : strings[rich[r].getAttribute('data-i18n-html')];
      if (typeof markup === 'string' && markup !== '') rich[r].innerHTML = markup;
    }

    var attributed = root.querySelectorAll('[data-i18n-attr]');
    for (var k = 0; k < attributed.length; k += 1) {
      var pairs = attrPairs(attributed[k]);
      for (var p = 0; p < pairs.length; p += 1) {
        var original = englishAttr(attributed[k], pairs[p][0]);
        var value = strings === null ? original : strings[pairs[p][1]];
        if (typeof value === 'string' && value !== '') {
          attributed[k].setAttribute(pairs[p][0], value);
        }
      }
    }
  }

  /** ⛔ The one way anything else on a page gets translated (`search.js`). */
  window.CAPTURE_TRANSLATE = function (root) {
    translateWithin(root || document, painted);
  };

  /**
   * One string a page's own script writes (the join page's status line), in
   * the language on the page, with its `{{placeholders}}` filled. `english`
   * is the fallback and the source of truth (`scripts/site.test.mjs` holds
   * `i18n/en.json` to it).
   */
  window.CAPTURE_T = function (key, english, values) {
    var strings = painted === 'en' ? null : catalogue(painted);
    var text = strings && typeof strings[key] === 'string' ? strings[key] : english;
    return text.replace(/\{\{(\w+)\}\}/g, function (whole, name) {
      return values && Object.prototype.hasOwnProperty.call(values, name)
        ? String(values[name])
        : whole;
    });
  };

  function buildPicker() {
    var picker = document.querySelector('select.locale');
    if (picker === null) return;
    for (var i = 0; i < LOCALES.length; i += 1) {
      var option = document.createElement('option');
      option.value = LOCALES[i].code;
      option.textContent = LOCALES[i].name;
      option.lang = LOCALES[i].code;
      picker.appendChild(option);
    }
    picker.addEventListener('change', function () {
      // The reader chose it: the one place a language is stored.
      var chosen = known(picker.value);
      if (chosen !== null) remember(STORE_LOCALE, chosen.code);
      apply(picker.value);
    });
  }

  function markCurrentPage() {
    var here = location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.site-nav a[href]');
    for (var i = 0; i < links.length; i += 1) {
      if (links[i].getAttribute('href') === here) {
        links[i].setAttribute('aria-current', 'page');
      }
    }
  }

  function start() {
    buildPicker();
    markCurrentPage();
    apply(initialLocale());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
