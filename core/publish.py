#!/usr/bin/env python3
"""Publish your portfolio to GitHub Pages (the Publish button in the preview).

Writes the clean site (portfolio.py --publish) into pages/ in the table folder, a
clone of your GitHub Pages repository ("portfolio" in config.json; see config.py),
checks it holds nothing private, then commits and pushes. Never forces.

Only you press Publish: the nightly sweep and agents never run this. Making the
repository and switching Pages on is yours to do once, on GitHub.
"""
import datetime
import os
import re
import subprocess
import sys

from config import CORE, portfolio_settings, table_path

PAGES = table_path("pages")
# Never published: file paths, local addresses, emails, the preview's own data.
BLOCK = [(r"/Users/|/home/|file://", "a file path"), (r"localhost|127\.0\.0\.1", "a local address"),
         (r"[\w.+-]+@[\w-]+\.[a-z]{2,}", "an email address"), (r"\"key\":|\"hidden\":|\"checks\":", "preview data")]


def git(*args):
    return subprocess.run(["git", "-C", PAGES, *args], capture_output=True, text=True, timeout=120)


def main():
    site = portfolio_settings()
    if not site["remote"]:
        sys.exit('Publishing isn\'t set up yet: add your GitHub Pages repository to config.json, '
                 'as "portfolio": { "repo": "you/you.github.io" }.')
    where = site["url"] or site["repo"] or "GitHub"
    if not os.path.isdir(os.path.join(PAGES, ".git")):
        os.makedirs(PAGES, exist_ok=True)
        git("init", "-q", "-b", "main")
        git("remote", "add", "origin", site["remote"])
        # Start from what's already on GitHub (a README, a CNAME for your own domain), so the first
        # push isn't refused as unrelated and those files stay.
        if git("fetch", "-q", "origin", "main").returncode == 0:
            git("reset", "-q", "--hard", "origin/main")
    elif git("remote", "get-url", "origin").stdout.strip() != site["remote"]:
        git("remote", "set-url", "origin", site["remote"])  # config.json changed where it goes
    r = subprocess.run([sys.executable, os.path.join(CORE, "portfolio.py"), "--publish", PAGES],
                       capture_output=True, text=True, timeout=600)
    if r.returncode:
        sys.exit("The site didn't build: " + r.stderr.strip()[-300:])
    open(os.path.join(PAGES, ".nojekyll"), "w").close()

    with open(os.path.join(PAGES, "index.html")) as fh:
        page = fh.read()
    # Check the projects only, not the page's own code (which mentions localhost for the preview).
    start = page.index("const DATA =")
    data = page[start:page.index("\n// Editing works only", start)]
    found = sorted({why for pat, why in BLOCK if re.search(pat, data, re.I)})
    if found:
        sys.exit("Not published: the text has " + ", ".join(found) + ". Fix it in the preview and try again.")

    git("add", "-A")
    if not git("status", "--porcelain").stdout.strip():
        print(f"Nothing new to publish. {where}")
        return
    when = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    c = git("commit", "-q", "-m", f"Publish {when}")
    if c.returncode:
        sys.exit("Couldn't save the site: " + (c.stderr or c.stdout).strip()[-300:])
    p = git("push", "-q", "origin", "main")
    if p.returncode:
        sys.exit("Couldn't push to GitHub: " + p.stderr.strip()[-300:])
    print(f"Published. It shows at {where} within a minute or two.")


if __name__ == "__main__":
    main()
