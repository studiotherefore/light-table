#!/bin/sh
# After the sweep edits the record: check it, put back the owner's places, build.
#   sh core/nightly-finish.sh [table folder]    (default: $LIGHT_TABLE_HOME or ~/.light-table)
[ -n "$1" ] && export LIGHT_TABLE_HOME="$1"
cd "$(dirname "$0")" || exit 1
RECORD="$(/usr/bin/python3 -c 'import config; print(config.RECORD)')" || exit 1
/usr/bin/python3 -m json.tool "$RECORD" >/dev/null || { echo "projects.json is not valid JSON; not building"; exit 1; }
/usr/bin/python3 places.py restore
/usr/bin/python3 build.py
