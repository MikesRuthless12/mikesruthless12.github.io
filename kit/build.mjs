#!/usr/bin/env node
/**
 * ⛔⛔ THE FREALLY SITE KIT'S BUILDER — every Freally website, one format.
 *
 * ▶ The owner, 2026-10-04: *"ensure all docs sites are the same across the
 * board, no difference in any of them unless there is no changelog or no
 * features or documentation page associated with that exact app"*. So the
 * shell of every page — head, navigation, hero, page heads, the road to 1.0,
 * the changelog, the family strip, the call to action, the footer — is WRITTEN
 * HERE, from data, and a site supplies only its words:
 *
 *   docs/site.json            the product: name, icon, pages, chips, strings
 *   docs/src/<page>.html      each page's own sections (kit components below)
 *   docs/ladder.json          the road to 1.0 (optional)
 *   <changelog>.md            the changelog page's source (site.json names it)
 *   docs/i18n/<code>.json     the site's strings in each language
 *   docs/i18n/changelog/<code>.json  the changelog's blocks in each language
 *
 * and this writes `docs/<page>.html`, `docs/i18n/en.json` (the English every
 * translation is made from), `docs/i18n/changelog/en.json`,
 * `docs/i18n/<code>.js` and `docs/search-index.js`.
 *
 *   node kit/build.mjs            write
 *   node kit/build.mjs --check    write nothing; fail on any drift or gap
 *
 * ⛔ This file, `kit.css`, `kit.js` and everything else in `kit/` are
 * byte-identical on every site (`kit/manifest.json` holds their hashes, the
 * check verifies them, and publish.py refuses a site whose kit differs from
 * `Freally Bugs/site-kit/kit`). Never edit a site's copy.
 *
 * Kit components a page may use (`docs/src/<page>.html`):
 *   <kit-hero> <kit-headline …>…</kit-headline> <kit-lede …>…</kit-lede> </kit-hero>
 *       home only: the hero, with the icon, badge, buttons and price notice added
 *   <kit-head> <kit-lede …>…</kit-lede> </kit-head>
 *       every other page: the page head (its headline is the kit's, per page)
 *   <kit-section id="…" label="key|English"> … </kit-section>
 *       a full-width section with its [Label]; sections alternate grounds
 *   <kit-stats> <div class="stat">…</div>… </kit-stats>   big numbers that count up
 *   <kit-ladder></kit-ladder>       the road to 1.0, from ladder.json
 *   <kit-manual> <section>…<h2 id=… data-i18n=…>…</h2>…</section>… </kit-manual>
 *       documentation: the contents rail is built from the h2s
 *   <kit-art name="circuit"></kit-art>   one of the kit's illustrations
 *   <kit-icon name="globe"></kit-icon>   one of the kit's icons
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { icon } from './icons.mjs';
import {
  escapeHtml,
  parseBlocks,
  renderInline,
  parseRelease,
  renderReleaseHeading,
  slug,
  textOf,
} from './markdown.mjs';

const KIT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const SITE = resolve(args.find((a) => !a.startsWith('--')) ?? join(KIT, '..'));

export const LANGS = [
  'en', 'ar', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pl', 'pt-BR', 'ru', 'tr',
  'uk', 'vi', 'zh-CN',
];

/** ⚠ The family, in the main site's order. Links are absolute: other sites. */
export const FAMILY = [
  { slug: 'midi-master', name: 'Freally MIDI Master' },
  { slug: 'flipcopy', name: 'Freally Flipcopy' },
  { slug: 'oscillate', name: 'Freally Oscillate' },
  { slug: 'unloop', name: 'Freally Unloop' },
  { slug: 'sourcerer', name: 'Freally Sourcerer' },
  { slug: 'teleprompt', name: 'Freally Teleprompt' },
  { slug: 'file-manager', name: 'Freally File Manager' },
  { slug: 'capture', name: 'Freally Capture' },
];
const DOMAIN = 'https://freallyproducts.com/';

/** Every page a site may have, in navigation order. */
const PAGE_ORDER = ['index', 'features', 'documentation', 'roster', 'changelog'];
const PAGE_KEY = {
  index: 'kit.nav.home',
  features: 'kit.nav.features',
  documentation: 'kit.nav.documentation',
  roster: 'kit.nav.roster',
  changelog: 'kit.nav.changelog',
};

const problems = [];
const written = [];

// ── io ─────────────────────────────────────────────────────────────────────

function read(path) {
  return readFileSync(path, 'utf8');
}

function readJson(path) {
  return JSON.parse(read(path));
}

/** Writes, or in `--check` compares and records the drift. */
function put(path, next, what) {
  let current = null;
  try {
    current = readFileSync(path, 'utf8');
  } catch {
    /* not generated yet */
  }
  if (current === next) return;
  if (CHECK) {
    problems.push(
      current === null ? `⛔ ${what} has never been generated (${rel(path)})` : `⛔ ${what} is out of date (${rel(path)})`,
    );
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, next, 'utf8');
  written.push(what);
}

function rel(path) {
  return relative(SITE, path).split('\\').join('/');
}

const sha = (text) => createHash('sha256').update(text).digest('hex');

// ── the kit itself: intact, and the same everywhere ───────────────────────

const KIT_FILES = () =>
  walk(KIT)
    .filter((p) => !p.endsWith('manifest.json'))
    .map((p) => relative(KIT, p).split('\\').join('/'))
    .sort();

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

/**
 * ⚠ **Text is hashed with its CRLF line endings folded to LF**, so a checkout
 * that turns LF into CRLF (Windows' `core.autocrlf`) is the same kit; a font or
 * an image is hashed as it is.
 */
const TEXT = /\.(css|js|mjs|json|svg|txt|md|html)$/;
export function kitHash(name, bytes) {
  return sha(TEXT.test(name) ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes);
}

function kitManifest() {
  const files = {};
  for (const name of KIT_FILES()) files[name] = kitHash(name, readFileSync(join(KIT, name)));
  return files;
}

{
  const manifestPath = join(KIT, 'manifest.json');
  const actual = kitManifest();
  const recorded = existsSync(manifestPath) ? readJson(manifestPath).files : null;
  if (args.includes('--seal')) {
    // Only the kit's own home seals it; a site never does.
    const version = sha(JSON.stringify(actual)).slice(0, 12);
    writeFileSync(manifestPath, `${JSON.stringify({ version, files: actual }, null, 2)}\n`, 'utf8');
    process.stdout.write(`kit: sealed ${Object.keys(actual).length} files as ${version}\n`);
    process.exit(0);
  }
  if (recorded === null) {
    problems.push('⛔ kit/manifest.json is missing: copy the kit whole from Freally Bugs/site-kit/kit');
  } else {
    for (const [name, hash] of Object.entries(actual)) {
      if (recorded[name] !== hash) problems.push(`⛔ kit/${name} differs from the kit it was copied from — never edit a site's kit`);
    }
    for (const name of Object.keys(recorded)) {
      if (!(name in actual)) problems.push(`⛔ kit/${name} is missing from this site's kit`);
    }
  }
}

// ── the site's data ───────────────────────────────────────────────────────

const SITE_JSON = join(SITE, 'site.json');
if (!existsSync(SITE_JSON)) {
  process.stderr.write(`⛔ ${SITE_JSON} not found — is ${SITE} a Freally site?\n`);
  process.exit(2);
}
const site = readJson(SITE_JSON);
for (const field of ['product', 'name', 'icon', 'pages', 'strings']) {
  if (site[field] === undefined) problems.push(`⛔ site.json has no "${field}"`);
}
const pages = PAGE_ORDER.filter((p) => site.pages.includes(p));
for (const p of site.pages) if (!PAGE_ORDER.includes(p)) problems.push(`⛔ site.json names an unknown page "${p}"`);
const has = (page) => pages.includes(page);

