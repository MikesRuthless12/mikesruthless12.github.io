/*
 * Freally MIDI Master — the roster page: every style the plugin models, A–Z.
 * © 2026 Mike Weaver — All Rights Reserved.
 *
 * ⛔⛔ THE ONLY SITE-SPECIFIC SCRIPT ON THIS SITE, and it is the roster's alone
 * (site.json `scripts.roster`). Everything else — the shell, the languages,
 * the reveals — is the site kit's `kit/kit.js`, the same on every Freally site.
 *
 * ⛔ `roster.json` is GENERATED from `data/` by `scripts/docs-roster.mjs`,
 * walking the registry the CI gate walks. A hand-written list of 1,318 models
 * once went 1,095 models stale without anyone noticing; never hand-maintain it.
 *
 * ⚠ Every word this script writes is on the page already, in a hidden
 * `[data-roster-word]` element the kit translates like any other — so this
 * reads the words back in whatever language is showing, and redraws when the
 * reader picks another. No string here is shown to a reader.
 */

(function () {
  'use strict';

  /*
   * ⛔⛔ NOINDEX, DELIBERATELY, AND IT COSTS THE SEO ON PURPOSE. This page lists
   * 2,413 real people's names. Describing a style to somebody already using the
   * tool is nominative use; ranking for their names would be using their
   * identity to pull search traffic toward a product, which is the core of what
   * right of publicity covers. Owner's decision, 2026-09-10. The site kit
   * writes every page's <head>, so the mark is added here.
   */
  var robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex, follow';
  document.head.appendChild(robots);

  var CHUNK = 250;

  function word(name) {
    var node = document.querySelector('[data-roster-word="' + name + '"]');
    return node === null ? '' : node.textContent;
  }

  function fillIn(template, values) {
    return template.replace(/\{(\w+)\}/g, function (whole, name) {
      return name in values ? values[name] : whole;
    });
  }

  function number(value) {
    try {
      return value.toLocaleString(document.documentElement.lang || 'en');
    } catch (error) {
      return String(value);
    }
  }

  function start() {
    var rows = document.getElementById('roster-rows');
    var shown = document.getElementById('roster-shown');
    var box = document.getElementById('roster-q');
    if (rows === null || shown === null || box === null) return;

    var models = [];
    var loaded = false;
    var failure = null;
    var wantType = '';
    var wantTier = '';
    var pending = 0;

    function message(text) {
      rows.textContent = '';
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = text;
      tr.appendChild(td);
      rows.appendChild(tr);
    }

    function cell(tr, text, strong) {
      var td = document.createElement('td');
      if (strong) {
        var mark = document.createElement('strong');
        mark.textContent = text;
        td.appendChild(mark);
      } else {
        td.textContent = text;
      }
      tr.appendChild(td);
    }

    function row(model) {
      var tr = document.createElement('tr');
      cell(tr, model.name);
      cell(tr, model.type ? word(model.type) || model.type : '—');
      cell(tr, model.era || '—');
      cell(tr, model.genres.join(', '));
      // ⚠ A flagship model is the one a producer most likely came for, so the
      // tier says so in bold as well as in words — never by colour alone.
      cell(tr, model.tier ? word(model.tier) || model.tier : '—', model.tier === 'flagship');
      return tr;
    }

    function counts() {
      var by = { all: models.length, artist: 0, producer: 0, genre: 0 };
      for (var i = 0; i < models.length; i += 1) {
        if (by[models[i].type] !== undefined) by[models[i].type] += 1;
      }
      var nodes = document.querySelectorAll('[data-roster-count]');
      for (var n = 0; n < nodes.length; n += 1) {
        var value = by[nodes[n].getAttribute('data-roster-count')];
        if (value !== undefined) nodes[n].textContent = number(value);
      }
    }

    /*
     * ⛔⛔ EVERY MODEL IS DRAWN, A–Z. The list once stopped at 300 rows, so the
     * published roster silently ended at "Darius Rucker". It is drawn in
     * chunks instead, one per frame, so the first screen is cheap and the list
     * is still complete.
     */
    function draw() {
      pending += 1;
      var drawing = pending;
      if (failure !== null) {
        message(word(failure));
        shown.textContent = '';
        return;
      }
      if (!loaded) return;
      counts();
      var needle = box.value.trim().toLowerCase();
      var matched = models.filter(function (m) {
        if (wantType && m.type !== wantType) return false;
        if (wantTier && m.tier !== wantTier) return false;
        return needle === '' || m.hay.indexOf(needle) !== -1;
      });
      shown.textContent = fillIn(word('shown'), {
        shown: number(matched.length),
        total: number(models.length),
      });
      if (matched.length === 0) {
        message(word('none'));
        return;
      }
      rows.textContent = '';
      var at = 0;
      function more() {
        if (drawing !== pending) return;
        var batch = document.createDocumentFragment();
        var until = Math.min(at + CHUNK, matched.length);
        for (; at < until; at += 1) batch.appendChild(row(matched[at]));
        rows.appendChild(batch);
        if (at < matched.length) window.requestAnimationFrame(more);
      }
      more();
    }

    /*
     * A row of pressable filters. `toggles`: pressing the pressed one lets it go
     * (the tier row has no "All" of its own — two "All"s side by side would
     * not say which was which); otherwise one of the row is always pressed.
     */
    function wire(attribute, toggles, set) {
      var buttons = document.querySelectorAll('[' + attribute + ']');
      for (var i = 0; i < buttons.length; i += 1) {
        buttons[i].addEventListener('click', function (event) {
          var chosen = event.currentTarget;
          var release = toggles && chosen.getAttribute('aria-pressed') === 'true';
          for (var j = 0; j < buttons.length; j += 1) {
            var on = buttons[j] === chosen && !release;
            buttons[j].setAttribute('aria-pressed', on ? 'true' : 'false');
            buttons[j].classList.toggle('btn-primary', on);
            buttons[j].classList.toggle('btn-secondary', !on);
          }
          set(release ? '' : chosen.getAttribute(attribute));
          draw();
        });
      }
    }

    box.addEventListener('input', draw);
    wire('data-roster-type', false, function (value) {
      wantType = value;
    });
    wire('data-roster-tier', true, function (value) {
      wantTier = value;
    });

    // The kit sets <html lang> as it paints a language: redraw in its words.
    if (typeof window.MutationObserver === 'function') {
      new window.MutationObserver(draw).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang'],
      });
    }

    /*
     * ⛔ `no-store`, because a cached roster is a roster that lies: a browser
     * holding yesterday's copy would draw a smaller roster with no sign
     * anything was wrong. ⚠ From a `file://` page the browser refuses the
     * request, and the reader is told so rather than shown empty filters.
     */
    if (location.protocol === 'file:') {
      failure = 'file';
      draw();
      return;
    }
    fetch('roster.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then(function (data) {
        models = data.models || [];
        // ⚠ The search haystack, built once rather than on every keystroke.
        models.forEach(function (m) {
          m.genres = Array.isArray(m.genres) ? m.genres : [];
          m.hay = (m.name + ' ' + m.era + ' ' + m.genres.join(' ')).toLowerCase();
        });
        loaded = true;
        draw();
      })
      .catch(function () {
        failure = 'failed';
        draw();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
