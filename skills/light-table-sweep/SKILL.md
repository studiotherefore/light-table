---
name: light-table-sweep
description: The Light Table nightly sweep. Use when a scheduled task or the user asks to sweep, refresh or catch up the project board. Finds projects whose files changed since their entry was written, updates just those from their docs and git log, refreshes screenshots, rebuilds the board and runs the optional backup.
---

# Light Table nightly sweep

Bring the record up to date for every project whose files changed since its entry was written, refresh auto-screenshots, rebuild the board, and back up if the owner set that up. This usually runs unattended, so never stop to ask questions: do what the rules allow and report the rest.

## Find things

The scripts are in `core/`, two folders up from this skill's folder (`<this skill's folder>/../../core`, symlinks resolved). Call it `CORE`; write it out in full in the commands below. Field definitions and rules: `CORE/RECORD.md`. If the Find command says Light Table isn't set up, report that and stop.

## Commands

A scheduled run stops at any command that needs approval and waits for a prompt nobody sees at night. So the sweep runs only these fixed commands, **exactly as written, word for word and one at a time**. Don't chain them, wrap them, pipe them or add `cd`. The owner approves each one once with "Always allow", and later runs don't stop.

- **Find:** `sh "CORE/nightly-find.sh"` prints, under headings: `== table` (the record path, table folder `home` and projects root), `== snap` (the screenshot captures), `== sweep` (what changed locally) and `== cloud` (what was pushed to GitHub).
- **Finish:** `sh "CORE/nightly-finish.sh"` checks that the record is valid JSON (it refuses to build if not), runs `places.py restore`, then `build.py`.
- **Backup:** `sh "CORE/backup.sh"`.

If the scheduled task's prompt names a table folder, add it as the last argument to all three, in quotes, the same way every time. Read files with your file-reading tool, not the shell. For git in project folders, use read commands only.

## Hard rules

- **Read-only everywhere except the table folder.** Never edit, create, delete, commit, push, merge, check out or deploy anything in a project folder. Git in project folders: read commands only (`log`, `show`, `branch`, `status`, `diff`).
- Never start or stop servers. Never open a browser window (snap.py's own headless Chrome is fine).
- Don't rewrite an entry that `sweep.py` or `cloud.py` didn't flag.
- **Never set, change or remove `shelf` or `rank`.** New entries get neither. Keep every field you aren't updating.
- Don't invent. If the docs don't say, leave the field as it was and append ` (unconfirmed)` only to what you inferred.

## Steps

1. Run the **Find** command. Under `== snap`, note any FAILED lines for the report; they are not errors (the previous capture is kept). A "no browser" line means captures are off.
2. Under `== sweep` is JSON: `changed` (stale entries, with the docs and git commits changed since their `updated` date) and `candidates` (folders with work in the last 30 days that no entry covers). Under `== cloud` is what `cloud.py` found when it asked GitHub (read-only, through `gh`) for pushes to each project's repo that aren't on this Mac yet: work from cloud sessions, other accounts or other machines. It prints JSON `{id: [{branch, pushed, head, merged, handoff, shot, current, wrapup}]}`. `handoff` is a local copy of the project's handoff file as it is on that branch (in the table folder's `auto/cloud/`). `shot` (the session's screenshot) and `current` (the owner's pick) are images `build.py` picks up by itself. `wrapup` says whether that branch's CLAUDE.md has the end-of-session block. If it says it skipped (no `gh`), say so in the report. If `changed`, `candidates` and the cloud result are all empty, run the **Finish** command, then the **Backup** command (step 6), and finish with "Nothing changed today." plus the screenshot count and backup result.
3. For each project in `changed`, read what changed: the listed docs (newest first; for long dated handoff files only the newest entries), the commits, and the entry's `handoff` file if it changed. Then update that entry:
   - `now`: one or two plain sentences on where it stands.
   - `nextStep`: the single concrete next step as the project's docs state it. If work is built on a branch but not merged, say so: "try it and okay the merge" is often the real next step.
   - `calls`: decisions only the owner can make, people to contact, deadlines, written as instructions ("Choose…", "Approve…", "Try…"). Keep a call only while the project's current docs (the handoff's open items, next steps, questions for the owner) still ask for it, or git shows it still pending. Remove calls the docs or commits show are resolved, and calls the current docs no longer mention: don't carry a call forward just because nothing says it's done. Check what git can answer yourself (e.g. "okay the push": is the branch ahead of its remote?).
   - `status`: active / waiting / paused / dormant, as defined in RECORD.md.
   - `lastWorked`: the newest commit or file-change date. `updated`: today. `updatedBy`: `"nightly sweep"`.
   - For each project in the cloud result (whether or not `sweep.py` flagged it): read its saved `handoff` copy (newest dated entries first) as the latest word on that project. It is newer than the local folder. Update the entry the same way. If the branch isn't merged (`merged: false`), say so in `now` ("Cloud work on branch X, not merged yet") and make the next step or a call "Try branch X and okay the merge". Set `updatedBy: "nightly sweep (cloud)"`, and record what you read in the entry's `cloudSeen`: `{"<branch>": "<head>"}` for each branch reported (keep other branches already there). Never fetch, pull or check out the branch; the copy is all you need. If `wrapup` is false, add the call "Paste the end-of-session block (docs/cloud-wrapup.md in Light Table) into <name>'s CLAUDE.md" (once; remove it when `wrapup` is true). If a project shows an `error`, note it in the report and move on.
   - If an entry has `"missing": true`, don't delete it: set `now` to "Folder not found at <folder>; moved or renamed?" and add the call "Check where <name> went".
4. For each folder in `candidates`: read its CLAUDE.md / AGENTS.md / README / HANDOFF if any. If it is a real project (not screenshots, assets, backups or a stray file), add an entry with every field filled as above (server from `.claude/launch.json` if present), `updatedBy: "nightly sweep"`, and no `shelf` or `rank`. Skip things that clearly aren't projects.
5. Set the record's top-level `updated` to today. Then run the **Finish** command. It refuses to build if the record isn't valid JSON (fix it and run it again), and it puts back any shelf or rank that changed (include that in the report if it put anything back).
6. Run the **Backup** command. It does nothing unless the owner made the table folder a Git repo with a remote. If a push fails, don't retry or change Git settings; include the error in the report.
7. Finish with a short report, under 12 lines: one line per project changed, marking cloud ones "(cloud)" ("Tide Clock: next, finish the station picker; 1 new decision"), one per project added, any status changes, "Screenshots: N captured, M failed", and the backup result.
