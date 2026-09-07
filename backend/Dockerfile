# Built from the repo root (pnpm workspace): docker build -f backend/Dockerfile .
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY patches patches
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY backend backend
RUN pnpm --filter backend run build

FROM base AS runtime
ENV NODE_ENV=production
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY patches patches
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
# Full install, not --prod: entrypoint.sh runs migrations via
# `pnpm run migration:run`, which loads src/**/*.entity.ts and
# src/database/migrations/*.ts straight from TS source through tsx
# (a devDependency) the same way it already does in dev/CI — a
# --prod-only install leaves tsx/typescript out and, separately,
# breaks minio's stream-json import (see the OPS-004 commit).
RUN pnpm install --frozen-lockfile
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/entrypoint.sh ./backend/entrypoint.sh
RUN chmod +x ./backend/entrypoint.sh

WORKDIR /app/backend
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
