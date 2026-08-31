# Runtime image for the web frontend: nginx serving the Expo static
# export. The export itself (apps/client/dist) is built in CI *before*
# `docker build` — pnpm install + `expo export --platform web` on the
# GitHub runner, where the pnpm cache lives — so this image is a plain
# copy, not a build stage.
FROM nginx:1.27-alpine

# `org.opencontainers.image.source` is what GHCR uses to auto-link the
# container package to this repo. Without it the package ends up
# unlinked and GITHUB_TOKEN cannot push new layers (blob HEAD → 403).
LABEL org.opencontainers.image.source="https://github.com/octopus-synapse/patch-careers-ui"
LABEL org.opencontainers.image.description="Patch Careers web UI (Expo static export)"
LABEL org.opencontainers.image.licenses="UNLICENSED"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/client/dist /usr/share/nginx/html

EXPOSE 7142

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:7142/ || exit 1
