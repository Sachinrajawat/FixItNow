# syntax=docker/dockerfile:1.7

# -----------------------------
# 1. Install production deps
# -----------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Required for some native modules on Alpine
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

# -----------------------------
# 2. Build the Next.js app
# -----------------------------
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment placeholders. Real values are injected at runtime.
ARG NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ARG NEXT_PUBLIC_API_URL="http://localhost:4000"
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# -----------------------------
# 3. Run the production server
# -----------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a dedicated non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
