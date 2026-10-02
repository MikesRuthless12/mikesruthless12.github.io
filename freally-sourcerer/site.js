/*
 * Freally Sourcerer — the docs site's only script, taken from Freally
 * Flipcopy's site (itself Freally Oscillate's) and kept like it: the site is
 * dark-only, so there is no theme button (owner); and each language's
 * catalogue is loaded only when a reader chooses it (below).
 *
 * ⛔⛔ NO THIRD-PARTY SCRIPT, NO ANALYTICS, NO TRACKER, NO CDN. This file,
 * `search.js` and the generated catalogue and index scripts are the whole of
 * the site's JavaScript, and `scripts/site.test.mjs` fails on any `<script
 * src>` pointing off this origin.
 *
 * ⛔ **A catalogue is a `<script>` from this site, added when its language is
 * chosen — never a `fetch`, never all seventeen at once.**
 *   · `docs/i18n/<code>.js` holds one language; a bundle of all of them was
 *     ~200 KB on every page for readers who each read one at most;
 *   · a script tag works from `file://`, so the screenshot pass and anybody
 *     reviewing the site from a checkout see the real thing;
 *   · ⚠ the cost: a reader in another language sees the English markup until
 *     their catalogue arrives (a same-origin file, milliseconds). `lang` and
 *     `dir` change only together with the text, so English is never shown
 *     mirrored and a translation is never shown unmirrored.
 *
 * ⚠ **The page ships in English in the markup.** Every translatable node
 * carries `data-i18n`; this replaces their text when a different locale is
 * chosen. So a reader with JavaScript off gets the English site rather than a
 * page of empty elements — which is what a key-driven template would give them.
 */

