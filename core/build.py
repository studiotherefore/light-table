#!/usr/bin/env python3
"""Build dashboard.html from projects.json.

projects.json is the single record of every project's status. This script
reads it, fills in facts it can see on disk (last time files changed, newest
screenshot, latest agent session), and writes a self-contained dashboard.html
into the table folder.

It only reads the project folders; it writes only inside the table folder
(see config.py).
"""
import json
import os
import datetime
import base64
import hashlib
import glob
import subprocess
from urllib.parse import quote

import sessions
from config import CFG, CORE, GALLERY_MAX, GALLERY_SKIP, RECORD, ROOT, SKIP_DIRS, require_root, table_path

IMG_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")


def newest_mtime(folder):
    """Newest modification time of any real file in the folder (skips deps/builds)."""
    best = 0.0
    if os.path.isfile(folder):
        return os.path.getmtime(folder)
    for dirpath, dirnames, filenames in os.walk(folder):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.endswith(".app")]
        for f in filenames:
            if f == ".DS_Store":
                continue
            try:
                best = max(best, os.path.getmtime(os.path.join(dirpath, f)))
            except OSError:
                pass
    return best


def newest_screenshot(folder):
    """Newest image inside any folder whose name contains 'screenshot'."""
    best, best_path = 0.0, None
    if not os.path.isdir(folder):
        return None
    for dirpath, dirnames, filenames in os.walk(folder):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.endswith(".app")]
        if "screenshot" not in os.path.basename(dirpath).lower():
            continue
        for f in filenames:
            if f.lower().endswith(IMG_EXT):
                p = os.path.join(dirpath, f)
                m = os.path.getmtime(p)
                if m > best:
                    best, best_path = m, p
    return best_path


def gallery_sources(folder, main_src):
    """Up to GALLERY_MAX newest images from the project's screenshot folders, for the hover cycle.

    Looks in any folder with "screenshot" in its name (and folders inside it), skipping
    anything under a folder named old/archive. The card's main image is left out.
    """
    hits = []
    if not os.path.isdir(folder):
        return hits
    for dirpath, dirnames, filenames in os.walk(folder):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and d.lower() not in GALLERY_SKIP
                       and not d.startswith(".") and not d.endswith(".app")]
        rel = os.path.relpath(dirpath, folder).lower()
        if "screenshot" not in rel:
            continue
        for f in filenames:
            path = os.path.join(dirpath, f)
            if f.lower().endswith(IMG_EXT) and path != main_src:
                hits.append((os.path.getmtime(path), path))
    return [p for _, p in sorted(hits, reverse=True)[:GALLERY_MAX]]


def gallery_thumb(src):
    """A 720px JPEG of src in thumbs/, served by server.py at /thumbs/<name>; returns (url, is_tall)."""
    name = "g-" + hashlib.md5(src.encode()).hexdigest()[:12] + ".jpg"
    out = table_path("thumbs", name)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    stamp = os.path.getmtime(src)  # same rule as thumb_data_uri: remake on any change
    if not os.path.exists(out) or os.path.getmtime(out) != stamp:
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "70", "-Z", "720", src, "--out", out],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.utime(out, (stamp, stamp))
    dims = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", out], capture_output=True, text=True).stdout
    w, h = [int(line.split()[-1]) for line in dims.splitlines() if "pixel" in line]
    return f"/thumbs/{name}?v={int(os.path.getmtime(out))}", h > w * 0.85, name


def find_current(folder):
    """Newest image with "current" in its file name anywhere in the project: the owner's pick."""
    best, best_path = 0.0, None
    if not os.path.isdir(folder):
        return None
    for dirpath, dirnames, filenames in os.walk(folder):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and (d == ".board" or not d.startswith("."))
                       and not d.endswith(".app")]
        for f in filenames:
            if "current" in f.lower() and f.lower().endswith(IMG_EXT):
                p = os.path.join(dirpath, f)
                if os.path.getmtime(p) > best:
                    best, best_path = os.path.getmtime(p), p
    return best_path


