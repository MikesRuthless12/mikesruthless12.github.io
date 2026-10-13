# Disclaimer

**Freally Oscillate** · © 2026 Mike Weaver. All Rights Reserved.

This page is the plain-language companion to [`LICENSE`](../../LICENSE) and
[`EULA.md`](../../EULA.md). ⚠ **Where it and those documents differ, they
govern** — this one is written for reading, not for signing.

---

## What you make with Oscillate is yours

Projects, MIDI, audio, stems, renders, split sheets and video that you create
with Freally Oscillate belong to you. The author claims no ownership of them and
asserts no licence over them. Use them for anything lawful, including commercial
release, with **no royalty and no attribution requirement**. You do not need
permission, and you do not need to say what you made it with.

⚠ **That is about Oscillate's part in it, and only Oscillate's part.** It is not a claim
about anything you put *into* a project. A sample you did not clear, a melody you
did not write, a loop from a pack whose licence forbids resale — Oscillate's licence
does not clear any of those, and cannot. What you import is your responsibility.

## There is no warranty

Oscillate is provided **as is**. It is a large piece of software that touches audio
hardware, third-party plugins and the network, and it will have defects.

⛔ **Keep backups of work that matters, and do not make Oscillate the only copy of a
session you cannot afford to lose.** That is ordinary advice for any DAW; it is
worth saying plainly rather than leaving inside a block of capital letters.

## Third-party plugins are not ours

VST3 and CLAP plugins are other people's software running inside — or, in
Oscillate's case, beside — your session. Oscillate sandboxes each one in its own process
so that a crash greys out a device instead of losing your work, but it cannot
make somebody else's plugin correct, stable or safe. Support for a plugin is its
author's, not ours.

## Collaboration

A **room code contains your public IP address.** Oscillate says so at every point
you can copy one, and it is worth repeating here: **treat a room code like a
password.** Anyone you send it to can join your session; anyone who intercepts
it can try.

⚠ **A session is peer to peer.** There is no server, which is why it is free and
why nothing is stored centrally — and it also means the people in the room are
connected directly to each other. Only open a room with people you would give
your address to.

⚠ **Roughly one pair in ten will not connect.** Some networks — symmetric NAT,
which many mobile hotspots use — cannot be traversed without a relay server, and
Oscillate has no relay server by design. Oscillate says which side failed and why rather
than spinning.

## No accounts, no telemetry, no AI

Oscillate has no account system, sends no telemetry, and contains no
machine-learning component of any kind. These are not settings; they are
properties of the build, checked by
[`scripts/check-denylist.mjs`](../../scripts/check-denylist.mjs) on every commit.

The only network traffic Oscillate makes is a collaboration connection you opened, a
STUN lookup that Settings names, and an update check you pressed.

## Trademarks

**VST** is a trademark of Steinberg Media Technologies GmbH. **CLAP** is
maintained by u-he and Bitwig. Any other product or company name that appears in
this project's documentation is the property of its respective owner and is used
only to describe compatibility or to say honestly what Oscillate is measured
against. ⛔ **None of them endorses Freally Oscillate, and no such endorsement is
implied.**

## This is not legal advice

Nothing here or in the licence documents is legal advice, and none of it is a
substitute for your own. If a question about your rights matters to you, ask
somebody qualified to answer it.

---

**Questions:** freallyproducts@gmail.com
