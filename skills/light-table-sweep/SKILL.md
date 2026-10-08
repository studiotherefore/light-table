---
name: light-table-sweep
description: The Light Table nightly sweep. Use when a scheduled task or the user asks to sweep, refresh or catch up the project board. Finds projects whose files changed since their entry was written, updates just those from their docs and git log, refreshes screenshots, rebuilds the board and runs the optional backup.
---

# Light Table nightly sweep

Bring the record up to date for every project whose files changed since its entry was written, refresh auto-screenshots, rebuild the board, and back up if the owner set that up. This usually runs unattended, so never stop to ask questions: do what the rules allow and report the rest.

## Find things

The scripts are in `core/`, two folders up from this skill's folder (`<this skill's folder>/../../core`, symlinks resolved). Call it `CORE`. `python3 "$CORE/config.py"` prints the record path, table folder (`home`) and projects root. Field definitions and rules: `CORE/RECORD.md`. If the config or record is missing, report "Light Table isn't set up" and stop.

## Hard rules

- **Read-only everywhere except the table folder.** Never edit, create, delete, commit, push, merge, check out or deploy anything in a project folder. Git in project folders: read commands only (`log`, `show`, `branch`, `status`, `diff`).
- Never start or stop servers. Never open a browser window (snap.py's own headless Chrome is fine).
- Don't rewrite an entry the finder didn't flag.
- **Never set, change or remove `shelf` or `rank`.** New entries get neither. Keep every field you aren't updating.
- Don't invent. If the docs don't say, leave the field as it was and append ` (unconfirmed)` only to what you inferred.

## Steps

1. Run `python3 "$CORE/snap.py"`. Note any FAILED lines for the report; they are not errors (the previous capture is kept). If it says there's no browser, skip it.
2. Run `python3 "$CORE/sweep.py"`. It prints JSON: `changed` (stale entries, with the docs and git commits changed since their `updated` date) and `candidates` (folders with work in the last 30 days that no entry covers). If both are empty, run `build.py` and the backup (step 6), and finish with "Nothing changed today." plus the screenshot count and backup result.
3. For each project in `changed`, read what changed: the listed docs (newest first; for long dated handoff files only the newest entries), the commits, and the entry's `handoff` file if it changed. Then update that entry:
   - `now`: one or two plain sentences on where it stands.
   - `nextStep`: the single concrete next step as the project's docs state it. If work is built on a branch but not merged, say so: "try it and okay the merge" is often the real next step.
   - `calls`: decisions only the owner can make, people to contact, deadlines, written as instructions ("Choose…", "Approve…", "Try…"). Remove ones the docs or commits show are resolved; keep open ones.
   - `status`: active / waiting / paused / dormant, as defined in RECORD.md.
   - `lastWorked`: the newest commit or file-change date. `updated`: today. `updatedBy`: `"nightly sweep"`.
   - If an entry has `"missing": true`, don't delete it: set `now` to "Folder not found at <folder>; moved or renamed?" and add the call "Check where <name> went".
4. For each folder in `candidates`: read its CLAUDE.md / AGENTS.md / README / HANDOFF if any. If it is a real project (not screenshots, assets, backups or a stray file), add an entry with every field filled as above (server from `.claude/launch.json` if present), `updatedBy: "nightly sweep"`, and no `shelf` or `rank`. Skip things that clearly aren't projects.
5. Set the record's top-level `updated` to today. Check it is valid JSON (`python3 -m json.tool "<record>" >/dev/null`). Run `python3 "$CORE/places.py" restore`, which puts back any shelf or rank that changed (include its output in the report if it put anything back), then `python3 "$CORE/build.py"`.
6. Run `sh "$CORE/backup.sh"`. It does nothing unless the owner made the table folder a Git repo with a remote. If a push fails, don't retry or change Git settings; include the error in the report.
7. Finish with a short report, under 12 lines: one line per project changed ("Tide Clock: next, finish the station picker; 1 new decision"), one per project added, any status changes, "Screenshots: N captured, M failed", and the backup result.
