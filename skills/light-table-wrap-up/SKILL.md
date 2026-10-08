---
name: light-table-wrap-up
description: Wrap up this session for Light Table. Use when the user says "wrap up", "update the board", "record where we are" or presses Update board / Add to board. Rewrites this project's entry (now, next step, decisions, status), takes a screenshot of the app, and rebuilds the board.
---

# Wrap up for Light Table

Record where this project stands after the session, so the board (and the next session) can pick it up.

## Find things

The scripts are in `core/`, two folders up from this skill's folder (`<this skill's folder>/../../core`, symlinks resolved). Call it `CORE`. Run `python3 "$CORE/config.py"` for the record path (`record`), the table folder (`home`) and the projects root (`root`). Field definitions and rules: `CORE/RECORD.md`.

If the config or record doesn't exist, say Light Table isn't set up and offer the `light-table-setup` skill. Stop there.

**Which entry:** the one whose `folder` (relative to `root`) contains the current working folder; if several do, the longest `folder` wins. If none does, this project is new: add an entry (pick `id`, `name`, `folder` relative to `root`, `kind`, `summary`), without `shelf` or `rank`.

## Update the entry

From what happened in this session (and the project's own docs if needed):

- `now`: one or two sentences on where things stand after this session.
- `nextStep`: the single concrete next step.
- `calls`: decisions only the owner can make, people to contact, deadlines. Short and actionable. Drop ones that are resolved.
- `status`: `active` | `waiting` | `paused` | `dormant` (see RECORD.md).
- `lastWorked` and `updated`: today. `updatedBy`: `"wrap up"`. Also set the record's top-level `updated` to today.
- Keep every other field as it is. Check the file is valid JSON afterwards (`python3 -m json.tool "<record>" >/dev/null`).

## Screenshot

The full app view as it is now, not a detail.

- If the project has a server and you have a browser tool that can show and screenshot pages (for example a built-in browser pane): make sure the app is running and open in it (start it the way this project's launch config or docs say, if it isn't), show the main view, take a full screenshot, and copy the saved image to `<home>/shots/<id>.png` (or `.jpg`, matching its type), replacing any older one.
- Otherwise run `python3 "$CORE/snap.py" --only <id>` (headless Chrome; captures the project's own running local server, else its live site).
- If neither works, skip the screenshot and say so.

## Finish

Run `python3 "$CORE/places.py" restore` (it puts back any card placement that changed by accident), then `python3 "$CORE/build.py"`. Then reply with a two-line summary of what you recorded.

## Hard rules

- Edit nothing outside the table folder. Don't touch the project's files for this.
- **Never change an entry's `shelf` or `rank`**: that's where the owner placed it on the board.
- Don't invent. Mark inferences ` (unconfirmed)`.
