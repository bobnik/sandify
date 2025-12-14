
# Claude Code Agent running within Docker

This folder contains a safe setup for using Claude Code as a project-based coding agent inside Docker, operating on a Git worktree, with human-controlled Git operations and explicit verification.

## Setup

Claude operates on a Git worktree, not your main working copy.

```
PDIR=<project folder>
cd $PDIR
git worktree add agent-sandbox <base-branch>
```

Disable pushing from the worktree.

```
WT=$PDIR/agent-sandbox
git -C "$WT" config extensions.worktreeConfig true
git -C "$WT" config --worktree remote.origin.pushurl DISABLED

# verify
git -C "$WT" config --worktree --get remote.origin.pushurl
# > DISABLED
```

Setup docker images.

```
docker build -f agent/claude.Dockerfile -t claude-author:local .

# to rebuild
docker build --no-cache -f agent/claude.Dockerfile -t claude-author:local .

docker volume create claude_state
```

Run Claude.
```
./agent/claude_run.sh

# or to get a shell first instead
docker run --rm -it \
  --env-file .env \
  -v "$PDIR/agent-sandbox":/project:rw \
  -v "$PDIR/agent/claude_append.txt":/opt/claude/claude_append.txt:ro \
  -v claude_state:/home/agent \
  -w /project \
  claude-author:local \
  bash
```

Configure Claude to either use an API key or a Pro subscription as desired. When you run Claude, it will prompt for either.

## Claude Permissions

Claude’s behavioral rules live in `agent/claude_append.txt`. They are injected via the container entrypoint and applied every run.

Claude’s permission prompts (tool use, memory, etc.) are stored in `/home/agent/.claude/` This directory is persisted via Docker volume (`claude_state`).

## Recommended Workflow

- Create a new branch and switch over to it.
- Start Claude.
- Claude edits files.
- You build or Claude builds if explicitly instructed.
- You commit or Claude may commit if explicitly instructed.
- Claude never pushes.
- You review diffs, run app, and test as needed.
- You push and open PRs.
