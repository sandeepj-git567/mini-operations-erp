# ==============================================================================
# Multi-Stage Production Dockerfile for Mini Operations ERP Frontend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and configuration files
COPY tsconfig.json tailwind.config.js postcss.config.js ./
COPY src ./src
COPY public ./public

# Set build-time environment variables for Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL="http://localhost:5000/api"
ARG NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# Build production bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime Stage
# ------------------------------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root system user for security hardening
RUN groupadd -r erpgroup && useradd -r -g erpgroup erpuser

# Copy built application assets from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set appropriate directory ownership for non-root user
RUN chown -R erpuser:erpgroup /app

# Switch to non-root user context
USER erpuser

# Expose frontend network port
EXPOSE 3000

# Start Production Next.js App
CMD ["npm", "start"]
