#!/usr/bin/env python3
"""Find what the Studio Board's record is missing. Read-only.

Prints JSON:
  changed    projects whose files changed after their status was last written,
             with the docs and git commits that changed since then
  candidates folders with recent work that no project entry covers
The nightly sweep reads this, then updates projects.json for just those.
"""
import datetime
import json
import os
import subprocess

from build import newest_mtime
from config import HOME, IGNORE_TOP, RECORD, ROOT, SKIP_DIRS, require_root
DOC_EXT = (".md", ".txt")


def day(ts):
    return datetime.date.fromtimestamp(ts).isoformat()


def changed_docs(folder, since_ts, limit=12):
    hits = []
    for dirpath, dirnames, filenames in os.walk(folder):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".") and not d.endswith(".app")]
        for f in filenames:
            if f.lower().endswith(DOC_EXT):
                p = os.path.join(dirpath, f)
                m = os.path.getmtime(p)
                if m > since_ts:
                    hits.append((m, os.path.relpath(p, ROOT)))
    return [p for _, p in sorted(hits, reverse=True)[:limit]]


def git_log(folder, since):
    if not os.path.isdir(os.path.join(folder, ".git")):
        return []
    try:
        out = subprocess.run(["git", "-C", folder, "log", "--all", f"--since={since}", "--format=%ad %s",
                              "--date=short", "-n", "25"], capture_output=True, text=True, timeout=20).stdout
        return [line for line in out.splitlines() if line.strip()]
    except Exception:
        return []


def main():
    require_root()
    with open(RECORD) as fh:
        data = json.load(fh)

    changed = []
    for p in data["projects"]:
        folder = os.path.join(ROOT, p["folder"])
        if not os.path.exists(folder):
            changed.append({"id": p["id"], "folder": p["folder"], "missing": True})
            continue
        m = newest_mtime(folder)
        updated = p.get("updated") or "1970-01-01"
        if m and day(m) > updated:
            since_ts = datetime.datetime.fromisoformat(updated).timestamp() + 86400
            changed.append({
                "id": p["id"], "name": p["name"], "folder": p["folder"], "updated": updated,
                "filesChanged": day(m), "handoff": p.get("handoff"),
                "docs": changed_docs(folder, since_ts) if os.path.isdir(folder) else [],
                "commits": git_log(folder, updated) if os.path.isdir(folder) else [],
            })

    # The table folder itself is never a candidate, wherever it lives.
    covered = [os.path.join(ROOT, p["folder"]) for p in data["projects"]] + [os.path.realpath(HOME)]
    cutoff = (datetime.datetime.now() - datetime.timedelta(days=30)).timestamp()
    candidates = []
    for top in sorted(os.listdir(ROOT)):
        tp = os.path.join(ROOT, top)
        if top in IGNORE_TOP or top.startswith(".") or not os.path.isdir(tp):
            continue
        # a top folder that is itself a project, or a group of projects one level down
        kids = [os.path.join(tp, k) for k in sorted(os.listdir(tp))
                if os.path.isdir(os.path.join(tp, k)) and not k.startswith(".") and k not in IGNORE_TOP and k not in SKIP_DIRS]
        for f in [tp] + kids:
            if any(f == c or f.startswith(c + os.sep) for c in covered):
                continue
            if f == tp and kids:  # group folder: judge its children instead
                continue
            m = newest_mtime(f)
            if m > cutoff:
                candidates.append({"folder": os.path.relpath(f, ROOT), "filesChanged": day(m)})

    print(json.dumps({"today": datetime.date.today().isoformat(), "changed": changed, "candidates": candidates}, indent=1))


if __name__ == "__main__":
    main()
