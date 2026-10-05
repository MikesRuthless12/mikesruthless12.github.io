/*
 * Freally Capture — the guest join page's script (`join.html` only).
 *
 * ⚠ Every other page on this site is the Freally site kit's (`kit/kit.js`,
 * built by `kit/build.mjs`). The join page is not a kit page: it is a working
 * tool — the browser end of a remote-guest session — and it keeps its own
 * look (`styles.css`), this script and its own strings.
 *
 * ⛔⛔ NO THIRD-PARTY SCRIPT, NO ANALYTICS, NO TRACKER, NO CDN. The join page
 * loads this file, its catalogue and its vendored PeerJS, all from this site;
 * `scripts/site.test.mjs` fails on any `<script src>` pointing off this origin.
 *
 * ⛔ **A catalogue is a `<script>` from this site, added when its language is
 * chosen — never a `fetch`, never all seventeen at once.** `i18n/join/<code>.js`
 * holds one language's join-page strings (`scripts/build-join-i18n.mjs` writes
 * it from `i18n/join/<code>.json`). A script tag works from `file://`.
 *
 * ⚠ The language a reader picked on the rest of the site is the one this page
 * opens in: the choice is stored under the kit's own key.
 *
 * ⚠ **The page ships in English in the markup.** Every translatable node
 * carries `data-i18n`; this replaces them when a different locale is chosen. A
 * reader with JavaScript off gets the English page.
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

  /** The site kit's key (`kit/kit.js`), so one choice holds on every page. */
  var STORE_LOCALE = 'freally.site.locale';

  function stored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // ⚠ A private window, or storage blocked. The page works; it just does
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
   * `data-i18n-attr="aria-label:nav.site"` as `[[attribute, key]]` — ⚠ one
   * parser, both halves trimmed (`scripts/build-join-i18n.mjs` reads it the
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
   * before anything can overwrite it.
   */
  var ENGLISH_TEXT = new WeakMap();
  var ENGLISH_ATTRS = new WeakMap();

  function englishText(node) {
    if (!ENGLISH_TEXT.has(node)) ENGLISH_TEXT.set(node, node.textContent);
    return ENGLISH_TEXT.get(node);
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

  /** A loaded language's strings, or `undefined` while its script has not arrived. */
  function catalogue(code) {
    return (window.CAPTURE_I18N || {})[code];
  }

  /**
   * Runs `then` once `code`'s catalogue is here, adding its script the first
   * time. English is the markup and needs nothing.
   *
   * ⚠ `then` also runs when the script fails to load (an offline copy):
   * `apply` checks for the catalogue itself and leaves the page as it is.
   */
  var waiting = {};
  function load(code, then) {
    if (code === 'en' || catalogue(code) !== undefined) {
      then();
      return;
    }
    if (waiting[code] !== undefined) {
      waiting[code].push(then);
      return;
    }
    waiting[code] = [then];
    var settle = function () {
      var callbacks = waiting[code];
      delete waiting[code];
      for (var i = 0; i < callbacks.length; i += 1) callbacks[i]();
    };
    var script = document.createElement('script');
    script.src = 'i18n/join/' + code + '.js';
    script.onload = settle;
    script.onerror = settle;
    document.head.appendChild(script);
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
      // The page writes its own text (the status line) and repaints it.
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

  /**
   * One string the page's own script writes (the status line), in the
   * language on the page, with its `{{placeholders}}` filled. `english` is the
   * fallback and the source of truth (`scripts/build-join-i18n.mjs` writes
   * `i18n/join/en.json` from it).
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

  function start() {
    buildPicker();
    apply(initialLocale());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
