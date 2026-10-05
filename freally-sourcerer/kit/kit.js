/*
 * ⛔⛔ THE FREALLY SITE KIT — the one script every Freally website runs.
 *
 * ▶ Byte-identical in every site's `kit/` folder (owner, 2026-10-04: *"the
 * exact same format, no different except the text"*). Edit
 * `Freally Bugs/site-kit/kit/kit.js`, never a site's copy.
 *
 * ⛔ NO THIRD-PARTY SCRIPT, NO ANALYTICS, NO TRACKER, NO CDN, NO FETCH. This
 * file, the generated `i18n/<code>.js` catalogues and `search-index.js` are the
 * whole of a site's JavaScript. A catalogue is a `<script>` from the site itself,
 * added only when its language is chosen, so the site also works from `file://`.
 *
 * ⚠ The page ships in English in its markup. Every translatable node carries
 * `data-i18n` (text), `data-i18n-html` (rich text the builder rendered from the
 * site's own Markdown) or `data-i18n-attr="attr:key,…"`; a reader with
 * JavaScript off reads the English site, never empty boxes.
 *
 * Loaded in `<head>` without `defer`: the first line marks the document as
 * scripted before the first paint, so the scroll reveals never flash. The rest
 * waits for the DOM.
 */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

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

  /**
   * ⚠ One key for the whole family: every Freally site lives on the same
   * origin, so a language chosen on one is the language of all of them.
   */
  var STORE_LOCALE = 'freally.site.locale';

  var reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      // A private window or blocked storage: the site works, it just forgets.
      return null;
    }
  }

  function remember(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
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
   * The stored choice wins over the browser's; ⛔ only the picker stores one, so
   * a guess from the browser never hardens into a "choice". An unshipped
   * language falls back to English rather than a half-matched neighbour.
   */
  function initialLocale() {
    var saved = stored(STORE_LOCALE);
    if (saved !== null && known(saved) !== null) return saved;
    var wanted = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < wanted.length; i += 1) {
      var tag = String(wanted[i]);
      if (known(tag) !== null) return tag;
      var base = tag.split('-')[0];
      for (var j = 0; j < LOCALES.length; j += 1) {
        if (LOCALES[j].code.split('-')[0] === base) return LOCALES[j].code;
      }
    }
    return 'en';
  }

  /** `data-i18n-attr="placeholder:search.placeholder"` → `[[attr, key]]`, both trimmed. */
  function attrPairs(el) {
    var out = [];
    var pairs = el.getAttribute('data-i18n-attr').split(',');
    for (var p = 0; p < pairs.length; p += 1) {
      var split = pairs[p].split(':');
      if (split.length === 2) out.push([split[0].trim(), split[1].trim()]);
    }
    return out;
  }

  /*
   * ⛔ Each node's English, recorded the first time this script meets the node
   * and before anything overwrites it — per node, never one snapshot of the
   * page, because the search results are built later and must go back to
   * English too.
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

  function catalogue(code) {
    return (window.FREALLY_I18N || {})[code];
  }

  /** Runs `then` once `code`'s catalogue is here (also after a failed load). */
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

  /** What was last written into the nodes (the markup starts in English). */
  var painted = 'en';
  /** The latest choice: a catalogue that arrives after a newer choice is not painted. */
  var wanted = 'en';

  function apply(code) {
    var locale = known(code) || known('en');
    wanted = locale.code;
    var pickers = document.querySelectorAll('select.locale');
    for (var i = 0; i < pickers.length; i += 1) pickers[i].value = locale.code;

    load(locale.code, function () {
      if (wanted !== locale.code) return;
      // The catalogue did not load: stay as we are rather than mislabel English.
      if (locale.code !== 'en' && catalogue(locale.code) === undefined) return;
      // ⛔ `lang` and `dir` change together with the text, never apart.
      root.lang = locale.code;
      root.dir = locale.rtl === true ? 'rtl' : 'ltr';
      if (locale.code === painted) return;
      translateWithin(document, locale.code);
      painted = locale.code;
      retitle();
      restartCycles();
      // the numbers are written in the new language: fit them again
      queueFit();
    });
  }

  /**
   * Writes `code`'s strings into every keyed node inside `root`. A missing key
   * leaves what is there; it never writes the key itself onto the page (the
   * build fails on a gap long before a reader could see one).
   */
  function translateWithin(scope, code) {
    var strings = code === 'en' ? null : catalogue(code) || {};

    var nodes = scope.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      var english = englishText(nodes[i]);
      var text = strings === null ? english : strings[nodes[i].getAttribute('data-i18n')];
      if (typeof text === 'string' && text !== '') nodes[i].textContent = text;
    }

    // Rich blocks keep their bold, code and links: HTML the builder rendered
    // from this site's own translated Markdown, never anything a reader typed.
    var rich = scope.querySelectorAll('[data-i18n-html]');
    for (var r = 0; r < rich.length; r += 1) {
      var englishMarkup = englishHtml(rich[r]);
      var markup = strings === null ? englishMarkup : strings[rich[r].getAttribute('data-i18n-html')];
      if (typeof markup === 'string' && markup !== '') rich[r].innerHTML = markup;
    }

    var attributed = scope.querySelectorAll('[data-i18n-attr]');
    for (var k = 0; k < attributed.length; k += 1) {
      var pairs = attrPairs(attributed[k]);
      for (var p = 0; p < pairs.length; p += 1) {
        var original = englishAttr(attributed[k], pairs[p][0]);
        var value = strings === null ? original : strings[pairs[p][1]];
        if (typeof value === 'string' && value !== '') attributed[k].setAttribute(pairs[p][0], value);
      }
    }
  }

  /**
   * The tab's title in the language on the page: `<name> — <tagline>` on the
   * home page, `<page> — <name>` on the others — the builder's own order.
   */
  var englishTitle = document.title;
  function retitle() {
    var key = root.getAttribute('data-title-key');
    var name = root.getAttribute('data-name') || '';
    if (painted === 'en' || !key) {
      document.title = englishTitle;
      return;
    }
    var word = phrase(key, '');
    if (word === '') return;
    document.title = root.getAttribute('data-page') === 'index' ? name + ' — ' + word : word + ' — ' + name;
  }

  /** ⛔ The one way anything built later (the search results) gets translated. */
  window.FREALLY_TRANSLATE = function (scope) {
    translateWithin(scope || document, painted);
  };

  /** The string `key` in the language on the page, or `fallback`. */
  function phrase(key, fallback) {
    if (painted === 'en') return fallback;
    var strings = catalogue(painted) || {};
    var value = strings[key];
    return typeof value === 'string' && value !== '' ? value : fallback;
  }

  function buildPickers() {
    var pickers = document.querySelectorAll('select.locale');
    for (var n = 0; n < pickers.length; n += 1) {
      var picker = pickers[n];
      if (picker.options.length === 0) {
        for (var i = 0; i < LOCALES.length; i += 1) {
          var option = document.createElement('option');
          option.value = LOCALES[i].code;
          option.textContent = LOCALES[i].name;
          if (LOCALES[i].rtl === true) option.dir = 'rtl';
          option.lang = LOCALES[i].code;
          picker.appendChild(option);
        }
      }
      picker.addEventListener('change', onPick);
    }
  }

  function onPick(event) {
    var chosen = known(event.target.value);
    if (chosen !== null) remember(STORE_LOCALE, chosen.code);
    apply(event.target.value);
  }

  // ── navigation ─────────────────────────────────────────────────────────

  function markCurrentPage() {
    var here = location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.site-nav a[href], .footer a[data-page]');
    for (var i = 0; i < links.length; i += 1) {
      var href = links[i].getAttribute('href');
      if (href === here || (here === '' && href === 'index.html')) {
        links[i].setAttribute('aria-current', 'page');
      }
    }
  }

  function wireNav() {
    var nav = document.querySelector('.nav');
    if (nav === null) return;
    var ticking = false;
    function update() {
      ticking = false;
      nav.classList.toggle('scrolled', window.scrollY > 8);
    }
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
  }

  // ── motion ─────────────────────────────────────────────────────────────

  /**
   * ⚠ The same list as the `.js :where(…)` rule in kit.css: what is hidden from
   * the first paint must be exactly what this shows.
   */
  var REVEAL = [
    '.reveal',
    '.hero__copy > *',
    '.hero__visual',
    '.page-head .wrap > *',
    '.section > .wrap > .label',
    '.section > .wrap > h2',
    '.section > .wrap > .lead',
    '.section > .wrap > p',
    '.split > *',
    '.section-head > *',
    '.card',
    '.note',
    '.stat',
    '.rung',
    '.release',
    '.section > .wrap > .table-wrap',
    '.shot',
    '.story',
    '.marquee',
  ].join(', ');

  /** Each element enters from 20px below, siblings staggered 90 ms apart. */
  function wireReveals() {
    var items = document.querySelectorAll(REVEAL);
    if (items.length === 0) return;
    if (reduceMotion || typeof window.IntersectionObserver !== 'function') {
      for (var i = 0; i < items.length; i += 1) items[i].classList.add('visible');
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        for (var e = 0; e < entries.length; e += 1) {
          var entry = entries[e];
          if (!entry.isIntersecting) continue;
          // ⛔ 8 % of an element on the screen — or, for one taller than the
          // screen, any of it: 8 % of a 2,413-row roster or a long release can
          // never be on a screen, and it stayed at opacity 0 (owner, 2026-10-05)
          var screen = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;
          var tall = entry.boundingClientRect.height > screen;
          if (entry.intersectionRatio < 0.08 && !tall) continue;
          var target = entry.target;
          var delay = Number(target.getAttribute('data-delay') || 0);
          window.setTimeout(reveal.bind(null, target), delay);
          observer.unobserve(target);
        }
      },
      // 0 as well, so a tall element is told it is on the screen at all
      { threshold: [0, 0.08], rootMargin: '0px 0px -40px 0px' },
    );
    for (var j = 0; j < items.length; j += 1) {
      var item = items[j];
      if (!item.hasAttribute('data-delay')) {
        var siblings = item.parentElement ? item.parentElement.children : [];
        var index = 0;
        for (var s = 0; s < siblings.length; s += 1) {
          if (siblings[s] === item) break;
          if (siblings[s].classList.contains('reveal')) index += 1;
        }
        item.setAttribute('data-delay', String(Math.min(index, 8) * 90));
      }
      observer.observe(item);
    }
  }

  function reveal(target) {
    target.classList.add('visible');
  }

  /** `data-countup="2413"` counts up from 0 on first sight, 1.8 s, ease-out. */
  function wireCountups() {
    var items = document.querySelectorAll('[data-countup]');
    if (items.length === 0 || typeof window.IntersectionObserver !== 'function') return;
    var observer = new IntersectionObserver(
      function (entries) {
        for (var e = 0; e < entries.length; e += 1) {
          if (!entries[e].isIntersecting) continue;
          observer.unobserve(entries[e].target);
          countUp(entries[e].target);
        }
      },
      { threshold: 0.4 },
    );
    for (var i = 0; i < items.length; i += 1) {
      if (!reduceMotion) observer.observe(items[i]);
    }
  }

  function formatNumber(value) {
    try {
      return new Intl.NumberFormat(painted === 'ar' ? 'ar-u-nu-latn' : painted).format(value);
    } catch (_) {
      return String(value);
    }
  }

  /**
   * ⛔ A big number never runs out of its card (owner, 2026-10-05: "the
   * 463,985 is running out of the container"). The type is sized by the window;
   * a number wider than its card is set smaller by the ratio it overflows,
   * measured at its final value (a count-up starts at 0) in the reader's
   * language — again when the language, the window or the fonts change.
   */
  function fitStats() {
    var items = document.querySelectorAll('.stat__num');
    for (var i = 0; i < items.length; i += 1) fitStat(items[i]);
  }

  function fitStat(el) {
    el.style.fontSize = '';
    var target = parseFloat(el.getAttribute('data-countup'));
    var counting = isFinite(target);
    var shown = el.textContent;
    if (counting) el.textContent = formatNumber(target);
    var room = el.clientWidth;
    var need = el.scrollWidth;
    if (room > 0 && need > room) {
      var size = parseFloat(window.getComputedStyle(el).fontSize);
      if (isFinite(size)) el.style.fontSize = Math.floor(((size * room) / need) * 0.97 * 10) / 10 + 'px';
    }
    if (counting) el.textContent = shown;
  }

  var fitQueued = false;
  function queueFit() {
    if (fitQueued) return;
    fitQueued = true;
    window.requestAnimationFrame(function () {
      fitQueued = false;
      fitStats();
    });
  }

  function wireFits() {
    if (document.querySelector('.stat__num') === null) return;
    fitStats();
    window.addEventListener('resize', queueFit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueFit);
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-countup'));
    if (!isFinite(target)) return;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / 1800, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNumber(p < 1 ? Math.floor(eased * target) : target);
      if (p < 1) window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  /**
   * The hero's cycling word: `<span class="cycle" data-cycle="hero.cycle"
   * data-words="copy.|MIDI.|audio.">`. The words come from the catalogue (`|`
   * between them) in a translation and from `data-words` in English. Re-queried
   * every turn, because a translation rewrites the headline around it.
   */
  var cycleTimer = null;
  var cycleIndex = 0;

  function cycleWords(el) {
    var english = el.getAttribute('data-words') || el.textContent;
    var key = el.getAttribute('data-cycle');
    var list = key ? phrase(key, english) : english;
    return String(list)
      .split('|')
      .map(function (w) {
        return w.trim();
      })
      .filter(function (w) {
        return w !== '';
      });
  }

  function restartCycles() {
    if (cycleTimer !== null) window.clearInterval(cycleTimer);
    cycleTimer = null;
    cycleIndex = 0;
    if (reduceMotion || document.querySelector('.cycle') === null) return;
    cycleTimer = window.setInterval(turnCycles, 2600);
  }

  function turnCycles() {
    var items = document.querySelectorAll('.cycle');
    cycleIndex += 1;
    for (var i = 0; i < items.length; i += 1) turnOne(items[i]);
  }

  /**
   * Out and in again, by opacity: the phrase is inline (it wraps with the
   * headline), and an inline box does not take a transform.
   */
  function turnOne(el) {
    var words = cycleWords(el);
    if (words.length < 2) return;
    el.style.transition = 'opacity 300ms ease';
    el.style.opacity = '0';
    window.setTimeout(function () {
      el.textContent = words[cycleIndex % words.length];
      window.requestAnimationFrame(function () {
        el.style.transition = 'opacity 380ms ease';
        el.style.opacity = '1';
      });
    }, 320);
  }

  /** The cards' pointer spotlight. */
  function wireSpotlights() {
    if (reduceMotion) return;
    document.addEventListener(
      'pointermove',
      function (event) {
        var card = event.target && event.target.closest ? event.target.closest('.card') : null;
        if (card === null) return;
        var box = card.getBoundingClientRect();
        card.style.setProperty('--mx', event.clientX - box.left + 'px');
        card.style.setProperty('--my', event.clientY - box.top + 'px');
      },
      { passive: true },
    );
  }

  /** The contents rail and the changelog rail follow the reader. */
  function wireScrollSpy() {
    var rails = document.querySelectorAll('[data-spy]');
    for (var r = 0; r < rails.length; r += 1) spy(rails[r]);
  }

  /**
   * ⛔ The section being read is the last whose heading has passed a line 30 %
   * down the screen — and at the very bottom of the page, the last heading on
   * the screen, since the short last sections can never reach the line. The
   * rail scrolls itself to keep that entry on it (owner, 2026-10-05: "you don't
   * have anything on the left hand side within the sidebar for these": a band
   * 20–35 % down the screen marked nothing in the middle of a long section or
   * at the end of a manual, and a long rail kept its mark out of sight).
   */
  function spy(rail) {
    var links = rail.querySelectorAll('a[href^="#"]');
    var byId = {};
    var targets = [];
    for (var i = 0; i < links.length; i += 1) {
      var id = decodeURIComponent(links[i].getAttribute('href').slice(1));
      var target = document.getElementById(id);
      if (target === null) continue;
      byId[id] = links[i];
      targets.push(target);
    }
    if (targets.length === 0) return;
    var shown = null;
    var queued = false;

    function update() {
      queued = false;
      var screen = window.innerHeight;
      var current = targets[0];
      for (var t = 0; t < targets.length; t += 1) {
        if (targets[t].getBoundingClientRect().top > screen * 0.3) break;
        current = targets[t];
      }
      var page = document.documentElement.scrollHeight;
      if (window.scrollY + screen >= page - 2) {
        for (var b = targets.length - 1; b >= 0; b -= 1) {
          if (targets[b].getBoundingClientRect().top < screen) {
            current = targets[b];
            break;
          }
        }
      }
      if (current.id === shown) return;
      shown = current.id;
      for (var key in byId) {
        if (Object.prototype.hasOwnProperty.call(byId, key)) {
          byId[key].classList.toggle('is-active', key === shown);
        }
      }
      keepInView(rail, byId[shown]);
    }

    function queue() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  }

  /** Scroll `rail` (only the rail, never the page) so that `link` is on it. */
  function keepInView(rail, link) {
    if (rail.scrollHeight <= rail.clientHeight + 1) return;
    var box = rail.getBoundingClientRect();
    var at = link.getBoundingClientRect();
    var top = at.top - box.top + rail.scrollTop;
    var margin = 24;
    if (top >= rail.scrollTop + margin && top + at.height <= rail.scrollTop + rail.clientHeight - margin) {
      return;
    }
    var goal = Math.max(0, top - (rail.clientHeight - at.height) / 2);
    if (typeof rail.scrollTo === 'function') {
      rail.scrollTo({ top: goal, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      rail.scrollTop = goal;
    }
  }

  // ── search (the index is a file this page already loaded) ──────────────

  function wireSearch() {
    var box = document.querySelector('.search input');
    var results = document.querySelector('.search-results');
    if (box === null || results === null) return;
    var INDEX = window.FREALLY_SEARCH_INDEX || [];

    function fold(text) {
      return String(text).toLowerCase();
    }

    function folded(entry) {
      if (entry._h === undefined) {
        entry._h = fold(entry.heading);
        entry._t = fold(entry.text);
      }
      return entry;
    }

    /** ⚠ Every word must appear somewhere; title hits outrank body hits. */
    function score(entry, query, words) {
      var title = folded(entry)._h;
      var body = entry._t;
      var total = 0;
      for (var j = 0; j < words.length; j += 1) {
        if (title.indexOf(words[j]) === -1 && body.indexOf(words[j]) === -1) return 0;
      }
      if (title.indexOf(query) !== -1) total += 100;
      if (body.indexOf(query) !== -1) total += 30;
      for (var i = 0; i < words.length; i += 1) {
        if (title.indexOf(words[i]) !== -1) total += 10;
        if (body.indexOf(words[i]) !== -1) total += 2;
      }
      return total;
    }

    function literal(text) {
      return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function extract(entry, query) {
      var body = entry.text;
      var at = query === '' ? -1 : body.search(new RegExp(literal(query), 'i'));
      if (at === -1) at = 0;
      var from = Math.max(0, at - 60);
      var snippet = body.slice(from, from + 180).trim();
      return (from > 0 ? '…' : '') + snippet + (from + 180 < body.length ? '…' : '');
    }

    function render(matches, query) {
      results.textContent = '';
      if (matches.length === 0) {
        var empty = document.createElement('li');
        empty.className = 'search-empty';
        empty.setAttribute('data-i18n', 'kit.search.none');
        empty.textContent = 'Nothing on this site matches that.';
        results.appendChild(empty);
        window.FREALLY_TRANSLATE(results);
        return;
      }
      var batch = document.createDocumentFragment();
      for (var i = 0; i < Math.min(matches.length, 12); i += 1) {
        var entry = matches[i].entry;
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.href = entry.url;
        link.textContent = entry.heading;
        item.appendChild(link);
        var where = document.createElement('p');
        where.textContent = extract(entry, query);
        item.appendChild(where);
        batch.appendChild(item);
      }
      results.appendChild(batch);
    }

    function run() {
      var query = fold(box.value).trim();
      if (query === '') {
        results.textContent = '';
        return;
      }
      var words = query.split(/\s+/).filter(function (word) {
        return word !== '';
      });
      var matches = [];
      for (var i = 0; i < INDEX.length; i += 1) {
        var value = score(INDEX[i], query, words);
        if (value > 0) matches.push({ entry: INDEX[i], value: value });
      }
      matches.sort(function (a, b) {
        return b.value - a.value;
      });
      render(matches, query);
    }

    box.addEventListener('input', run);
    var fromUrl = new URLSearchParams(location.search).get('q');
    if (fromUrl !== null && fromUrl !== '') box.value = fromUrl;
    run();
  }

  // ── the copier stories (a video waits for a press, never autoplays) ────

  function wireStories() {
    var stories = document.querySelectorAll('.story');
    for (var i = 0; i < stories.length; i += 1) wireStory(stories[i]);
  }

  /**
   * ⛔ Started by the angled START or the video's own control, never by itself;
   * stopped or finished, it goes back to its very first frame and stays there.
   */
  function wireStory(story) {
    var video = story.querySelector('video');
    var start = story.querySelector('.story__start');
    if (!video || !start) return;
    start.addEventListener('click', function () {
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () {});
    });
    video.addEventListener('play', function () {
      start.hidden = true;
    });
    video.addEventListener('pause', function () {
      video.currentTime = 0;
      start.hidden = false;
    });
  }

  // ── a screenshot opens large ────────────────────────────────────────────

  /**
   * ⛔ Every screenshot is a button that opens it whole, in the middle of the
   * screen; the X, Escape or a click outside the picture closes it (owner,
   * 2026-10-05: *"enlarge the images into the center of the screen and be able
   * to exit out of them with an "X""*). One native modal `<dialog>` for the
   * page: it keeps focus while open and gives it back to the screenshot after.
   */
  function wireZooms() {
    var shots = document.querySelectorAll('.shot > img');
    if (shots.length === 0) return;
    var dialog = document.createElement('dialog');
    if (typeof dialog.showModal !== 'function') return;
    dialog.className = 'zoom';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'zoom__close';
    close.setAttribute('aria-label', 'Close');
    // ⚠ The key quoted on its own: that is how the builder finds the keys
    // kit.js writes, and puts them in every language's catalogue.
    close.setAttribute('data-i18n-attr', 'aria-label:' + 'kit.zoom.close');
    close.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    var figure = document.createElement('figure');
    figure.className = 'zoom__figure';
    var big = document.createElement('img');
    big.decoding = 'async';
    var caption = document.createElement('figcaption');
    figure.appendChild(big);
    figure.appendChild(caption);
    dialog.appendChild(close);
    dialog.appendChild(figure);
    document.body.appendChild(dialog);
    var opener = null;

    function show(img, button) {
      opener = button;
      big.src = img.getAttribute('src');
      big.alt = img.alt;
      var text = button.parentNode.querySelector('figcaption');
      caption.textContent = text ? text.textContent : '';
      caption.hidden = caption.textContent === '';
      root.classList.add('zoom-open');
      dialog.showModal();
      close.focus();
    }

    function wrap(img) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'shot__zoom';
      button.setAttribute('aria-haspopup', 'dialog');
      img.parentNode.insertBefore(button, img);
      button.appendChild(img);
      button.addEventListener('click', function () {
        show(img, button);
      });
    }

    for (var i = 0; i < shots.length; i += 1) wrap(shots[i]);
    close.addEventListener('click', function () {
      dialog.close();
    });
    // ⚠ The backdrop and the space around the picture are the dialog itself.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      root.classList.remove('zoom-open');
      if (opener) opener.focus();
    });
  }

  /**
   * ⚠ Each part on its own: one failing never takes the others down — and if
   * the reveals themselves fail, everything is shown at once, so a script error
   * can never leave a page blank.
   */
  function startKit() {
    var parts = [
      buildPickers,
      markCurrentPage,
      wireNav,
      wireReveals,
      wireCountups,
      wireSpotlights,
      wireScrollSpy,
      wireSearch,
      wireStories,
      wireZooms,
      function () {
        apply(initialLocale());
      },
      wireFits,
      restartCycles,
    ];
    for (var i = 0; i < parts.length; i += 1) {
      try {
        parts[i]();
      } catch (error) {
        if (parts[i] === wireReveals) root.classList.add('kit-shown');
        if (window.console && window.console.error) window.console.error(error);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startKit);
  } else {
    startKit();
  }
})();
