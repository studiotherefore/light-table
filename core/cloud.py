#!/usr/bin/env python3
"""Find work pushed to GitHub that isn't on this Mac yet (cloud sessions, other
accounts, other machines). Read-only: it asks GitHub through `gh` and only reads the local
repos (remote URL, whether a commit is present). It never fetches or pulls.

For each project whose GitHub repo has a branch head committed since the entry's
`updated` date that the local repo doesn't have (and the sweep hasn't read), it saves into the table folder's auto/cloud/:
  <id>--<branch>.md     the project's handoff file as it is on that branch
  <id>.<png|jpg>        the session's screenshot (screenshots/*session*, or the older .board/shot.*)
  <id>-current.<ext>    the owner's pick (any *current* image in the repo), which always wins the cover
  <id>.json             the newest branch, for the card's Notes link
and prints JSON: {id: [{branch, pushed, head, merged, handoff, shot, current, wrapup}]}.
`wrapup` says whether that branch's CLAUDE.md has the end-of-session block
(docs/cloud-wrapup.md).
The nightly sweep reads this, updates just those entries, and records each
head in the entry's `cloudSeen` ({branch: head}) so it isn't reported again.

An entry's optional `github` ("owner/repo") overrides the local folder's origin,
for a project whose current repo lives on another GitHub account.

Needs the GitHub CLI (`gh`), signed in with read access to the repos.

  python3 cloud.py            all projects (skips archived ones, and "sweep": false unless `github` is set)
  python3 cloud.py --only id  one project
"""
import json
import os
import re
import subprocess
import sys
from urllib.parse import quote

from config import RECORD, ROOT, SKIP_DIRS, require_root, table_path

OUT = table_path("auto", "cloud")
IMG = (".png", ".jpg", ".jpeg")


def gh(path):
    r = subprocess.run(["gh", "api", path], capture_output=True, text=True, timeout=60)
    return json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else None


def github_repo(folder):
    r = subprocess.run(["git", "-C", folder, "remote", "get-url", "origin"], capture_output=True, text=True)
    m = re.search(r"github\.com[:/]([^/]+)/(.+?)(?:\.git)?$", r.stdout.strip())
    return (m.group(1), m.group(2)) if m else None


def have_commit(folder, sha):
    return subprocess.run(["git", "-C", folder, "cat-file", "-e", sha + "^{commit}"],
                          capture_output=True).returncode == 0


def board_images(owner, repo, ref):
    """The images the board can use at a commit: the session's capture
    (screenshots/*session*, or the older .board/shot.*) and the owner's pick, a file
    named "current" (in screenshots/ first, else .board/, else anywhere, as on this Mac).
    Returns (shot, current) paths, or None when GitHub didn't answer."""
    tree = gh(f"repos/{owner}/{repo}/git/trees/{ref}?recursive=1")
    if not tree or "tree" not in tree:
        return None
    shot = current = None
    for item in tree["tree"]:
        path = item["path"]
        parts = path.lower().split("/")
        if item["type"] != "blob" or os.path.splitext(parts[-1])[1] not in IMG:
            continue
        if any(d in SKIP_DIRS or d in ("old", "archive") or (d.startswith(".") and d != ".board")
               for d in parts[:-1]):
            continue
        rank = 2 if parts[:-1] == ["screenshots"] else 1 if parts[:-1] == [".board"] else 0
        if "current" in parts[-1]:
            if not current or rank > current[0]:
                current = (rank, path)
        elif rank and ("session" in parts[-1] or parts[-1].startswith("shot.")):
            if not shot or rank > shot[0]:
                shot = (rank, path)
    return (shot and shot[1]), (current and current[1])


def file_at(owner, repo, path, ref):
    """A file's bytes at a commit (raw, so images over 1 MB come through too), or None."""
    r = subprocess.run(["gh", "api", "-H", "Accept: application/vnd.github.raw",
                        f"repos/{owner}/{repo}/contents/{quote(path)}?ref={ref}"],
                       capture_output=True, timeout=120)
    return r.stdout if r.returncode == 0 else None


def save(name, data):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, "wb") as fh:
        fh.write(data)
    return path


