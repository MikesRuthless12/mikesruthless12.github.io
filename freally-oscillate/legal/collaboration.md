# The collaboration features, and what they do and do not expose

⛔⛔ **THIS IS NOT LEGAL ADVICE AND NOBODY HERE IS A LAWYER.** It is a record of
what the collaboration half of Oscillate is built from, what was checked, and
what is still open — written so that a conversation with an actual IP attorney
starts from facts rather than from a re-reading of the source.

▶ Written 2026-09-17, on the owner's question: *"is there a copyright issue with
collaboration DAWs or collaboration VST's with how i have this set up … that i am
violating?"*

---

## ✅ The short answer

**Nothing found.** The collaboration path adds **no third-party code at all**, and
the dependency set behind it is permissive and gated at build time. The risks
that exist in this area are mostly **not copyright** — they are patents and
trademarks, and they are named below.

---

## ⛔ Why collaboration adds almost no exposure

▶ **Owner's decision, 2026-09-09:** *"use the webview WebRTC, don't add Rust
codecs."* That decision is the reason this section is short.

| Piece | Where it comes from | Exposure |
|---|---|---|
| Peer connections | `RTCPeerConnection`, from the operating system's webview | None added — the webview is already linked |
| Audio codec (Opus) | The webview | None added |
| Video codec (VP8) | The webview | None added |
| Camera and microphone | The webview, through `getUserMedia` | None added |
| Signalling | `src/lib/room/peer.ts`, in-house, broker-free | Owner's own code |

⚠ **`peerjs` is in neither `package.json` nor the lockfile.** `peer.ts` uses raw
`RTCPeerConnection` deliberately, because the broker-free path is the feature.
⛔ Opus, VP8, libvpx and `nokhwa` were all struck from `ATTRIBUTION.md` on
2026-09-10 — **none of them was ever a dependency**, and `scripts/check-licences.mjs`
is what proves it: the component count was unchanged across the whole media half.

---

## ⛔ Where the real risk is, in order

### 1. Patents — and they do not care that you wrote the code yourself

⛔⛔ **This is the one that matters, and it is not a copyright question.** A
patent covers an *invention*, so writing an implementation from scratch is no
defence. The relevant art for a collaborative DAW is networked low-latency audio,
session synchronisation and collaborative editing.

⚠ Most of the foundational work in this area is old enough to have expired, but
*"probably fine"* is not a clearance opinion and this document is not one.

▶ **This is the item worth paying an attorney for before taking money.**

### 2. Trademarks and trade dress

✅ **`VST` is handled.** `docs/legal/vst3-sdk.md` records the MIT licence at SDK
v3.8.0; the **logo is declined** (optional under MIT, and not shipped) and *"VST"*
never appears in a product name. ⛔ `vst3-sys` stays banned — GPLv3 as a
derivative of the *old* SDK.

⚠ **The live ones:** *Ableton*, *Live*, *Push*, *FL Studio*, *Image-Line* must not
appear in a way implying endorsement. Factual comparison in documentation is
ordinarily fine; **looking** like a competitor's interface is the riskier axis.

▶ **Recorded for the Pattern Rack specifically.** The owner asked for a rack
*"like Ableton's or FL Studio's, but with its own twist"*. It was built from this
project's **own** `Pattern`/`PatternRow` model — rows are this product's tracks
and the strip draws this product's clip sketch. That is convergent function, not
copied trade dress, and it is written down here because the instruction that
produced it could be read the other way.

### 3. Codecs, when export arrives

⚠ `ATTRIBUTION.md`'s **Q4** is the right open question. MP3's patents expired in
2017; **AAC still carries licensing**. ⛔ Keep AAC out until somebody checks.

### 4. The splash and icon artwork

▶ See `ATTRIBUTION.md`. The three current marks were generated with ChatGPT:
usable commercially, **unlikely to attract copyright**, and protectable as
**trademarks**, which is the protection that matters for a logo.

---

## ⚠ Not a licensing problem, but a decision worth making

⛔ **`src/lib/room/peer.ts` ships Google's public STUN servers as defaults**
(`stun.l.google.com:19302`, `stun1.l.google.com:19302`), with Cloudflare's third.

⚠ Google provides those as a convenience with **no SLA and no commercial terms**.
It is not a violation of anything — it is a shipping product depending on somebody
else's goodwill for a feature that does not work without it. ▶ The ordinary answer
for a product people rely on is to run a `coturn` instance or use a provider with
terms.

---

## ⛔ The owner's position on payment, and what it does to the patent question

▶ Owner, 2026-09-17: *"i am not going to accept payment, and if i ever do i will
ask an IP lawyer first before proceeding, but i would like to keep both for free
for as long as possible."*

⚠ **Being free lowers the practical risk a great deal. It does not create legal
immunity, and the difference is worth understanding.**

- ⛔ **Patent infringement does not require commercial use.** Making, using,
  selling, offering to sell or importing a patented invention infringes; a free
  download is still *making* and *distributing*. There is no "it's free" defence
  in the statute.
- ✅ **But damages track harm, and a product with no revenue is a poor target.**
  Enforcement is expensive; the realistic exposure for a free tool with no
  turnover is a cease-and-desist rather than a damages claim.
- ⚠ **Research and experimental-use exemptions are narrow** and generally do not
  cover public distribution of a working product.

▶ **So the owner's plan is a sound one**: free keeps the practical risk low, and
asking an attorney *before* the first payment is exactly the right trigger — the
moment revenue exists is the moment the calculus changes.

---

## The open items

| # | Item | Status |
|---|---|---|
| C1 | Patent clearance for collaborative-DAW features | ⛔ **Open** — for an attorney, before any payment is taken |
| C2 | Reverse-image and trademark search on the ChatGPT-generated marks | ⛔ **Open** — ordinary diligence, not yet done |
| C3 | Google's public STUN servers shipped as defaults | ⚠ **Open** — a dependency on goodwill; `coturn` or a provider with terms is the answer |
| C4 | AAC encoding | ⚠ **Blocked deliberately** — see `ATTRIBUTION.md` Q4 |
| C5 | Apple AudioUnit SDK terms | ⚠ **Open** — `ATTRIBUTION.md` Q2, blocks TASK-160 |
