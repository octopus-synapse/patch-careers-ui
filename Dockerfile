FROM oven/bun:1.3.11-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* bunfig.toml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN --mount=type=secret,id=GITHUB_TOKEN,env=GITHUB_TOKEN \
    --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

FROM deps AS builder
WORKDIR /app
COPY . .
ARG VITE_API_URL=https://backend.patchcareers.org
ENV VITE_API_URL=$VITE_API_URL
RUN cd apps/web && bun run build

FROM oven/bun:1.3.11-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts

FROM oven/bun:1.3.11-alpine AS runner
WORKDIR /app/apps/web
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit
COPY --from=builder --chown=sveltekit:nodejs /app/apps/web/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/apps/web/package.json ./package.json
COPY --from=prod-deps --chown=sveltekit:nodejs /app/node_modules /app/node_modules
COPY --from=prod-deps --chown=sveltekit:nodejs /app/apps/web/node_modules ./node_modules
USER sveltekit
ARG PORT=7142
ENV PORT=$PORT
EXPOSE $PORT
CMD ["bun", "./build/index.js"]
