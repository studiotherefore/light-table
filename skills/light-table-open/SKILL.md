---
name: light-table-open
description: Open the Light Table project board. Use when the user asks to open, show or see their board, their projects dashboard or Light Table.
---

# Open the board

The scripts are in `core/`, two folders up from this skill's folder (`<this skill's folder>/../../core`, symlinks resolved).

Run `python3 "<core>/open.py"`. It rebuilds the board, starts its local server in the background if it isn't running, and opens it in the default browser. If you have your own browser view the user is watching, run it with `--no-open` and open the printed address there instead.

If it says Light Table isn't set up, offer the `light-table-setup` skill. If it says the port is taken, tell the user and offer to pick a free `port` in the table folder's `config.json`.

Reply with one line: the board's address.
