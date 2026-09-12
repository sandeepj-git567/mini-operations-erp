# Security and Secrets Management Guidelines

This document outlines the security procedures, environment variable handling, and secret isolation guidelines for **Mini Operations ERP**.

---

## 🔒 1. Never Commit `.env` Files

- `.env` files contain sensitive operational configuration, database credentials, and secret signing keys (`DATABASE_URL`, `JWT_SECRET`).
- `.env` files must **NEVER** be committed to version control or pushed to public repositories.
- The root `.gitignore` file enforces exclusion of all `.env` files while preserving safe template files (`.env.example`).

---

## 📋 2. Using `.env.example` Templates

- `.env.example` files act as standard structural templates for developers setting up local environments or deployment platforms.
- They contain **only generic placeholder values** (`postgresql://USER:PASSWORD@HOST:PORT/DATABASE`, `replace-with-a-long-random-secret`).
- Never put real passwords, live Supabase/RDS database URLs, or real secret keys inside any `.env.example` file.

---

## 🛠 3. Local Environment Setup

To create local environment configurations:

### Backend Local Setup (`backend/.env`)
1. Copy the example template:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Edit `backend/.env` with your local PostgreSQL or development database string:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/mini_erp_db"
   JWT_SECRET="local-development-secret-key-at-least-32-chars-long"
   FRONTEND_URL="http://localhost:3000"
   ```

### Frontend Local Setup (`frontend/.env.local`)
1. Copy the example template:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```
2. Edit `frontend/.env.local` to point to your local backend API:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
   ```

---

## ⚙️ 4. Required Backend Environment Variables

| Variable | Description | Validation | Exposure |
| :--- | :--- | :--- | :--- |
| `PORT` | API Server listening port (default: 5000) | Optional Number | Server-Only |
| `NODE_ENV` | Runtime environment (`development` / `production` / `test`) | Optional String | Server-Only |
| `DATABASE_URL` | PostgreSQL connection string | **Required (non-empty)** | Server-Only |
| `JWT_SECRET` | Secret key for signing and verifying Auth JWTs | **Required (min 8 chars)** | Server-Only |
| `FRONTEND_URL` | Allowed origin for CORS & Socket.IO | Optional String | Server-Only |

---

## 🌐 5. Required Frontend Environment Variables

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL for REST API endpoints | Browser-Exposed (Public) |
| `NEXT_PUBLIC_SOCKET_URL` | Base URL for Socket.IO WebSocket connections | Browser-Exposed (Public) |

> ⚠️ **CRITICAL**: Never prefix sensitive server-side variables (such as `DATABASE_URL` or `JWT_SECRET`) with `NEXT_PUBLIC_`. Prefixing a variable with `NEXT_PUBLIC_` exposes it inside static client-side JavaScript bundles.

---

## 🚀 6. Configuring Cloud Deployment Variables

### Backend (Render / Railway / AWS ECS)
1. Navigate to your Web Service dashboard settings.
2. Add environment variables:
   - `DATABASE_URL` = Your production database connection string.
   - `JWT_SECRET` = A strong, randomly generated 32+ character key.
   - `FRONTEND_URL` = Your deployed frontend URL (e.g. `https://mini-operations-erp-frontend.vercel.app`).
   - `NODE_ENV` = `production`

### Frontend (Vercel / Netlify)
1. Navigate to Project Settings -> Environment Variables.
2. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-domain.com/api`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend-domain.com`

---

## 🔄 7. Secret Rotation Protocol

If credentials or secrets are accidentally exposed or compromised:

1. **Database Password**: Immediately change your PostgreSQL/Supabase database user password and update `DATABASE_URL` in all deployment environments.
2. **JWT Secret**: Generate a new random secret using OpenSSL (`openssl rand -base64 32`) and update `JWT_SECRET`. *Note: Rotating `JWT_SECRET` invalidates existing active user sessions, requiring users to log in again.*
3. **Redeploy**: Trigger a fresh service deployment to pick up updated environment variables.

For detailed step-by-step manual rotation instructions, refer to [`docs/CREDENTIAL_ROTATION.md`](file:///docs/CREDENTIAL_ROTATION.md).

---

## 🔍 8. Verifying Secret Exclusions in Git

Before making commits, verify that no `.env` files or secret values are tracked by Git:

```bash
# Check if any .env file is tracked
git ls-files "*.env*"

# Search codebase for secret keyword patterns
git grep -n -I -E "DATABASE_URL|JWT_SECRET|SECRET_KEY|API_KEY|postgresql://"
```
