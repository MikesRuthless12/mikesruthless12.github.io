/*
 * The reporter's email address, checked as typed and never mailed (owner,
 * 2026-10-01: "verify what they entered, not have an email sent back").
 *
 * ⛔ The same rules as backend/emailcheck.py, held to the same cases
 * (shared/email-cases.json) by site-kit/emailcheck.test.mjs, so the page never
 * accepts an address the backend then refuses.
 */
(function (root) {
  var LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
  var LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
  var TLD = /^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/;
  var COMMON = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com',
    'live.com', 'msn.com', 'proton.me', 'protonmail.com', 'gmx.de', 'web.de',
    'yandex.ru', 'mail.ru', 'qq.com', '163.com', 'naver.com',
  ];

  function clean(address) {
    return String(address).trim();
  }

  function isValid(address) {
    address = clean(address);
    if (!address || address.length > 254 || address.split('@').length !== 2) return false;
    var parts = address.split('@');
    var local = parts[0];
    var labels = parts[1].split('.');
    if (!local || local.length > 64 || !LOCAL.test(local)) return false;
    if (labels.length < 2) return false;
    for (var i = 0; i < labels.length; i += 1) if (!LABEL.test(labels[i])) return false;
    return TLD.test(labels[labels.length - 1]);
  }

  function distance(a, b) {
    var previous = [];
    for (var j = 0; j <= b.length; j += 1) previous.push(j);
    for (var i = 1; i <= a.length; i += 1) {
      var current = [i];
      for (var k = 1; k <= b.length; k += 1) {
        current.push(Math.min(previous[k] + 1, current[k - 1] + 1, previous[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1)));
      }
      previous = current;
    }
    return previous[b.length];
  }

  function hint(address) {
    address = clean(address);
    var parts = address.split('@');
    if (parts.length !== 2) return null;
    var domain = parts[1].toLowerCase();
    if (COMMON.indexOf(domain) !== -1) return null;
    var best = COMMON[0];
    for (var i = 1; i < COMMON.length; i += 1) {
      if (distance(domain, COMMON[i]) < distance(domain, best)) best = COMMON[i];
    }
    return distance(domain, best) <= 2 ? parts[0] + '@' + best : null;
  }

  var api = { clean: clean, isValid: isValid, hint: hint };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FreallyEmail = api;
})(this);
