# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /repo

# Copy workspace manifests so npm can resolve workspace links.
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

RUN npm run build --workspace @fixitnow/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 api

# Production deps only
COPY --from=deps /repo/node_modules /tmp/full_node_modules
COPY apps/api/package.json ./package.json
RUN cp -r /tmp/full_node_modules ./node_modules \
 && rm -rf /tmp/full_node_modules

COPY --from=builder --chown=api:nodejs /repo/apps/api/dist ./dist
COPY --from=builder --chown=api:nodejs /repo/packages ./packages

USER api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/healthz || exit 1

CMD ["node", "dist/server.js"]
