FROM node:20.6.1-bookworm-slim

RUN useradd -m agent

RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates ripgrep \
    python3 make g++ pkg-config \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code
COPY agent/claude_entrypoint.sh /usr/local/bin/claude_entrypoint.sh
RUN chmod +x /usr/local/bin/claude_entrypoint.sh

USER agent
WORKDIR /project

ENTRYPOINT ["/usr/local/bin/claude_entrypoint.sh"]
