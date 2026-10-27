# Light Table panel (Claude Code, optional, early access)

One row above the prompt in every Claude Code session.

**In a project on the board**, from left to right:

- **∴ name** and the number of decisions waiting on you. The small **›** beside the count opens the list: the row grows upward with one line per decision and the full next step. Sending a message folds it away
- **Next:** the next step, shortened to fit
- **Open**, **App**, **Local**, **Live**: one button per way into the project, each shown only when the project has it. **Open** opens the record's hand-set `open`, **App** launches the built app, **Live** opens the deployed site. **Local** opens the local page; while its server is down it's the bright button, and pressing it asks Claude to start the server and opens the page once it answers
- **Update**: only while no nightly sweep has run in the last two days (none set up, or one that stalled). It runs the `light-table-wrap-up` skill. With the sweep running, nothing else is needed and the button stays out of the way
- **⠿** (Board): rebuilds the board, starts its server if needed, opens it
- **Hide** (**–** in a narrow window): folds the row down to a small **∴ Light Table**

It always stays one row. As the window narrows, the next step gives way first, then Hide turns into **–**, then the count drops its word. The name is never cut and the buttons never move.

To refresh a project right away, any time, say "wrap up" or run `/light-table:light-table-wrap-up`. For every project at once, run `/light-table:light-table-sweep`.

**In a folder that isn't on the board**, just a small **∴ Add to board**.

It doesn't restart a stopped dev server by itself: the **Local** button is bright while the server is down, and pressing it starts the server and opens the page when it's up. A project can opt in with `"autoStart": true` in its record entry (see `core/RECORD.md`); then the panel restarts it when a session starts, when you come back to the session, or with your first message after an outage. Every 20 seconds it checks the server and re-reads the record, so a project you just added shows up without a restart.

**Early access.** The panel uses Claude Code's function-hooks API, which still changes between releases. If an update breaks it, the skills keep working. Turn the panel off and use them by asking ("wrap up", "open my board").

## Install

Needs the `light-table` plugin from the same marketplace (for the Wrap up skill), and a board that has been set up once (the setup skill writes `core-path` into your table folder, which is how the panel finds everything).

```
/plugin marketplace add studiotherefore/light-table
/plugin install light-table-panel@light-table
```

Settings: **Table folder** (where your board lives, if not `~/.light-table`) and **Background** (a color behind the row, e.g. `#26282e` on a dark theme).

Or load it straight from a clone, for every session, in `~/.claude/settings.json`:

```json
{ "env": { "CLAUDE_CODE_PLUGIN_DIRS": "/path/to/light-table/claude/panel" } }
```

## Develop

`claude plugin validate claude/panel` checks it. For editor types, run `/plugin-types claude/panel/.claude-plugin/types` in a Claude Code session; `tsconfig.json` points there.