const kitStrings = {};
for (const code of LANGS) {
  const path = join(KIT, 'i18n', `${code}.json`);
  kitStrings[code] = existsSync(path) ? readJson(path) : {};
}
const kitEnglish = kitStrings.en;

/**
 * The values a kit string's `{name}`-style holes are filled with, once per
 * site — so the catalogues carry finished sentences, never templates.
 */
const ladder = site.ladder && existsSync(join(SITE, site.ladder)) ? readJson(join(SITE, site.ladder)) : null;
const doneRungs = ladder ? ladder.rungs.filter((r) => r.state === 'done') : [];
const nextRung = ladder ? ladder.rungs.find((r) => r.state !== 'done') : undefined;
// ⚠ The badge names the next rung that HAS a number: an unnumbered planned step
// would read "rig is next".
const nextNumbered = ladder ? ladder.rungs.find((r) => r.state !== 'done' && r.version) : undefined;
const lastDone = doneRungs.length > 0 ? doneRungs[doneRungs.length - 1].version : null;
const HOLES = {
  name: site.name,
  done: lastDone ?? '',
  next: nextNumbered ? nextNumbered.version : '',
  version: site.version ?? lastDone ?? '',
};

function fill(text) {
  return String(text).replace(/\{(\w+)\}/g, (whole, hole) => (hole in HOLES ? HOLES[hole] : whole));
}

/** A kit string's English, holes filled. */
function kitText(key) {
  const value = kitEnglish[key];
  if (typeof value !== 'string') {
    problems.push(`⛔ the kit has no English for ${key}`);
    return key;
  }
  return fill(value);
}

/** A site string's English (from site.json "strings"). */
function siteText(key) {
  const value = site.strings[key];
  if (typeof value !== 'string') {
    problems.push(`⛔ site.json "strings" has no "${key}"`);
    return key;
  }
  return value;
}

/** A kit string or a site string, by its key's namespace. */
function textFor(key) {
  return key.startsWith('kit.') ? kitText(key) : siteText(key);
}

const T = (key) => `data-i18n="${escapeHtml(key)}"`;
const H = (key) => `data-i18n-html="${escapeHtml(key)}"`;
const kt = (key) => `<span ${T(key)}>${escapeHtml(kitText(key))}</span>`;

// ── pieces of the shell ───────────────────────────────────────────────────

function pageTitle(page) {
  if (page === 'index') return `${site.name} — ${siteText('site.tagline')}`;
  return `${kitText(PAGE_KEY[page])} — ${site.name}`;
}

function head(page) {
  const description = siteText('site.description');
  return [
    '<!doctype html>',
    `<html lang="en" dir="ltr" class="no-js" data-page="${page}" data-product="${escapeHtml(site.product)}" data-name="${escapeHtml(site.name)}" data-title-key="${page === 'index' ? 'site.tagline' : PAGE_KEY[page]}">`,
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    '    <meta name="color-scheme" content="dark" />',
    '    <meta name="theme-color" content="#090c09" />',
    // ⛔ Nothing from anywhere else, and no inline script: the site loads only its
    // own files (data: only for the grain and the comparison marks' SVG masks).
    "    <meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'\" />",
    `    <title>${escapeHtml(pageTitle(page))}</title>`,
    `    <meta name="description" content="${escapeHtml(description)}" />`,
    // a page the site asks search engines to leave out (MIDI Master's roster)
    (site.noindex ?? []).includes(page) ? '    <meta name="robots" content="noindex" />' : '',
    `    <meta property="og:title" content="${escapeHtml(pageTitle(page))}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    '    <meta property="og:type" content="website" />',
    `    <link rel="icon" href="favicon.ico${site.iconVersion ? `?v=${site.iconVersion}` : ''}" sizes="any" />`,
    `    <link rel="icon" href="favicon-192.png${site.iconVersion ? `?v=${site.iconVersion}` : ''}" type="image/png" />`,
    `    <link rel="apple-touch-icon" href="apple-touch-icon.png${site.iconVersion ? `?v=${site.iconVersion}` : ''}" />`,
    '    <link rel="preload" href="kit/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />',
    '    <link rel="stylesheet" href="kit/kit.css" />',
    '    <script src="kit/kit.js"></script>',
    '  </head>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

function navItems() {
  if (Array.isArray(site.nav)) {
    return site.nav.map((item) => ({ href: item.href, key: item.key }));
  }
  return pages.map((p) => ({ href: `${p}.html`, key: PAGE_KEY[p] }));
}

function brand() {
  return [
    `<a class="nav__brand" href="index.html">`,
    `<img src="${escapeHtml(site.icon)}" alt="" width="28" height="28" />`,
    `<span>${escapeHtml(site.name)}</span></a>`,
  ].join('');
}

function nav() {
  const links = navItems()
    .map((item) => `          <a href="${escapeHtml(item.href)}" ${T(item.key)}>${escapeHtml(kitText(item.key))}</a>`)
    .join('\n');
  return [
    `    <a class="skip" href="#main" ${T('kit.skip')}>${escapeHtml(kitText('kit.skip'))}</a>`,
    '    <header class="nav">',
    '      <div class="wrap nav__inner">',
    `        ${brand()}`,
    `        <nav class="site-nav" aria-label="${escapeHtml(kitText('kit.nav.site'))}" data-i18n-attr="aria-label:kit.nav.site">`,
    links,
    '        </nav>',
    '        <div class="nav__end">',
    '          <label class="locale-wrap">',
    `            ${icon('globe')}`,
    `            <select class="locale" aria-label="${escapeHtml(kitText('kit.nav.language'))}" data-i18n-attr="aria-label:kit.nav.language"></select>`,
    '          </label>',
    site.product === 'home'
      ? ''
      : `          <a class="btn btn-primary btn-sm nav__cta" href="${DOMAIN}" ${T('kit.nav.allApps')}>${escapeHtml(kitText('kit.nav.allApps'))}</a>`,
    '        </div>',
    '      </div>',
    '    </header>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

function familyLinks(current) {
  return FAMILY.map((app) => {
    const here = app.slug === current ? ' aria-current="true"' : '';
    return `<li><a href="${DOMAIN}freally-${app.slug}/"${here}>${escapeHtml(app.name)}</a></li>`;
  }).join('');
}

function footer() {
  const own =
    site.product === 'home'
      ? ''
      : [
          '<div>',
          `<h2 ${T('kit.footer.thisApp')}>${escapeHtml(kitText('kit.footer.thisApp'))}</h2>`,
          '<ul>',
          ...navItems().map(
            (item) =>
              `<li><a href="${escapeHtml(item.href)}" data-page ${T(item.key)}>${escapeHtml(kitText(item.key))}</a></li>`,
          ),
          '</ul>',
          '</div>',
        ].join('');
  const statusKey = site.status ?? (lastDone ? 'kit.status.devVersion' : 'kit.status.dev');
  const legal = (site.legal ?? ['footer.licence', 'footer.yours'])
    .map((key) => `<p ${T(key)}>${escapeHtml(siteText(key))}</p>`)
    .join('');
  return [
    '    <footer class="footer">',
    '      <div class="footer__panel">',
    `        <div class="footer__top${site.product === 'home' ? ' footer__top--home' : ''}">`,
    `          <div class="footer__about">${brand()}<p ${T('site.tagline')}>${escapeHtml(siteText('site.tagline'))}</p>`,
    `<p class="fineprint" ${T(site.price ?? 'kit.price')}>${escapeHtml(textFor(site.price ?? 'kit.price'))}</p></div>`,
    own === '' ? '' : `          ${own}`,
    '          <div>',
    `            <h2 ${T('kit.footer.family')}>${escapeHtml(kitText('kit.footer.family'))}</h2>`,
    `            <ul><li><a href="${DOMAIN}" ${T('kit.footer.home')}>${escapeHtml(kitText('kit.footer.home'))}</a></li>${familyLinks(site.product)}</ul>`,
    '          </div>',
    '        </div>',
    '        <div class="footer__bottom">',
    `          <div class="footer__legal">${legal}</div>`,
    `          <span class="status" ${T(statusKey)}>${escapeHtml(kitText(statusKey))}</span>`,
    '        </div>',
    '      </div>',
    '    </footer>',
  ].join('\n');
}

function scripts(page) {
  const lines = [];
  if (page === 'documentation') lines.push('    <script src="search-index.js"></script>');
  for (const extra of site.scripts?.[page] ?? []) lines.push(`    <script src="${escapeHtml(extra)}"></script>`);
  return lines.join('\n');
}

// ── kit components ────────────────────────────────────────────────────────

/** `<kit-x attrs>inner</kit-x>` → `fn(attrs, inner)`, outermost first, repeatedly. */
function expand(html, tag, fn) {
  const pattern = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g');
  return html.replace(pattern, (_whole, attrs = '', inner) => fn(parseAttrs(attrs), inner));
}

function parseAttrs(text) {
  const out = {};
  const pattern = /([\w:-]+)(?:="([^"]*)")?/g;
  let match = pattern.exec(text);
  while (match !== null) {
    out[match[1]] = match[2] ?? '';
    match = pattern.exec(text);
  }
  return out;
}

/** The one keyed element inside `inner` named `tag`, as `{ attrs, inner }`. */
function part(inner, tag) {
  const match = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`).exec(inner);
  if (match === null) return null;
  return { attrs: parseAttrs(match[1] ?? ''), inner: match[2].trim(), raw: match[1] ?? '' };
}

