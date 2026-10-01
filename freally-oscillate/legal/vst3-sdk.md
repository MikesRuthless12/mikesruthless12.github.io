# The VST 3 SDK licence — read, recorded, and closed

⛔ **TASK-065. Nothing in Phase 6 was allowed to start until this file existed.**
This is the "last mile" `prd.md` § 15.1 and `ATTRIBUTION.md` Q1 both defer to:
the terms are not recorded from a news article, they are recorded from the
`LICENSE` file inside the exact revision this product builds against.

**Read and recorded: 2026-08-28.** Verdict below.

---

## 1. The verdict, in one table

| Question TASK-065 asks | Answer |
|---|---|
| **Licence name** | The **MIT License** |
| **Version** | MIT has no versions. The SDK revision carrying it is **VST 3.8.0** (`v3.8.0_build_66`) |
| **Date** | `Copyright (c) 2025, Steinberg Media Technologies GmbH` |
| **Permits use in a proprietary, closed-source product?** | ⛔ **Yes.** "without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies" |
| **At no charge?** | ⛔ **Yes.** "free of charge". No registration, no signature, no agreement to return, no royalty |
| **What it requires** | **One thing only**: the copyright notice and the permission notice reproduced in copies or substantial portions. § 5 below is where Oscillate does that |
| **Attribution required?** | Yes — the notice, and nothing more. No credit screen, no "built with", no link |
| **A logo required?** | ⛔ **No.** See § 4 — the trademark is a **separate** grant that Oscillate does not take |
| **Registration required?** | ⛔ **No.** The GPLv3-or-proprietary dual model, and the signed agreement that went with it, are **gone** |

✅ **Phase 6 is unblocked, and no fallback is needed.** The roadmap's contingency
— *"CLAP-only at 1.0 with VST3 deferred"* — does not apply. The terms allow this.

---

## 2. What was actually read

⚠ **The revision that matters is the one the binary derives from, not the one at
the top of the default branch.** Oscillate does **not** vendor the C++ SDK (§ 3), so
the chain of custody is:

```
Oscillate  →  vst3 0.3.0 (crates.io, MIT OR Apache-2.0)
          └── src/bindings.rs, pre-generated, shipped in the crate source
              └── generated from steinbergmedia/vst3_pluginterfaces
                  └── SDKVersionString = "VST 3.8.0"
                      └── steinbergmedia/vst3sdk @ v3.8.0_build_66
                          └── LICENSE.txt  ←  the file quoted in § 3
```

The version string is not inferred. It is a constant in the shipped bindings:

```rust
// vst3-0.3.0/src/bindings.rs:14428
pub const SDKVersionString: FIDString = b"VST 3.8.0\0".as_ptr() as *const ::std::ffi::c_char;
```

**Sources read, all at fixed revisions:**

| What | Where | Identity |
|---|---|---|
| The SDK licence | `steinbergmedia/vst3sdk` `LICENSE.txt` @ tag `v3.8.0_build_66` | SHA-256 `d6115b263faa1cdf8c7372d70889c833dde1cec95252e7ee93e4f7d599ec96ca` |
| The trademark terms | `steinbergmedia/vst3sdk` `README.md` @ tag `v3.8.1_build_84`, § *License & Usage guidelines* | quoted verbatim in § 4 |
| The binding crate | `vst3` 0.3.0, `.cargo_vcs_info.json` sha1 `2d86c810be3e22367f92438800cd96a3e9cd3a37` | `LICENSE-MIT` + `LICENSE-APACHE` in the crate |

⚠ **The later revision was checked too, and it differs in nothing that matters.**
`v3.8.1_build_84` (SHA-256 `e86d79e19e4a33ebc442d2e0d083887dfc75a2a8de9fe17eeddedb84810ad74e`)
is the identical MIT text with the copyright year rolled to **2026** and the two
`//---` comment rules stripped. Same licence, same grant, same conditions.

---

## 3. The licence, verbatim

⛔ **Reproduced exactly, comment rules and all, from `LICENSE.txt` at
`v3.8.0_build_66`.** Not paraphrased, not reflowed, not summarised — a summary of
a licence is not a licence, and this file exists so nobody has to trust one.

