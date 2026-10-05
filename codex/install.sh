#!/bin/sh
# Link Light Table's skills into ~/.agents/skills, where Codex finds personal skills.
# Links (not copies), so pulling a new version of this repo updates them.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$HOME/.agents/skills"
for s in "$REPO"/skills/*/; do
  name="$(basename "$s")"
  dest="$HOME/.agents/skills/$name"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    echo "Skipped $name: $dest exists and isn't a link."
    continue
  fi
  ln -sfn "${s%/}" "$dest"
  echo "Linked $name"
done
