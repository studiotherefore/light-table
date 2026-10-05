# Light Table for Codex

Status: the skills are written in the shared Agent Skills format and are meant to work in Codex as they are. **Not yet tested in Codex.** Testing and a Codex plugin bundle are the next step.

## Install (personal)

Codex loads skills from `~/.agents/skills`. Link the four skills there from a clone of this repo:

```bash
sh codex/install.sh
```

Then, in a Codex session in any folder: "set up Light Table".

Optionally add `codex/AGENTS.snippet.md` to your global `~/.codex/AGENTS.md` so every session knows about Wrap up. The setup skill offers to do this.

## What works differently from Claude Code

- **Session links:** with `"sessions": "codex"` (or `"auto"` on a Mac with Codex but no Claude app), a project's title on the board opens its latest Codex session (`codex://threads/<id>`), or starts one in its folder (`codex://threads/new?path=…`).
- **No button panel.** Ask instead: "wrap up", "open my board". A SessionStart hook could restart dev servers (Codex hooks support `async`); not built yet.
- **Nightly sweep:** see `schedule/README.md` (`codex exec`).

## To do (for the Codex packaging pass)

- Test the four skills in Codex (CLI and desktop app), especially that the skill can find `core/` two folders up from its own (symlinked) folder.
- Check `$light-table-sweep` works through `codex exec` with `-s workspace-write` (writes limited to the table folder) and that headless Chrome (snap.py) runs inside the sandbox.
- Decide whether to ship a Codex plugin bundle (`.codex-plugin/plugin.json` + `skills/`), installable with `codex plugin marketplace add studiotherefore/light-table`. Workspace plugin sharing was Business/Enterprise only as of October 2026; installing from a public repo marketplace is what matters here. Verify before relying on it.
