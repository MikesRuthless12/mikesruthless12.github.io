# Credits & Attribution

Sources whose published statistics, research, or assets informed Freally MIDI
Master. The About screen quotes this file.

*This list grows as the style dataset is authored. Every entry here is a source of
**numbers and rules** — no MIDI, audio, or musical content from any source below is
copied into the product. See `docs/legal/disclaimer.md`.*

## Datasets

✅ **THE GROOVE MIDI DATASET, AND THIS TIME THE CLAIM IS TRUE** (TASK-078,
2026-09-05). `engine/data/humanize/groove.json` holds statistics **measured from** it by
`tools/groovestats`.

> Jon Gillick, Adam Roberts, Jesse Engel, Douglas Eck and David Bamman. *Learning
> to Groove with Inverse Sequence Transformations.* ICML 2019. **Groove MIDI
> Dataset**, Google LLC / Magenta, licensed **CC BY 4.0**.
> <https://magenta.tensorflow.org/datasets/groove>

⛔ **CC BY 4.0 asks for four things and the fourth is the one nobody
remembers:** the creator, the title, the licence, and **an indication that changes
were made**. The changes: 1,150 performances were read, their notes mapped onto this
product's own lane names, their deviations measured against a 16th-note grid and
centred on each performance's median, and the results reduced to one row per lane
per style — a lean, a spread and three velocity percentiles — plus one swing
ratio per style.

⚠ **What is derived is statistics, never data.** No performance, phrase, bar or
note from the dataset is reproduced in `groove.json`, in the binary, or in anything
the product generates. The About panel says so in all eighteen languages.

▶ **The correction of 2026-08-22 stands as written, and reading it is the point.**
This section used to credit GMD for having *"informed the humanizer's constants"*,
and the About screen quoted that as *"Timing and velocity statistics derived from the
Magenta Groove MIDI Dataset (CC BY 4.0)"* — in all eighteen languages, while
`engine/src/humanize.rs` was hand-authored from the published technique research
below, `data/humanize/` did not exist and `tools/groovestats` had never been written.
**Removing that credit was the correct direction**: CC-BY asks for attribution when
you *use* the work, and attributing something you do not use is a false statement
about where the product's numbers came from. Precise provenance is the whole of this
product's legal position, and it cuts both ways.

⚠ **E-GMD is still a permitted source rather than a used one.** It is the same
recordings with audio, and nothing here needed the audio. `ATTRIBUTION.md` keeps its
row for that reason.

## Published technique research

The drum grammars in `data/genres/` — kick placement, snare and ghost-note
conventions, hat subdivisions, roll vocabularies, swing settings and 808
behaviour — are encoded from documented production practice. These are the
publications behind those numbers. **Rules and statistics only; nothing musical
is copied from any of them.**

- **Roger Linn on swing and groove** — Attack Magazine. The MPC swing scale
  (50% straight, 54, 58, 62, 66% triplet) that the humanizer implements.
  https://www.attackmagazine.com/features/interview/roger-linn-swing-groove-magic-mpc-timing/
- **Attack Magazine** — Beat Dissected (west-coast hip-hop), *10 Snare Rolls for
  the Drop*.
- **MusicRadar** — mixed-resolution trap hi-hat programming, the six jungle/DnB
  grooves, snare-roll build-ups, realistic banjo programming.
- **audeobox** — MPC drum programming, trap and drill walkthroughs.
- **EDMProd** — the drums guide (fill conventions), liquid DnB, phonk.
- **Splice** — Memphis rap; **BVKER** — phonk.
- **BRL Theory** — J Dilla's microtiming analyses, from which the "drunk"
  quantize-strength and swing-drift figures come.
- **Drumeo** — a drummer's guide to country, for the train beat and two-beat
  patterns.
- **ujam**, **MusicTech**, **MasterClass**, **LANDR**, **emastered**,
  **Native Instruments**, **Melodigging**, **Amped Studio**, **Soundation**,
  **kickdrum.io**, **Noisegate**, **POW MAG**, **Gearspace** — genre-specific
  technique articles cited per model in each file's `sources` field.

Every model in `data/genres/` names its own sources; `datasetc stats` reports
any model that cites none.

## Fonts

Bundled as subset `woff2` files; full license texts vendored alongside them in
`src/assets/fonts/`.

- **Inter** — Rasmus Andersson. SIL Open Font License 1.1.
- **Space Grotesk** — Florian Karsten. SIL Open Font License 1.1.
- **JetBrains Mono** — JetBrains. SIL Open Font License 1.1.

## Icons

- **Lucide** — ISC License. Bundled locally; no CDN.

## Sounds

The preview instrument kits shipped in `data/kits/` are **synthesized from scratch**
by this project's own `tools/kitgen` and contain no third-party samples.

## Third-party code

Rust crates and npm packages are pinned in `Cargo.lock` and
`package-lock.json`. The dependency licence allowlist is enforced in CI by
`cargo deny`, which fails the build on any licence outside it — see
`deny.toml`.