def choose_image(p, folder):
    """Pick the card image and say where it came from.

    1. a file named "...current..." in the project, or one fetched from its GitHub
       branch (the owner's pick). It always wins, even over a newer board update or
       auto capture.
    2. otherwise the newest of the board-update capture (shots/), the auto-capture (auto/),
       a cloud session's capture (auto/cloud/, fetched by cloud.py) and the session
       capture in the project itself (screenshots/*session*, or the older .board/shot.*)
    3. last resort: the newest image in a screenshots folder ("older image")
    """
    def newest(paths):
        paths = [x for x in paths if x and os.path.exists(x)]
        return max(paths, key=os.path.getmtime) if paths else None

    shot = newest([table_path("shots", p["id"] + e) for e in (".png", ".jpg", ".jpeg")])
    auto = table_path("auto", p["id"] + ".png")
    cloud_dir = table_path("auto", "cloud")
    cloud = newest([os.path.join(cloud_dir, p["id"] + e) for e in IMG_EXT])
    if p.get("local") is False:  # the local copy is old: only the board's own and GitHub's images
        folder = ""
    board = newest([os.path.join(folder, ".board", "shot" + e) for e in IMG_EXT]
                   + glob.glob(os.path.join(glob.escape(folder), "screenshots", "*session*"))) if folder else None
    current = newest([find_current(folder) if os.path.isdir(folder) else None]
                     + [os.path.join(cloud_dir, p["id"] + "-current" + e) for e in IMG_EXT])
    label = {shot: "board update", auto: "auto capture", cloud: "cloud capture",
             board: "session capture", current: "your pick"}
    pick = current or newest([shot, auto, cloud, board])
    if pick:
        return pick, label[pick]
    recorded = os.path.join(ROOT, p["screenshot"]) if p.get("screenshot") and folder else None
    old = newest([recorded, newest_screenshot(folder) if os.path.isdir(folder) else None])
    return (old, "older image") if old else (None, None)


def thumb_data_uri(src, pid):
    """Shrink a screenshot to a 720px JPEG with macOS sips and return it as a data URI.

    Embedding keeps the dashboard self-contained, so it renders anywhere
    (the app's browser pane, a published page) without reaching the folders.
    """
    out = table_path("thumbs", pid + ".jpg")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    # Remake whenever the source changes: a different file (a renamed or moved pick
    # keeps its old date), an older one, or the same file edited.
    st = os.stat(src)
    key = f"{src}|{st.st_mtime}|{st.st_size}"
    keyfile = out + ".src"
    old = open(keyfile).read() if os.path.exists(keyfile) else None
    if not os.path.exists(out) or old != key:
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "70",
                        "-Z", "720", src, "--out", out],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with open(keyfile, "w") as fh:
            fh.write(key)
    with open(out, "rb") as fh:
        return "data:image/jpeg;base64," + base64.b64encode(fh.read()).decode()


def first_commit(folder):
    """The date of the project's first commit, when the folder is its own git repo. Read-only."""
    if not folder or not os.path.isdir(os.path.join(folder, ".git")):
        return None
    try:
        r = subprocess.run(["git", "-C", folder, "log", "--max-parents=0", "--format=%cs"],
                           capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.TimeoutExpired):  # no git, or a repo too slow to ask: leave it out
        return None
    dates = r.stdout.split()
    return min(dates) if r.returncode == 0 and dates else None


def remote(p):
    """A project whose current copy is only on GitHub (`"local": false`): the title
    opens the live site, Notes opens the handoff on the newest branch, and the local
    copy's Local, App and Finder buttons are left off."""
    for k in ("localUrl", "server", "app"):
        p.pop(k, None)
    p["remote"] = True
    p["titleUrl"] = p.get("liveUrl") or ("https://github.com/" + p["github"] if p.get("github") else None)
    try:
        with open(table_path("auto", "cloud", p["id"] + ".json")) as fh:
            seen = json.load(fh)
    except (OSError, ValueError):
        seen = {"repo": p.get("github"), "branch": None}
    if seen.get("repo") and p.get("handoff", "").startswith(p["folder"] + "/"):
        rel = p["handoff"][len(p["folder"]) + 1:]
        p["notesUrl"] = f"https://github.com/{seen['repo']}/blob/{quote(seen['branch'] or 'HEAD')}/{quote(rel)}"
        p["notesBranch"] = seen.get("branch")


