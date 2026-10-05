# The record: projects.json

One file holds every project's status: `projects.json` in the table folder
(`python3 core/config.py` prints where). Project folders are never written to.
See `projects.example.json` for a filled-in example.

```json
{ "updated": "2026-10-01", "projects": [ { ... }, { ... } ] }
```

## Fields

| Field | Who writes it | Meaning |
|---|---|---|
| `id` | setup / agent | Short lowercase slug, unique, never changed once set. Names screenshots (`shots/<id>.png`). |
| `name` | setup / agent | Display name. |
| `folder` | setup / agent | Path relative to the projects root. |
| `kind` | setup / agent | A few words: "web app", "audio archive", "game prototype". |
| `summary` | setup / agent | One sentence on what the project is. |
| `status` | agent | `active`: worked on in the last ~3 weeks. `waiting`: the next step is blocked on the owner or on someone else (the `calls` say who). `paused`: work stopped with a plan. `dormant`: 60+ days untouched with nothing stated. A guessed status gets "(status unconfirmed)" at the end of `now`. |
| `lastWorked` | agent | Date of the newest commit or file change (YYYY-MM-DD). |
| `updated` | agent | Date this entry was last written. The sweep compares it with file changes. |
| `updatedBy` | agent | Optional: "wrap up", "nightly sweep", "setup". |
| `now` | agent | One or two plain sentences on where things stand. |
| `nextStep` | agent | The single concrete next step, or `null`. |
| `calls` | agent | Decisions only the owner can make, people to contact, deadlines. Short instructions to the owner ("Choose…", "Approve…", "Try…"). Dates with the year (2026-10-20), so they stay right next year. Resolved ones are removed. |
| `server` | setup / agent | `{"config": <name>, "port": <n>, "launchJson": <path or null>}` for a project with a local dev server, else `null`. With a `.claude/launch.json`: `config` is the configuration name and `launchJson` its path relative to the root. Without one: `config` is the start command (e.g. `npm run dev`) and `launchJson` is `null`. |
| `localUrl` | setup / agent | The dev server's URL, e.g. `http://localhost:5173/`. |
| `liveUrl` | setup / agent | The deployed site, if any. |
| `handoff` | setup / agent | Path (relative to the root) of the project's main handoff/notes file, if any. The board's Notes button opens it. |
| `screenshot` | setup | Optional fallback image path (relative to the root). |
| `autoCapture` | owner | `false` keeps headless captures off for projects where they only show a loading, login or audio-gate screen. |
| `sweep` | owner | `false` makes the nightly sweep skip this entry (for example the board's own entry, which you update by hand). |
| `shelf` | **owner only** | `motion` · `resting` · `archive`. Set by dragging on the board. |
| `rank` | **owner only** | Position in the owner's order. Set by dragging on the board. |

## Rules every agent follows

- **Never set, change or remove `shelf` or `rank`.** New entries get neither; the board places them by status until the owner drags them.
- **Don't invent.** If the project's docs don't say, leave the field as it was (or `null` for a new entry). Append ` (unconfirmed)` to anything inferred rather than read.
- **Keep every field you aren't updating.**
- **Write only inside the table folder.** Project folders are read-only: no edits, no commits, no git writes (only `log`, `show`, `status`, `diff`, `branch`).
- Keep the file valid JSON: check with `python3 -m json.tool <record> >/dev/null` after editing.

## Images

The card image is chosen by `build.py`, in this order:

1. A file with `current` in its name anywhere in the project: the owner's pick (unless a Wrap up capture is newer).
2. The newer of the Wrap up capture (`shots/<id>.png|jpg`) and the auto-capture (`auto/<id>.png`).
3. Last resort: the newest image in a folder whose name contains `screenshot`.

The hover cycle shows up to `galleryMax` recent images from screenshot folders. Folders named in `gallerySkip` (`old`, `archive`) are left out.
