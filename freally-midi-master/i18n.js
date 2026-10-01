/* Freally MIDI Master — the docs site in eighteen languages.
   © 2026 Mike Weaver — All Rights Reserved.

   ⛔⛔ THE SAME EIGHTEEN THE APP SHIPS, and the same two conventions:
   the picker shows the NATIVE name (somebody who cannot read the current
   language still has to find their own), and the order is English first then
   alphabetical by English name (sorting by endonym would reorder the whole list
   every time the language changed, so nobody could build muscle memory).
   `src/i18n/locales.ts` is where that is written down at length.

   ⛔ NO DEPENDENCIES AND NO BUILD STEP, which is the rule this site already
   follows for its search: a catalogue is a `<script>` tag and the swap is a walk
   over `[data-i18n]`. Anything cleverer would be a toolchain for five static
   pages.

   ⛔ NO `fetch`, DELIBERATELY. The catalogues load as scripts so the site works
   when opened from a folder as well as over HTTPS — a `fetch` of a local JSON is
   refused by every browser under `file://`, and this repo has already paid for
   assuming a page is always served.

   ⚠ ENGLISH LIVES IN THE HTML. Each element's own markup is kept on first run
   and restored when English is picked back, so there is no second copy of the
   English prose to fall out of step with the page. A key with no translation
   falls back the same way — one untranslated sentence in an otherwise translated
   page, which is honest, rather than a missing one. */

