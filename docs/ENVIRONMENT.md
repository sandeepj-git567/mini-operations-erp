# ENVIRONMENT CONFIGURATION STRATEGY & SPECIFICATION

This document outlines the environment configuration strategy, variable specifications, validation mechanisms, and security boundaries for the **Mini Operations ERP** platform across Development, Testing, and Production environments.

---

## 1. Overview & Architectural Principles

The Mini Operations ERP system strictly enforces standard 12-Factor App principles regarding configuration management:

1. **Strict Separation of Configuration and Code**: All environment-specific settings (ports, URLs, secrets, connection strings) are stored in environment variables, never hardcoded in source code.
2. **Environment Isolation**: Separate `.env` files are used per deployment tier:
   * `.env` / `.env.local` for local development.
   * Environment variables injected directly via platform settings (e.g. Render Dashboard, Vercel Dashboard) for production.
3. **Fail-Fast Startup Validation**: The backend application validates all required environment variables at server initialization using **Zod schema validation** (`src/config/env.config.ts`). If any required variable is missing or malformed, the process immediately logs descriptive error diagnostics and halts execution (`process.exit(1)`).
4. **Client/Server Security Boundaries**:
   * Server-only secrets (`DATABASE_URL`, `JWT_SECRET`) are never exposed to browser context.
   * Frontend environment variables MUST be prefixed with `NEXT_PUBLIC_` to be intentionally exposed to Next.js browser bundles.

---

## 2. Backend Environment Variables

| Variable Name | Description | Type / Schema | Required? | Default / Example Value | Exposure Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PORT` | HTTP network port for Express backend server | Integer (`1-65535`) | Optional | `5000` | Server-only |
| `NODE_ENV` | Application execution environment | Enum (`development` \| `test` \| `production`) | Optional | `development` | Server-only |
| `DATABASE_URL` | PostgreSQL connection string (Supabase / local DB) | String (non-empty URL) | **Required** | `postgresql://USER:PASS@HOST:5432/DB` | Server-only |
| `JWT_SECRET` | Secret key for signing and verifying Auth JWTs | String (min 8 chars) | **Required** | `your-secure-random-jwt-secret` | Server-only |
| `FRONTEND_URL` | Allowed origin URL for CORS and Socket.io clients | String (valid URL) | Optional | `http://localhost:3000` | Server-only |

---

## 3. Frontend Environment Variables

| Variable Name | Description | Type / Schema | Required? | Default / Example Value | Exposure Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend REST API endpoint base URL | String (valid URL) | Optional | `http://localhost:5000/api` | Public Browser Bundle |
| `NEXT_PUBLIC_SOCKET_URL` | Backend Socket.io server base URL | String (valid URL) | Optional | `http://localhost:5000` | Public Browser Bundle |

> [!WARNING]
> Never prefix sensitive server-side variables (such as `JWT_SECRET` or `DATABASE_URL`) with `NEXT_PUBLIC_`. Doing so will embed secret values directly into static JavaScript bundles downloaded by users' Web browsers.

---

## 4. Startup Validation Mechanism

Validation is enforced in `backend/src/config/env.config.ts` during server startup:

```typescript
const envSchema = z.object({
  PORT: z.string().default('5000').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL cannot be empty'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  FRONTEND_URL: z.string().default('http://localhost:3000')
});
```

### Example Fail-Fast Terminal Output

If `DATABASE_URL` or `JWT_SECRET` is missing when launching the backend:

```text
❌ [ENVIRONMENT CONFIGURATION ERROR] Invalid or missing environment variables:
   - DATABASE_URL: DATABASE_URL environment variable is required
   - JWT_SECRET: JWT_SECRET environment variable is required
💥 Exiting backend process due to configuration failure.
```

---

## 5. Local Setup per Tier

### Development Setup
1. Copy template files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Populate `backend/.env` with your local database URL and JWT secret:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_erp_dev"
   JWT_SECRET="dev-super-secret-jwt-key-32-chars-long"
   FRONTEND_URL="http://localhost:3000"
   ```

### Testing Setup
During automated Jest test execution, `NODE_ENV` is automatically set to `test`. Safe fallback defaults are initialized if variables are absent, allowing unit/integration tests to run reproducibly in isolated environments.

### Production Setup (Render & Vercel)
* **Backend (Render)**: Set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and `NODE_ENV=production` in Render Web Service Dashboard Environment Settings.
* **Frontend (Vercel)**: Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` in Vercel Environment Variables.
