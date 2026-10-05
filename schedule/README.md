# The nightly sweep

Each night the `light-table-sweep` skill finds projects whose files changed since their entry was written, updates just those from their docs and git log, retakes auto-screenshots, rebuilds the board, and runs the optional backup.

## Claude desktop app

Create a scheduled task: daily, about 11 PM, prompt **"Run the light-table-sweep skill."** The setup skill offers to do this for you.

## Anyone else (macOS launchd)

`run-sweep.sh` runs the sweep through the agent's headless CLI (`claude -p` or `codex exec`) and appends the report to `sweep.log` in your table folder.

1. Try it once by hand: `sh schedule/run-sweep.sh claude` (or `codex`).
2. Copy `launchd.plist.template` to `~/Library/LaunchAgents/com.lighttable.sweep.plist`, replacing `REPO` (this folder), `HOME` (your home folder) and `AGENT`.
3. `launchctl load ~/Library/LaunchAgents/com.lighttable.sweep.plist`

The Mac must be awake at 11 PM (or launchd runs it when it next wakes).

## Backup (optional)

To back up your record and Wrap up screenshots, make the table folder a Git repo with a private remote of your own:

```bash
cd ~/.light-table && git init && git remote add origin <your private repo URL>
```

The sweep then runs `core/backup.sh` each night. It never pushes anywhere you haven't set up.
