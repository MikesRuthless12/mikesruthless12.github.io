/*
 * Freally Oscillate — the docs site's only script. TASK-130, TASK-132.
 *
 * ⛔⛔ NO THIRD-PARTY SCRIPT, NO ANALYTICS, NO TRACKER, NO CDN. This file and
 * `search.js` are the whole of the site's JavaScript, and
 * `scripts/check-docs-site.mjs` fails on any `<script src>` pointing off this
 * origin.
 *
 * ⛔ **The catalogues are INLINED in `i18n.js`, not fetched**, and that is
 * deliberate rather than lazy:
 *   · a `fetch` for a catalogue is a request, and a site that claims the
 *     application makes none should model the same discipline;
 *   · it works from `file://`, so `docs:shots` and anybody reviewing the site
 *     from a checkout sees the real thing rather than a page stuck in English;
 *   · and there is no loading state to get wrong — the page is never briefly in
 *     the wrong language, which is the same reasoning `main.tsx` applies to the
 *     application's first paint.
 *
 * ⚠ **The page ships in English in the markup.** Every translatable node
 * carries `data-i18n`; this replaces their text when a different locale is
 * chosen. So a reader with JavaScript off gets the English site rather than a
 * page of empty elements — which is what a key-driven template would give them.
 */

(function () {
  'use strict';

  /**
   * ⛔⛔ THE DOWNLOAD FLAG — TASK-154 IS THE ONE LINE THAT FLIPS IT.
   *
   * ▶ Owner's standing instruction and charter rule 5: **no downloads and no
   * installers appear anywhere on this site until `v1.0.0`.** `download.html`
   * is built — it is easier to review a real page than an imagined one — and it
   * is reachable by typing the URL, where it says plainly that there is nothing
   * there yet.
   *
   * ⚠ What this flag controls is the **navigation link**, which is the only
   * thing a reader would find by looking. ⛔ It is NOT a security boundary and
   * it does not pretend to be: a static site cannot hide a file it publishes.
   * The page itself is honest instead of hidden, which is the version of this
   * that cannot be embarrassing.
   */
  var DOWNLOADS_LIVE = false;

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

  var STORE_LOCALE = 'oscillate.docs.locale';
  var STORE_THEME = 'oscillate.docs.theme';

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
   * The English already in the markup, captured once — ⛔ before anything can
   * overwrite it.
   *
   * ▶ `i18n.js` deliberately does not ship an English catalogue: every
   * translatable node carries its English text in the HTML, which is what makes
   * this site readable with JavaScript switched off, and shipping the same ~10 KB
   * a second time for the commonest language is dead weight.
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
   * ⚠ So English is a catalogue like any other; it is just read off the page
   * instead of out of a file. Called at the top of every `apply`, and the first
   * call is the only one that does work.
   */
  var ENGLISH = null;
  function english() {
    if (ENGLISH !== null) return ENGLISH;
    ENGLISH = { text: {}, attr: {} };

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      ENGLISH.text[nodes[i].getAttribute('data-i18n')] = nodes[i].textContent;
    }

    var attributed = document.querySelectorAll('[data-i18n-attr]');
    for (var k = 0; k < attributed.length; k += 1) {
      var pairs = attributed[k].getAttribute('data-i18n-attr').split(',');
      for (var p = 0; p < pairs.length; p += 1) {
        var split = pairs[p].split(':');
        // ⚠ The attribute may legitimately be absent in the markup; an empty
        // string is the right thing to restore to in that case, and the write
        // below skips empties anyway.
        ENGLISH.attr[split[1].trim()] = attributed[k].getAttribute(split[0].trim()) || '';
      }
    }
    return ENGLISH;
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

  function apply(code) {
    var locale = known(code) || known('en');

    // ⛔ **`english()` is NOT called here, and it does not need to be.**
    // `translateWithin` calls it as its first statement, before any write — and
    // that is the only place a write happens. The early return below means this
    // function sometimes does not write at all, so capturing here would be work
    // on a path with nothing to protect.
    document.documentElement.lang = locale.code;
    // ⛔ RTL is real. `dir` on the root is what mirrors every logical property
    // in `styles.css`; right-aligning text alone is not the same thing.
    document.documentElement.dir = locale.rtl === true ? 'rtl' : 'ltr';

    var picker = document.querySelector('select.locale');
    if (picker !== null) picker.value = locale.code;
    remember(STORE_LOCALE, locale.code);

    // ⚠ Already on the page — including the first paint, which is English. The
    // ~70 writes would each be a layout invalidation for a string that is
    // already there.
    if (locale.code === painted) return;

    translateWithin(document, locale.code);
    painted = locale.code;
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
    var source = english();
    var strings = code === 'en' ? source.text : (window.OSCILLATE_I18N || {})[code] || {};
    // ⚠ A shipped catalogue is one flat map holding both; English is two,
    // because its attribute values live in attributes rather than in text.
    var attrs = code === 'en' ? source.attr : strings;

    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      var key = nodes[i].getAttribute('data-i18n');
      var text = strings[key];
      // ⚠ **A missing key leaves what is there in place.** It never writes the
      // key itself onto the page, which is what i18next does in the
      // application and what makes a gap there loud. Here a gap shows the
      // previous language, and `check-docs-site.mjs` is what makes it
      // impossible rather than quiet.
      //
      // ⚠ It is also the right answer for a node built after `english()` ran: a
      // script that creates one writes its own English into it, so "leave it
      // alone" restores nothing incorrectly.
      if (typeof text === 'string' && text !== '') nodes[i].textContent = text;
    }

    var attributed = root.querySelectorAll('[data-i18n-attr]');
    for (var k = 0; k < attributed.length; k += 1) {
      // ⚠ `data-i18n-attr="placeholder:search.placeholder"` — for the things a
      // reader cannot see but a screen reader reads.
      var pairs = attributed[k].getAttribute('data-i18n-attr').split(',');
      for (var p = 0; p < pairs.length; p += 1) {
        var split = pairs[p].split(':');
        // ⚠ **Both halves trimmed.** `check-docs-site.mjs` records the key
        // trimmed and this only trimmed the attribute name, so
        // `"placeholder: search.placeholder"` would have passed the "every key
        // exists" gate and then silently never translated in seventeen
        // languages.
        var value = attrs[split[1].trim()];
        if (typeof value === 'string' && value !== '') {
          attributed[k].setAttribute(split[0].trim(), value);
        }
      }
    }

    translateLong(root, code);
  }

  /**
   * ⛔ **The changelog, the manual and the ladder, in every language** (owner,
   * 2026-10-01).
   *
   * ▶ Their blocks carry `data-i18n-html="<kind>.<hash>"`, keyed by their own
   * English, and their translations are HTML built by
   * `scripts/build-docs-site.mjs` from this site's own files — never from
   * anything a reader typed. The changelog alone is hundreds of kilobytes a
   * language, so none of them is in `i18n.js`: `i18n/long/<kind>/<code>.js` is
   * added the first time a reader picks that language on a page carrying that
   * kind, and its arrival paints the blocks.
   */
  var ENGLISH_HTML = new WeakMap();
  var LONG_ASKED = {};

  function askForLong(kind, code) {
    var file = 'i18n/long/' + kind + '/' + code + '.js';
    if (LONG_ASKED[file]) return;
    LONG_ASKED[file] = true;
    var tag = document.createElement('script');
    tag.src = file;
    tag.onload = function () {
      if (painted === code) translateLong(document, code);
    };
    document.head.appendChild(tag);
  }

  function translateLong(root, code) {
    var blocks = root.querySelectorAll('[data-i18n-html]');
    var strings = code === 'en' ? null : (window.OSCILLATE_LONG || {})[code] || {};
    for (var b = 0; b < blocks.length; b += 1) {
      if (!ENGLISH_HTML.has(blocks[b])) ENGLISH_HTML.set(blocks[b], blocks[b].innerHTML);
      var key = blocks[b].getAttribute('data-i18n-html');
      var html = strings === null ? null : strings[key];
      var ready = typeof html === 'string' && html !== '';
      if (strings !== null && !ready) askForLong(key.split('.')[0], code);
      // ⚠ **English until its file arrives**, never the language picked before
      // it: French blocks under `lang="de"` would be the bug `apply('en')` had.
      // A block a language truly lacks stays English the same way — the build
      // refuses such a gap; this makes one survivable.
      blocks[b].innerHTML = ready ? html : ENGLISH_HTML.get(blocks[b]);
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
  window.OSCILLATE_TRANSLATE = function (root) {
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
      apply(picker.value);
    });
  }

  function buildTheme() {
    var button = document.querySelector('button.theme');
    if (button === null) return;
    // ⚠ **Reading and applying the stored theme is NOT done here.** A ~200-byte
    // inline script in each page's `<head>` does it before the first paint —
    // this file arrives after `i18n.js` and would flash the wrong theme for the
    // length of that download. All that is left here is the button.
    button.addEventListener('click', function () {
      // ⚠ Reads what is actually painted rather than what was stored, so the
      // first press from the system default flips to the opposite of what the
      // reader is looking at.
      var painted =
        document.documentElement.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      var next = painted === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      remember(STORE_THEME, next);
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

  function applyDownloadFlag() {
    if (DOWNLOADS_LIVE) return;
    var links = document.querySelectorAll('[data-downloads-link]');
    for (var i = 0; i < links.length; i += 1) {
      links[i].hidden = true;
    }
  }

  function start() {
    buildPicker();
    buildTheme();
    markCurrentPage();
    applyDownloadFlag();
    apply(initialLocale());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
