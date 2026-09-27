# cafe-mcp — Dockerfile for Glama automated safety/quality checks.
#
# This image is NOT how end users run cafe-mcp (they use `npx -y
# @dangamsoft/cafe-mcp` per the README). Glama uses this Dockerfile only to
# spin the server up in an isolated sandbox, confirm it starts, enumerate its
# tools, and run security/quality scans.
#
# Design notes:
#   - Installs the PUBLISHED npm package (not a repo build) so the scanned
#     artifact is byte-identical to what users get from npm.
#   - Pinned to the current release so the scan matches the listed version.
#   - thin stdio proxy: only outbound HTTPS to the public 24Plus backend.
#     No API key, no engine, no database is bundled or required.
#   - Runs as a non-root user.

FROM node:20-slim

# Pin to the published release Glama is listing. Bump on each new version.
ENV CAFE_MCP_VERSION=1.0.1

# Optional: override the backend base URL. Default (baked into the package)
# is https://24plus.ai.kr/api — the server POSTs to ${CAFE_MCP_API_URL}/try/panels.
# ENV CAFE_MCP_API_URL=https://24plus.ai.kr/api

WORKDIR /app

# Install the exact published version globally, then drop npm caches.
RUN npm install -g "@dangamsoft/cafe-mcp@${CAFE_MCP_VERSION}" \
    && npm cache clean --force

# Run as an unprivileged user (node:20-slim ships a built-in `node` user).
USER node

# stdio MCP server — stdout carries the protocol stream, stderr carries logs.
ENTRYPOINT ["cafe-mcp"]
