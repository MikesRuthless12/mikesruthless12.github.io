/* ⛔ GENERATED from Freally Bugs/cursor-kit/kit/cursor.js (kit 035d0c667378) by its sync-kit.mjs — never edit. */
(function () {
  'use strict';

/**
 * ⛔⛔ THE FREALLY CURSOR — a ring with a dot at its heart, in every Freally app
 * and on every Freally site. The owner, 2026-10-23:
 *
 *   - *"the circle with the dot in the middle where the dot moves to the bottom
 *     left of the circle if that's the direction your mouse is going or the top
 *     right if that's the direction your mouse is going"*;
 *   - *"when you go to hover over a button the cursor gets a little bigger"*;
 *   - *"when you click somewhere with the dot, the circle gets a little smaller
 *     so it looks like you've clicked something and then goes back to its
 *     regular size"*;
 *   - *"i only want it to do this where the regular cursor goes … for stuff like
 *     the "BPM" selector where it has the up and down arrow cursor or the "[" or
 *     "]" for the resizing of different notes … i want those to stay like that"*.
 *
 * ▶ Byte-identical in every app's `src/cursor-kit/`, and (made a classic script
 * by `sync-kit.mjs`) in the site kit. Edit `Freally Bugs/cursor-kit/kit/`, then
 * sync; never a copy.
 *
 * How it behaves:
 *
 *   - The dot is the pointer's hotspot, drawn where the pointer is, so aiming
 *     stays pixel exact.
 *   - The ring trails it (`FOLLOW_MS`, time based), never so far that the dot
 *     leaves it (`reachOf`): moving down and left, the dot sits in the ring's
 *     lower left.
 *   - The ring stands in for the arrow and the hand only. Every cursor that
 *     means something — a resize, a crosshair, grab, text, not-allowed, a drawn
 *     cursor — stays the system's, and the ring and dot step aside
 *     (`cursorKind`). `data-cursor="native"` keeps a whole region native;
 *     `data-cursor="hover"` makes anything pressable.
 *   - The system's arrow and hand never show, not even for a frame (the owner:
 *     *"you can see the actual regular mouse cursor for a brief second … i
 *     want it to render the new mouse cursor as quick as possible"*). The
 *     browser picks the cursor before the page hears the pointer move, so
 *     nothing can wait for the pointer: from the mount on, the page's own
 *     rules that ask for the arrow or the hand ask for none (`takeRules`), the
 *     browser's own do too (`cursor.css`), and they stay that way when the
 *     pointer leaves and comes back.
 *   - Over something pressable the ring grows (`HOVER`). Pressed, it shrinks
 *     (`PRESS`) for at least `PRESS_MIN_MS`, so even a quick click shows.
 *   - The frame loop runs only while the ring is catching up: a still pointer
 *     costs nothing.
 *   - Mouse only, never touch or pen; never in forced colours, where the
 *     system's cursor is the accessible one; reduced motion drops the trail.
 */

/** The ring's diameter, its line and the dot's diameter, in CSS px (`cursor.css` draws them). */
const RING = 34;
const LINE = 1.5;
const DOT = 6;

/** The ring over something pressable, and while pressed. */
const HOVER = 1.45;
const PRESS = 0.78;

/** The trail's time constant, ms: after this long the ring has closed 63% of the gap. */
const FOLLOW_MS = 70;

/** A press shows for at least this long, ms. */
const PRESS_MIN_MS = 140;

/** On `<html>` while the ring is in use (`cursor.css`: the arrow gives way where nothing asks for a cursor). */
const ON = 'freally-cursor-on';

/**
 * On the one element under the pointer when it asks for the arrow or the hand
 * and no rule the ring took over says so: an inline style (`cursor.css`).
 */
const HIDE = 'data-freally-cursor-hide';

/**
 * Beside the `cursor: none` of every rule the ring takes over: what the rule
 * asked for, `arrow` or `hand` (`cursor.css` says it for the browser's own).
 * It inherits as the cursor does, so it is read where the cursor is.
 */
const ASKED = '--freally-cursor-asked';

/** The cursors the ring takes over in a page's rules, and what each is. */
const TAKEN = { default: 'arrow', pointer: 'hand' };

/** The `<input>` types typing goes into: there `auto` is the text cursor, and it stays. */
const TEXT_INPUTS = new Set([
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
]);

/** What a press acts on: the ring grows over these. */
const PRESSABLE = [
  'a[href]',
  'button',
  'label',
  'select',
  'summary',
  'input[type="button"]',
  'input[type="checkbox"]',
  'input[type="color"]',
  'input[type="file"]',
  'input[type="radio"]',
  'input[type="range"]',
  'input[type="reset"]',
  'input[type="submit"]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
  '[data-cursor="hover"]',
].join(', ');

/**
 * What the pointer is over, from the cursor the page asks for there: `'arrow'`
 * and `'hand'` are the ring's, anything else is `'native'` and stays the
 * system's. `none` is what `cursor.css` and the rules the ring took over
 * leave: the arrow, or the hand where the rule it came from asked for it
 * (`asked`, the `ASKED` property there).
 */
function cursorKind(cursor, editable, asked = '') {
  switch (cursor) {
    case '':
    case 'none':
      return asked === 'hand' ? 'hand' : 'arrow';
    case 'default':
      return 'arrow';
    case 'auto':
      return editable ? 'native' : 'arrow';
    case 'pointer':
      return 'hand';
    default:
      return 'native';
  }
}

/** Whether typing goes into `el`. */
function isEditable(el) {
  if (el.isContentEditable === true) return true;
  if (el.localName === 'textarea') return true;
  return el.localName === 'input' && TEXT_INPUTS.has(el.type || 'text');
}

/** Whether a press on `el` acts on something that is not disabled. */
function isPressable(el) {
  const hit = el.closest(PRESSABLE);
  return hit !== null && !hit.matches(':disabled, [aria-disabled="true"]');
}

/** How far the ring may trail at `scale`, px: the dot stays inside its line. */
const reachOf = (scale) => Math.max(0, (RING * scale) / 2 - DOT / 2 - LINE);

/**
 * One frame of the trail: the ring eases toward the dot over `dtMs` and never
 * lets it out (`reach`). Time based, so 60 Hz and 144 Hz trail alike.
 */
function follow(ring, dot, dtMs, reach, followMs = FOLLOW_MS) {
  const k = followMs > 0 ? 1 - Math.exp(-Math.max(0, dtMs) / followMs) : 1;
  let x = ring.x + (dot.x - ring.x) * k;
  let y = ring.y + (dot.y - ring.y) * k;
  const far = Math.hypot(x - dot.x, y - dot.y);
  if (far > reach) {
    x = dot.x + ((x - dot.x) / far) * reach;
    y = dot.y + ((y - dot.y) / far) * reach;
  }
  return { x, y };
}

/**
 * Takes over every rule in `rules` that asks for the arrow or the hand: it asks
 * for none instead, and says what it asked for (`ASKED`). In place, so the
 * cascade is unchanged: the rule keeps its place, its specificity and its
 * importance, and every cursor that means something still wins wherever it
 * did. Each one taken goes on `taken` as `[style, cursor, priority]`, to be
 * put back.
 */
function takeRules(rules, taken) {
  for (const rule of rules) {
    const style = rule.style;
    const cursor = style ? style.getPropertyValue('cursor').trim() : '';
    const kind = TAKEN[cursor];
    if (kind) {
      const priority = style.getPropertyPriority('cursor');
      taken.push([style, cursor, priority]);
      style.setProperty('cursor', 'none', priority);
      style.setProperty(ASKED, kind);
    }
    // @media, @supports, @layer, @container and nested rules hold rules of their own, @import a sheet
    let inner = null;
    try {
      inner = rule.cssRules ?? (rule.styleSheet ? rule.styleSheet.cssRules : null);
    } catch {
      inner = null; // an imported sheet from another origin
    }
    if (inner) takeRules(inner, taken);
  }
}

/** Puts back what `takeRules` took. */
function giveRules(taken) {
  for (const [style, cursor, priority] of taken.splice(0)) {
    style.setProperty('cursor', cursor, priority);
    style.removeProperty(ASKED);
  }
}

/** A pointer event made by a mouse (a plain mouse event, as some tests send, counts). */
const byMouse = (e) => e.pointerType === undefined || e.pointerType === 'mouse';

const mounted = new WeakMap();

/**
 * Puts the cursor on the page and returns what takes it off again. Mount it
 * outside anything scaled or transformed (the overlay is `position: fixed` on
 * `<body>`). `reducedMotion` is asked each frame; by default it reads
 * `html[data-motion='reduce']` and the system's setting.
 */
function mountCursor({ doc = document, reducedMotion } = {}) {
  const view = doc.defaultView;
  if (!view || !doc.body) return () => {};
  if (mounted.has(doc)) return mounted.get(doc);
  const query = (q) =>
    typeof view.matchMedia === 'function' ? view.matchMedia(q).matches : null;
  if (query('(any-pointer: fine)') === false || query('(forced-colors: active)') === true)
    return () => {};
  const html = doc.documentElement;
  const reduced =
    reducedMotion ??
    (() =>
      html.dataset.motion === 'reduce' || query('(prefers-reduced-motion: reduce)') === true);
  const now = () => view.performance.now();

  const box = doc.createElement('div');
  box.className = 'freally-cursor';
  box.setAttribute('aria-hidden', 'true');
  const ringEl = doc.createElement('div');
  ringEl.className = 'freally-cursor-ring';
  const grow = doc.createElement('i');
  grow.className = 'freally-cursor-grow';
  const press = doc.createElement('i');
  press.className = 'freally-cursor-press';
  grow.append(press);
  ringEl.append(grow);
  const dotEl = doc.createElement('div');
  dotEl.className = 'freally-cursor-dot';
  box.append(ringEl, dotEl);
  doc.body.append(box);

  let shown = false;
  let dot = { x: 0, y: 0 };
  let ring = dot;
  let target = null;
  let marked = null;
  let dirty = false;
  let hover = false;
  let pressed = false;
  let pressedAt = 0;
  let release = 0;
  let raf = 0;
  let last = 0;
  let lastPointer = 0;
  let on = false;
  let seen = new WeakSet();
  const taken = [];

  const flag = (name, set) => box.toggleAttribute(name, set);
  const place = (el, p) => {
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  };
  const scale = () => (hover ? HOVER : 1) * (pressed ? PRESS : 1);
  const kick = () => {
    if (!raf) raf = view.requestAnimationFrame(frame);
  };

  // The page may change the cursor it asks for under a still pointer (a class
  // or an inline style on the element or any parent): read it again.
  const watch = new view.MutationObserver(() => {
    dirty = true;
    if (shown && now() - lastPointer < 250) kick();
  });

  function unmark() {
    if (marked) marked.removeAttribute(HIDE);
    marked = null;
  }

  /** Takes over the rules of every stylesheet not taken yet (one still loading, once it has). */
  function sweep() {
    for (const sheet of [...doc.styleSheets, ...(doc.adoptedStyleSheets ?? [])]) {
      if (seen.has(sheet)) continue;
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // another origin's, or not loaded yet
      }
      seen.add(sheet);
      takeRules(rules, taken);
    }
  }

  /** The ring is in use: the arrow and the hand are gone, before the pointer gets anywhere. */
  function take() {
    if (on) return;
    on = true;
    html.classList.add(ON);
    sweep();
  }

  /** A touch or a pen, or the unmount: every cursor is the system's again. */
  function handBack() {
    if (!on) return;
    on = false;
    unmark();
    html.classList.remove(ON);
    giveRules(taken);
    seen = new WeakSet();
  }

  /** Reads the cursor the page asks for at `el`, and takes it when it is the arrow or the hand. */
  function aim(el) {
    dirty = false;
    unmark();
    if (el !== target) {
      target = el;
      watch.disconnect();
      for (let at = el; at && at !== html; at = at.parentElement)
        watch.observe(at, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    if (!el) return;
    // a stylesheet added since (a lazy one): taken before it is read
    sweep();
    const style = view.getComputedStyle(el);
    const asked = style.cursor;
    const kind = el.closest('[data-cursor="native"]')
      ? 'native'
      : cursorKind(asked, isEditable(el), style.getPropertyValue(ASKED).trim());
    hover = kind === 'hand' || (kind === 'arrow' && isPressable(el));
    flag('data-native', kind === 'native');
    flag('data-hover', hover);
    if (kind === 'native') return;
    if (asked !== 'none') {
      el.setAttribute(HIDE, '');
      marked = el;
    }
  }

  /**
   * The pointer has gone (out of the window, into a drag): the ring hides. The
   * arrow and the hand stay gone, and so does the mark, so the pointer's
   * return shows the ring and never the system's cursor first.
   */
  function away() {
    watch.disconnect();
    target = null;
    if (shown) {
      shown = false;
      flag('data-shown', false);
    }
    if (raf) view.cancelAnimationFrame(raf);
    raf = 0;
  }

  function frame(time) {
    raf = 0;
    const dt = last ? Math.min(time - last, 64) : 16;
    last = time;
    if (dirty && target) aim(target);
    ring = reduced() ? dot : follow(ring, dot, dt, reachOf(scale()));
    if (Math.hypot(ring.x - dot.x, ring.y - dot.y) < 0.1) ring = dot;
    place(ringEl, ring);
    if (ring !== dot) raf = view.requestAnimationFrame(frame);
    else last = 0;
  }

  function onPointer(e) {
    if (!byMouse(e)) {
      away();
      return handBack();
    }
    take();
    lastPointer = now();
    dot = { x: e.clientX, y: e.clientY };
    if (!shown) {
      // drawn where the pointer is in this very frame, the ring on the dot
      shown = true;
      ring = dot;
      last = 0;
      place(ringEl, ring);
      flag('data-shown', true);
    }
    const el = e.target && e.target.nodeType === 1 ? e.target : null;
    if (el !== target || dirty) aim(el);
    place(dotEl, dot);
    kick();
  }

  function letGo() {
    view.clearTimeout(release);
    pressed = false;
    flag('data-pressed', false);
    kick();
  }

  function onDown(e) {
    if (!byMouse(e)) return;
    view.clearTimeout(release);
    pressed = true;
    pressedAt = now();
    flag('data-pressed', true);
    dirty = true;
    kick();
  }

  function onUp() {
    if (!pressed) return;
    const held = now() - pressedAt;
    dirty = true;
    if (held >= PRESS_MIN_MS) letGo();
    else release = view.setTimeout(letGo, PRESS_MIN_MS - held);
  }

  function onOut(e) {
    if (e.relatedTarget === null) away();
  }

  const listeners = [
    ['pointerover', onPointer],
    ['pointermove', onPointer],
    // the pointer as the system reports it, between frames (secure pages): the
    // dot drawn from the newest position there is
    ['pointerrawupdate', onPointer],
    ['pointerdown', onDown],
    ['pointerup', onUp],
    ['pointercancel', onUp],
    ['pointerout', onOut],
    ['dragstart', away],
  ];
  for (const [type, fn] of listeners)
    doc.addEventListener(type, fn, { capture: true, passive: true });
  view.addEventListener('blur', onUp);
  take();

  const unmount = () => {
    away();
    handBack();
    for (const [type, fn] of listeners) doc.removeEventListener(type, fn, { capture: true });
    view.removeEventListener('blur', onUp);
    view.clearTimeout(release);
    box.remove();
    mounted.delete(doc);
  };
  mounted.set(doc, unmount);
  return unmount;
}

  window.FreallyCursor = { mountCursor: mountCursor };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { mountCursor(); });
  else mountCursor();
})();
