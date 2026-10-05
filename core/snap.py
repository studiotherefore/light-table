#!/usr/bin/env python3
"""Capture the current full view of each project for the Studio Board.

For every project: if its local server is running, capture that (the newest
work); otherwise capture its live site. Headless Chrome, 1440x900, saved to
auto/<id>.png in the table folder. A page that never settles (Street View streams
forever) is cut off after a time limit rather than hanging.

  python3 snap.py              every project with a running server or a live site
  python3 snap.py --only drift one project (the Wrap up button uses this)

Only writes inside the table folder's auto/.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

import time

from config import CHROME, RECORD, ROOT, require_root, table_path

OUT = table_path("auto")
SETTLE_MS = 10000      # give the page this long to draw before the shot
HARD_LIMIT_S = 30      # then give up on it
MIN_BYTES = 15000      # smaller than this is a blank page; keep the old capture


def server_is_this_projects(port, folder):
    """True when the process listening on the port runs from inside this project's folder.

    Several projects share ports (8000, 5173), so a listening port alone doesn't
    say whose app is on it.
    """
    r = subprocess.run(["/usr/sbin/lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN", "-t"],
                       capture_output=True, text=True)
    for pid in r.stdout.split():
        c = subprocess.run(["/usr/sbin/lsof", "-a", "-p", pid, "-d", "cwd", "-Fn"], capture_output=True, text=True)
        cwd = next((line[1:] for line in c.stdout.splitlines() if line.startswith("n")), "")
        if cwd == folder or cwd.startswith(folder + os.sep):
            return True
    return False


def target(p):
    port = (p.get("server") or {}).get("port")
    if p.get("localUrl") and port and server_is_this_projects(port, os.path.join(ROOT, p["folder"])):
        return p["localUrl"], "local"
    if p.get("liveUrl"):
        return p["liveUrl"], "live"
    return None, None


def capture(url, dest):
    profile = tempfile.mkdtemp(prefix="light-table-snap-")
    tmp = dest + ".tmp.png"
    cmd = [CHROME, "--headless=new", "--hide-scrollbars", "--mute-audio", "--no-first-run",
           "--no-default-browser-check", f"--user-data-dir={profile}", "--window-size=1440,900",
           f"--timeout={SETTLE_MS}", f"--screenshot={tmp}", url]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    # Chrome writes the shot after SETTLE_MS but often lingers on pages that keep
    # streaming; stop it once the file has been written and stopped growing.
    deadline, last = time.time() + HARD_LIMIT_S, -1
    try:
        while time.time() < deadline and proc.poll() is None:
            time.sleep(0.5)
            size = os.path.getsize(tmp) if os.path.exists(tmp) else -1
            if size > 0 and size == last:
                break
            last = size
    finally:
        if proc.poll() is None:
            os.killpg(proc.pid, 9)
            proc.wait()
        shutil.rmtree(profile, ignore_errors=True)
    if os.path.exists(tmp) and os.path.getsize(tmp) >= MIN_BYTES:
        os.replace(tmp, dest)
        return True
    if os.path.exists(tmp):
        os.remove(tmp)
    return False


def main():
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    require_root()
    if not os.path.exists(CHROME):
        sys.exit(f"No browser for captures at {CHROME}; set \"chrome\" in config.json.")
    with open(RECORD) as fh:
        projects = json.load(fh)["projects"]
    os.makedirs(OUT, exist_ok=True)
    meta_path = os.path.join(OUT, "captures.json")
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}

    for p in projects:
        if only and p["id"] != only:
            continue
        if p.get("autoCapture") is False and not only:
            continue  # headless Chrome can't show this one's real state (login, WebGL, audio gate)
        url, kind = target(p)
        if not url:
            if only:
                print(f"{p['id']}: no running server and no live site to capture")
            continue
        ok = capture(url, os.path.join(OUT, p["id"] + ".png"))
        if ok:
            meta[p["id"]] = {"url": url, "kind": kind}
        print(f"{p['id']}: {'captured' if ok else 'FAILED (kept previous)'} {kind} {url}")

    with open(meta_path, "w") as fh:
        json.dump(meta, fh, indent=1)


if __name__ == "__main__":
    main()
