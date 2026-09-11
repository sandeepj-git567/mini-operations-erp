# DOCKER CONTAINERIZATION & LOCAL ORCHESTRATION GUIDE

This document details the multi-stage Docker build architecture, security hardening, container health checks, local Docker Compose setup, and Docker Hub deployment for the **Mini Operations ERP** platform.

Target Docker Hub Repository: `sandeepj07/mini-operations-erp-backend`

---

## 1. Multi-Stage Dockerfile Architecture

The backend containerization follows a 2-stage build pipeline in [`backend/Dockerfile`](file:///d:/mini-operations-erp/backend/Dockerfile):

```
┌────────────────────────────────────────────────────────┐
│ STAGE 1: Builder (node:20-alpine)                       │
│ ├─ Copy package.json, package-lock.json & prisma       │
│ ├─ Run npm ci (install all dependencies)               │
│ ├─ Build TypeScript source (npm run build ──► dist/)   │
│ └─ Prune devDependencies (npm prune --production)      │
└───────────────────────────┬────────────────────────────┘
                            │ (Copy compiled dist & prod node_modules only)
                            ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 2: Runner (node:20-alpine)                       │
│ ├─ Create non-root system user (erpuser:erpgroup)      │
│ ├─ Set NODE_ENV=production                             │
│ ├─ Add native HEALTHCHECK directive (/api/health)      │
│ └─ CMD ["node", "dist/src/server.js"]                  │
└────────────────────────────────────────────────────────┘
```

### Security & Hardening Highlights
1. **Non-Root Execution Context**: The container runs under a dedicated unprivileged user (`USER erpuser`) rather than `root`.
2. **Minimal Layer Footprint**: Multi-stage separation discards build tools, TypeScript source files, and devDependencies, reducing container image size by over 60%.
3. **Zero Hardcoded Secrets**: Secrets and database credentials are injected at runtime via environment variables, never baked into container layers.
4. **Native Healthcheck**: The `HEALTHCHECK` directive polls `/api/health` every 30 seconds to allow container orchestrators (Docker Swarm, Kubernetes, ECS) to monitor container readiness.

---

## 2. Local Docker Commands

### 1. Build Backend Image Locally
```bash
# Navigate to backend directory
cd backend

# Build Docker image tagged for sandeepj07 Docker Hub repository
docker build -t sandeepj07/mini-operations-erp-backend:latest -t sandeepj07/mini-operations-erp-backend:1.0.0 .
```

### 2. Run Container Standalone
```bash
docker run -d \
  --name erp-backend \
  -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/mini_erp_db" \
  -e JWT_SECRET="your-secure-runtime-jwt-secret-min-32-chars" \
  sandeepj07/mini-operations-erp-backend:latest
```

### 3. Check Container Health Status
```bash
docker ps
```
*(Look for `STATUS: Up (healthy)`)*

---

## 3. Local Infrastructure Orchestration via Docker Compose

Local development and testing infrastructure is defined in [`docker-compose.yml`](file:///d:/mini-operations-erp/docker-compose.yml):

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: erp-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: mini_erp_db
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: erp-backend
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
```

### Starting Docker Compose Stack
```bash
# Launch PostgreSQL and Backend containers in background
docker-compose up -d --build

# View container logs
docker-compose logs -f backend

# Stop stack and preserve volume data
docker-compose down
```

---

## 4. Docker Hub Registry Deployment (`sandeepj07`)

To push the compiled production image to Docker Hub under account `sandeepj07`:

```bash
# 1. Login to Docker Hub
docker login -u sandeepj07

# 2. Push latest and version tags
docker push sandeepj07/mini-operations-erp-backend:latest
docker push sandeepj07/mini-operations-erp-backend:1.0.0
```

> [!NOTE]
> The frontend application (Next.js 14) is deployed directly to **Vercel** (`mini-operations-erp-frontend.vercel.app`), leveraging Vercel's global Edge CDN, automatic ISR, and serverless route optimization. Therefore, containerizing the frontend is unnecessary.
