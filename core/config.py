#!/usr/bin/env python3
"""Where StudioWall keeps things, read from one config file.

Two folders matter:

  the code   this core/ folder: scripts, template.html, icons/
  the table  your board's own folder: config.json, projects.json (the record),
             and what the scripts generate there (dashboard.html, shots/,
             auto/, thumbs/, and core-path, which tells the Claude Code panel
             where this code is). It is $LIGHT_TABLE_HOME, or ~/.light-table.

config.json (see config.example.json):
  root          the folder that holds your projects (required; may be relative
                to the table folder, and may start with ~)
  port          the board's localhost port (default 8130)
  title         the name at the top of the board (default "StudioWall")
  chrome        the browser used for auto-captures
  sessions      whose sessions project titles open: "auto", "claude", "codex" or "none"
  skipDirs      extra folder names never scanned (node_modules etc. are built in)
  ignoreFolders top-level folders under root that are never projects
  gallerySkip   folder names whose images stay out of the hover cycle
  galleryMax    how many images the hover cycle shows
  demo          true for the demo board: dates shift so the newest entry is today
  portfolio     your public portfolio (portfolio.py, publish.py), all optional:
                  name    the site's name: header, tab title, footer (default "Portfolio")
                  repo    your GitHub Pages repository, "you/you.github.io"; Publish
                          needs it (you make the repository and switch Pages on)
                  url     the site's address (default: worked out from repo)
                  remote  the git remote to push to (default https://github.com/<repo>.git)

Run it to see the resolved settings as JSON (skills and the panel use this):
  python3 core/config.py
"""
import json
import os
import sys

CORE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.abspath(os.path.expanduser(os.environ.get("LIGHT_TABLE_HOME") or "~/.light-table"))
# Child processes (the server, rebuilds) start in other folders: hand them the full path.
os.environ["LIGHT_TABLE_HOME"] = HOME
CONFIG_PATH = os.path.join(HOME, "config.json")
RECORD = os.path.join(HOME, "projects.json")

DEFAULTS = {
    "root": None,
    "port": 8130,
    "chrome": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "sessions": "auto",
    "skipDirs": [],
    "ignoreFolders": [],
    "gallerySkip": ["old", "archive", "_old"],
    "galleryMax": 5,
}

# Never worth scanning: dependencies, builds, caches, version control.
BUILTIN_SKIP = {"node_modules", ".git", ".wrangler", "worktrees", "dist", "build", "target",
                "__pycache__", ".venv", "venv", ".next", ".cache", "_Old", "OLD", "old"}


def load():
    cfg = dict(DEFAULTS)
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH) as fh:
            cfg.update(json.load(fh))
    return cfg


CFG = load()


def resolve_root(value):
    if not value:
        return None
    path = os.path.expanduser(value)
    return os.path.realpath(path if os.path.isabs(path) else os.path.join(HOME, path))


ROOT = resolve_root(CFG["root"])
PORT = int(CFG["port"])
CHROME = CFG["chrome"]
SKIP_DIRS = BUILTIN_SKIP | set(CFG["skipDirs"])
IGNORE_TOP = {"node_modules"} | set(CFG["ignoreFolders"])
GALLERY_SKIP = {s.lower() for s in CFG["gallerySkip"]}
GALLERY_MAX = int(CFG["galleryMax"])
BOARD_URL = f"http://localhost:{PORT}/"


def portfolio_settings():
    """The public portfolio's name, repository, address and git remote, from config.json."""
    pf = CFG.get("portfolio") if isinstance(CFG.get("portfolio"), dict) else {}
    name = " ".join(str(pf.get("name") or "").split()) or "Portfolio"
    repo = str(pf.get("repo") or "").strip().strip("/")
    if repo.startswith("https://github.com/"):
        repo = repo[len("https://github.com/"):]
    repo = repo[:-4] if repo.endswith(".git") else repo
    owner, _, site = repo.partition("/")
    url = str(pf.get("url") or "").strip()
    if not url and owner and site:
        # A user site (you/you.github.io) is served at the root; any other repository under its name.
        url = f"https://{site}" if site.lower() == f"{owner}.github.io".lower() else f"https://{owner}.github.io/{site}"
    remote = str(pf.get("remote") or "").strip() or (f"https://github.com/{repo}.git" if owner and site else "")
    return {"name": name, "repo": repo if owner and site else "", "url": url.rstrip("/"), "remote": remote}


def require_root():
    """Stop with a plain message when the table hasn't been set up yet."""
    if not ROOT or not os.path.isdir(ROOT):
        sys.exit(f"StudioWall isn't set up yet: {CONFIG_PATH} needs a \"root\" folder that exists "
                 f"(found {CFG['root']!r}). Ask your agent to run the light-table setup skill.")
    if not os.path.exists(RECORD):
        sys.exit(f"No record at {RECORD}. Ask your agent to run the light-table setup skill.")
    return ROOT


def table_path(*parts):
    """A path inside the table folder (the only place these scripts write)."""
    return os.path.join(HOME, *parts)


if __name__ == "__main__":
    print(json.dumps({"core": CORE, "home": HOME, "config": CONFIG_PATH, "record": RECORD,
                      "root": ROOT, "port": PORT, "boardUrl": BOARD_URL, "chrome": CHROME,
                      "sessions": CFG["sessions"], "configExists": os.path.exists(CONFIG_PATH),
                      "recordExists": os.path.exists(RECORD), "portfolio": portfolio_settings()}, indent=1))