function keyAttrs(attrs) {
  return Object.entries(attrs)
    .filter(([name]) => name.startsWith('data-i18n'))
    .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    .join(' ');
}

function chips() {
  return (site.chips ?? [])
    .map((chip) => {
      // `@key|English` is a translatable chip; anything else is a name.
      if (chip.startsWith('@')) {
        const [key, english] = chip.slice(1).split('|');
        return `<li ${T(key)}>${escapeHtml(english)}</li>`;
      }
      return `<li>${escapeHtml(chip)}</li>`;
    })
    .join('');
}

function heroBadge() {
  if (site.badge) return `<p class="badge"><span class="badge__dot"></span><span ${T(site.badge)}>${escapeHtml(siteText(site.badge))}</span></p>`;
  if (lastDone === null) return `<p class="badge"><span class="badge__dot"></span>${kt('kit.status.dev')}</p>`;
  const key = nextNumbered ? 'kit.badge.progress' : 'kit.badge.done';
  return `<p class="badge"><span class="badge__dot"></span>${kt(key)}</p>`;
}

function heroActions() {
  const buttons = [];
  if (has('features')) {
    buttons.push(
      `<a class="btn btn-primary" href="features.html"><span ${T('kit.cta.features')}>${escapeHtml(kitText('kit.cta.features'))}</span>${icon('arrow-right', 'icon--arrow')}</a>`,
    );
  }
  if (has('documentation')) {
    buttons.push(
      `<a class="btn btn-secondary" href="documentation.html">${icon('book-open')}<span ${T('kit.cta.docs')}>${escapeHtml(kitText('kit.cta.docs'))}</span></a>`,
    );
  } else if (has('changelog')) {
    buttons.push(
      `<a class="btn btn-secondary" href="changelog.html">${icon('history')}<span ${T('kit.cta.changelog')}>${escapeHtml(kitText('kit.cta.changelog'))}</span></a>`,
    );
  }
  for (const extra of site.heroActions ?? []) {
    buttons.push(
      `<a class="btn btn-${extra.primary ? 'primary' : 'secondary'}" href="${escapeHtml(extra.href)}"><span ${T(extra.key)}>${escapeHtml(siteText(extra.key))}</span></a>`,
    );
  }
  return buttons.length === 0 ? '' : `<div class="actions">${buttons.join('')}</div>`;
}

function heroVisual() {
  return [
    '<div class="hero__visual" aria-hidden="true">',
    '<img class="hero__orbit" src="kit/art/orbit.svg" alt="" width="640" height="640" />',
    '<div class="hero__core">',
    `<img src="${escapeHtml(site.icon)}" alt="" width="200" height="200" />`,
    '</div>',
    '</div>',
  ].join('');
}

function hero(_attrs, inner) {
  const headline = part(inner, 'kit-headline');
  const lede = part(inner, 'kit-lede');
  if (headline === null) problems.push('⛔ <kit-hero> needs a <kit-headline>');
  if (lede === null) problems.push('⛔ <kit-hero> needs a <kit-lede>');
  // freallyproducts.com: the turning wordmark is the page's <h1>, and the
  // headline beside it is display type without being a second heading.
  const wordmark = part(inner, 'kit-wordmark');
  return [
    '<section class="hero">',
    '<div class="hero__grid" aria-hidden="true"></div>',
    '<div class="orb" aria-hidden="true"></div>',
    '<div class="wrap hero__inner">',
    '<div class="hero__copy">',
    wordmark !== null
      ? `<div class="hero__brand"><img class="app-icon" src="${escapeHtml(site.icon)}" alt="" width="56" height="56" />${wordmarkHtml(textOf(wordmark.inner))}${heroBadge()}</div>`
      : `<div class="hero__brand"><img class="app-icon" src="${escapeHtml(site.icon)}" alt="" width="56" height="56" /><span class="hero__name">${escapeHtml(site.name)}</span>${heroBadge()}</div>`,
    headline === null
      ? ''
      : wordmark !== null
        ? `<p class="display" ${keyAttrs(headline.attrs)}>${headline.inner}</p>`
        : `<h1 class="display" ${keyAttrs(headline.attrs)}>${headline.inner}</h1>`,
    lede !== null ? `<p class="lead" ${keyAttrs(lede.attrs)}>${lede.inner}</p>` : '',
    heroActions(),
    `<p class="fineprint" ${T(site.price ?? 'kit.price')}>${escapeHtml(textFor(site.price ?? 'kit.price'))}</p>`,
    `<p class="fineprint"><strong ${T('kit.noDownloads')}>${escapeHtml(kitText('kit.noDownloads'))}</strong></p>`,
    `<ul class="chips">${chips()}</ul>`,
    '</div>',
    heroVisual(),
    '</div>',
    '</section>',
  ].join('\n');
}

function wordmarkHtml(text) {
  const layers = [];
  for (let depth = 9; depth >= 0; depth -= 1) {
    layers.push(`<span class="wordmark__layer" data-depth="${depth}">${escapeHtml(text)}</span>`);
  }
  return [
    '<h1 class="wordmark" dir="ltr">',
    `<span class="visually-hidden">${escapeHtml(text)}</span>`,
    `<span class="wordmark__spin" aria-hidden="true">${layers.join('')}</span>`,
    '</h1>',
  ].join('');
}

const PAGE_HEADLINE = {
  features: 'kit.head.features',
  documentation: 'kit.head.documentation',
  changelog: 'kit.head.changelog',
  roster: 'kit.head.roster',
};

