# Light Table

A local board of all your projects, kept current by your coding agent.

One dark page at `http://localhost:8130` answers, at a glance: what's active, where each project stands, what the next step is, which decisions are waiting on you, and what it looks like now.

- **Active** projects get large cards: screenshot, status, Overview / Decisions tabs, next step, buttons for the live site, local server, notes and folder.
- **Resting** projects are compact rows; **Archive** folds away at the bottom.
- **Drag** cards between shelves and into your own order; it saves.
- **Click a project's name** to open its latest Claude Code or Codex session (or start one in its folder).
- **Hover** the stacked-frames icon to cycle through recent screenshots.

Your agent keeps it current:

- **Wrap up** at the end of a session: the agent rewrites the project's entry (now, next step, decisions, status) and screenshots the app.
- **Nightly sweep**: finds projects whose files changed, updates just those from their docs and git log, refreshes screenshots, rebuilds the board.

Everything runs on your Mac. Status lives in one file in your own table folder (`~/.light-table/projects.json`); **your project folders are only ever read.**

Requirements: macOS, Python 3 (built in), Google Chrome for automatic screenshots (optional), and Claude Code or Codex.

## Install for Claude Code

In Claude Code:

```
/plugin marketplace add studiotherefore/light-table
/plugin install light-table@light-table
```

Then ask: **"Set up Light Table."** The agent asks which folder holds your projects, reads each one's README / CLAUDE.md / handoff notes, drafts an entry for each (anything it guessed is marked "unconfirmed"), lets you correct the list, and opens the board.

Optional: **buttons above the prompt** (Start/Restart server, Wrap up, Open board) and automatic dev-server restarts. This uses an early-access Claude Code API that still changes. See [claude/panel/README.md](claude/panel/README.md).

## Install for Codex

```bash
git clone https://github.com/studiotherefore/light-table
sh light-table/codex/install.sh
```

Then, in Codex: **"Set up Light Table."** See [codex/README.md](codex/README.md). Codex support is new and less tested.

## Everyday use

| You want to | Say (or press) |
|---|---|
| See the board | "Open my board" (or **Open board**) |
| Record where a project stands | "Wrap up" (or **Wrap up**) |
| Catch up every project now | "Run the Light Table sweep" |
| Choose a project's cover image | Name an image in its folder `…current….png` |
| Keep headless screenshots off for a project | Set `"autoCapture": false` on its entry |

The nightly sweep: [schedule/README.md](schedule/README.md).

## What's where

```
core/        the board: build.py, server.py, sweep.py, snap.py, open.py, template.html
             config.example.json, projects.example.json, RECORD.md (every field and rule)
skills/      light-table-setup, -wrap-up, -sweep, -open (shared by Claude Code and Codex)
claude/      the optional Claude Code panel
codex/       Codex install script and AGENTS.md snippet
schedule/    nightly sweep through launchd for anyone without the Claude app's scheduler
```

Your table folder (`~/.light-table`, or `$LIGHT_TABLE_HOME`) holds `config.json`, `projects.json`, Wrap up screenshots (`shots/`) and generated files. It's never inside this repo.

## Privacy

- The board server listens on `127.0.0.1` only and refuses requests from other sites.
- Agents following these skills write only to the table folder. They never edit, commit or push in your project folders (git there is read-only: log, status, diff).
- Agents never move your cards: `shelf` and `rank` are yours.
- Backup is off unless you make the table folder a Git repo with your own private remote.
- The record holds your project names, notes, people and deadlines. Don't put your table folder in a public repo.