def shift_demo_dates(data):
    """Demo boards: move every date so the newest entry reads as today, and ignore
    file dates (a fresh clone makes every file look changed today)."""
    dates = [p.get("updated") for p in data["projects"] if p.get("updated")]
    if not dates:
        return
    shift = datetime.date.today() - datetime.date.fromisoformat(max(dates))
    move = lambda d: (datetime.date.fromisoformat(d) + shift).isoformat() if d else d
    data["updated"] = move(data.get("updated"))
    for p in data["projects"]:
        for key in ("lastWorked", "updated"):
            p[key] = move(p.get(key))
        p["filesChanged"] = p.get("lastWorked")
        if p.get("imageDate"):
            p["imageDate"] = p["lastWorked"] or p["imageDate"]


def main():
    require_root()
    with open(RECORD) as fh:
        data = json.load(fh)

    # The owner's own notes, typed on the board (server.py writes notes.json).
    try:
        with open(table_path("notes.json")) as fh:
            notes = json.load(fh)
    except (OSError, ValueError):
        notes = {}

    agent = sessions.provider(CFG["sessions"])
    used = set()
    for p in data["projects"]:
        if p["id"] in notes:
            p["note"], p["noteUpdated"] = notes[p["id"]]["text"], notes[p["id"]]["updated"]
        folder = os.path.join(ROOT, p["folder"])
        if p.get("local") is False:
            folder = ""  # the local copy is old; remote() fills in the links
        # Clicking a project's title opens its latest agent session, or starts a new
        # one in its folder when it has none (when the agent supports that).
        if os.path.isdir(folder):
            p.update(sessions.describe(agent.link(folder)))
        p["exists"] = os.path.exists(folder) or p.get("local") is False
        m = newest_mtime(folder) if folder and p["exists"] else 0
        p["filesChanged"] = datetime.date.fromtimestamp(m).isoformat() if m else None
        p["started"] = p.get("started") or first_commit(folder)

        src, p["imageSource"] = choose_image(p, folder)
        p["image"] = thumb_data_uri(src, p["id"]) if src else None
        gallery = [gallery_thumb(g) for g in gallery_sources(folder, src)] if src and folder else []
        p["gallery"] = [{"src": url, "tall": tall} for url, tall, _ in gallery]
        used.update(name for _, _, name in gallery)
        p["imageDate"] = datetime.date.fromtimestamp(os.path.getmtime(src)).isoformat() if src else None

        if p.get("local") is False:
            remote(p)
            continue
        p["folderUrl"] = "file://" + quote(folder)
        # A built app the App button launches (may be a link into a build cache).
        p["appReady"] = bool(p.get("app")) and os.path.isdir(os.path.join(ROOT, p["app"]))
        if p.get("handoff"):
            p["handoffUrl"] = "file://" + quote(os.path.join(ROOT, p["handoff"]))

    if CFG.get("demo"):
        shift_demo_dates(data)

    # Drop gallery thumbnails nothing points at any more.
    for f in glob.glob(table_path("thumbs", "g-*.jpg")):
        if os.path.basename(f) not in used:
            os.remove(f)

    data["built"] = datetime.datetime.now().isoformat(timespec="minutes")
    data["title"] = CFG.get("title") or "Light Table"

    with open(os.path.join(CORE, "template.html")) as fh:
        html = fh.read()
    payload = json.dumps(data, indent=1).replace("</", "<\\/")
    html = html.replace("/*__STUDIO_DATA__*/null", payload)
    # Where the code is, for the Claude Code panel (plugin updates move it).
    with open(table_path("core-path"), "w") as fh:
        fh.write(CORE)
    with open(table_path("dashboard.html"), "w") as fh:
        fh.write(html)
    print("wrote dashboard.html with", len(data["projects"]), "projects")


if __name__ == "__main__":
    main()
