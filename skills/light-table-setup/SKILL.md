---
name: light-table-setup
description: Set up Light Table, a local dashboard of all your projects. Use when the user asks to set up, install, start or rebuild their Light Table / project board, or to add the projects in a folder to it for the first time. Scans their projects folder, drafts one entry per project from its docs, writes the record and opens the board.
---

# Set up Light Table

Light Table is a local web page (a "board") showing every project in one folder tree: status, next step, decisions waiting on the owner, and a screenshot. One file holds the status of all projects: `projects.json` in the **table folder**. Project folders are only ever read.

## Find the code

The scripts live in `core/`, two folders up from this skill's own folder (`<this skill's folder>/../../core`; resolve symlinks if the skill folder is a link). Call that path `CORE` below. Check it holds `config.py`. Read `CORE/RECORD.md` now: it defines every field and the rules.

Then see where things stand:

```bash
python3 "$CORE/config.py"
```

It prints the table folder (`home`, normally `~/.light-table`; `$LIGHT_TABLE_HOME` overrides), the record path, the projects root and the port, plus whether the config and record exist.

If a config or a record already exists, **don't overwrite either.** If the record has projects in it, tell the user how many projects it has and offer to (a) add the folders it doesn't cover (run the steps below for just those, appending), or (b) open the board (`python3 "$CORE/open.py"`). Stop unless they choose one.

## Steps

Keep the user updates short and plain. Ask questions with your question/choice tool when you have one.

1. **Projects root.** Ask which folder holds their projects. Offer likely ones that exist: the parent of the current folder, `~/Projects`, `~/Developer`, `~/code`, `~/Documents/GitHub`, `~/Desktop`. Accept any folder.
2. **Port.** Use 8130 unless something already listens there (`lsof -nP -iTCP:8130 -sTCP:LISTEN`); then try 8131, 8132… Tell them which.
3. **Write the config** (only if there isn't one; otherwise keep it and skip to step 4). Create the table folder and write `config.json` there from `CORE/config.example.json`, with `root` and `port` filled in. Ask whether there are top-level folders under the root that are never projects (archives, reference material, backups) and put those in `ignoreFolders`. If there's no record yet, write an empty one: `{"updated": "<today>", "projects": []}`.
4. **List candidates.** Run `python3 "$CORE/sweep.py" --all` and take its `candidates` (folders no entry covers, with the date files last changed). A top folder with no project files of its own (README, package.json, .git…) is treated as a group, and its subfolders are listed instead. Drop only obvious non-projects (screenshots, assets, backups, stray downloads); keep small folders that hold real work (a few poems is a project) and let the user decide in step 7.
5. **Read each candidate.** Read-only. For each folder, read whichever exist: `CLAUDE.md`, `AGENTS.md`, `README*`, the newest `HANDOFF*` / `docs/*.md` (for long dated handoff files, only the newest entries), `package.json` scripts, `.claude/launch.json`, and `git log -n 15 --format='%ad %s' --date=short` if it is a Git repo. If you can run read-only subagents in parallel, split the folders between two or three of them and have each return draft entries as JSON; otherwise read them yourself, newest folders first.
6. **Draft entries** following `RECORD.md`:
   - `id` (slug), `name`, `folder` (relative to root), `kind`, `summary`, `status`, `lastWorked` (newest commit or the `filesChanged` date), `updated` (today), `updatedBy: "setup"`, `now`, `nextStep`, `calls`.
   - `server`, as RECORD.md defines it: from `.claude/launch.json` when present; otherwise from a dev script in `package.json` or the docs (then add "(server unconfirmed)" to `now`). `localUrl` to match. `liveUrl` and `handoff` only if the docs name them.
   - **Leave out `shelf` and `rank`.** The board places entries by status; the owner drags them from there.
   - `status` by RECORD.md: recent work is `active` even without a stated next step; blocked on someone (the owner or another person) is `waiting`.
   - Don't invent. Leave unknowns `null` or empty. Append ` (unconfirmed)` to anything inferred rather than read. Write deadlines with the year.
7. **Show the user the list**: one line per project (name, status, next step). Ask which to drop or fix. Apply their changes.
8. **Write the record.** Save the entries into `projects.json`, set its top-level `updated` to today, and check it with `python3 -m json.tool "<record>" >/dev/null`.
9. **Screenshots (optional).** If Google Chrome is installed, offer to take first screenshots of projects with a live site or a running local server: `python3 "$CORE/snap.py"` (about a minute; failures just keep no image). Projects where it shows only a loading, login or audio-start screen can get `"autoCapture": false`.
10. **Open the board.** Run `python3 "$CORE/open.py"`. It builds the page, starts the small local server in the background and opens the board in the browser. If you have your own browser view, you can use `--no-open` and show the printed URL there instead.
11. **Offer the extras**, in one short message, and set up only what they say yes to:
   - **Nightly sweep**: keeps entries current every night. Claude desktop app: create a scheduled task (daily, about 11 PM) whose prompt is "Run the light-table-sweep skill." Everyone else: see `schedule/README.md` in the Light Table code (a launchd job that runs the sweep through `claude -p` or `codex exec`).
   - **Backup**: make the table folder a private Git repo of their own (`git init`, add their remote). The sweep then backs it up nightly with `CORE/backup.sh`. Never create a remote repo for them without asking.
   - **Claude Code buttons** (optional panel above the prompt): see `claude/panel/README.md`.
   - **Codex**: offer to add the snippet in `codex/AGENTS.snippet.md` to their global `~/.codex/AGENTS.md` so every session knows about Wrap up.
12. Finish with two lines: how many projects are on the board, and its address.

## Hard rules

- Read-only in every project folder. Write only the table folder (and, if they ask, their scheduler or agent config).
- Never start or stop project servers during setup.
- Never set `shelf` or `rank`.
