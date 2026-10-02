/*
 * Freally File Manager — client-side search over `search-index.js`, ported from
 * Freally Flipcopy's docs site unchanged but for the names.
 *
 * ⛔ **No search service, no CDN, no request.** The index is a generated
 * JavaScript file this page already loaded; typing in the box never contacts
 * anything. That is the same promise the application makes and it is the reason
 * the site has no search backend rather than a cheap one.
 *
 * ⚠ **Scoring is deliberately simple** — a title hit outranks a body hit, an
 * exact phrase outranks scattered words — because the index is a few hundred
 * sections and anything cleverer would be a library, and a library would be a
 * `<script src>` off this origin.
 */

(function () {
  'use strict';

  var box = document.querySelector('.search input');
  var results = document.querySelector('.search-results');
  if (box === null || results === null) return;

  var INDEX = window.FFM_SEARCH_INDEX || [];

  function normalise(text) {
    return String(text).toLowerCase();
  }

  /**
   * ⚠ **Folded once per entry, not once per keystroke.** `score` runs over every
   * entry on every `input` event, so lowercasing the whole index each time was
   * ~99 KB of string work per character typed — thrown away immediately. The
   * folded forms are cached on the entry the first time it is scored.
   */
  function folded(entry) {
    if (entry._h === undefined) {
      // ⚠ `heading`, not `title` — see the note in `scripts/build-docs-site.mjs`.
      entry._h = normalise(entry.heading);
      entry._t = normalise(entry.text);
    }
    return entry;
  }

  function score(entry, query, words) {
    var title = folded(entry)._h;
    var body = entry._t;
    var total = 0;

    // ⛔ **The rejection first.** Every word has to appear somewhere, or a
    // two-word query returns everything that matched either — a search box that
    // looks broken. ⚠ It used to run AFTER the scoring loop, so the entries
    // that were about to score zero — most of them, for any real query — paid a
    // full scoring pass first.
    for (var j = 0; j < words.length; j += 1) {
      if (title.indexOf(words[j]) === -1 && body.indexOf(words[j]) === -1) return 0;
    }

    // ⚠ The whole phrase outranks scattered words: somebody typing "room code"
    // wants the section about room codes, not every section containing "room".
    if (title.indexOf(query) !== -1) total += 100;
    if (body.indexOf(query) !== -1) total += 30;

    for (var i = 0; i < words.length; i += 1) {
      if (title.indexOf(words[i]) !== -1) total += 10;
      if (body.indexOf(words[i]) !== -1) total += 2;
    }
    return total;
  }

  /**
   * Regex metacharacters escaped, so a query is searched for literally.
   *
   * ⚠ Without this a reader typing `c++` or `(` would get a syntax error
   * instead of a result list.
   */
  function literal(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** A short extract around the first hit, so a result says why it matched. */
  function extract(entry, query) {
    var body = entry.text;
    // ⛔⛔ **THE INDEX MUST COME FROM THE STRING BEING SLICED.** This read
    // the position out of the *folded* copy and then sliced the original, and
    // `toLowerCase` is not length-preserving — `'İ'.toLowerCase()` is two code
    // units. One such character earlier in a section shifted every later index,
    // so the snippet window landed off the hit it was supposed to be showing.
    //
    // ⚠ So it searches the original case-insensitively instead. A character
    // whose case does not fold under a plain `i` flag simply is not found, and
    // the fallback below shows the start of the section — which is a worse
    // extract, never a wrong one.
    var at = query === '' ? -1 : body.search(new RegExp(literal(query), 'i'));
    if (at === -1) at = 0;
    var from = Math.max(0, at - 60);
    var snippet = body.slice(from, from + 180).trim();
    return (from > 0 ? '…' : '') + snippet + (from + 180 < body.length ? '…' : '');
  }

  /**
   * Hands a freshly built subtree to `site.js` to translate.
   *
   * ⚠ **Guarded rather than assumed.** `site.js` is a separate file and a
   * separate request; if it failed to load, search must still work and still show
   * its English rather than throwing on every keystroke.
   */
  function translate(root) {
    if (typeof window.FFM_TRANSLATE === 'function') {
      window.FFM_TRANSLATE(root);
    }
  }

  function render(matches, query) {
    results.textContent = '';
    if (matches.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'search-empty';
      // ⛔⛔ **AND IT HAS TO BE TRANSLATED HERE, NOT BY `site.js` ALONE.**
      //
      // ▶ The comment that was here said `site.js` "fills it in if the reader is
      // not on English", and that was simply untrue: `apply` walks the document
      // once when the page loads and again when the picker changes, and this node
      // does not exist at either moment. So the one sentence a reader sees when a
      // search finds nothing was **English on all seventeen translations**.
      //
      // ⚠ The English is still written first, so a reader whose catalogue failed
      // to load gets a sentence rather than an empty bullet.
      empty.setAttribute('data-i18n', 'search.none');
      empty.textContent = 'Nothing on this site matches that.';
      results.appendChild(empty);
      translate(empty.parentNode);
      return;
    }


    // ⚠ One insertion rather than up to 36: the rows are built off-document
    // and appended together, so the page lays out once per keystroke.
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
    var query = normalise(box.value).trim();
    if (query === '') {
      // ⚠ Cleared here rather than by calling `render([], '')` — a sentinel
      // argument whose only purpose was to reach a guard inside `render`, which
      // encoded "an empty query shows nothing" in two places.
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
  // ⚠ Runs once at load so a deep link like `documentation.html?q=room` — or a
  // browser that restored the field on a back navigation — shows its results
  // rather than an empty box under a filled-in query.
  var fromUrl = new URLSearchParams(location.search).get('q');
  if (fromUrl !== null && fromUrl !== '') box.value = fromUrl;
  run();
})();
