# syntax=docker.io/docker/dockerfile:1

# Pinned by digest; Dependabot proposes updates. This is the image the old oven/bun:1.2-slim
# tag pointed to. That tag no longer gets updates; moving to a maintained base is a
# separate change.
FROM oven/bun:1.4.2-slim@sha256:cb3bbbb08e13a4a2ff400f24c7a2a1d5efa83f6ef8544d52d95a519631e2fc61 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

RUN apt update && apt install -y --no-install-recommends build-essential python3

# Install exactly what bun.lock lists; fail if it is out of date with package.json.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# CI writes a .env with per-environment build-time defaults; a local build without
# one gets an empty file so next build still succeeds. NEXT_PUBLIC_* values passed
# at container start override the defaults via docker-entrypoint.mjs.
RUN touch .env

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# .git is not in the build context (.dockerignore), so the commit that goes into the
# version string arrives as a build arg (scripts/update-version.js).
ARG GIT_COMMIT
RUN bun run build-release

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# public/ stays root-owned. env-config.js is a symlink into /tmp, where
# docker-entrypoint.mjs writes the runtime config, so the container can run
# with a read-only root filesystem: only /tmp has to be writable.
COPY --from=builder /app/public ./public
RUN ln -sf /tmp/env-config.js /app/public/env-config.js

# Copy the entrypoint script
COPY --from=builder /app/docker-entrypoint.mjs ./docker-entrypoint.mjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["bun", "docker-entrypoint.mjs"]
