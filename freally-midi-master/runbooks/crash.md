# Crash runbook

What to do when a producer says the plugin died, and what to ask them for.

This is the support side of TASK-093. The engineering side is
`plugin/src/crash.rs`; this is how to use what it writes.

## The two ways this product can go down

They look different to the producer and they need different questions.

| what happened | what the producer sees | what is written |
|---|---|---|
| **A Rust panic** | The **whole DAW** closes. Release is built `panic = "abort"`, so the plugin takes the host with it | `panic-<seconds>.txt` |
| **A React render throw** | The plugin window becomes a **dead rectangle** inside a project that is otherwise still running | `page-<seconds>.txt` |

**Ask which one it was first.** "Did Ableton close, or did the plugin window go
blank?" separates the two in one question, and the answer decides whether you are
looking for a host crash log as well.

## Where the reports are

One folder, both writers:

- **Windows** — `%APPDATA%\Freally MIDI Master\crashes\`
- **macOS** — `~/Library/Application Support/Freally MIDI Master/crashes/`
- **Linux** — `~/.local/share/Freally MIDI Master/crashes/`

The producer does not have to find it by hand: **Settings → General** names the
most recent crash and offers a button that opens the folder. That notice is the
first thing to point them at.

Filenames are `<kind>-<seconds since the epoch>.txt`, so they sort in time order.
The folder keeps the newest **20** and drops the rest.

## A renderer-crash relaunch

This is the case that reads as "it just came back on its own", and it is worth
knowing because the producer will not describe it as a crash.

**What happens.** A React render throw unmounts the page. The audio thread is
untouched — it does not run any of that code — so **the pattern keeps playing**
and the project keeps its state. The window comes back on the next open, and the
throw is on disk as `page-<seconds>.txt`.

**What to ask.**

1. **"Did the sound keep going?"** If it did, this was the renderer and not a
   panic. If the audio stopped too, look for a panic file with a nearby
   timestamp — and for the host's own crash log, because the process went down.
2. **"Was there a crash notice in Settings → General when you reopened it?"** If
   there was not, the throw never reached disk, and the report is worth having as
   a bug in its own right.
3. **"What were you doing?"** The page throw's text carries the component stack;
   pair it with the gesture and it is usually one panel.

**What to collect.** The newest one or two files from the crashes folder, the
host and its version, and the OS. The files are plain text and small enough to
attach whole — that is what the cap of 20 is for.

**⛔ Do not ask them to reproduce it before collecting the file.** The folder
keeps 20 reports; a producer who reopens and works for an afternoon can push the
one you want out of the window, and the newest file is written by the *next*
crash, not by this one.

## When the notice will not go away

The notice is dismissible and must not come back for the same crash. If a
producer says it returns every time they open Settings, that is a defect, not a
support question — the dismissal is recorded against the crash it named.

## When there is nothing in the folder

Three real causes, in the order to check them:

1. **There is no data directory** — `crash_dir` answers `None` and nothing is
   written. Rare, and it means other stored state is missing too: ask whether
   their library folders and saved kits survived.
2. **The crash was in the host, not in us.** A DAW can close for its own reasons
   while our plugin is loaded. Look for the host's crash log.
3. **The process was killed rather than crashing** — Task Manager, a force quit,
   or the machine losing power. Nothing runs on that path, by design.

⚠ `crash.rs` never panics and never reports a failure to write. A crash that
cannot be written is silently not written, because a panic inside a panic hook
aborts immediately and loses the original message. So an empty folder is not
evidence that nothing went wrong.
