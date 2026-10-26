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
| `about` | setup / agent | Two or three plain sentences on what the project is (not where it stands); a blank line splits paragraphs. Shown on the card's About tab, which falls back to `summary`. Written once from the project's README / CLAUDE.md, rewritten only if the project changes direction. |
| `status` | agent | `active`: worked on in the last ~3 weeks. `waiting`: the next step is blocked on the owner or on someone else (the `calls` say who). `paused`: work stopped with a plan. `dormant`: 60+ days untouched with nothing stated. A guessed status gets "(status unconfirmed)" at the end of `now`. |
| `lastWorked` | agent | Date of the newest commit or file change (YYYY-MM-DD). |
| `updated` | agent | Date this entry was last written. The sweep compares it with file changes. |
| `updatedBy` | agent | Optional: "wrap up", "nightly sweep", "setup". |
| `now` | agent | One or two plain sentences on where things stand. |
| `nextStep` | agent | The next piece of work, or `null`. When the owner's call comes first: "Yours first: <a few words> (below). Then <the work after>." Never repeats a call's wording. |
| `calls` | agent | Things only the owner can do: decisions, things to try or listen to, people to contact, deadlines. Most important first: the card shows the top three. Short instructions to the owner ("Choose…", "Approve…", "Try…"). Dates with the year (2026-10-20), so they stay right next year. Resolved ones are removed. |
| `server` | setup / agent | `{"config": <name>, "port": <n>, "launchJson": <path or null>}` for a project with a local dev server, else `null`. With a `.claude/launch.json`: `config` is the configuration name and `launchJson` its path relative to the root. Without one: `config` is the start command (e.g. `npm run dev`) and `launchJson` is `null`. |
| `localUrl` | setup / agent | The dev server's URL, e.g. `http://localhost:5173/`. |
| `liveUrl` | setup / agent | The deployed site, if any. |
| `handoff` | setup / agent | Path (relative to the root) of the project's main handoff/notes file, if any. The board's Handoff button opens it. |
| `app` | setup / agent | Path (relative to the root) of a built `.app`, if the project has one. It may be a link into a build cache. Cards show an **App** button that launches it. |
| `open` | owner | Optional. A URL, or a path relative to the root, for anything the other links don't cover. The panel shows an **Open** button for it. |
| `screenshot` | setup | Optional fallback image path (relative to the root). |
| `autoCapture` | owner | `false` keeps headless captures off for projects where they only show a loading, login or audio-gate screen. |
| `sweep` | owner | `false` makes the nightly sweep skip this entry (for example the board's own entry, which you update by hand). |
| `github` | owner / setup | Optional `"owner/repo"`, when the project's current repo isn't the local folder's `origin` (for example a repo on another GitHub account that you can read). `cloud.py` checks it. |
| `local` | owner | `false` when the copy on this Mac is old and should be ignored: the card's title opens the live site (else the GitHub repo), Handoff opens the handoff on GitHub, and Local, App and Finder are left off. |
| `cloudSeen` | agent | `{"<branch>": "<head>"}`: cloud branches the sweep has already read, so `cloud.py` doesn't report them again. Written by the sweep only. |
| `started` | owner (optional) | Date the project started. Without it, the board shows the date of the repo's first commit (read at build time). |
| `shelf` | **owner only** | `motion` · `resting` · `archive`. Set by dragging on the board. |
| `rank` | **owner only** | Position in the owner's order. Set by dragging on the board. |

## Rules every agent follows

- **Never set, change or remove `shelf` or `rank`.** New entries get neither; the board places them by status until the owner drags them.
- **Never edit `notes.json`** in the table folder. It holds the owner's own notes, typed on the board (`{id: {text, updated}}`, up to 5000 characters each). Only the board's server writes it, and the build shows each note on its card.
- **Run `core/places.py restore` before rebuilding** after any edit to the record. `places.json` in the table folder keeps the owner's placements (the board refreshes it on every drag), and restore puts back anything an edit changed. If the owner asks you in chat to move a card, change its `shelf`/`rank`, then run `core/places.py save`.
- **Don't invent.** If the project's docs don't say, leave the field as it was (or `null` for a new entry). Append ` (unconfirmed)` to anything inferred rather than read.
- **Keep every field you aren't updating.**
- **Write only inside the table folder.** Project folders are read-only: no edits, no commits, no git writes (only `log`, `show`, `status`, `diff`, `branch`).
- Keep the file valid JSON: check with `python3 -m json.tool <record> >/dev/null` after editing.

## Images

The card image is chosen by `build.py`, in this order:

1. A file with `current` in its name anywhere in the project (a `.board/` folder counts), or one `cloud.py` fetched from the project's newest GitHub branch (`auto/cloud/<id>-current.*`): the owner's pick. It always wins, even over a newer board update or auto capture. If it's gone from the newest branch, the board drops its copy.
2. The newest of: the board-update capture (`shots/<id>.png|jpg`), the auto-capture (`auto/<id>.png`), a cloud capture (`auto/cloud/<id>.*`) and the session capture in the project (`screenshots/*session*`, or the older `.board/shot.*`).
3. Last resort: the newest image in a folder whose name contains `screenshot`.

For `local: false` entries, only the table folder's own images and `auto/cloud/` are used.

**Screenshot names**, in one `screenshots/` folder at the top of each repo (what the end-of-session block in `docs/cloud-wrapup.md` asks for):

- `<id>-current.png` is the owner's pick. There's only ever one: older picks are renamed to their date, never deleted. "Drop the current screenshot" renames it the same way.
- `<id>-session.png` is the session's full-view capture (never a detail shot or an error page), replaced at each wrap-up.
- Keep images under about 2 MB.

The hover cycle shows up to `galleryMax` recent images from screenshot folders. Folders named in `gallerySkip` (`old`, `archive`) are left out.