function pageHead(page, inner) {
  const lede = inner === null ? null : part(inner, 'kit-lede');
  const headlineKey = PAGE_HEADLINE[page];
  const lines = [
    '<section class="page-head">',
    '<div class="page-head__grid" aria-hidden="true"></div>',
    '<div class="orb" aria-hidden="true"></div>',
    '<div class="wrap">',
    `<img class="app-icon" src="${escapeHtml(site.icon)}" alt="" width="72" height="72" />`,
    `<span class="label" ${T(PAGE_KEY[page])}>${escapeHtml(kitText(PAGE_KEY[page]))}</span>`,
    `<h1 ${H(headlineKey)}>${fill(kitEnglish[headlineKey] ?? '')}</h1>`,
  ];
  if (page === 'changelog') {
    lines.push(`<p class="lead" ${T('kit.changelog.lede')}>${escapeHtml(kitText('kit.changelog.lede'))}</p>`);
  } else if (lede !== null) {
    lines.push(`<p class="lead" ${keyAttrs(lede.attrs)}>${lede.inner}</p>`);
  } else {
    problems.push(`⛔ ${page}: <kit-head> needs a <kit-lede>`);
  }
  const fineprint = inner === null ? null : part(inner, 'kit-fineprint');
  if (fineprint !== null) lines.push(`<p class="fineprint" ${keyAttrs(fineprint.attrs)}>${fineprint.inner}</p>`);
  if (page === 'documentation') {
    lines.push(
      '<div class="search">',
      '<div class="search__field">',
      icon('search'),
      `<input type="search" placeholder="${escapeHtml(kitText('kit.search.placeholder'))}" aria-label="${escapeHtml(kitText('kit.search.placeholder'))}" data-i18n-attr="placeholder:kit.search.placeholder,aria-label:kit.search.placeholder" />`,
      '</div>',
      '<ul class="search-results" aria-live="polite"></ul>',
      '</div>',
    );
  }
  lines.push('</div>', '</section>');
  return lines.join('\n');
}

let sectionCount = 0;
function section(attrs, inner) {
  const id = attrs.id ? ` id="${escapeHtml(attrs.id)}"` : '';
  sectionCount += 1;
  const surface = sectionCount % 2 === 0 ? ' section--surface' : '';
  let label = '';
  if (attrs.label) {
    // `kit.label.*` is one of the kit's shared labels; anything else is the
    // site's own, written `key|English`.
    const [key, english] = attrs.label.split('|');
    if (english === undefined && !key.startsWith('kit.')) {
      problems.push(`⛔ <kit-section label="${attrs.label}"> needs "key|English" or a kit.label.* key`);
    }
    label = `<span class="label" ${T(key)}>${escapeHtml(english ?? kitText(key))}</span>`;
  }
  return `<section class="section${surface}"${id}>\n<div class="wrap">\n${label}\n${inner.trim()}\n</div>\n</section>`;
}

function stats(attrs, inner) {
  // A field of hex behind the numbers: texture, not information (aria-hidden).
  const rows = [];
  let seed = 0x5eed ^ site.product.length;
  for (let r = 0; r < 18; r += 1) {
    let row = '';
    for (let c = 0; c < 26; c += 1) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      row += `${((seed >> 8) & 0xff).toString(16).padStart(2, '0').toUpperCase()} `;
    }
    rows.push(row.trimEnd());
  }
  sectionCount += 1;
  // ⛔ Every band has the same head on every site (owner, 2026-10-04: "no
  // difference in any of them"): its [Label] — [By the numbers] unless the
  // page names another — and one lead sentence: the page's own, written
  // before the first stat as a single `<p class="lead">`, else the kit's.
  const first = inner.search(/<div class="stat"/);
  const own = first > 0 ? inner.slice(0, first).trim() : '';
  const oneLead = /^<p class="lead"[^>]*>[\s\S]*<\/p>$/.test(own) && own.match(/<p\b/g).length === 1;
  if (own !== '' && !oneLead) {
    problems.push(`⛔ a <kit-stats> head is one <p class="lead">, nothing more: ${own.slice(0, 60)}…`);
  }
  const lead = own || `<p class="lead" ${T('kit.numbers.lead')}>${escapeHtml(kitText('kit.numbers.lead'))}</p>`;
  const items = first >= 0 ? inner.slice(first) : inner;
  const [key, english] = (attrs.label ?? 'kit.label.numbers').split('|');
  const label = `<span class="label" ${T(key)}>${escapeHtml(english ?? kitText(key))}</span>`;
  const head = `<div class="section-head">${label}${lead}</div>`;
  const id = ` id="${escapeHtml(attrs.id ?? 'numbers')}"`;
  return [
    `<section class="section section--tight stats-band"${id}>`,
    `<div class="stats-band__code" aria-hidden="true">${rows.join('\n')}</div>`,
    '<div class="wrap">',
    head,
    `<div class="stats">${items.trim()}</div>`,
    '</div>',
    '</section>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

const STATE_KEY = {
  done: 'kit.ladder.done',
  planned: 'kit.ladder.planned',
  goal: 'kit.ladder.goal',
  later: 'kit.ladder.later',
};

/** Site strings that come from data rather than markup: `[key, English]`. */
const dataStrings = new Map();

function ladderList() {
  if (ladder === null) {
    problems.push('⛔ <kit-ladder> is used but site.json names no ladder file');
    return '';
  }
  const rows = ladder.rungs.map((rung) => {
    const stateKey = STATE_KEY[rung.state];
    const name = rung.id ?? rung.version;
    if (stateKey === undefined) {
      problems.push(`⛔ ${name} has the state "${rung.state}" (done, planned, goal or later)`);
      return '';
    }
    if (!name) {
      problems.push('⛔ a ladder rung has neither an id nor a version');
      return '';
    }
    const isNext = nextRung !== undefined && rung === nextRung;
    // ⚠ A rung is keyed by its `id` when it has one: a planned step can have
    // no number until it ships (Teleprompt's rule), and its key must not change
    // the day it gets one.
    const textKey = `ladder.rung.${name}`;
    dataStrings.set(textKey, rung.summary);
    const cls = `rung rung--${rung.state}${isNext ? ' rung--next' : ''}${
      doneRungs.length > 0 && rung === doneRungs[doneRungs.length - 1] ? ' rung--last-done' : ''
    }`;
    return [
      `<li class="${cls}">`,
      `<code class="rung__ver">${rung.version ? escapeHtml(rung.version) : '—'}</code>`,
      `<span class="state state-${rung.state}" ${T(stateKey)}>${escapeHtml(kitText(stateKey))}</span>`,
      `<span class="rung__text" ${T(textKey)}>${escapeHtml(rung.summary)}</span>`,
      '</li>',
    ].join('');
  });
  return `<ol class="ladder">\n${rows.join('\n')}\n</ol>`;
}

/**
 * `<kit-states>`: the Limits section's first card — what each state on the
 * road means, for the states this site's ladder uses — in the kit's words, so
 * it reads the same on every site.
 */
function statesCard() {
  if (ladder === null) {
    problems.push('⛔ <kit-states> is used but site.json names no ladder file');
    return '';
  }
  const rows = Object.keys(STATE_KEY)
    .filter((state) => ladder.rungs.some((rung) => rung.state === state))
    .map(
      (state) =>
        `<li><span class="state state-${state}" ${T(STATE_KEY[state])}>${escapeHtml(kitText(STATE_KEY[state]))}</span>` +
        `<span ${T(`kit.states.${state}`)}>${escapeHtml(kitText(`kit.states.${state}`))}</span></li>`,
    );
  return [
    '<article class="card"><div class="card__body">',
    `<h3 ${T('kit.states.title')}>${escapeHtml(kitText('kit.states.title'))}</h3>`,
    `<ul class="legend legend--states">${rows.join('')}</ul>`,
    `<p><a href="index.html#ladder" ${T('kit.states.ladder')}>${escapeHtml(kitText('kit.states.ladder'))}</a></p>`,
    '</div></article>',
  ].join('\n');
}

/**
 * ⛔⛔ ONE ORDER FOR EVERY SITE (owner, 2026-10-04: *"ensure all docs sites
 * are the same across the board, no difference in any of them unless there is
 * no changelog or no features or documentation page associated with that
 * exact app"*). The home page and the Features page carry these sections, in
 * this order, each section's top level built exactly the same way — only the
 * words differ. `?` marks the one optional block: real media of the app (a
 * story video or a screenshot), which a site without any simply leaves out.
 *
 * A section's shape is its top-level elements, by tag and first class, in
 * order: `h2 p.lead div.cards p.fineprint`.
 */
const CANON = {
  index: [
    ['kit.label.overview', 'div.split'],
    ['kit.label.inAction?', /^h2 p\.lead div\.(?:stories|shots)$/],
    ['kit.label.inside', 'h2 div.cards'],
    ['kit.label.roadmap', 'h2 p.lead ol.ladder p.fineprint'],
    ['kit.label.honesty', 'h2 div.notes'],
  ],
  features: [
    ['kit.label.numbers', /^(?:p\.lead )?div\.stat$/],
    ['kit.label.free', 'div.callout-band'],
    ['kit.label.inside', 'h2 div.cards'],
    ['kit.label.compare', 'h2 p.lead div.table-wrap ul.legend div.notes p.fineprint'],
    ['kit.label.principles', 'h2 div.notes'],
    ['kit.label.limits', 'h2 p.lead div.cards p.fineprint'],
  ],
};

/** `inner`'s top-level elements as `tag.firstClass`, repeats folded into one. */
function topLevel(inner) {
  const tops = [];
  let depth = 0;
  for (const t of inner.matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*?)(\/?)>/g)) {
    if (t[1]) {
      depth -= 1;
      continue;
    }
    if (depth === 0) {
      const cls = /\sclass="([^"\s]+)/.exec(t[3])?.[1];
      const one = cls ? `${t[2]}.${cls}` : t[2];
      if (tops[tops.length - 1] !== one) tops.push(one);
    }
    if (!/^(?:img|br|hr|input|source|meta|link|wbr)$/.test(t[2]) && t[4] !== '/') depth += 1;
  }
  return tops.join(' ');
}

