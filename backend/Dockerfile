# ==============================================================================
# Multi-Stage Production Dockerfile for Mini Operations ERP Backend
# Target Docker Hub Repository: sandeepj07/mini-operations-erp-backend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Copy package descriptors & Prisma schema
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and build production bundle
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Remove development dependencies to keep runtime minimal
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime Stage
# ------------------------------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install wget for lightweight container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

# Create non-root system user for security hardening
RUN groupadd -r erpgroup && useradd -r -g erpgroup erpuser

# Copy built dist, production node_modules, and Prisma artifacts from Builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Set appropriate directory ownership for non-root user
RUN chown -R erpuser:erpgroup /app

# Switch to non-root user context
USER erpuser

# Expose backend network port
EXPOSE 5000

# Container Healthcheck directive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start Production Backend API Server
CMD ["node", "dist/src/server.js"]
