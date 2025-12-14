#!/usr/bin/env bash
set -euo pipefail

# Make git usable inside container when /project is a bind mount
git config --global --add safe.directory /project >/dev/null 2>&1 || true

# If user provided a command (e.g., "bash"), run it.
if [[ $# -gt 0 ]]; then
  exec "$@"
fi

exec claude --append-system-prompt-file /opt/claude/claude_append.txt
