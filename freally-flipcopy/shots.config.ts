/**
 * ⛔⛔ **EVERY ANNOTATED SCREENSHOT IN THE MANUAL, DECLARED HERE** — Freally
 * Oscillate's `docs/shots.config.ts`, ported as it is.
 *
 * ▶ Every procedure in `documentation.html` is illustrated by a real
 * screenshot of the real editor, with the thing the reader is told to press
 * **boxed in red** — and **numbered** when there is more than one. Not a stock
 * image, not a diagram, not a crop of a mock-up: a screenshot of the build the
 * manual documents, taken by `e2e/docs-shots.spec.ts`.
 *
 * ## ⛔ The alt text is declared HERE and is never generated
 *
 * Each entry carries the sentence, written by a person, that describes **the
 * whole frame** — what is in it, which control each box frames, and which
 * number each box carries — so a screen-reader user gets the same instruction
 * a sighted reader gets. The manual's `<img>` carries exactly this text as its
 * `alt` (and its translation through `data-i18n-attr="alt:…"`); the spec fails
 * when the two differ, when a picture is shown that nothing declared, or when a
 * declared picture is shown nowhere.
 *
 * ## ⚠ What the capture pass can reach, said honestly
 *
 * ⛔ **Playwright drives the browser-leg build: the editor with the mock bridge
 * in place of the plugin** (`playwright.config.ts`). The copier, the browser,
 * the preview, Copy Settings, Settings and the Studio all run there on the
 * repository's own fixtures — the playbook's test clip (`e2e/fixtures`) and
 * the mock's disk (`src/bridge/mockLibrary.ts`) — so every entry below is a
 * state the editor reaches on its own. What only a DAW draws (a host's track,
 * Scan from track arming against a real transport) is not photographed here.
 *
 * ⛔ **Owner-made material only.** No picture is ever taken of the audioTest
 * corpus or of any sample pack.
 *
 * ⚠ **`docs/img/` is committed with the site.** The pass is deterministic — the
 * same fixtures, the plugin's own window size, the dark theme — so a re-render
 * that differs is a change in the product, which is what the spec's check mode
 * exists to catch.
 */

/** What one annotated screenshot declares. */
export interface Shot {
  /** Groups shots in a filename: `docs/img/<topic>-<NN>-<slug>.png`. */
  readonly topic: string;
  /** The step number within the topic. ⚠ Also the file's `NN`, zero-padded. */
  readonly step: number;
  /** The end of the filename. Lowercase, hyphenated. */
  readonly slug: string;
  /**
   * ⛔ The element to photograph — **not the viewport**. A window-sized
   * picture to illustrate one button is a picture in which the button is a
   * few pixels wide.
   */
  readonly frame: string;
  /**
   * What to box in red and number, in order. ⚠ An empty list means the frame
   * itself is the subject and nothing is boxed.
   */
  readonly targets: readonly string[];
  /**
   * ⛔ Dim everything outside the targets at 45 %. Optional: a veil over a
   * small frame is noise rather than emphasis.
   */
  readonly veil?: boolean;
  /**
   * ⚠ **The window drawn at this many times its default size** (1400 × 875,
   * the plugin's own; the whole window scales as one), for a part of the
   * machine too small to read at 1 × — the touch screen, a panel's controls.
   * The red box and its badge stay at their own size, so a larger window is a
   * clearer picture of the same box. Default 1.
   */
  readonly zoom?: number;
  /**
   * What the picture must show, when that is less than the whole frame: the
   * picture is the box round these elements (default: the targets), widened
   * by `around` pixels on every side and kept inside the frame. Still the
   * elements, never the viewport — a tighter crop of the same frame.
   */
  readonly include?: readonly string[];
  /** The margin round `include`, in CSS pixels: the badges sit just outside a box. */
  readonly around?: number;
  /**
   * ⛔⛔ **REQUIRED, AND WRITTEN BY A PERSON.** Describes the whole frame,
   * including which box carries which number.
   */
  readonly alt: string;
  /**
   * How to drive the editor into the state before the picture is taken.
   *
   * ⚠ A **name**, resolved by `e2e/docs-shots.spec.ts`, not a function: this
   * file is data, and a config that carried closures could not be read
   * without executing it.
   */
  readonly setup: string;
}

/**
 * ⛔ The red box. Used by the capture pass; named here so the config and the
 * injector cannot disagree about what "the red box" is.
 */
