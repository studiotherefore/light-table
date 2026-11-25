#!/usr/bin/env python3
"""Build your public portfolio from the board's record.

Only projects you marked public on the board go in (the globe on a card, kept in
portfolio.json in the table folder; server.py writes it). Each one shows its name,
one-liner, About text (your public version if you wrote one), cover (with the
board's framing), its other screenshots minus any you left out, and the live link.
Nothing about development goes in: no status, next steps, calls, notes, folders,
servers, sessions or dates.

  python3 portfolio.py                 the local preview, written to site/ in the table
                                       folder and served by the board at /portfolio/ (editable there)
  python3 portfolio.py --publish DIR   the clean public site, written to DIR

The site's name comes from "portfolio" in config.json (see config.py).
It only reads the project folders; it never writes outside the table folder (or DIR).
"""
import hashlib
import html as htmllib
import json
import os
import re
import shutil
import subprocess
import sys

import build
from config import CORE, RECORD, ROOT, portfolio_settings, require_root, table_path

PREVIEW = table_path("site")
SHELVES = {"motion": 0, "resting": 1, "archive": 2}
IMG_PX = 1600

# Words that usually mean a text is about development, or private. Shown as a check in the preview.
CHECKS = [(r"/Users/|~/", "a file path"), (r"localhost|127\.0\.0\.1|:\d{4}\b", "a local address"),
          (r"[\w.+-]+@[\w-]+\.[\w.]+", "an email address"),
          (r"\b(handoff|CLAUDE\.md|session|branch|commit|repo|TODO|\.json|\.py|\.tsx?)\b", "development words")]


def load(path):
    try:
        with open(path) as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def shelf(p):
    return p.get("shelf") or ("motion" if p.get("status") in ("active", "waiting") else "resting")


def image(src, out_dir):
    """A 1600px JPEG of src in out_dir/img/, named by its path, date and size (a changed file gets a
    new name, so no cache serves the old one); returns the relative URL and whether it's tall
    (a phone screenshot: shown whole rather than cropped)."""
    st = os.stat(src)
    name = hashlib.md5(f"{src}|{st.st_mtime}|{st.st_size}".encode()).hexdigest()[:14] + ".jpg"
    out = os.path.join(out_dir, "img", name)
    if not os.path.exists(out):
        os.makedirs(os.path.dirname(out), exist_ok=True)
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "80", "-Z", str(IMG_PX), src, "--out", out],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    dims = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", out], capture_output=True, text=True).stdout
    w, h = [int(line.split()[-1]) for line in dims.splitlines() if "pixel" in line]
    return "img/" + name, h > w * 0.85


def checks(text):
    return [why for pat, why in CHECKS if re.search(pat, text or "", re.I)]


def main():
    require_root()
    publish = "--publish" in sys.argv
    out_dir = os.path.abspath(sys.argv[sys.argv.index("--publish") + 1]) if publish else PREVIEW
    with open(RECORD) as fh:
        record = json.load(fh)
    chosen = load(table_path("portfolio.json"))
    framing = load(table_path("framing.json"))
    site = portfolio_settings()

    picked = [p for p in record["projects"] if isinstance(chosen.get(p["id"]), dict) and chosen[p["id"]].get("public")]
    # Your order from the preview (dragging cards); projects added since go after, in board order.
    picked.sort(key=lambda p: (chosen[p["id"]]["order"],) if isinstance(chosen[p["id"]].get("order"), int)
                else (1e9, SHELVES.get(shelf(p), 1), p["rank"] if isinstance(p.get("rank"), (int, float)) else 1e9))

    os.makedirs(out_dir, exist_ok=True)
    used, cards = set(), []
    for p in picked:
        mine = chosen[p["id"]]
        folder = "" if p.get("local") is False else os.path.join(ROOT, p["folder"])
        src, _ = build.choose_image(p, folder)
        about = mine.get("about") or p.get("about") or p.get("summary") or ""
        live = p["liveUrl"] if re.match(r"https?://", p.get("liveUrl") or "") else None
        link = mine.get("link", True)  # you can keep a live site off the portfolio until it's ready
        kind = mine.get("kind") or p.get("kind") or ""
        card = {"id": p["id"], "name": p["name"], "kind": kind, "about": about,
                "live": live if link or not publish else None, "images": []}
        if src:
            key = os.path.relpath(src, ROOT)
            f = framing.get(p["id"])
            if f and f.get("key") == key:
                card["frame"] = {"x": f["x"], "y": f["y"], "zoom": f["zoom"], "fit": bool(f.get("fit"))}
            hidden = set(mine.get("hide", []))
            for g in [src] + (build.gallery_sources(folder, src) if folder else []):
                gkey = os.path.relpath(g, ROOT)
                if publish and gkey in hidden:
                    continue
                url, tall = image(g, out_dir)
                used.add(os.path.basename(url))
                shot = {"src": url, "tall": tall} if tall and g != src else {"src": url}
                if not publish:
                    shot.update(key=gkey, hidden=gkey in hidden, cover=g == src)
                card["images"].append(shot)
        if not publish:
            card["own"] = bool(mine.get("about"))
            card["ownKind"] = bool(mine.get("kind"))
            card["link"] = link
            card["checks"] = checks(kind + "\n" + about)
        cards.append(card)

    # Drop images nothing points at any more, and bring the tab icons along.
    img_dir = os.path.join(out_dir, "img")
    for f in os.listdir(img_dir) if os.path.isdir(img_dir) else []:
        if f not in used:
            os.remove(os.path.join(img_dir, f))
    for icon in ("favicon.ico", "favicon-32.png", "favicon.svg", "apple-touch-icon.png"):
        shutil.copy2(os.path.join(CORE, "icons", icon), os.path.join(out_dir, icon))

    with open(os.path.join(CORE, "portfolio.html")) as fh:
        page = fh.read()
    data = {"projects": cards, "preview": not publish, "site": {"name": site["name"]}}
    if not publish:  # where Publish sends it, for the preview's header; the public site doesn't need it
        data["site"].update(url=site["url"], ready=bool(site["remote"]))
    payload = json.dumps(data, indent=1, ensure_ascii=False).replace("</", "<\\/")
    page = page.replace("__SITE_NAME__", htmllib.escape(site["name"]))
    with open(os.path.join(out_dir, "index.html"), "w") as fh:
        fh.write(page.replace("/*__PORTFOLIO_DATA__*/null", payload))
    print(f"wrote {'the public site' if publish else 'the portfolio preview'} with {len(cards)} projects")


if __name__ == "__main__":
    main()
