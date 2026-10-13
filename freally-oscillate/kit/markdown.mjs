/**
 * ⛔ The kit's Markdown renderer — deliberately small, and the same for every
 * Freally site, so every changelog renders the same way.
 *
 * Taken from Freally Flipcopy's `scripts/lib/markdown.mjs` (escape first,
 * markup second, no raw-HTML passthrough, only http(s) and relative links),
 * plus the two things the eight changelogs use that it lacked: block quotes,
 * and a release heading split into its version, date and title.
 */

/** ⛔ First, always, before anything else looks at the text. */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Inline spans: code, bold, italic, links. Code first, so a backtick span
 * holding an asterisk is not italicised; NUL is stripped so the sentinel that
 * holds code spans aside cannot collide with the source.
 */
export function renderInline(text) {
  const held = [];
  let work = escapeHtml(text)
    .split('\u0000')
    .join('')
    .replace(/`([^`]+)`/g, (_match, code) => {
      held.push(`<code>${code}</code>`);
      return `\u0000${held.length - 1}\u0000`;
    });
  work = work
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|[^\s):]+)\)/g, '<a href="$2">$1</a>');
  // eslint-disable-next-line no-control-regex
  return work.replace(/\u0000(\d+)\u0000/g, (_match, index) => held[Number(index)] ?? '');
}

/**
 * A release heading — `[0.3.0] — 2026-10-01 — Audio → MIDI` — as its parts.
 * ⚠ The same function renders the English and every translation, so a
 * translated heading (which keeps its version and date) lands in the same spans.
 */
export function parseRelease(text) {
  const whole = String(text).trim();
  let version = '';
  let rest = whole;
  const bracket = /^\[([^\]]+)\]\s*/.exec(whole);
  const bare = /^(v?\d+\.\d+\.\d+[^\s—–]*)\s*/.exec(whole);
  if (bracket !== null) {
    version = bracket[1].trim();
    rest = whole.slice(bracket[0].length);
  } else if (bare !== null) {
    version = bare[1];
    rest = whole.slice(bare[0].length);
  } else {
    return { version: '', date: '', title: whole };
  }
  rest = rest.replace(/^[—–-]+\s*/, '');
  let date = '';
  const dated = /^\(?(\d{4}-\d{2}-\d{2})\)?\s*/.exec(rest);
  if (dated !== null) {
    date = dated[1];
    rest = rest.slice(dated[0].length).replace(/^[—–:-]+\s*/, '');
  }
  return { version, date, title: rest.trim() };
}

export function renderReleaseHeading(text) {
  const { version, date, title } = parseRelease(text);
  if (version === '') return `<span class="release__title">${renderInline(title)}</span>`;
  const shown = /^\d/.test(version) ? `v${version}` : version;
  const parts = [
    '<span class="release__meta">',
    `<span class="release__ver">${renderInline(shown)}</span>`,
    date !== '' ? `<time class="release__date" datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>` : '',
    '</span>',
  ];
  if (title !== '') parts.push(`<span class="release__title">${renderInline(title)}</span>`);
  return parts.join('');
}

function cells(line) {
  const trimmed = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
  const out = [];
  let current = '';
  let code = false;
  for (const character of trimmed) {
    if (character === '`') code = !code;
    if (character === '|' && !code) {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += character;
  }
  out.push(current.trim());
  return out;
}

function isTableSeparator(line) {
  return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');
}

/**
 * Markdown → a list of blocks: `{ type, level?, text?, items?, rows?, tag? }`.
 * Rendering is separate, so the changelog can group blocks into release cards.
 */
export function parseBlocks(source) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null;
  let quote = null;
  let inCode = false;
  let code = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'p', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list === null) return;
    blocks.push({ type: 'list', tag: list.tag, items: list.items });
    list = null;
  };
  const flushQuote = () => {
    if (quote === null) return;
    blocks.push({ type: 'quote', text: quote.join(' ') });
    quote = null;
  };
  const flush = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      if (inCode) {
        blocks.push({ type: 'code', text: code.join('\n') });
        code = [];
        inCode = false;
      } else {
        flush();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    if (/^\s*<!--.*-->\s*$/.test(line)) continue;
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading !== null) {
      flush();
      blocks.push({ type: 'h', level: heading[1].length, text: heading[2].replace(/\s+#+\s*$/, '') });
      continue;
    }
    if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      flush();
      blocks.push({ type: 'hr' });
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flush();
      const header = cells(line);
      const rows = [];
      i += 1;
      while (i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].trim() !== '') {
        i += 1;
        rows.push(cells(lines[i]));
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }
    const quoted = /^\s*>\s?(.*)$/.exec(line);
    if (quoted !== null) {
      flushParagraph();
      flushList();
      if (quote === null) quote = [];
      if (quoted[1].trim() !== '') quote.push(quoted[1].trim());
      continue;
    }
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet !== null || numbered !== null) {
      flushParagraph();
      flushQuote();
      const tag = bullet !== null ? 'ul' : 'ol';
      const text = (bullet ?? numbered)[1];
      if (list === null || list.tag !== tag) {
        flushList();
        list = { tag, items: [] };
      }
      list.items.push(text);
      continue;
    }
    if (list !== null) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    if (quote !== null) {
      quote.push(line.trim());
      continue;
    }
    paragraph.push(line.trim());
  }
  if (inCode) blocks.push({ type: 'code', text: code.join('\n') });
  flush();
  return blocks;
}

/** The visible text of an HTML fragment (for the search index). */
export function textOf(html) {
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