export const BOX = {
  // ⚠ Injected into a page whose tokens the overlay cannot reach, and drawn
  // into a PNG rather than rendered in a theme, so `var(--color-…)` would not
  // mean anything here. Freally Oscillate's value, the family's red box.
  colour: '#E11D48',
  width: 3,
  radius: 4,
  outset: 6,
  veilOpacity: 0.45,
} as const;

/**
 * ⛔ **Dark**, the theme the docs site wears. No page documents theming with
 * a light picture, so there is no light set — and inventing one would be a
 * screenshot nothing references, which the spec would fail on.
 */
export const THEME = 'dark';

export const SHOTS: readonly Shot[] = [
  {
    topic: 'window',
    step: 1,
    slug: 'layout',
    setup: 'window',
    frame: '[data-testid="shell"]',
    targets: [
      '[data-testid="browser"]',
      '[data-testid="preview"]',
      '[data-testid="browser-toggle"]',
      '[data-testid="stage"]',
    ],
    alt: 'The Flipcopy window: the browser down the left boxed in red and numbered 1, the preview player docked under it numbered 2, the button at the browser’s edge that folds them away numbered 3, and the stage, where the copier stands, numbered 4.',
  },
  {
    topic: 'copier',
    step: 1,
    slug: 'start',
    setup: 'glass:midi',
    frame: '[data-testid="stage"]',
    zoom: 2,
    targets: [
      'div:has(> div > [data-testid="print-original"])',
      '[data-testid="touch-screen"]',
      '[data-testid="key-start"]',
    ],
    around: 40,
    alt: 'The copier with a MIDI file on the glass: the glass, where the copier has laid the printed original face-down, boxed in red and numbered 1, the touch screen numbered 2, and the green START key numbered 3.',
  },
  {
    topic: 'copier',
    step: 2,
    slug: 'pages',
    setup: 'copied:midi',
    frame: '[data-testid="stage"]',
    zoom: 1.5,
    targets: ['[data-testid="print-copy"]'],
    include: ['[data-testid="print-copy"]', '[data-testid="touch-screen"]'],
    around: 60,
    alt: 'The copier after a MIDI file was copied to audio, its audio pages stacked on the tray and the page on top boxed in red: grab a page by the lime frame round its printed clip and drag it onto a track.',
  },
  {
    topic: 'screen',
    step: 1,
    slug: 'soft-keys',
    setup: 'copied:midi',
    frame: '[data-testid="stage"]',
    zoom: 4,
    targets: [
      '[data-testid="soft-settings"]',
      '[data-testid="soft-save"]',
      '[data-testid="soft-reprint"]',
    ],
    include: ['[data-testid="touch-screen"]', '[data-testid="key-start"]'],
    around: 48,
    alt: 'The copier’s touch screen after a copy, saying MIDI > AUDIO, with its soft keys along the bottom: SETTINGS boxed in red and numbered 1, SAVE numbered 2 and REPRINT numbered 3; between them are PREV, NEXT and REVEAL, and STUDIO is last.',
  },
  {
    topic: 'audio',
    step: 1,
    slug: 'parts',
    setup: 'copy-settings:audio',
    frame: '[data-testid="copy-settings"]',
    zoom: 2,
    targets: [
      '[data-testid="copy-parts"]',
      '[data-testid="copy-grid"]',
      '[data-testid="copy-swing"]',
    ],
    alt: 'Copy Settings open over the copier with an audio loop on the glass, at its AUDIO > MIDI settings: Parts boxed in red and numbered 1, Grid numbered 2 and Swing numbered 3.',
  },
  {
    topic: 'audio',
    step: 2,
    slug: 'pages',
    setup: 'copied:audio',
    frame: '[data-testid="stage"]',
    zoom: 1.5,
    targets: ['[data-testid="print-copy"]'],
    include: ['[data-testid="print-copy"]', '[data-testid="touch-screen"]'],
    around: 60,
    alt: 'The copier after an audio loop was copied to MIDI, a MIDI page for each part it heard stacked on the tray, the page on top boxed in red.',
  },
  {
    topic: 'midi',
    step: 1,
    slug: 'pages-and-instruments',
    setup: 'copy-settings:midi',
    frame: '[data-testid="copy-settings"]',
    zoom: 2,
    targets: ['[data-testid="copy-stems"]', '[data-testid="copy-toner-melody"]'],
    alt: 'Copy Settings with a MIDI file on the glass, at its MIDI > AUDIO settings: Pages, a page per part or the mix only, boxed in red and numbered 1, and the Melody’s instrument numbered 2, between the Bassline’s and the Countermelody’s.',
  },
  {
    topic: 'midi',
    step: 2,
    slug: 'tail-and-format',
    setup: 'copy-settings:format',
    frame: '[data-testid="copy-settings"]',
    zoom: 2,
    targets: [
      '[data-testid="copy-drums"]',
      '[data-testid="copy-tail"]',
      '[data-testid="copy-format"]',
      '[data-testid="copy-rate"]',
      '[data-testid="copy-depth"]',
    ],
    alt: 'Copy Settings further down: the drum machine boxed in red and numbered 1, the Tail slider numbered 2, Format, with WAV, AIFF, FLAC and MP3, numbered 3, Sample rate numbered 4 and Bit depth numbered 5.',
  },
  {
    topic: 'browser',
    step: 1,
    slug: 'folder',
    setup: 'browser:folder',
    frame: '[data-testid="rail"]',
    zoom: 2,
    targets: [
      '[data-testid="browser-filter"]',
      '[data-testid="browser-row"][aria-selected="true"]',
      '[data-testid="browser-row"][aria-selected="true"] [data-testid="browser-grip"]',
    ],
    include: ['[data-testid="explorer-bar"]', '[data-testid="browser-tree"]'],
    around: 12,
    alt: 'The browser open on a music folder: the filter box boxed in red and numbered 1, the selected MIDI file’s row numbered 2, and the grip at the end of that row, which drags the file into your DAW, numbered 3.',
  },
  {
    topic: 'preview',
    step: 1,
    slug: 'player',
    setup: 'browser:folder',
    frame: '[data-testid="preview"]',
    zoom: 2,
    targets: [
      '[data-testid="preview-play"]',
      '[data-testid="preview-loop"]',
      '[data-testid="preview-autoplay"]',
      '[data-testid="preview-volume"]',
    ],
    alt: 'The preview player playing a MIDI file, its notes drawn on the strip: the play and pause key boxed in red and numbered 1, Loop numbered 2, Play when selected (the headphones) numbered 3 and the level slider numbered 4.',
  },
  {
    topic: 'studio',
    step: 1,
    slug: 'parts',
    setup: 'studio',
    frame: '[data-testid="studio"]',
    targets: [
      '[data-testid="studio-part-melody"]',
      '[data-testid="studio-roll"]',
      '[data-testid="studio-play"]',
      '[data-testid="studio-send"]',
    ],
    alt: 'The Studio with a copy open: the Melody part’s tab boxed in red and numbered 1, the piano roll numbered 2, Play numbered 3 and Send to the copier numbered 4.',
  },
  {
    topic: 'mixer',
    step: 1,
    slug: 'strip',
    setup: 'studio:mixer',
    frame: '[data-testid="studio"]',
    targets: [
      '[data-testid="mixer-melody-fader"]',
      '[data-testid="mixer-melody-pan"]',
      '[data-testid="mixer-melody-solo"]',
    ],
    alt: 'The Studio’s Mixer, a strip for every part and one for the master: the Melody strip’s fader boxed in red and numbered 1, its pan knob numbered 2, and its S key, with M beside it, numbered 3.',
  },
  {
    topic: 'settings',
    step: 1,
    slug: 'copies-folder',
    setup: 'settings:copies',
    frame: '[data-testid="settings"]',
    zoom: 1.5,
    targets: ['[data-testid="settings-tab-copies"]', '[data-testid="settings-copies-change"]'],
    alt: 'Settings open on its Copies folder category: the category boxed in red and numbered 1, and Change, which picks another folder for new copies, numbered 2.',
  },
  {
    topic: 'appearance',
    step: 1,
    slug: 'themes',
    setup: 'settings:appearance',
    frame: '[data-testid="settings"]',
    zoom: 1.5,
    targets: ['[data-testid="settings-theme-dark"]', '[data-testid="settings-theme-light"]'],
    alt: 'Settings open on Appearance: Dark, shown by its own copier, boxed in red and numbered 1, and Light numbered 2.',
  },
  {
    topic: 'troubleshooting',
    step: 1,
    slug: 'refused',
    setup: 'refused:bars',
    frame: '[data-testid="stage"]',
    zoom: 4,
    targets: ['[data-testid="touch-screen"]'],
    include: ['[data-testid="touch-screen"]', '[data-testid="key-start"]'],
    around: 48,
    alt: 'The copier’s touch screen, boxed in red, refusing a loop that is too long, with the reason running across it: That clip is 32 bars long — the copier takes clips of up to 16 bars.',
  },
];

/** `docs/img/<topic>-<NN>-<slug>.png` — the naming the family already uses. */
export function fileNameOf(shot: Shot): string {
  return `${shot.topic}-${String(shot.step).padStart(2, '0')}-${shot.slug}.png`;
}
