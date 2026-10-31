"""Export the demo board as a static, read-only website (for GitHub Pages).

    python3 demo/export-site.py [out-folder]     (default: _site)

Builds the demo board, then copies it into the out folder with relative image
paths, the Folder / Handoff links pointing at the demo's files on GitHub, and a
banner saying it's a demo. The Local buttons are left off: they would point at
the visitor's own computer. Served over https, the page is read-only by itself:
drag, notes and the other buttons that need the local server are off.
"""
import json
import os
import pathlib
import shutil
import subprocess
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
TABLE = REPO / "demo" / "table"
GITHUB = "https://github.com/studiotherefore/light-table"
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()

BANNER = (
    '<div style="position:sticky;top:0;z-index:50;background:#2b2a33;color:#d8d6e0;'
    'font:13px/1.5 -apple-system,system-ui,sans-serif;text-align:center;padding:8px 16px">'
    "A demo board with invented projects, read-only here. "
    f'<a href="{GITHUB}#readme" style="color:#c7bdff">Get Light Table for your own work →</a></div>'
)

subprocess.run([sys.executable, str(REPO / "core" / "build.py")],
               env={**os.environ, "LIGHT_TABLE_HOME": str(TABLE)}, check=True)

page = (TABLE / "dashboard.html").read_text()

# The board's data sits in the page as JSON after `const STUDIO = `.
MARK = "const STUDIO = "
start = page.index(MARK) + len(MARK)
data, end = json.JSONDecoder().raw_decode(page, start)
for p in data["projects"]:
    # "Local :5173" would open localhost on the visitor's machine.
    for key in ("localUrl", "server", "app", "appReady"):
        p.pop(key, None)
    # The demo's project folders are in this repo, so link them on GitHub instead
    # of this machine: folders under /tree/, files (the handoff) under /blob/.
    for key, kind in (("folderUrl", "tree"), ("handoffUrl", "blob")):
        if p.get(key):
            p[key] = p[key].replace(REPO.as_uri() + "/", f"{GITHUB}/{kind}/main/", 1)
payload = json.dumps(data, indent=1).replace("</", "<\\/")
page = page[:start] + payload + page[end:]
# Images and icons are served from the server's root locally; on the site they sit next to the page.
page = page.replace('"/thumbs/', '"thumbs/')
for icon in ("favicon.ico", "favicon-32.png", "favicon.svg", "apple-touch-icon.png"):
    page = page.replace(f'href="/{icon}', f'href="{icon}')
page = page.replace("<body>", "<body>\n" + BANNER, 1)
# Nothing on the public page may point at a computer: not this one, not the visitor's.
for local in ("file://", "localhost", "127.0.0.1", str(REPO), str(pathlib.Path.home())):
    if local in page:
        sys.exit(f"export-site: '{local}' is left in the page; not exporting it.")

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)
(OUT / "index.html").write_text(page)
shutil.copytree(TABLE / "thumbs", OUT / "thumbs", ignore=shutil.ignore_patterns("*.src"))
for icon in (REPO / "core" / "icons").iterdir():
    shutil.copy(icon, OUT / icon.name)
print(f"export-site: wrote {OUT}")