function checkCanon(page, found) {
  const canon = CANON[page];
  if (canon === undefined || site.product === 'home') return;
  const got = found.map((f) => f.label).join(' → ');
  let at = 0;
  for (const [want, shape] of canon) {
    const optional = want.endsWith('?');
    const label = want.replace(/\?$/, '');
    if (found[at]?.label !== label) {
      if (optional) continue;
      problems.push(`⛔ src/${page}.html: the sections must run ${canon.map((c) => c[0].replace('kit.label.', '')).join(' → ')}; they run ${got.replaceAll('kit.label.', '')}`);
      return;
    }
    const tops = topLevel(found[at].inner);
    if (typeof shape === 'string' ? tops !== shape : !shape.test(tops)) {
      problems.push(`⛔ src/${page}.html: its ${label.replace('kit.label.', '')} section is "${tops}", and on every site it is "${shape.toString()}"`);
    }
    // Every note is a title — an icon and its words — and one paragraph.
    for (const n of found[at].inner.matchAll(/<article class="note">([\s\S]*?)<\/article>/g)) {
      const titled = /^\s*<h3><svg\b[\s\S]*?<\/svg><span\b[^>]*>[^<]+<\/span><\/h3>\s*<p\b[\s\S]*<\/p>\s*$/.test(n[1]);
      if (!titled || n[1].match(/<p\b/g).length !== 1) {
        problems.push(`⛔ src/${page}.html: a note in its ${label.replace('kit.label.', '')} section is not an <h3> (an icon and a title) and one <p>: "${textOf(n[1]).slice(0, 50)}…"`);
      }
    }
    // The Limits pair: what the states mean (the kit's), then what it does not do.
    const pair = /<div class="cards cards--2">\s*<kit-states><\/kit-states>\s*<article class="card"><div class="card__body">\s*<h3\b[^>]*>[^<]+<\/h3>\s*<ul>[\s\S]*<\/ul>\s*<\/div><\/article>\s*<\/div>/;
    if (label === 'kit.label.limits' && !pair.test(found[at].inner)) {
      problems.push(`⛔ src/${page}.html: its limits cards are <kit-states>, then one card — an <h3> and a <ul> of what it does not do`);
    }
    at += 1;
  }
  if (at !== found.length) {
    problems.push(`⛔ src/${page}.html: the sections must run ${canon.map((c) => c[0].replace('kit.label.', '')).join(' → ')}; they run ${got.replaceAll('kit.label.', '')}`);
  }
}

/** A Markdown manual → `<section>`s, one per `##`, every block keyed `manual.*`. */
function manualFromMarkdown(src) {
  const path = resolve(SITE, src);
  if (!existsSync(path)) {
    problems.push(`⛔ <kit-manual src="${src}"> — no such file`);
    return '';
  }
  const blocks = parseBlocks(read(path));
  const sections = [];
  let current = null;
  const used = new Map();
  for (const block of blocks) {
    if (block.type === 'h' && block.level === 1) continue;
    if (block.type === 'h' && block.level === 2) {
      const base = slug(block.text) || `chapter-${sections.length + 1}`;
      const seen = used.get(base) ?? 0;
      used.set(base, seen + 1);
      const id = seen === 0 ? base : `${base}-${seen + 1}`;
      current = [`<h2 id="${escapeHtml(id)}" ${H(manualKey(block.text))}>${renderInline(block.text)}</h2>`];
      sections.push(current);
      continue;
    }
    if (current === null) continue; // the preamble: the page head says what the page is
    if (block.type === 'h') {
      const level = Math.min(Math.max(block.level, 3), 4);
      current.push(`<h${level} ${H(manualKey(block.text))}>${renderInline(block.text)}</h${level}>`);
      continue;
    }
    current.push(renderBlock(block, manualKey));
  }
  return sections
    .map((lines) => ['<section>', ...lines.filter((l) => l !== ''), '</section>'].join('\n'))
    .join('\n');
}

function manual(attrs, inner) {
  if (attrs.src) inner = [manualFromMarkdown(attrs.src), inner].join('\n');
  const entries = [];
  const pattern = /<h2\s([^>]*)>([\s\S]*?)<\/h2>/g;
  let match = pattern.exec(inner);
  while (match !== null) {
    const attrs = parseAttrs(match[1]);
    if (!attrs.id) problems.push(`⛔ documentation: an <h2> has no id ("${textOf(match[2]).slice(0, 40)}")`);
    const key = attrs['data-i18n'] ?? attrs['data-i18n-html'];
    entries.push(
      `<li><a href="#${escapeHtml(attrs.id ?? '')}"${key ? ` ${T(key)}` : ''}>${escapeHtml(textOf(match[2]))}</a></li>`,
    );
    match = pattern.exec(inner);
  }
  sectionCount += 1;
  return [
    '<section class="section section--tight">',
    '<div class="wrap manual">',
    `<nav class="manual-toc" data-spy aria-label="${escapeHtml(kitText('kit.docs.contents'))}" data-i18n-attr="aria-label:kit.docs.contents">`,
    `<span class="label" ${T('kit.docs.contents')}>${escapeHtml(kitText('kit.docs.contents'))}</span>`,
    `<ol>${entries.join('')}</ol>`,
    '</nav>',
    `<div class="manual-body">${inner.trim()}</div>`,
    '</div>',
    '</section>',
  ].join('\n');
}

