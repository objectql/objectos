# ──────────────────────────────────────────────────────────────
# ObjectOS — Multi-Stage Docker Build
# Produces a minimal production image running `objectstack serve`
# with the Admin Console (apps/web) and Docs (apps/site) baked in.
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Base ─────────────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ── Stage 2: Dependencies ────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/package.json
COPY apps/site/package.json ./apps/site/package.json
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 3: Build ───────────────────────────────────────────
FROM deps AS build

# Copy remaining source files
COPY . .

# Build all packages (server plugins + frontend apps)
RUN pnpm run build

# ── Stage 4: Production ─────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production
ENV PORT=5320

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/package.json
COPY apps/site/package.json ./apps/site/package.json

# Install production-only dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from build stage
COPY --from=build /app/packages/*/dist ./packages/
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/apps/site/out ./apps/site/out

# Copy server entrypoint & config
COPY objectstack.config.ts ./
COPY api/ ./api/
COPY tsconfig.json ./

EXPOSE 5320

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5320/api/v1/health || exit 1

CMD ["pnpm", "objectstack:serve"]
