#!/bin/sh
# The nightly sweep's first steps as one fixed command, so "Always allow" sticks:
# where the table is, capture screenshots, then the read-only finders (local
# changes, then GitHub).
#   sh core/nightly-find.sh [table folder]    (default: $LIGHT_TABLE_HOME or ~/.light-table)
[ -n "$1" ] && export LIGHT_TABLE_HOME="$1"
cd "$(dirname "$0")" || exit 1
echo "== table"; /usr/bin/python3 config.py
echo "== snap"; /usr/bin/python3 snap.py 2>&1 | grep -iE "captured|failed|no browser"
echo "== sweep"; /usr/bin/python3 sweep.py
echo "== cloud"
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  /usr/bin/python3 cloud.py
else
  echo "skipped: the GitHub CLI (gh) isn't installed or signed in"
fi