(function () {
  'use strict';

  /**
   * ⛔⛔ NO DOWNLOADS, AND NO DOWNLOAD PAGE OR LINK, BEFORE `v1.0.0`.
   *
   * ▶ The owner, 2026-10-01: *"remove those download links now"* — v1.0.0 is
   * when the apps start selling. The old site's download menu and its
   * `downloads.js` are gone, and `scripts/check-no-downloads.mjs` refuses any
   * download on any page before then.
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

  var STORE_LOCALE = 'sourcerer.docs.locale';

  function stored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // ⚠ A private window, or storage blocked. The site works; it just does
      // not remember. Never a thrown error on a documentation page.
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
   * ⚠ **The stored choice wins over the browser's** — the same rule
   * `initialLocale` applies in the application, and for the same reason:
   * somebody who went looking for the language picker meant it.
   *
   * ⛔ So **only the picker stores a language** (`buildPicker`). A language
   * guessed from the browser is followed, never stored: storing the guess made
   * it a "choice" that then outranked the browser on every later visit, so a
   * reader who changed their browser's language kept the old one here.
   *
   * ⚠ An unshipped language falls back to English rather than to a
   * half-matched near-neighbour.
   */
  function initialLocale() {
    var saved = stored(STORE_LOCALE);
    if (saved !== null && known(saved) !== null) return saved;

    var wanted = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < wanted.length; i += 1) {
      var tag = String(wanted[i]);
      if (known(tag) !== null) return tag;
      var base = tag.split('-')[0];
      // ⚠ `pt` matches `pt-BR` and `zh` matches `zh-CN` because those are the
      // only variants shipped. A second Portuguese would make this ambiguous,
      // and that is the day this becomes a real decision rather than a default.
      for (var j = 0; j < LOCALES.length; j += 1) {
        if (LOCALES[j].code.split('-')[0] === base) return LOCALES[j].code;
      }
    }
    return 'en';
  }

  /**
   * `data-i18n-attr="placeholder:search.placeholder"` as `[[attribute, key]]` —
   * for the things a reader cannot see but a screen reader reads.
   *
   * ⚠ **One parser, both halves trimmed.** There were two copies of this, and
   * the translating one trimmed only the attribute name while
   * `scripts/site.test.mjs` recorded the key trimmed, so
   * `"placeholder: search.placeholder"` would have passed the "every key
   * exists" gate and then silently never translated in seventeen languages.
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
   * Each node's English, recorded the first time this script sees the node —
   * ⛔ before anything can overwrite it.
   *
   * ▶ There is deliberately no English catalogue script: every translatable
   * node carries its English text in the HTML, which is what makes this site
   * readable with JavaScript switched off, and shipping the same ~10 KB a second
   * time for the commonest language is dead weight.
   *
   * ⛔⛔ **But "English is in the markup" is only true until somebody picks
   * French.** The first version of this read that sentence as "there is nothing
   * to do for English" and returned early *on every* call — so choosing
   * Français and then English again set `lang="en"` over a page that was still
   * entirely French. From Arabic it was worse: `dir` flipped back to `ltr`
   * while the text stayed Arabic, un-mirroring the layout under RTL content.
   * The stored preference was already `en` by then, so a reload fixed it — which
   * is what made it look intermittent rather than broken.
   *
   * ⛔ **Per node, not one snapshot of the page.** The second version captured
   * the page's English once, at the first switch — and `search.js` builds its
   * "nothing matches" row later, so that row had no English to go back to and
   * stayed French under `lang="en"`. Every node is born English (the markup,
   * or a script that writes its English before asking for a translation), so
   * a node's text when this script first meets it *is* its English.
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
    // ⚠ The attribute may legitimately be absent in the markup; an empty
    // string is the right thing to restore to in that case, and the write
    // below skips empties anyway.
    if (!(attribute in attrs)) attrs[attribute] = node.getAttribute(attribute) || '';
    return attrs[attribute];
  }

  /** A loaded catalogue, or `undefined` while its script has not arrived. */
  function catalogue(code) {
    return (window.SOURCERER_I18N || {})[code];
  }

  /**
   * Runs `then` once `code`'s catalogue is here, adding its script the first
   * time. English is the markup and needs nothing.
   *
   * ⚠ `then` also runs when the script fails to load (a missing file, an
   * offline copy): `apply` checks for the catalogue itself and leaves the page
   * as it is, so a failure never leaves a waiting callback behind.
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
    var script = document.createElement('script');
    script.src = 'i18n/' + code + '.js';
    script.onload = script.onerror = function () {
      var callbacks = waiting[code];
      delete waiting[code];
      for (var i = 0; i < callbacks.length; i += 1) callbacks[i]();
    };
    document.head.appendChild(script);
  }

  /**
   * Which language is on the page right now.
   *
   * ⚠ Not the *stored* preference and not `documentElement.lang` — what was last
   * actually written into the nodes. It starts as `en` because that is what the
   * markup holds, and it is what lets a repeated choice skip ~70 DOM writes
   * while a real change still performs them.
   */
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
      if (locale.code !== 'en' && catalogue(locale.code) === undefined) return;

      // ⛔ `translateWithin` records each node's English before it writes to
      // the node — and that is the only place a write happens.
      document.documentElement.lang = locale.code;
      // ⛔ RTL is real. `dir` on the root is what mirrors every logical
      // property in `styles.css`; right-aligning text alone is not the same.
      document.documentElement.dir = locale.rtl === true ? 'rtl' : 'ltr';

      // ⚠ Already on the page — including the first paint, which is English.
      // The ~70 writes would each be a layout invalidation for a string that
      // is already there.
      if (locale.code === painted) return;

      translateWithin(document, locale.code);
      painted = locale.code;
    });
  }

  /**
   * Writes `code`'s strings into every `data-i18n` node inside `root`.
   *
   * ⛔ **Scoped to a root, because the page is not finished when `apply` runs.**
   * `search.js` builds its results list *after* the language has been chosen, so
   * its `data-i18n` node was never reached by anything: the search results' empty
   * state — *"Nothing on this site matches that."* — was English on all
   * seventeen translations of this site. ⚠ Found while checking that the
   * English-capture fix beside this was complete, which is the shape of that same
   * bug one layer down.
   */
  function translateWithin(root, code) {
    // English is each node's own (recorded on first sight); every other
    // language is one flat catalogue holding texts and attribute values alike.
    var strings = code === 'en' ? null : catalogue(code) || {};

    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      var english = englishText(nodes[i]);
      var text = strings === null ? english : strings[nodes[i].getAttribute('data-i18n')];
      // ⚠ **A missing key leaves what is there in place.** It never writes the
      // key itself onto the page, which is what i18next does in the
      // application and what makes a gap there loud. Here a gap shows the
      // previous language, and `scripts/site.test.mjs` is what makes it
      // impossible rather than quiet.
      if (typeof text === 'string' && text !== '') nodes[i].textContent = text;
    }

    // ⛔ **The changelog, in every language** (owner, 2026-10-01): its blocks keep
    // their bold, code and links, so they carry HTML — written by
    // `scripts/build-docs-site.mjs` from this site's own translated Markdown
    // (escaped, `http(s)` and relative links only), never from anything a
    // reader typed.
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

  /**
   * ⛔ **The one way anything else on this page gets translated.**
   *
   * ⚠ A single named global rather than exporting the module: these are plain
   * browser scripts with no module system, `search.js` is the only caller, and a
   * second copy of the lookup in it would be a second place for the trimming rule
   * and the missing-key rule to be got wrong.
   */
  window.SOURCERER_TRANSLATE = function (root) {
    translateWithin(root || document, painted);
  };

  function buildPicker() {
    var picker = document.querySelector('select.locale');
    if (picker === null) return;
    for (var i = 0; i < LOCALES.length; i += 1) {
      var option = document.createElement('option');
      option.value = LOCALES[i].code;
      option.textContent = LOCALES[i].name;
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
