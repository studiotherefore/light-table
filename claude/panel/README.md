# Light Table panel (Claude Code, optional, early access)

A row of buttons above the prompt in every Claude Code session:

- the project's name, status, server light (● running / ○ stopped) and next step
- **Start / Restart server**: asks Claude to start the project's dev server in the browser pane
- **Add to board** / **Update board**: runs the `light-table-wrap-up` skill (adds this folder, or rewrites its entry)
- **Open board**: rebuilds the board, starts its server if needed, opens it
- **Hide**: folds the row down to one small button

It also restarts a project's dev server by itself when you come back to a session (or send the first message) and the server has stopped.

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
