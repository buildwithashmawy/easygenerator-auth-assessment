# syntax=docker/dockerfile:1.7
# ---- build: install all deps, build web + api ------------------------------------------
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- prod deps only ----------------------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --omit=dev --workspace api --include-workspace-root=false --no-audit --no-fund

# ---- runtime: small, non-root ------------------------------------------------------------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/api/dist ./api/dist
COPY --from=build --chown=node:node /app/api/package.json ./api/package.json
COPY --from=build --chown=node:node /app/web/dist ./web/dist
USER node
EXPOSE 3000
CMD ["node", "api/dist/main.js"]
