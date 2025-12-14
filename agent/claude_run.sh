#!/usr/bin/env bash
set -euo pipefail

#
# Runs Claude Code inside a Docker container with:
# - RW access ONLY to a single git worktree
# - Persistent Claude CLI state
# - Git history available (via parent .git)
# - Push disabled at the worktree level
#
# Intended use: authoring + optional local commits
# NOT pushing to remote
#

IMAGE="claude-author:local"

# Resolve script + repo layout safely
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="$ROOT_DIR/.env"
WORKTREE_DIR="${1:-$ROOT_DIR/agent-sandbox}"
WORKTREE_DIR="$(cd "$WORKTREE_DIR" && pwd)"

# -------------------------------------------------------------------
# Preconditions
# -------------------------------------------------------------------

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Env file not found at $ENV_FILE" >&2
  exit 1
fi

if [[ ! -d "$WORKTREE_DIR" ]]; then
  echo "ERROR: Worktree directory not found: $WORKTREE_DIR" >&2
  exit 1
fi

if [[ ! -f "$WORKTREE_DIR/.git" ]]; then
  echo "ERROR: $WORKTREE_DIR/.git not found or not a worktree" >&2
  exit 1
fi

PUSHURL="$(git -C "$WORKTREE_DIR" config --worktree --get remote.origin.pushurl 2>/dev/null || true)"

if [[ "$PUSHURL" != "DISABLED" ]]; then
  echo "ERROR: Worktree push is not disabled for: $WORKTREE_DIR" >&2
  echo "Run once (repo-wide), then per-worktree:" >&2
  echo "  git -C \"$WORKTREE_DIR\" config extensions.worktreeConfig true" >&2
  echo "  git -C \"$WORKTREE_DIR\" config --worktree remote.origin.pushurl DISABLED" >&2
  exit 1
fi

# -------------------------------------------------------------------
# Discover parent repo .git directory
# -------------------------------------------------------------------

# Worktree .git is a *file* like:
#   gitdir: /abs/path/to/repo/.git/worktrees/<name>
GITDIR_LINE="$(cat "$WORKTREE_DIR/.git")"

if [[ "$GITDIR_LINE" != gitdir:* ]]; then
  echo "ERROR: Unexpected .git format in worktree:" >&2
  echo "  $GITDIR_LINE" >&2
  exit 1
fi

WORKTREE_GITDIR="${GITDIR_LINE#gitdir: }"
PARENT_GIT_DIR="${WORKTREE_GITDIR%/worktrees/*}"

if [[ ! -d "$PARENT_GIT_DIR" ]]; then
  echo "ERROR: Parent .git directory does not exist:" >&2
  echo "  $PARENT_GIT_DIR" >&2
  exit 1
fi

echo "OK: Using worktree: $WORKTREE_DIR"
echo "OK: remote.origin.pushurl is DISABLED (worktree-only)"
echo "OK: Parent git dir: $PARENT_GIT_DIR"
echo "Starting Claude in container…"

# -------------------------------------------------------------------
# Run container. That last git command just ensures git knows project
# directory is safe for Claude to use.
# -------------------------------------------------------------------
docker run --rm -it \
  --name claude-author \
  --env-file "$ENV_FILE" \
  -v "$WORKTREE_DIR":/project:rw \
  -v claude_state:/home/agent \
  -v "$PARENT_GIT_DIR":"$PARENT_GIT_DIR":rw \
  -w /project \
  "$IMAGE"