def save_image(pid, kind, data, ext):
    """auto/cloud/<id>.<ext> (session capture) or <id>-current.<ext> (the owner's pick)."""
    stem = pid + ("-current" if kind == "current" else "")
    for e in IMG:
        if e != ext and os.path.exists(os.path.join(OUT, stem + e)):
            os.remove(os.path.join(OUT, stem + e))
    return save(stem + ext, data)


def check(p):
    folder = os.path.join(ROOT, p["folder"])
    if not p.get("github") and not os.path.isdir(os.path.join(folder, ".git")):
        return []
    gr = tuple(p["github"].split("/", 1)) if p.get("github") else github_repo(folder)
    if not gr:
        return []
    owner, repo = gr
    # Branch heads straight from GitHub (its activity feed can lag by minutes), keeping
    # the ones this Mac doesn't have and the sweep hasn't read, committed since `updated`.
    since = p.get("updated") or ""
    seen = p.get("cloudSeen") or {}  # branch -> head the sweep already read
    latest = {}  # branch -> (commit date, head)
    for br in gh(f"repos/{owner}/{repo}/branches?per_page=100") or []:
        branch, head = br["name"], br["commit"]["sha"]
        if seen.get(branch) == head[:9] or have_commit(folder, head):
            continue
        c = gh(f"repos/{owner}/{repo}/commits/{head}") or {}
        date = c.get("commit", {}).get("committer", {}).get("date", "")
        if date[:10] >= since:
            latest[branch] = (date, head)
    newest = max(latest, key=lambda b: latest[b][0]) if latest else None
    if newest:  # for the card's Notes link
        save(p["id"] + ".json", json.dumps({"repo": f"{owner}/{repo}", "branch": newest,
                                            "pushed": latest[newest][0]}).encode())
    meta = gh(f"repos/{owner}/{repo}") or {}
    default = meta.get("default_branch", "main")
    found = []
    for branch, (pushed, head) in latest.items():
        cmp = gh(f"repos/{owner}/{repo}/compare/{default}...{head}") or {}
        merged = branch == default or cmp.get("status") in ("behind", "identical")
        safe = re.sub(r"[^A-Za-z0-9._-]+", "-", branch)
        handoff = None
        if p.get("handoff") and p["handoff"].startswith(p["folder"] + "/"):
            text = file_at(owner, repo, p["handoff"][len(p["folder"]) + 1:], head)
            if text is not None:
                handoff = save(f"{p['id']}--{safe}.md", text)
        # Images from the newest branch. A current pick that's gone there is dropped here too.
        shot = current = None
        found_imgs = board_images(owner, repo, head) if branch == newest else None
        if found_imgs:
            for kind, path in zip(("shot", "current"), found_imgs):
                img = file_at(owner, repo, path, head) if path else None
                if img:
                    saved = save_image(p["id"], kind, img, os.path.splitext(path.lower())[1])
                    shot, current = (saved, current) if kind == "shot" else (shot, saved)
        if found_imgs is not None and not found_imgs[1]:
            for e in IMG:
                old = os.path.join(OUT, p["id"] + "-current" + e)
                if os.path.exists(old):
                    os.remove(old)
                    current = "removed"
        claude_md = file_at(owner, repo, "CLAUDE.md", head) or b""
        wrapup = b"End of a session" in claude_md and b"-session.png" in claude_md  # docs/cloud-wrapup.md
        found.append({"branch": branch, "pushed": pushed, "head": head[:9], "merged": merged,
                      "handoff": handoff, "shot": shot, "current": current, "wrapup": wrapup})
    return found


def main():
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    require_root()
    with open(RECORD) as fh:
        projects = json.load(fh)["projects"]
    out = {}
    for p in projects:
        if only and p["id"] != only:
            continue
        # "sweep": false stops the local sweep; an entry with its own `github` repo is still checked here
        if not only and ((p.get("sweep") is False and not p.get("github")) or p.get("shelf") == "archive"):
            continue
        try:
            hits = check(p)
        except Exception as err:  # one repo failing shouldn't stop the rest
            hits = [{"error": str(err)}]
        if hits:
            out[p["id"]] = hits
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
