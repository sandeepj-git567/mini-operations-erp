# Docker Compose & Supabase Integration Guide

This guide explains how to containerize and execute **Mini Operations ERP** using Docker Compose connected to your remote **Supabase PostgreSQL** instance.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────┐       ┌──────────────────────────────────┐
│      erp-frontend (Next.js)     │       │       erp-backend (Express)      │
│          Port: 3000             │ ────► │            Port: 5000            │
└─────────────────────────────────┘       └─────────────────┬────────────────┘
                                                            │
                                                            ▼ (TLS / Port 5432 or 6543)
                                          ┌──────────────────────────────────┐
                                          │      Supabase PostgreSQL DB      │
                                          │     (Remote Managed Service)     │
                                          └──────────────────────────────────┘
```

- **Backend Container (`erp-backend`)**: Node.js v20 Express service built from [`backend/Dockerfile`](file:///backend/Dockerfile). Runs on port 5000.
- **Frontend Container (`erp-frontend`)**: Next.js 14 Web UI built from [`frontend/Dockerfile`](file:///frontend/Dockerfile). Runs on port 3000.
- **Database Connection**: The backend connects directly to remote **Supabase PostgreSQL** via `DATABASE_URL` and `DIRECT_URL` environment variables. No local database container is executed.

---

## 🚀 Quickstart Guide

### Step 1: Copy Environment Template
Copy the Docker environment template:
```bash
cp .env.docker.example .env.docker
```

### Step 2: Configure Supabase Credentials in `.env.docker`
Edit `.env.docker` with your actual Supabase connection strings and secrets:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-secure-random-jwt-secret-min-32-chars"
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
```

### Step 3: Validate Docker Compose Configuration
Run configuration verification:
```bash
docker compose config
```

### Step 4: Build and Launch Containers
```bash
# Build and start services in background
docker compose up -d --build

# View real-time application logs
docker compose logs -f
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.docker`**: `.env.docker` is excluded via root `.gitignore`.
2. **Environment Variable Injection**: Credentials are injected into container environments at runtime, avoiding hardcoded secrets inside Docker images.
3. **Non-Root Execution**: Both `backend` and `frontend` Docker images enforce non-root security contexts (`USER erpuser`).
