# The nightly sweep

Each night the `light-table-sweep` skill finds projects whose files changed since their entry was written, updates just those from their docs and git log, retakes auto-screenshots, rebuilds the board, and runs the optional backup.

## Claude desktop app

Create a scheduled task: daily, about 11 PM, prompt **"Run the light-table-sweep skill."** The setup skill offers to do this for you.

**Then press Run now once, while you're at the computer,** and choose "Always allow" for each command it asks about. A scheduled run that hits a command needing approval waits for a prompt nobody sees at night: it shows as running and blocks every later run. The sweep only ever runs three fixed commands (`core/nightly-find.sh`, `core/nightly-finish.sh` and `core/backup.sh`), so approving them once covers every future run. After updating the plugin, do one more Run now, since the commands' path changes.

## Anyone else (macOS launchd)

`run-sweep.sh` runs the sweep through Claude Code's headless CLI (`claude -p`) and appends the report to `sweep.log` in your table folder.

1. Try it once by hand: `sh schedule/run-sweep.sh claude`. It runs with a fixed list of allowed tools, so it never stops for approval. (The `codex` option is early, untested work: Codex isn't supported yet.)
2. Copy `launchd.plist.template` to `~/Library/LaunchAgents/com.lighttable.sweep.plist`, replacing `REPO` (this folder), `HOME` (your home folder) and `AGENT`.
3. `launchctl load ~/Library/LaunchAgents/com.lighttable.sweep.plist`

The Mac must be awake at 11 PM (or launchd runs it when it next wakes).

## Backup (optional)

To back up your record and Wrap up screenshots, make the table folder a Git repo with a private remote of your own:

```bash
cd ~/.light-table && git init && git remote add origin <your private repo URL>
```

The sweep then runs `core/backup.sh` each night. It never pushes anywhere you haven't set up.
