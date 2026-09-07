# Built from the repo root (pnpm workspace): docker build -f backend/Dockerfile .
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY backend backend
RUN pnpm --filter backend run build

FROM base AS runtime
ENV NODE_ENV=production
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile --prod --filter backend
COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