```
//-----------------------------------------------------------------------------
MIT License

Copyright (c) 2025, Steinberg Media Technologies GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

//---------------------------------------------------------------------------------
```

### What is **not** covered by that file

⚠ The SDK is not one licence end to end, and the parts Oscillate does not use are
the parts with the other terms:

| Part of the SDK | Licence | Does Oscillate use it? |
|---|---|---|
| `pluginterfaces/` — the COM interface headers | **MIT**, above | ⛔ **Yes, and only this.** It is the whole of what `vst3` 0.3.0 was generated from |
| `base/`, `public.sdk/` — the C++ helper layer | MIT | ⛔ **No.** Oscillate writes its own host code in Rust |
| `vstgui/` | BSD-like (VSTGUI's own) | ⛔ **No.** A hosted plugin brings its own GUI; Oscillate never draws one |
| `public.sdk/samples/vst/mda-vst3/` | BSD-like (`mda` originals) | ⛔ **No.** Example plugins |

**Which means the BSD-like corners of the SDK are not a question for this
product at all.** They were the reason § 15.1 hedged; the pre-generated binding
removes them from the graph entirely.

---

## 4. ⛔ The trademark — recorded separately, because MIT does not cover it

**This is the half a licence summary always loses.** The MIT grant is about
*code*. The word **VST** and the **VST Compatible Logo** are Steinberg
trademarks, and they are governed by a different instrument that MIT says
nothing about.

**Verbatim, from the SDK's own `README.md`, § *Trademark and Logo Usage*:**

> #### General Principle
>
> Trademark usage (e.g. "VST" name or logo) is optional under MIT license, but if used, must comply with Steinberg's official trademark rules.
>
> #### Permitted Use (if selected)
>
> If you choose to display the **VST Compatible Logo** or refer to the **VST trademark**:
>
> - Logos must be used in unaltered form.
> - Use must follow the official usage guidelines provided in the SDK.
> - The trademark/logo must appear only in clear product-related contexts, such as:
>   - Splash screens
>   - About boxes
>   - Product websites
>   - Documentation and manuals
>
> #### Prohibited Use
>
> - Using "VST" (or derivatives like "VSTi") in company or product names.
> - Applying the logo or trademark to non-VST-compatible products.
> - Associating the trademark with offensive, obscene, or inappropriate content.
>
> #### Notes for Developers
>
> - The _Steinberg VST Usage Guidelines_ are included in the SDK.
> - Use of branding is not required under MIT license, but if you choose to use it, trademark compliance is mandatory.
> - Non-compliance with logo guidelines does not affect your MIT rights (but may result in trademark violations).

### ⛔ Oscillate's decision: take the code grant, decline the trademark grant

**The logo is not shipped and the guidelines are therefore not entered into.**
That is a choice, and it is the cheap one: the branding is explicitly optional,
taking it would bind this product to a document that can be revised without
Oscillate's involvement, and the only thing it buys is a logo on a splash screen.

**The rules that fall out of that decision, and they are enforceable:**

1. ⛔ **No VST logo** — not on the splash, not in About, not on the docs site,
   not in the README.
2. ⛔ **"VST" never appears in a product or company name**, or in any name-shaped
   position. That is prohibited outright above, not merely discouraged. Oscillate,
   Freally and every device name stay clear of it.
3. ✅ **Naming the format factually is not trademark use of the kind above.**
   "Loads VST3 and CLAP plugins" describes what the software does — the same
   sentence every host writes — and no logo accompanies it. That is the line
   this product stands on.
4. ⚠ **If the owner ever wants the VST Compatible Logo**, it is one decision and
   it re-opens this file: read the *Steinberg VST Usage Guidelines* inside the
   pinned SDK, record them here, then use the mark unaltered and only in the four
   contexts listed.

⚠ **`scripts/check-product-names.mjs` is where rule 2 stops being a promise.**
The gate already owns the product-name vocabulary; a "VST" in a name-shaped
position is exactly the class of mistake it exists to catch.

---

## 5. Where the notice is reproduced, as the licence requires

The single condition is the notice. It is discharged in three places, none of
which are hand-maintained lists that can drift:

| Where | What it carries |
|---|---|
| `THIRD-PARTY-NOTICES.md` | ⛔ **Generated from the build.** The SDK is its own row under *Plug-in SDKs*, with the notice below the table, beside `vst3` and `com-scrape-types` — which land there because they are in the graph, not because somebody remembered |
| `src/assets/credits.generated.json` | The same three rows, as Settings → Credits reads them; the notice is the SDK row's `note` |
| `ATTRIBUTION.md` | The human-readable intent, and the pointer to this file |

### ⛔⛔ CORRECTED 2026-09-09 — this section described something that was not there

**Until TASK-122, neither generated file contained the word *Steinberg* at all,**
and neither named the SDK. What the graph carries is the *binding crate*, so
what landed was `vst3 0.3.0 | MIT OR Apache-2.0` — an identifier in a table,
with no holder and no notice anywhere near it. ⚠ The row above also claimed the
crates' *"MIT/Apache-2.0 text"* landed there; it did not and does not. Both
files are identifier tables, not licence texts.

▶ The fix was to stop relying on the graph for something the graph does not
know. `scripts/check-licences.mjs` now carries the SDK as an explicit entry —
name, MIT, `Steinberg Media Technologies GmbH` as the author, and the copyright
line verbatim in its note — and re-labels `vst3` and `com-scrape-types` into the
same `sdk` category, which § F-30 requires to exist. ⛔ It is a **generated**
entry in a generator, not a hand-edit of a generated file: the drift gate
(`node scripts/check-licences.mjs --check`) still owns both outputs, and
`src/components/settings/credits.categories.test.ts` fails if the SDK row, its
licence or its author goes missing.

⚠ **Oscillate ships no Steinberg source**, so the "substantial portions" clause bites
through the binding crate rather than directly. `vst3` 0.3.0 carries Steinberg's
notice in its own generated source; reproducing that crate's notices reproduces
Steinberg's. Recorded here so the reasoning survives the next audit. ⚠ The
notice is now reproduced directly as well, which does not depend on that
argument holding.

---

## 6. ⛔ `vst3-sys` stays banned, and this file is why the ban is narrow

`deny.toml` bans `vst3-sys` by name. **The reason is not "VST3 is GPL"** — this
file is the proof it never was, and after VST 3.8 it is not even arguably so.

`vst3-sys` (RustAudio) is **GPLv3** because it was written as a derivative of the
**old** GPLv3-licensed SDK headers. That is a fact about **that crate**, frozen
at the moment it was written. It did not change when Steinberg relicensed, and
it would poison an All-Rights-Reserved product.

⚠ **The folklore has a source and it is worth naming**: `nih-plug` uses
`vst3-sys` for VST3 *export*, so "Rust plus VST3 equals GPL" is what gets
repeated. Freally MIDI Master paid for that discovery once; this project pays for
it zero times.

---

## 7. What this closes, and what it opens

| | |
|---|---|
| ✅ **`prd.md` § 15 Q1** | Answered from the licence file itself, not from public reporting |
| ✅ **`ATTRIBUTION.md` Q1** | Closed. The row now points here |
| ✅ **TASK-069's binding decision** | ⛔ **The `cxx` C++ bridge is unnecessary and is not built.** `vst3` 0.3.0 ships pre-generated bindings with `build = false` and no SDK checkout — so there is no C++ toolchain in the build, none on three CI runners, and none in the README's build requirements. "The bridge is the only C++ in the repository" becomes **"there is no C++ in the repository"** |
| ⚠ **The pin** | `vst3 = "=0.3.0"`, exact, with the reason in `Cargo.toml`. ⛔ An unpinned binding is an unpinned *ABI*: a minor bump that regenerates against a newer SDK changes the COM vtables this host calls through, and that is a crash in somebody else's plugin, not a compile error |
| ⚠ **What re-opens this file** | Bumping `vst3` past 0.3.0 (re-read the SDK revision behind it), or the owner deciding to show the VST logo (§ 4.4) |
