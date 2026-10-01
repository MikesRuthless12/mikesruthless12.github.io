/*
 * The report page on every Freally docs site (owner, 2026-10-01).
 *
 * The app opens /freally-<product>/report/#p=<payload>&s=<signature>&l=<lang>.
 * `p` is the app's facts, base64url JSON, signed by the app as `s`; this page
 * shows them read-only and sends `p` and `s` back exactly as they came, with
 * what the person typed beside them. ⛔ It never changes `p`: the backend checks
 * the signature, and a changed fact is refused.
 *
 * ⚠ Everything from the URL is drawn with textContent, never innerHTML, so a
 * report cannot put markup on the page.
 */
(function () {
  'use strict';

  var BACKEND = 'https://freallyproducts.pythonanywhere.com';
  var STORE = 'freally-report-lang';
  var html = document.documentElement;
  var product = html.getAttribute('data-product');
  var productName = html.getAttribute('data-product-name');
  var STRINGS = window.FREALLY_REPORT_STRINGS || {};
  var LANGS = window.FREALLY_REPORT_LANGS || [{ code: 'en', name: 'English' }];
  var params = new URLSearchParams(window.location.hash.slice(1));
  var p = params.get('p');
  var s = params.get('s');
  var lang = 'en';

  function pickLanguage() {
    var wanted = [params.get('l')];
    try {
      wanted.push(window.localStorage.getItem(STORE));
    } catch (e) {
      /* storage may be off */
    }
    wanted = wanted.concat(navigator.languages || [navigator.language]);
    for (var i = 0; i < wanted.length; i += 1) {
      var tag = wanted[i];
      if (!tag) continue;
      if (STRINGS[tag]) return tag;
      var base = tag.split('-')[0];
      for (var code in STRINGS) if (code.split('-')[0] === base) return code;
    }
    return 'en';
  }

  function t(key, vars) {
    var text = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    vars = vars || {};
    vars.product = productName;
    return text.replace(/\{(\w+)\}/g, function (_, name) {
      return vars[name] !== undefined ? String(vars[name]) : '';
    });
  }

  function decode(payload) {
    try {
      var b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      b64 += '==='.slice((b64.length + 3) % 4);
      var bytes = Uint8Array.from(atob(b64), function (c) {
        return c.charCodeAt(0);
      });
      return JSON.parse(new TextDecoder('utf-8').decode(bytes));
    } catch (e) {
      return null;
    }
  }

  var app = p && s && /^[0-9a-f]{64}$/i.test(s) ? decode(p) : null;
  if (!app || app.product !== product) app = null;

  function $(id) {
    return document.getElementById(id);
  }

  function row(table, label, value, mono) {
    if (value === undefined || value === null || value === '') return;
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    var td = document.createElement('td');
    th.textContent = label;
    td.textContent = value;
    if (mono) td.className = 'mono';
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);
  }

  function drawFacts() {
    var table = $('facts');
    table.textContent = '';
    if (!app) return;
    var when = '';
    try {
      when = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(app.time * 1000),
      );
    } catch (e) {
      when = new Date(app.time * 1000).toISOString();
    }
    row(table, t('fact.kind'), t('kind.' + app.kind));
    row(table, t('fact.type'), app.type);
    row(table, t('fact.message'), app.message);
    row(table, t('fact.location'), app.location, true);
    row(table, t('fact.version'), app.version);
    row(table, t('fact.build'), app.build, true);
    row(table, t('fact.os'), app.os);
    row(table, t('fact.host'), app.host);
    row(table, t('fact.time'), when);
    row(table, t('fact.crash'), app.crash_id, true);
    if (Array.isArray(app.frames) && app.frames.length) {
      row(table, t('fact.frames'), app.frames.join('\n'), true);
    }
  }

  function draw() {
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('title') + ' · ' + productName;
    var nodes = document.querySelectorAll('[data-t]');
    for (var i = 0; i < nodes.length; i += 1) nodes[i].textContent = t(nodes[i].getAttribute('data-t'));
    $('report').hidden = !app;
    $('none').hidden = !!app;
    drawFacts();
    checkEmail();
  }

  function checkEmail() {
    var input = $('email');
    var note = $('email-note');
    var value = input.value;
    if (!value.trim()) {
      note.textContent = '';
      input.setCustomValidity('');
      return true;
    }
    if (!window.FreallyEmail.isValid(value)) {
      note.textContent = t('email.invalid');
      input.setCustomValidity(t('email.invalid'));
      return false;
    }
    input.setCustomValidity('');
    var suggestion = window.FreallyEmail.hint(value);
    note.textContent = suggestion ? t('email.hint', { suggestion: suggestion }) : '';
    return true;
  }

  function say(key, vars, good) {
    var status = $('status');
    status.textContent = t(key, vars);
    status.className = good ? 'status good' : 'status bad';
  }

  function send(event) {
    event.preventDefault();
    if (!checkEmail()) return;
    var button = $('send');
    button.disabled = true;
    say('sending', {}, true);
    fetch(BACKEND + '/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p: p,
        s: s,
        user: {
          what: $('what').value,
          steps: $('steps').value,
          email: window.FreallyEmail.clean($('email').value),
        },
      }),
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            if (response.status === 201) {
              say('sent', { ref: body.ref }, true);
              $('form').hidden = true;
            } else if (response.status === 200) {
              say('duplicate', {}, true);
              $('form').hidden = true;
            } else if (response.status === 403) {
              say('refused', {}, false);
            } else if (response.status === 429) {
              say('tooMany', {}, false);
              button.disabled = false;
            } else {
              say('failed', {}, false);
              button.disabled = false;
            }
          });
      })
      .catch(function () {
        say('failed', {}, false);
        button.disabled = false;
      });
  }

  function languages() {
    var select = $('lang');
    for (var i = 0; i < LANGS.length; i += 1) {
      if (!STRINGS[LANGS[i].code]) continue;
      var option = document.createElement('option');
      option.value = LANGS[i].code;
      option.textContent = LANGS[i].name;
      option.lang = LANGS[i].code;
      select.appendChild(option);
    }
    select.value = lang;
    select.addEventListener('change', function () {
      lang = select.value;
      try {
        window.localStorage.setItem(STORE, lang);
      } catch (e) {
        /* storage may be off */
      }
      draw();
    });
  }

  lang = pickLanguage();
  languages();
  $('email').addEventListener('input', checkEmail);
  $('form').addEventListener('submit', send);
  draw();
})();