function art(attrs) {
  const name = attrs.name ?? '';
  if (!existsSync(join(KIT, 'art', `${name}.svg`))) {
    problems.push(`⛔ <kit-art name="${name}"> — the kit has no art called that`);
  }
  return `<img src="kit/art/${escapeHtml(name)}.svg" alt="" width="800" height="440" loading="lazy" decoding="async" />`;
}

function iconTag(attrs) {
  const svg = icon(attrs.name ?? '', attrs.class ?? '');
  if (svg === null) problems.push(`⛔ <kit-icon name="${attrs.name}"> — the kit has no icon called that`);
  return svg ?? '';
}

// ── the changelog ─────────────────────────────────────────────────────────

const changelogEnglish = new Map();
const headingKeys = new Set();
const changelogKey = (markdown) => {
  const key = `changelog.${sha(markdown).slice(0, 12)}`;
  changelogEnglish.set(key, markdown);
  return key;
};

/** A Markdown manual's blocks (`<kit-manual src>`), keyed like the changelog's. */
const manualEnglish = new Map();
const manualKey = (markdown) => {
  const key = `manual.${sha(markdown).slice(0, 12)}`;
  manualEnglish.set(key, markdown);
  return key;
};

function renderBlock(block, keyOf = changelogKey) {
  const keyed = (text) => `${H(keyOf(text))}`;
  switch (block.type) {
    case 'p':
      return `<p ${keyed(block.text)}>${renderInline(block.text)}</p>`;
    case 'quote':
      return `<blockquote><p ${keyed(block.text)}>${renderInline(block.text)}</p></blockquote>`;
    case 'list':
      return [
        `<${block.tag}>`,
        ...block.items.map((item) => `<li ${keyed(item)}>${renderInline(item)}</li>`),
        `</${block.tag}>`,
      ].join('\n');
    case 'code':
      return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    case 'hr':
      return '';
    case 'table':
      return [
        '<div class="table-wrap"><table><thead><tr>',
        ...block.header.map((cell) => `<th>${renderInline(cell)}</th>`),
        '</tr></thead><tbody>',
        ...block.rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`),
        '</tbody></table></div>',
      ].join('');
    default:
      return '';
  }
}

function changelog() {
  if (!site.changelog) {
    problems.push('⛔ the changelog page is listed but site.json names no "changelog" file');
    return '';
  }
  const source = read(resolve(SITE, site.changelog));
  const blocks = parseBlocks(source);
  const releases = [];
  let current = null;
  for (const block of blocks) {
    if (block.type === 'h' && block.level === 1) continue;
    if (block.type === 'h' && block.level === 2) {
      // ⚠ Only a heading that reads as a release is one (`[1.2.0] — date`,
      // `[Unreleased]`); a section like "How to update this file" is the
      // file's own housekeeping, and the page leaves it out with its body.
      if (parseRelease(block.text).version === '') {
        current = null;
        continue;
      }
      current = { heading: block.text, blocks: [] };
      releases.push(current);
      continue;
    }
    // ⚠ The changelog's own preamble (before the first release) is not shown:
    // the page head says what the page is, the same words on every site.
    if (current === null) continue;
    current.blocks.push(block);
  }
  const usedIds = new Map();
  const unique = (base) => {
    const seen = usedIds.get(base) ?? 0;
    usedIds.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };
  const rail = [];
  // ⚠ An empty release (an `## [Unreleased]` with nothing under it yet) is no
  // card at all — an empty box wearing the "latest" glow says nothing.
  const kept = releases.filter((release) => release.blocks.some((b) => b.type !== 'hr'));
  const cards = kept.map((release, index) => {
    const key = changelogKey(release.heading);
    headingKeys.add(key);
    const id = unique(slug(release.heading) || `release-${index + 1}`);
    const version = /^\[([^\]]+)\]/.exec(release.heading)?.[1] ?? release.heading.split(/\s[—–-]\s/)[0];
    // ⚠ "Unreleased" is a word, and words are translated; a version is not
    const unreleased = /^unreleased$/i.test(version.trim());
    rail.push(
      unreleased
        ? `<li><a href="#${escapeHtml(id)}" ${T('kit.changelog.unreleased')}>${escapeHtml(kitText('kit.changelog.unreleased'))}</a></li>`
        : `<li><a href="#${escapeHtml(id)}">${escapeHtml(/^\d/.test(version) ? `v${version}` : version)}</a></li>`,
    );
    const body = [];
    for (const block of release.blocks) {
      if (block.type === 'h') {
        const level = Math.min(Math.max(block.level, 3), 4);
        const subId = unique(`${id}-${slug(block.text)}`);
        body.push(`<h${level} id="${escapeHtml(subId)}" ${H(changelogKey(block.text))}>${renderInline(block.text)}</h${level}>`);
        continue;
      }
      body.push(renderBlock(block));
    }
    return [
      `<article class="release${index === 0 ? ' release--latest' : ''}" id="${escapeHtml(id)}">`,
      `<h2 class="release__head" ${H(key)}>${renderReleaseHeading(release.heading)}</h2>`,
      body.filter((line) => line !== '').join('\n'),
      '</article>',
    ].join('\n');
  });
  sectionCount += 1;
  return [
    '<section class="section section--tight">',
    '<div class="wrap changelog">',
    `<nav class="changelog__rail" data-spy aria-label="${escapeHtml(kitText('kit.changelog.versions'))}" data-i18n-attr="aria-label:kit.changelog.versions">`,
    `<span class="label" ${T('kit.changelog.versions')}>${escapeHtml(kitText('kit.changelog.versions'))}</span>`,
    `<ol>${rail.join('')}</ol>`,
    '</nav>',
    `<div class="releases">${cards.join('\n')}</div>`,
    '</div>',
    '</section>',
  ].join('\n');
}

// ── the home page's closing sections (the same on every site) ─────────────

function familyStrip() {
  const items = FAMILY.map((app) => {
    const here = app.slug === site.product ? ' aria-current="true"' : '';
    return `<a class="marquee__item" href="${DOMAIN}freally-${app.slug}/"${here}><img src="kit/family/${app.slug}.png" alt="" width="30" height="30" loading="lazy" />${escapeHtml(app.name)}</a>`;
  }).join('');
  sectionCount += 1;
  return [
    '<section class="section section--tight family">',
    '<div class="wrap section-head section-head--center">',
    `<span class="label" ${T('kit.family.label')}>${escapeHtml(kitText('kit.family.label'))}</span>`,
    `<h2 class="h2" ${H('kit.family.title')}>${fill(kitEnglish['kit.family.title'] ?? '')}</h2>`,
    '</div>',
    '<div class="marquee"><div class="marquee__track">',
    `<div class="marquee__group">${items}</div>`,
    `<div class="marquee__group" aria-hidden="true">${items.replace(/<a /g, '<a tabindex="-1" ')}</div>`,
    '</div></div>',
    '</section>',
  ].join('\n');
}

function callToAction() {
  const buttons = [];
  if (has('changelog')) {
    buttons.push(
      `<a class="btn btn-primary" href="changelog.html"><span ${T('kit.cta.changelog')}>${escapeHtml(kitText('kit.cta.changelog'))}</span>${icon('arrow-right', 'icon--arrow')}</a>`,
    );
  }
  if (has('features')) {
    buttons.push(
      `<a class="btn btn-secondary" href="features.html"><span ${T('kit.cta.features')}>${escapeHtml(kitText('kit.cta.features'))}</span></a>`,
    );
  }
  return [
    '<section class="cta">',
    '<div class="orb" aria-hidden="true"></div>',
    '<div class="wrap">',
    `<span class="label" ${T('kit.cta.label')}>${escapeHtml(kitText('kit.cta.label'))}</span>`,
    `<h2 class="h2" ${H('kit.cta.title')}>${fill(kitEnglish['kit.cta.title'] ?? '')}</h2>`,
    `<p class="lead" ${T('kit.cta.lede')}>${escapeHtml(kitText('kit.cta.lede'))}</p>`,
    buttons.length > 0 ? `<div class="actions">${buttons.join('')}</div>` : '',
    '</div>',
    '</section>',
  ].join('\n');
}

// ── a page ────────────────────────────────────────────────────────────────

function buildPage(page) {
  sectionCount = 0;
  const srcPath = join(SITE, 'src', `${page}.html`);
  let body = existsSync(srcPath) ? read(srcPath) : '';
  if (!existsSync(srcPath) && page !== 'changelog') problems.push(`⛔ src/${page}.html is missing`);

  // Comments in a source page are notes for whoever edits it, not the reader.
  body = body.replace(/<!--[\s\S]*?-->/g, '');
  body = expand(body, 'kit-icon', iconTag);
  body = expand(body, 'kit-art', art);
  body = expand(body, 'kit-ladder', () => ladderList());
  // ⚠ Kept as a marker until the order is checked, then built.
  const STATES = '<kit-states></kit-states>';

  let top = '';
  if (page === 'index') {
    if (!/<kit-hero[\s>]/.test(body)) problems.push('⛔ src/index.html has no <kit-hero>');
    body = expand(body, 'kit-hero', (attrs, inner) => {
      top = hero(attrs, inner);
      return '';
    });
  } else {
    let headInner = null;
    body = expand(body, 'kit-head', (_attrs, inner) => {
      headInner = inner;
      return '';
    });
    top = pageHead(page, headInner);
  }

  // Sections in source order, so the grounds alternate the same way everywhere.
  const pieces = [];
  const found = [];
  const pattern = /<(kit-section|kit-stats|kit-manual)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;
  let last = 0;
  let match = pattern.exec(body);
  while (match !== null) {
    const loose = body.slice(last, match.index).trim();
    if (loose !== '') problems.push(`⛔ src/${page}.html has markup outside a kit section: "${textOf(loose).slice(0, 60)}"`);
    const attrs = parseAttrs(match[2] ?? '');
    const inner = match[3].replaceAll(STATES, () => statesCard());
    found.push({
      label: (attrs.label ?? (match[1] === 'kit-stats' ? 'kit.label.numbers' : '')).split('|')[0],
      inner: match[3],
    });
    if (match[1] === 'kit-section') pieces.push(section(attrs, inner));
    else if (match[1] === 'kit-stats') pieces.push(stats(attrs, inner));
    else pieces.push(manual(attrs, inner));
    last = pattern.lastIndex;
    match = pattern.exec(body);
  }
  const tail = body.slice(last).trim();
  if (tail !== '') problems.push(`⛔ src/${page}.html has markup outside a kit section: "${textOf(tail).slice(0, 60)}"`);
  checkCanon(page, found);

  if (page === 'changelog') pieces.push(changelog());
  // The main site lists the family itself and has no changelog to point at.
  if (page === 'index' && site.product !== 'home') pieces.push(familyStrip(), callToAction());

  const html = [
    head(page),
    '  <body>',
    nav(),
    '    <main id="main">',
    top,
    ...pieces,
    '    </main>',
    footer(),
    scripts(page),
    '  </body>',
    '</html>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');
  return html;
}

// ── build every page ──────────────────────────────────────────────────────

const built = {};
for (const page of pages) {
  built[page] = buildPage(page);
  put(join(SITE, `${page}.html`), built[page], `${page}.html`);
}

// ── strings: the English every translation is made from ───────────────────

/** Every key a page uses, with its English, from the built pages themselves. */
function keysOf(html) {
  const found = [];
  const element = /<([a-z0-9-]+)(\s[^>]*?)?(\/?)>/gi;
  let match = element.exec(html);
  while (match !== null) {
    const attrs = parseAttrs(match[2] ?? '');
    const tag = match[1].toLowerCase();
    const contentFrom = element.lastIndex;
    if (attrs['data-i18n'] !== undefined || attrs['data-i18n-html'] !== undefined) {
      const close = findClose(html, tag, contentFrom);
      const inner = html.slice(contentFrom, close);
      if (attrs['data-i18n'] !== undefined) found.push([attrs['data-i18n'], decode(textOf(inner)), 'text']);
      if (attrs['data-i18n-html'] !== undefined) found.push([attrs['data-i18n-html'], inner.trim(), 'html']);
    }
    // A cycling word's list: `data-cycle="key"` with its English in `data-words`.
    if (attrs['data-cycle'] !== undefined) found.push([attrs['data-cycle'], decode(attrs['data-words'] ?? ''), 'cycle']);
    if (attrs['data-i18n-attr'] !== undefined) {
      for (const pair of attrs['data-i18n-attr'].split(',')) {
        const [name, key] = pair.split(':').map((s) => s.trim());
        found.push([key, decode(attrs[name] ?? ''), 'attr']);
      }
    }
    match = element.exec(html);
  }
  return found;
}

function decode(text) {
  return String(text)
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** The index of the `</tag>` that closes the element opened before `from`. */
function findClose(html, tag, from) {
  const pattern = new RegExp(`<(/?)${tag}(?:\\s[^>]*)?>`, 'gi');
  pattern.lastIndex = from;
  let depth = 1;
  let match = pattern.exec(html);
  while (match !== null) {
    if (match[0].endsWith('/>')) {
      match = pattern.exec(html);
      continue;
    }
    depth += match[1] === '/' ? -1 : 1;
    if (depth === 0) return match.index;
    match = pattern.exec(html);
  }
  return html.length;
}

const english = new Map();
for (const [page, html] of Object.entries(built)) {
  for (const [key, text] of keysOf(html)) {
    if (key.startsWith('kit.') || key.startsWith('changelog.') || key.startsWith('manual.')) continue;
    // A rich block's English is its markup; text normalised the same way.
    const value = text.replace(/\s+/g, ' ').trim();
    if (english.has(key) && english.get(key) !== value) {
      problems.push(`⛔ "${key}" has two different Englishes (${page}.html): "${english.get(key).slice(0, 50)}" / "${value.slice(0, 50)}"`);
    }
    english.set(key, value);
  }
}
const englishCatalogue = Object.fromEntries([...english.entries()].sort(([a], [b]) => a.localeCompare(b)));
put(join(SITE, 'i18n', 'en.json'), `${JSON.stringify(englishCatalogue, null, 2)}\n`, 'i18n/en.json');

if (manualEnglish.size > 0) {
  put(
    join(SITE, 'i18n', 'manual', 'en.json'),
    `${JSON.stringify(Object.fromEntries(manualEnglish), null, 2)}\n`,
    'i18n/manual/en.json',
  );
}

if (has('changelog')) {
  put(
    join(SITE, 'i18n', 'changelog', 'en.json'),
    `${JSON.stringify(Object.fromEntries(changelogEnglish), null, 2)}\n`,
    'i18n/changelog/en.json',
  );
}

// ── every language: complete, or the build says exactly what is missing ──

const kitKeysUsed = new Set();
for (const html of Object.values(built)) {
  for (const [key] of keysOf(html)) if (key.startsWith('kit.')) kitKeysUsed.add(key);
}
// ⛔ And every key kit.js writes itself — the search's "nothing matches" row
// is built after the page loads, so no markup names it, and without this it
// stayed English in every language.
for (const m of readFileSync(join(KIT, 'kit.js'), 'utf8').matchAll(/'(kit\.[\w.]+)'/g)) {
  kitKeysUsed.add(m[1]);
}

const catalogueScripts = new Set();
for (const code of LANGS) {
  if (code === 'en') continue;
  const sitePath = join(SITE, 'i18n', `${code}.json`);
  const translated = existsSync(sitePath) ? readJson(sitePath) : {};
  const out = {};

  for (const key of english.keys()) {
    const value = translated[key];
    if (typeof value !== 'string' || value.trim() === '') {
      problems.push(`⛔ ${code} has no "${key}" (i18n/${code}.json): "${english.get(key).slice(0, 60)}…"`);
      continue;
    }
    out[key] = value;
  }
  const stale = Object.keys(translated).filter((key) => !english.has(key));
  if (stale.length > 0) {
    const kept = Object.fromEntries(Object.entries(translated).filter(([key]) => english.has(key)));
    put(sitePath, `${JSON.stringify(kept, null, 2)}\n`, `i18n/${code}.json without ${stale.length} key(s) no page uses`);
  }

  for (const key of kitKeysUsed) {
    const value = kitStrings[code][key];
    if (typeof value !== 'string' || value.trim() === '') {
      problems.push(`⛔ the kit has no ${code} for "${key}" (kit/i18n/${code}.json)`);
      continue;
    }
    out[key] = fill(value);
  }

  if (has('changelog')) {
    const path = join(SITE, 'i18n', 'changelog', `${code}.json`);
    const blocks = existsSync(path) ? readJson(path) : {};
    for (const [key, markdown] of changelogEnglish) {
      const value = blocks[key];
      if (typeof value !== 'string' || value.trim() === '') {
        problems.push(`⛔ the changelog has no ${code} for ${key}: "${markdown.slice(0, 60)}…" (i18n/changelog/${code}.json)`);
        continue;
      }
      out[key] = headingKeys.has(key) ? renderReleaseHeading(value) : renderInline(value);
    }
    const gone = Object.keys(blocks).filter((key) => !changelogEnglish.has(key));
    if (gone.length > 0) {
      const kept = Object.fromEntries(Object.entries(blocks).filter(([key]) => changelogEnglish.has(key)));
      put(path, `${JSON.stringify(kept, null, 2)}\n`, `i18n/changelog/${code}.json without ${gone.length} block(s) it no longer has`);
    }
  }

  if (manualEnglish.size > 0) {
    const path = join(SITE, 'i18n', 'manual', `${code}.json`);
    const blocks = existsSync(path) ? readJson(path) : {};
    for (const [key, markdown] of manualEnglish) {
      const value = blocks[key];
      if (typeof value !== 'string' || value.trim() === '') {
        problems.push(`⛔ the manual has no ${code} for ${key}: "${markdown.slice(0, 60)}…" (i18n/manual/${code}.json)`);
        continue;
      }
      out[key] = renderInline(value);
    }
    const gone = Object.keys(blocks).filter((key) => !manualEnglish.has(key));
    if (gone.length > 0) {
      const kept = Object.fromEntries(Object.entries(blocks).filter(([key]) => manualEnglish.has(key)));
      put(path, `${JSON.stringify(kept, null, 2)}\n`, `i18n/manual/${code}.json without ${gone.length} block(s) it no longer has`);
    }
  }

  const name = `${code}.js`;
  catalogueScripts.add(name);
  put(
    join(SITE, 'i18n', name),
    [
      `/* ⛔ GENERATED by kit/build.mjs from i18n/${code}.json, the changelog and the kit. Do not edit. */`,
      `(window.FREALLY_I18N = window.FREALLY_I18N || {})[${JSON.stringify(code)}] = ${JSON.stringify(out)};`,
      '',
    ].join('\n'),
    `i18n/${name}`,
  );
}

// A generated script nothing generates any more is stale.
if (existsSync(join(SITE, 'i18n'))) {
  for (const name of readdirSync(join(SITE, 'i18n'))) {
    if (!name.endsWith('.js') || catalogueScripts.has(name)) continue;
    const path = join(SITE, 'i18n', name);
    if (CHECK) problems.push(`⛔ i18n/${name} is generated by nothing — run the build to delete it`);
    else {
      unlinkSync(path);
      written.push(`deleted i18n/${name}`);
    }
  }
}

// ── the search index, from the rendered pages ─────────────────────────────

function sectionsOf(html, url) {
  const entries = [];
  const pattern = /<h([234])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  const found = [];
  let match = pattern.exec(html);
  while (match !== null) {
    found.push({ at: match.index, end: pattern.lastIndex, id: match[2], title: textOf(match[3]) });
    match = pattern.exec(html);
  }
  for (let i = 0; i < found.length; i += 1) {
    const until = i + 1 < found.length ? found[i + 1].at : html.length;
    const text = textOf(html.slice(found[i].end, until).replace(/<footer[\s\S]*$/, ''));
    entries.push({ url: `${url}#${found[i].id}`, heading: found[i].title, text: text.slice(0, 1200) });
  }
  return entries;
}

if (has('documentation')) {
  const index = [];
  for (const [page, html] of Object.entries(built)) index.push(...sectionsOf(html, `${page}.html`));
  put(
    join(SITE, 'search-index.js'),
    [
      '/* ⛔ GENERATED by kit/build.mjs from the rendered pages. Do not edit.',
      ' * ⚠ There is no search service behind the box: the index is this file. */',
      `window.FREALLY_SEARCH_INDEX = ${JSON.stringify(index, null, 1)};`,
      '',
    ].join('\n'),
    'search-index.js',
  );
}

// ── the pages are honest about what they load ─────────────────────────────

for (const [page, html] of Object.entries(built)) {
  // ⛔ Nothing loaded from anywhere else: every src and stylesheet is this site's.
  for (const m of html.matchAll(/\s(src|href)="([^"]+)"/g)) {
    const [, attr, url] = m;
    const isLink = attr === 'href' && !/rel="(?:stylesheet|icon|apple-touch-icon|preload)"/.test(html.slice(Math.max(0, m.index - 200), m.index));
    if (/^[a-z]+:/i.test(url)) {
      if (attr === 'src' || !isLink) problems.push(`⛔ ${page}.html loads ${url} from another origin`);
      else if (!url.startsWith('https://')) problems.push(`⛔ ${page}.html links ${url}, which is not https`);
      continue;
    }
    if (url.startsWith('#')) continue;
    const file = url.split('#')[0].split('?')[0];
    if (file === '') continue;
    if (!existsSync(join(SITE, file))) problems.push(`⛔ ${page}.html points at ${file}, which is not on the site`);
  }
  if (/<script(?![^>]*\ssrc=)[^>]*>/.test(html)) problems.push(`⛔ ${page}.html has an inline script`);
  // ⛔ The Content-Security-Policy refuses inline styles too: said here, not in a browser.
  if (/\sstyle="/.test(html)) problems.push(`⛔ ${page}.html has an inline style attribute (the CSP blocks it)`);
}

// ── report ────────────────────────────────────────────────────────────────

if (problems.length > 0) {
  process.stderr.write(`\n⛔ ${site.name ?? 'THE SITE'}: ${problems.length} problem(s)\n`);
  for (const problem of problems.slice(0, 200)) process.stderr.write(`  · ${problem}\n`);
  if (problems.length > 200) process.stderr.write(`  · …and ${problems.length - 200} more\n`);
  process.exit(1);
}

if (CHECK) {
  process.stdout.write(
    `${site.name}: the site is current — ${pages.length} pages, ${english.size} keys in 18 languages` +
      (has('changelog') ? `, ${changelogEnglish.size} changelog blocks` : '') +
      `, kit ${readJson(join(KIT, 'manifest.json')).version}\n`,
  );
} else if (written.length === 0) {
  process.stdout.write(`${site.name}: nothing changed\n`);
} else {
  process.stdout.write(`${site.name}: wrote ${written.length} —\n`);
  for (const what of written) process.stdout.write(`  · ${what}\n`);
}
