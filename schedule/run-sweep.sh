#!/bin/sh
# Run the Light Table nightly sweep through an agent's headless CLI.
#   sh schedule/run-sweep.sh claude    (Claude Code, with the light-table plugin installed)
#   sh schedule/run-sweep.sh codex     (Codex, with the skills linked by codex/install.sh)
# The report goes to sweep.log in the table folder.
set -e
AGENT="${1:-claude}"
TABLE="${LIGHT_TABLE_HOME:-$HOME/.light-table}"
LOG="$TABLE/sweep.log"
cd "$TABLE"
echo "=== $(date '+%Y-%m-%d %H:%M') $AGENT" >> "$LOG"
case "$AGENT" in
  claude)
    # Edits are limited by the skill's rules; the tool list keeps it to reading,
    # editing files, and running the board's own scripts and read-only git.
    claude -p "Run the light-table-sweep skill." \
      --permission-mode acceptEdits \
      --allowedTools "Read" "Edit" "Write" "Glob" "Grep" "Bash(python3:*)" "Bash(sh:*)" "Bash(git -C:*)" "Bash(git log:*)" \
      >> "$LOG" 2>&1
    ;;
  codex)
    # workspace-write: Codex may write only in the table folder (the current folder).
    # Network on so backup.sh can push; drop the -c line if you don't use the backup.
    codex exec -s workspace-write --skip-git-repo-check \
      -c sandbox_workspace_write.network_access=true \
      'Use the $light-table-sweep skill.' >> "$LOG" 2>&1
    ;;
  *) echo "Usage: run-sweep.sh claude|codex" >&2; exit 2 ;;
esac
