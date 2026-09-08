# Built from the repo root (pnpm workspace): docker build -f frontend/Dockerfile .
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile --filter frontend...

FROM deps AS build
COPY frontend frontend
# Vite bakes these into the bundle at build time — override with
# --build-arg for a real deployment, empty defaults just let the image
# build.
ARG VITE_API_URL=
ARG VITE_TURNSTILE_SITE_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
RUN pnpm --filter frontend run build

FROM nginx:alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
