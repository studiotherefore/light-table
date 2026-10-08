#!/usr/bin/env python3
"""Where the owner put each project on the board: its shelf and rank.

Only the owner sets these, by dragging cards. places.json (in the table folder)
keeps a copy, and the server refreshes it on every drag. Agents that edit the record (the nightly sweep,
Update board) run `places.py restore` before building. It puts back any shelf or
rank they changed or dropped.

  python3 places.py save      record -> places.json (after the owner asks for a move in chat)
  python3 places.py restore   places.json -> record; prints what it put back
"""
import datetime
import json
import os
import sys

from config import RECORD, ROOT, require_root, table_path

PLACES = table_path("places.json")
SHELVES = ("motion", "resting", "archive")


def load(path):
    with open(path) as fh:
        return json.load(fh)


def write(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(data, fh, indent=1, ensure_ascii=False)
    os.replace(tmp, path)


def shelf(p):
    # Same rule as the board: the owner's choice, else from status.
    return p.get("shelf") or ("motion" if p.get("status") in ("active", "waiting") else "resting")


def ordered(projects):
    """Each shelf in board order: rank first, then the most recently touched.
    Folder dates are read only for entries the owner hasn't placed yet."""
    from build import newest_mtime

    def touched(p):
        m = newest_mtime(os.path.join(ROOT, p["folder"])) if os.path.exists(os.path.join(ROOT, p["folder"])) else 0
        files = datetime.date.fromtimestamp(m).isoformat() if m else ""
        return max(p.get("lastWorked") or "", files)

    out = {}
    for s in SHELVES:
        on = [p for p in projects if shelf(p) == s]
        ranked = sorted([p for p in on if isinstance(p.get("rank"), int)], key=lambda p: p["rank"])
        loose = sorted([p for p in on if not isinstance(p.get("rank"), int)], key=touched, reverse=True)
        out[s] = ranked + loose
    return out


def move(data, pid, to, next_to=None, after=False):
    """Put one project on a shelf, before or after another (or at the end), and
    renumber from the record as it is now. Returns the full order, or None."""
    if to not in SHELVES:
        return None
    moved = next((p for p in data["projects"] if p["id"] == pid), None)
    if not moved:
        return None
    lists = ordered([p for p in data["projects"] if p is not moved])
    dest = lists[to]
    at = next((i for i, p in enumerate(dest) if p["id"] == next_to), None)
    dest.insert(len(dest) if at is None else at + (1 if after else 0), moved)
    moved["shelf"] = to
    order = lists["motion"] + lists["resting"] + lists["archive"]
    for i, p in enumerate(order):
        p["rank"] = i
        p["shelf"] = shelf(p)
    return [p["id"] for p in order]


def save(data):
    write(PLACES, {p["id"]: {"shelf": p.get("shelf"), "rank": p.get("rank")} for p in data["projects"]})


def restore(data):
    """Put back the saved shelf and rank. Entries added since have none saved and are left alone."""
    saved = load(PLACES)
    fixed = []
    for p in data["projects"]:
        keep = saved.get(p["id"])
        if keep is None:
            continue
        for k in ("shelf", "rank"):
            if p.get(k) != keep[k]:
                fixed.append(f'{p["id"]} {k}: {p.get(k)} -> {keep[k]}')
                if keep[k] is None:
                    p.pop(k, None)
                else:
                    p[k] = keep[k]
    return fixed


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    require_root()
    data = load(RECORD)
    if cmd == "save" or (cmd == "restore" and not os.path.exists(PLACES)):
        save(data)
        print("Places saved.")
    elif cmd == "restore":
        fixed = restore(data)
        if fixed:
            write(RECORD, data)
            print("Put back the owner's places:\n  " + "\n  ".join(fixed))
        else:
            print("Places unchanged.")
    else:
        sys.exit(__doc__)
