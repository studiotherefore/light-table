#!/usr/bin/env python3
"""Serve the board on http://localhost:<port> (config.json, default 8130) so its buttons can save.

  GET  /              the board (dashboard.html)
  POST /api/rescan    rebuild the board (new screenshots, dates)
  POST /api/recapture retake auto-captures (snap.py), then rebuild
  POST /api/open      {"id": ..., "what": "folder"|"handoff"}  open it in Finder / its app
  POST /api/order     {"ids": [...], "shelves": {id: "motion"|"resting"|"archive"}}
                      the owner's drag order and placement, saved as rank and shelf

Only ever writes inside the table folder (see config.py). Listens on localhost only.
"""
import json
import os
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from config import CORE as HERE, HOME, PORT, RECORD, ROOT, require_root, table_path

LOCK = threading.Lock()
SHELVES = {"motion", "resting", "archive"}


def run(script):
    return subprocess.run([sys.executable, os.path.join(HERE, script)], cwd=HERE,
                          capture_output=True, text=True, timeout=600)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, code, body, kind="application/json"):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.split("?")[0] in ("/", "/index.html", "/dashboard.html"):
            with open(table_path("dashboard.html"), "rb") as fh:
                return self.reply(200, fh.read(), "text/html; charset=utf-8")
        icons = {"/favicon.svg": ("favicon.svg", "image/svg+xml"), "/favicon.ico": ("favicon.ico", "image/x-icon"),
                 "/favicon-32.png": ("favicon-32.png", "image/png"), "/apple-touch-icon.png": ("apple-touch-icon.png", "image/png")}
        path = self.path.split("?")[0]
        if path.startswith("/thumbs/"):
            # Hover-cycle images. Plain file names only: no folders, no "..".
            name = path[len("/thumbs/"):]
            full = table_path("thumbs", name)
            if "/" in name or not name.startswith("g-") or not name.endswith(".jpg") or not os.path.isfile(full):
                return self.reply(404, {"error": "not found"})
            with open(full, "rb") as fh:
                data = fh.read()
            self.send_response(200)
            self.send_header("Content-Type", "image/jpeg")
            self.send_header("Cache-Control", "max-age=31536000")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            return self.wfile.write(data)
        if path in icons:
            name, kind = icons[path]
            with open(os.path.join(HERE, "icons", name), "rb") as fh:
                return self.reply(200, fh.read(), kind)
        if self.path == "/api/ping":
            return self.reply(200, {"ok": True, "home": HOME})
        self.reply(404, {"error": "not found"})

    def do_POST(self):
        # Same-origin only: refuse requests a page on another site could forge.
        origin = self.headers.get("Origin")
        if origin and origin not in (f"http://localhost:{PORT}", f"http://127.0.0.1:{PORT}"):
            return self.reply(403, {"error": "forbidden"})
        length = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(length) or b"{}")

        with LOCK:
            if self.path == "/api/rescan":
                r = run("build.py")
                return self.reply(200 if r.returncode == 0 else 500, {"ok": r.returncode == 0, "log": r.stdout + r.stderr})
            if self.path == "/api/recapture":
                snap = run("snap.py")
                r = run("build.py")
                return self.reply(200 if r.returncode == 0 else 500, {"ok": r.returncode == 0, "log": snap.stdout + r.stdout})
            if self.path == "/api/open":
                # Open a project's folder in Finder, or its handoff notes in their default app.
                # Paths come from the record only, never from the request.
                with open(RECORD) as fh:
                    data = json.load(fh)
                p = next((x for x in data["projects"] if x["id"] == body.get("id")), None)
                rel = p and (p.get("handoff") if body.get("what") == "handoff" else p.get("folder"))
                path = os.path.realpath(os.path.join(ROOT, rel)) if rel else None
                if not path or not path.startswith(ROOT + os.sep) or not os.path.exists(path):
                    return self.reply(404, {"error": "not found"})
                subprocess.run(["/usr/bin/open", path], timeout=10)
                return self.reply(200, {"ok": True})
            if self.path == "/api/order":
                # The owner's priority: rank = position in the list they dragged into place.
                ids = [i for i in body.get("ids", []) if isinstance(i, str)]
                with open(RECORD) as fh:
                    data = json.load(fh)
                pos = {pid: n for n, pid in enumerate(ids)}
                shelves = body.get("shelves") or {}
                for p in data["projects"]:
                    if p["id"] in pos:
                        p["rank"] = pos[p["id"]]
                    if shelves.get(p["id"]) in SHELVES:
                        p["shelf"] = shelves[p["id"]]
                tmp = RECORD + ".tmp"
                with open(tmp, "w") as fh:
                    json.dump(data, fh, indent=1, ensure_ascii=False)
                os.replace(tmp, RECORD)
                r = run("build.py")
                return self.reply(200, {"ok": r.returncode == 0})
        self.reply(404, {"error": "not found"})


if __name__ == "__main__":
    require_root()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
