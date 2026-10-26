# Light Table panel (Claude Code, optional, early access)

One row above the prompt in every Claude Code session.

**In a project on the board**, from left to right:

- **∴ name** and the number of decisions waiting on you. The small **›** beside the count opens the list: the row grows upward with one line per decision and the full next step. Sending a message folds it away
- **Next:** the next step, shortened to fit
- **Open**, **App**, **Local**, **Live**: one button per way into the project, each shown only when the project has it. **Open** opens the record's hand-set `open`, **App** launches the built app, **Live** opens the deployed site. **Local** opens the local page; while its server is down it's the bright button, and pressing it asks Claude to start the server and opens the page once it answers
- **⠿** (Board): rebuilds the board, starts its server if needed, opens it
- **Hide** (**–** in a narrow window): folds the row down to a small **∴ Light Table**

It always stays one row. As the window narrows, the next step gives way first, then Hide turns into **–**, then the count drops its word. The name is never cut and the buttons never move.

To record a session, say "wrap up" (the `light-table-wrap-up` skill). The nightly sweep catches up the rest.

**In a folder that isn't on the board**, just a small **∴ Add to board**.

It also restarts a project's dev server by itself when you come back to a session (or send the first message) and the server has stopped. Every 20 seconds it checks the server and re-reads the record, so a project you just added shows up without a restart.

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