(function () {
  'use strict';

  /* `english` is not shown — it exists to give the list a stable sort. */
  var LOCALES = [
    { code: 'en', english: 'English', native: 'English' },
    { code: 'ar', english: 'Arabic', native: 'العربية' },
    { code: 'zh-CN', english: 'Chinese (Simplified)', native: '简体中文' },
    { code: 'nl', english: 'Dutch', native: 'Nederlands' },
    { code: 'fr', english: 'French', native: 'Français' },
    { code: 'de', english: 'German', native: 'Deutsch' },
    { code: 'hi', english: 'Hindi', native: 'हिन्दी' },
    { code: 'id', english: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'it', english: 'Italian', native: 'Italiano' },
    { code: 'ja', english: 'Japanese', native: '日本語' },
    { code: 'ko', english: 'Korean', native: '한국어' },
    { code: 'pl', english: 'Polish', native: 'Polski' },
    { code: 'pt-BR', english: 'Portuguese (Brazil)', native: 'Português (Brasil)' },
    { code: 'ru', english: 'Russian', native: 'Русский' },
    { code: 'es', english: 'Spanish', native: 'Español' },
    { code: 'tr', english: 'Turkish', native: 'Türkçe' },
    { code: 'uk', english: 'Ukrainian', native: 'Українська' },
    { code: 'vi', english: 'Vietnamese', native: 'Tiếng Việt' },
  ];

  /* The one right-to-left language in the set. */
  var RTL = ['ar'];

  var STORAGE_KEY = 'freally.docs.language';
  var loaded = {};

  function codes() {
    return LOCALES.map(function (l) {
      return l.code;
    });
  }

  /* `pt-PT` lands on `pt-BR` rather than silently falling back to English: a
     Portuguese speaker reading Brazilian Portuguese is far better served than one
     reading English. Same for every regional variant of a language we ship. */
  function resolve(tag) {
    if (!tag) return 'en';
    var wanted = String(tag).replace('_', '-');
    if (codes().indexOf(wanted) !== -1) return wanted;
    var base = wanted.split('-')[0].toLowerCase();
    for (var i = 0; i < LOCALES.length; i += 1) {
      if (LOCALES[i].code.split('-')[0].toLowerCase() === base) return LOCALES[i].code;
    }
    return 'en';
  }

  function stored() {
    try {
      var held = window.localStorage.getItem(STORAGE_KEY);
      return held && codes().indexOf(held) !== -1 ? held : null;
    } catch (e) {
      /* A private window can refuse storage outright. The picker still works;
         it just does not remember. */
      return null;
    }
  }

  function remember(code) {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      /* See `stored`. */
    }
  }

  /* ⚠ `?lang=` wins over the remembered choice, so a link can be shared in a
     language — which is what somebody sending a page to a friend expects. */
  function wanted() {
    var match = /[?&]lang=([A-Za-z-]+)/.exec(window.location.search);
    if (match) return resolve(match[1]);
    return stored() || resolve(navigator.language || navigator.userLanguage);
  }

  /* Keep the page's own English before anything replaces it. */
  function rememberEnglish() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].getAttribute('data-i18n-en') === null) {
        nodes[i].setAttribute('data-i18n-en', nodes[i].innerHTML);
      }
    }
    var withAttrs = document.querySelectorAll('[data-i18n-attrs]');
    for (var j = 0; j < withAttrs.length; j += 1) {
      var spec = withAttrs[j].getAttribute('data-i18n-attrs').split(/\s+/);
      for (var k = 0; k < spec.length; k += 1) {
        var name = spec[k].split(':')[0];
        var slot = 'data-i18n-en-' + name;
        if (withAttrs[j].getAttribute(slot) === null) {
          withAttrs[j].setAttribute(slot, withAttrs[j].getAttribute(name) || '');
        }
      }
    }
  }

  function apply(code) {
    var table = (window.FREALLY_I18N && window.FREALLY_I18N[code]) || {};

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      var key = nodes[i].getAttribute('data-i18n');
      /* ⚠ A missing key restores the English rather than leaving the previous
         language's sentence behind — switching from German to a language that
         has not translated one line must not leave that line in German. */
      var text = Object.prototype.hasOwnProperty.call(table, key)
        ? table[key]
        : nodes[i].getAttribute('data-i18n-en');
      if (text !== null && nodes[i].innerHTML !== text) nodes[i].innerHTML = text;
    }

    var withAttrs = document.querySelectorAll('[data-i18n-attrs]');
    for (var j = 0; j < withAttrs.length; j += 1) {
      var spec = withAttrs[j].getAttribute('data-i18n-attrs').split(/\s+/);
      for (var k = 0; k < spec.length; k += 1) {
        var half = spec[k].split(':');
        var name = half[0];
        var attrKey = half[1];
        var value = Object.prototype.hasOwnProperty.call(table, attrKey)
          ? table[attrKey]
          : withAttrs[j].getAttribute('data-i18n-en-' + name);
        if (value !== null) withAttrs[j].setAttribute(name, value);
      }
    }

    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', RTL.indexOf(code) === -1 ? 'ltr' : 'rtl');
    var picker = document.getElementById('lang');
    if (picker) picker.value = code;
  }

  /* ⚠ One `<script>` per language, added once and kept. Eighteen catalogues are
     smaller than one font subset, but there is no reason to fetch seventeen of
     them to read one page. */
  function load(code, done) {
    /* Already here: English lives in the HTML, a catalogue already loaded needs
       no second request, and one a build step inlined needs no request at all —
       which is also what makes the swap testable without a network. */
    var have = window.FREALLY_I18N && window.FREALLY_I18N[code];
    if (code === 'en' || loaded[code] || have) {
      done();
      return;
    }
    var tag = document.createElement('script');
    tag.src = 'locales/' + code + '.js';
    tag.onload = function () {
      loaded[code] = true;
      done();
    };
    /* ⛔ A catalogue that will not load leaves the page in English rather than
       half-swapped. Silent, because "your language file is missing" is not a
       sentence a reader can act on. */
    tag.onerror = function () {
      done();
    };
    document.head.appendChild(tag);
  }

  function choose(code) {
    /* ⚠ **Before the first swap, and idempotent.** Each element's own markup has
       to be kept while it is still the page's English — after that it is whatever
       language was applied last. */
    rememberEnglish();
    remember(code);
    load(code, function () {
      apply(code);
    });
  }

  /* The picker, built here rather than repeated in five files — and put at the
     end of the site nav, which is the top of every page. */
  function picker() {
    var nav = document.querySelector('nav.nav');
    if (!nav || document.getElementById('lang')) return;

    var label = document.createElement('label');
    label.className = 'lang';
    label.setAttribute('for', 'lang');

    var text = document.createElement('span');
    text.className = 'lang__label';
    /* ⚠ The one string on the site that is NOT translated, on purpose: a reader
       looking for their own language should not have to understand the word
       "Language" in a language they do not read. The globe says it instead. */
    text.setAttribute('aria-hidden', 'true');
    text.textContent = '🌐';

    var select = document.createElement('select');
    select.id = 'lang';
    /* Announced in English because a screen reader is already set to a language
       and this is chrome, not content. */
    select.setAttribute('aria-label', 'Language');
    for (var i = 0; i < LOCALES.length; i += 1) {
      var option = document.createElement('option');
      option.value = LOCALES[i].code;
      option.textContent = LOCALES[i].native;
      /* ⚠ `lang` on the option, so a screen reader pronounces 日本語 as Japanese
         rather than spelling it in the reader's own language. */
      option.setAttribute('lang', LOCALES[i].code);
      select.appendChild(option);
    }
    select.addEventListener('change', function () {
      choose(select.value);
    });

    label.appendChild(text);
    label.appendChild(select);
    nav.appendChild(label);
  }

  function start() {
    picker();
    var code = wanted();
    /* ⛔ **An English reader pays for nothing.** The page IS English, so there is
       nothing to swap: `apply('en')` would walk every `[data-i18n]` node and write
       each one back the value it already had — 356 subtree serialisations on the
       manual, for the default language, on every load. The English snapshot is
       taken inside `choose` instead, on the first real switch. */
    if (code === 'en') {
      document.documentElement.setAttribute('lang', 'en');
      document.documentElement.setAttribute('dir', 'ltr');
      var box = document.getElementById('lang');
      if (box) box.value = 'en';
      return;
    }
    choose(code);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
