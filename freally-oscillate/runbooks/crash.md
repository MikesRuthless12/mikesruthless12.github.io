# Runbook — a crash report

**Build spec:** `build-prompts-guide.md` § F-28 · **Task:** TASK-024B · **Rung:** `v0.1.0`

Adapted from Freally MIDI Master's. ⚠ Public: this is the page a user is sent
to, so it says nothing about internal process.

---

## First, the one question that separates the two failures

> **Did the sound keep going?**

| Answer | What happened | The file |
|---|---|---|
| **No — the whole application vanished** | A Rust panic. The process ended. | `panic-<seconds>.txt` |
| **Yes — a panel went blank or grey** | A render failure in the interface. ⚠ **The audio engine runs none of that code**, so playback carried on and the project kept its state. | `page-<seconds>.txt` |

⛔ **Ask this before anything else.** The two have different causes, different
files and different urgency, and the words people use for them are the same —
almost everybody says "it crashed" for both.

---

## ⛔ Do not ask for a reproduction first

**Collect the file, then ask.**

Oscillate keeps the newest **20** reports and drops the rest. That window is short:
an afternoon of work can push the report you actually want out of it. Asking
somebody to "try to make it happen again" before they send you what already
happened is how the evidence gets deleted while you wait.

---

## Where the files are

| | |
|---|---|
| **Windows** | `%APPDATA%\Freally Oscillate\crashes\` |
| **macOS** | `~/Library/Application Support/Freally Oscillate/crashes/` |
| **Linux** | `~/.local/share/Freally Oscillate/crashes/` |

In the application: **Settings → General → Open the reports folder.**

---

## What to collect

1. **The report file itself.** It is plain text and it is safe to read first.
2. **What they were doing** in the ten seconds before it.
3. **Whether it has happened more than once**, and whether anything is common
   to the times it did.
4. **The operating system and its version** — the report already carries this,
   but a mismatch between what it says and what they say is itself a finding.

⛔ **Nothing else.** Do not ask for the project file, a screen recording of
their session, or their audio settings screen. If a report needs more than it
carries, that is a defect in the report, and the fix is in `crash.rs` rather
than in a bigger ask.

---

## What a report contains, and what it never contains

**It carries:** the application version, the target it was built for, the
message, and a backtrace.

⛔ **It never carries:** a file path from the disk, a project name, a room code,
a peer's address, or anything at all about anyone else who was in the room.
Absolute paths are replaced with `<path>` and addresses with `<address>` before
the file is written — `crash.rs`'s redaction, which is fuzzed against long and
unusual paths in several scripts.

⚠ **Relative paths are kept on purpose.** `src/main.rs:42` is Oscillate's own source
and names nobody; without it a report is a list of hexadecimal addresses.

---

## The three real reasons the folder is empty

1. **It has not happened since the application was last updated.** Reports are
   not carried across an uninstall.
2. **The panel went blank rather than the application closing, and the notice
   was dismissed.** The file is still there — look for `page-…` rather than
   `panic-…`.
3. ⚠ **The machine has no application-data directory.** Rare, and almost always
   a container or a locked-down corporate profile. Oscillate cannot write a report
   at all in that case, and it does not pretend to have.

---

## What Oscillate never does

⛔ **Nothing is ever transmitted automatically.** No telemetry, no analytics, no
crash uploader. A report is written locally, shown to the user in full, and
leaves their machine only if they choose to send it.

⚠ *Open a pre-filled issue in your browser* hands the text to **their browser**
through a URL. ⛔ Oscillate itself never makes the request — which is what keeps the
"nothing phones home" claim true and testable rather than merely stated.
