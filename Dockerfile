# ─────────────────────────────────
# Stage 1: deps — install production deps
# ─────────────────────────────────────────
FROM node:22-bullseye AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ─────────────────────────────────────────
# Stage 2: builder — generate Prisma client + build Next.js
# ─────────────────────────────────────────
FROM node:22-bullseye AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma schema lives at src/prisma/schema.prisma (non-default path)
ENV PRISMA_SCHEMA_PATH=src/prisma/schema.prisma

# NEXT_PUBLIC_* vars are inlined into the JS bundle at build time — runtime
# env vars (e.g. Kubernetes ConfigMap) have NO effect on these values.
# The production image always enables the API adapter.
ARG NEXT_PUBLIC_BACKEND_ENABLED=true
ENV NEXT_PUBLIC_BACKEND_ENABLED=${NEXT_PUBLIC_BACKEND_ENABLED}

RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

# ─────────────────────────────────────────
# Stage 2b: prisma-cli — self-contained Prisma CLI for runtime schema sync.
# The runner is offline; `npx` would try to download from the npm registry at
# runtime. npm install gives the FULL dependency closure of the CLI (verified
# empirically — copying prisma/ + @prisma/* alone misses @prisma/engines,
# effect, c12, jiti, ...). MUST match the app's lockfile prisma version.
# ─────────────────────────────────────────
FROM node:22-bullseye AS prisma-cli
WORKDIR /prisma
# Version is read from the app's lockfile so CLI and app can never drift apart
COPY --from=deps /app/package-lock.json /tmp/package-lock.json
RUN PRISMA_VER=$(node -e "const l=require('/tmp/package-lock.json');console.log(l.packages['node_modules/prisma']?.version||'7.7.0')") && \
    echo "Installing prisma CLI ${PRISMA_VER}" && \
    npm init -y >/dev/null && \
    npm install --no-package-lock "prisma@${PRISMA_VER}" "@next/env" && \
    npm cache clean --force

# ─────────────────────────────────────────
# Stage 3: runner — minimal production image
# ─────────────────────────────────────────
FROM node:22-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema needed at runtime for query engine path resolution
COPY --from=builder --chown=nextjs:nodejs /app/src/prisma/schema.prisma ./src/prisma/schema.prisma

# Self-contained Prisma CLI for runtime schema sync (initAdminOnStartup + k8s
# db-init job). Full closure from the dedicated build stage — see stage 2b.
COPY --from=prisma-cli --chown=nextjs:nodejs /prisma/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Pre-create uploads directory with proper permissions for logo uploads
RUN mkdir -p /app/public/uploads/logos && \
    chown -R nextjs:nodejs /app/public/uploads && \
    chmod -R 755 /app/public/uploads

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health 2>/dev/null || exit 1

CMD ["node", "server.js"]
