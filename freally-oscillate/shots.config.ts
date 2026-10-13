/**
 * ⛔⛔ **EVERY ANNOTATED DOCUMENTATION SCREENSHOT, DECLARED — TASK-132A, § F-33.**
 *
 * ▶ § F-33: *"every step in the documentation is illustrated by a real
 * screenshot of the real application, with the thing you are being told to
 * click **boxed in red and numbered**. Not a stock image, not a diagram, not a
 * crop of a mock-up — a screenshot of the build being documented."*
 *
 * ## ⛔ The alt text is declared HERE and is never generated
 *
 * § F-33 again, and it is the rule that shapes this file's shape: *"Alt text is
 * required and is never generated … a screen-reader user gets the same
 * instruction a sighted user gets."* So each entry carries the sentence, written
 * by a person, describing **the whole frame** — Freally File Manager's own
 * standard: *"The header toolbar with the Add files button boxed and numbered 1,
 * and Add folders boxed and numbered 2."*
 *
 * ⛔ A generated alt ("screenshot of the room panel") tells a screen-reader user
 * nothing they could act on, and it is worse than no alt because it silences the
 * missing-alt warning. `scripts/check-docs-site.mjs` fails on an alt that is the
 * filename, that is empty, or that does not name the numbered boxes it draws.
 *
 * ## ⚠ What the capture pass can and cannot reach, said honestly
 *
 * ⛔ **Playwright drives the built front end with NO TAURI BACKEND.** So a
 * screen that only exists once Rust has answered — a plugin list, a room code,
 * a loudness reading — cannot be photographed here, and a shot declared for one
 * would produce a picture of an empty state that the manual then describes as
 * something else. ▶ Every entry below is a state the front end reaches on its
 * own; the ones that need a backend are named in `Live-To-Do.md` as pictures a
 * human has to take from the shipped application.
 *
 * ⚠ **`docs/img/` is committed.** The pass is deterministic — a fixture project,
 * a pinned viewport, a fixed theme — so a re-render that differs is a change in
 * the product, which is exactly what the drift gate exists to catch.
 *
 * ## ⛔⛔ FOUR SHOTS WERE DECLARED HERE AND HAD TO BE REMOVED — READ THIS FIRST
 *
 * ▶ They were written, pointed at real selectors, and **could not be taken**.
 * Every one of them is a panel that answers *"there is no engine"* when Rust is
 * not behind it:
 *
 * | Shot | What the headless build actually draws |
 * |---|---|
 * | `arrangement-01-track-header` | `arrangement-empty` — there is no project, so no track header |
 * | `arrangement-02-blade` | the same; there is no toolbar either |
 * | `explorer-01-places` | *"Oscillate is not running its audio engine, so there is nothing to scan."* |
 * | `plugins-01-scan-folders` | `plugin-paths-empty` — the scan has never run |
 *
 * ⛔ **They were deleted rather than faked.** The alternative was a picture of
 * an empty panel under a caption describing a track header, which is the
 * documentation version of a green test over a broken product.
 *
 * ⚠ **They are rows in `Live-To-Do.md` now** — pictures a human takes from the
 * shipped binary, where those panels have something in them.
 *
 * ## ▶ What would unlock them, and why it is not being done today
 *
 * § F-33 names the answer: a **fixture project** under `data/fixtures/docs/`
 * that the front end loads with no backend. ⛔ Nothing in the page can load a
 * project today — the arrangement, the scan and the browser are all projections
 * of state that only `seam_state` produces — so this needs a *new* way for the
 * front end to be handed a session.
 *
 * ⚠ **That is a feature, and the freeze (TASK-127) is in force.** It is also
 * not a small one: a page-side project loader is a second door into the state
 * the whole product is a projection of. ▶ It belongs in Part II with a version
 * rung, and the three shots below are real in the meantime.
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
   * ⛔ The element to photograph — **not the viewport**.
   *
   * § F-33: *"screenshots **the element**, not the viewport"*. A viewport shot
   * of a 1280×720 application to illustrate one button is a picture in which
   * the button is forty pixels wide.
   */
  readonly frame: string;
  /**
   * What to box in red and number, in order. ⚠ An empty list means the frame
   * itself is the subject and nothing is boxed.
   */
  readonly targets: readonly string[];
  /**
   * ⛔ **Dim everything outside the frame's targets at 45 %.** Optional, because
   * a veil over a two-element frame is noise rather than emphasis.
   */
  readonly veil?: boolean;
  /**
   * ⛔⛔ **REQUIRED, AND WRITTEN BY A PERSON.** Describes the whole frame,
   * including which box carries which number.
   */
  readonly alt: string;
  /**
   * How to drive the application into the state before the picture is taken.
   *
   * ⚠ A **name**, resolved by `e2e/docs-shots.spec.ts`, not a function — this
   * file is read by `scripts/check-docs-site.mjs` as data, and a config that
   * carried closures could not be read without executing it.
   */
  readonly setup: string;
}

/**
 * ⛔ The red box, § F-33's own values. Used by the capture pass; named here so
 * the config and the injector cannot disagree about what "the red box" is.
 */
export const BOX = {
  // § F-33's own value. ⚠ It is injected into a page whose tokens this overlay
  // cannot reach, and it is drawn into a PNG rather than rendered in a theme,
  // so `var(--color-…)` is not available and would not mean anything if it
  // were. ⛔ The exemption is on this line rather than on the file, so a second
  // hex anywhere else here — a highlight, a veil tint — is still lint.
  // eslint-disable-next-line no-restricted-syntax
  colour: '#E11D48',
  width: 3,
  radius: 4,
  outset: 6,
  veilOpacity: 0.45,
} as const;

/**
 * ⛔ **Dark, because dark is the default.** § F-33: *"shots are taken in dark
 * (the default) with a light-theme set for the pages that document theming."*
 * ⚠ No page documents theming with a picture yet, so there is no light set —
 * and inventing one would be a screenshot nothing references, which the
 * coverage gate would fail on immediately.
 */
export const THEME = 'dark';

export const SHOTS: readonly Shot[] = [
  {
    topic: 'start',
    step: 1,
    slug: 'first-window',
    setup: 'opened',
    frame: '[data-testid="app-frame"]',
    targets: ['[data-testid="transport"]'],
    alt: 'The Oscillate window on a first run, with the File Explorer down the left, the arrangement in the middle, and the transport controls along the bottom boxed in red.',
  },
  {
    topic: 'room',
    step: 1,
    slug: 'create',
    setup: 'room',
    frame: '[data-testid="room-panel"]',
    targets: ['[data-testid="room-make"]', '[data-testid="room-join"]'],
    alt: 'The Room panel with the Create a room code button boxed in red and numbered 1, and the Let them in button — where you paste the code somebody sent you — boxed and numbered 2.',
  },
  {
    topic: 'updates',
    step: 1,
    slug: 'panel',
    setup: 'settings:updates',
    frame: '[data-testid="settings"]',
    targets: ['[data-testid="updates-check"]', '[data-testid="updates-at-launch"]'],
    veil: true,
    alt: 'Settings with the Updates section selected, the Check for updates button boxed in red and numbered 1, and the Check when Oscillate starts toggle boxed and numbered 2 in its off position.',
  },
];

/** `docs/img/<topic>-<NN>-<slug>.png` — the same naming the family already uses. */
export function fileNameOf(shot: Shot): string {
  return `${shot.topic}-${String(shot.step).padStart(2, '0')}-${shot.slug}.png`;
}
