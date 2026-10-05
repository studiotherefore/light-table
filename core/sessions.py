"""Which agent session a project's title opens. Read-only.

Each provider answers one question: for this project folder, what link resumes
its most recent session (or starts one there)? config.json "sessions" picks the
provider: "claude", "codex", "none", or "auto" (whichever agent has sessions on
this machine, Claude first).

A provider returns a dict with "url", and optionally "title" and "last"
(milliseconds since the epoch), or None when it has nothing to offer; the board
then shows the plain name.
"""
import datetime
import glob
import json
import os
from urllib.parse import quote

CLAUDE_GLOB = os.path.expanduser("~/Library/Application Support/Claude/claude-code-sessions/*/*/local_*.json")


def _inside(cwd, folder):
    return cwd == folder or cwd.startswith(folder + os.sep)


class Claude:
    """Claude desktop app (Code tab) sessions, opened with claude:// links."""
    name = "claude"

    def __init__(self):
        self.sessions = []
        for f in glob.glob(CLAUDE_GLOB):
            try:
                with open(f) as fh:
                    s = json.load(fh)
            except (OSError, ValueError):
                continue
            if s.get("isArchived") or not s.get("cwd") or not s.get("sessionId"):
                continue
            self.sessions.append({"id": s["sessionId"], "cwd": s["cwd"], "title": s.get("title") or "",
                                  "last": s.get("lastActivityAt") or s.get("createdAt") or 0})

    @staticmethod
    def available():
        return bool(glob.glob(CLAUDE_GLOB))

    def link(self, folder):
        hits = [s for s in self.sessions if _inside(s["cwd"], folder)]
        if hits:
            s = max(hits, key=lambda s: s["last"])
            return {"url": "claude://code/continue?session=" + quote(s["id"]) + "&source=light-table",
                    "title": s["title"], "last": s["last"]}
        return {"url": "claude://code/new?folder=" + quote(folder, safe="") + "&source=light-table"}


CODEX_DIR = os.path.expanduser("~/.codex")


class Codex:
    """Codex desktop app sessions, opened with codex:// links.

    Each session is a rollout file whose first line ("session_meta") holds its id
    and working folder; titles are kept separately in session_index.jsonl. Last
    activity is the rollout file's modification time.
    """
    name = "codex"

    def __init__(self):
        titles = {}
        try:
            with open(os.path.join(CODEX_DIR, "session_index.jsonl")) as fh:
                for line in fh:
                    try:
                        row = json.loads(line)
                        titles[row["id"]] = row.get("thread_name") or ""
                    except (ValueError, KeyError):
                        continue
        except OSError:
            pass
        self.sessions = []
        for f in glob.glob(os.path.join(CODEX_DIR, "sessions", "*", "*", "*", "rollout-*.jsonl")):
            try:
                with open(f) as fh:
                    meta = json.loads(fh.readline()).get("payload") or {}
                last = os.path.getmtime(f) * 1000
            except (OSError, ValueError):
                continue
            if meta.get("id") and meta.get("cwd"):
                self.sessions.append({"id": meta["id"], "cwd": meta["cwd"],
                                      "title": titles.get(meta["id"], ""), "last": last})

    @staticmethod
    def available():
        return bool(glob.glob(os.path.join(CODEX_DIR, "sessions", "*", "*", "*", "rollout-*.jsonl")))

    def link(self, folder):
        hits = [s for s in self.sessions if _inside(s["cwd"], folder)]
        if hits:
            s = max(hits, key=lambda s: s["last"])
            return {"url": "codex://threads/" + quote(s["id"]), "title": s["title"], "last": s["last"]}
        return {"url": "codex://threads/new?path=" + quote(folder, safe="")}


class NoSessions:
    name = "none"

    @staticmethod
    def available():
        return True

    def link(self, folder):
        return None


PROVIDERS = {"claude": Claude, "codex": Codex, "none": NoSessions}


def provider(choice):
    if choice == "auto":
        for cls in PROVIDERS.values():
            if cls.available():
                return cls()
        return NoSessions()
    return PROVIDERS.get(choice, NoSessions)()


def describe(link):
    """The fields build.py puts on a project for the template."""
    if not link:
        return {}
    out = {"sessionUrl": link["url"]}
    if link.get("last"):
        out["sessionTitle"] = link.get("title") or ""
        out["sessionLast"] = datetime.datetime.fromtimestamp(link["last"] / 1000).isoformat(timespec="minutes")
    return out
