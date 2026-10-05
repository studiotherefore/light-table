#!/bin/sh
# Optional: commit and push the table folder (your record and Wrap up screenshots)
# to your own private Git repo. Does nothing unless the table folder is a Git repo
# with a remote called origin. Commits only when something changed.
set -e
HOME_DIR="${LIGHT_TABLE_HOME:-$HOME/.light-table}"
cd "$HOME_DIR"
if [ ! -d .git ] || ! git remote get-url origin >/dev/null 2>&1; then
  echo "Backup: off (the table folder isn't a Git repo with a remote)."
  exit 0
fi
[ -f .gitignore ] || printf 'dashboard.html\nthumbs/\nauto/\nserver.log\n*.tmp\n*.tmp.png\n.DS_Store\n' > .gitignore
git add -A
if git diff --cached --quiet; then
  echo "Backup: nothing changed."
  exit 0
fi
git commit -q -m "Light Table backup $(date +%Y-%m-%d)"
git push -q origin HEAD
echo "Backup: pushed $(git rev-parse --short HEAD)."
