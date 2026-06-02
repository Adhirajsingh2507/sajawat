# syntax=docker/dockerfile:1.7
# Sajawat API (Express 5) — multi-stage, Node 22 (glibc/slim), non-root.
# Build from the repo root:  docker build -f infrastructure/docker/api.Dockerfile .
ARG NODE_IMAGE=node:22-bookworm-slim
ARG TURBO_VERSION=2.9.16

# --- base: Corepack-pinned pnpm ---------------------------------------------
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV HUSKY=0
RUN corepack enable
WORKDIR /app

# --- pruner: minimal monorepo subset for @sajawat/api -----------------------
FROM base AS pruner
ARG TURBO_VERSION
COPY . .
RUN pnpm dlx turbo@${TURBO_VERSION} prune @sajawat/api --docker

# --- builder: install (cached) -> build -> prod deploy bundle ---------------
FROM base AS builder
# Manifests first so the install layer is reused until a package.json changes.
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# Full source, then build api (+ its workspace deps via ^build).
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@sajawat/api
# Pruned, prod-only, self-contained bundle (api dist + shared dist + prod deps).
RUN pnpm --filter=@sajawat/api deploy --prod /app/deploy

# --- runner: slim, non-root, no toolchain -----------------------------------
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY --from=builder --chown=node:node /app/deploy ./
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Exec form so Node is PID 1 and receives SIGTERM (graceful shutdown).
CMD ["node", "dist/index.js"]
