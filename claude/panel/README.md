# Light Table panel (Claude Code, optional, early access)

One row above the prompt in every Claude Code session.

**In a project on the board**, from left to right:

- **∴ name**, the server light (● running, ○ stopped) with its port, and the number of decisions waiting on you
- **Next:** the next step, shortened to fit
- **Restart** (**Start server** when it's down, the only bright button): asks Claude to start the project's dev server
- **Update board**: runs the `light-table-wrap-up` skill
- **Board**: rebuilds the board, starts its server if needed, opens it
- **Hide**: folds the row down to a small **∴ Light Table**

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
