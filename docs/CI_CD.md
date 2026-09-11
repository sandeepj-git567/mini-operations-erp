# GITHUB ACTIONS CI & AUTOMATED PR VERIFICATION

This document details the continuous integration (CI) architecture, job matrix, local workflow simulation, and branch protection enforcement for the **Mini Operations ERP** repository.

Target Docker Hub Repository: `sandeepj07/mini-operations-erp-backend`

---

## 1. CI Workflow Overview

The GitHub Actions workflow configuration is defined in [`.github/workflows/ci.yml`](file:///d:/mini-operations-erp/.github/workflows/ci.yml). It automatically triggers on every `push` and `pull_request` targeting the `main` or `master` branches.

### Workflow Job Matrix

```
                          ┌────────────────────────┐
                          │  GitHub Trigger Event  │
                          │ (Push / Pull Request)  │
                          └───────────┬────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  Job 1: backend-ci   │   │ Job 2: frontend-ci   │   │  Job 3: docker-ci    │
│ ├─ Postgres Container│   │ ├─ Node.js 20 Setup  │   │ ├─ Docker Context    │
│ ├─ npm ci            │   │ ├─ npm ci            │   │ └─ Build Image       │
│ ├─ prisma db push    │   │ ├─ tsc --noEmit      │   │    (sandeepj07 tag)  │
│ ├─ npm run seed      │   │ └─ npm run build     │   └──────────────────────┘
│ ├─ tsc --noEmit      │   └──────────────────────┘
│ ├─ npm test (Jest)   │
│ └─ npm run build     │
└──────────────────────┘
```

---

## 2. Job Specifications

### Job 1: `backend-ci` (Backend Type-Check, Service DB Tests & Build)
* **Runner**: `ubuntu-latest`
* **Service Container**: `postgres:15-alpine` running on port `5432` with automatic health checks (`pg_isready`).
* **Steps**:
  1. Checkout code (`actions/checkout@v4`).
  2. Setup Node.js 20 (`actions/setup-node@v4`) with `npm` dependency caching.
  3. Clean dependency installation (`npm ci`).
  4. Database Schema Provisioning (`npx prisma db push --skip-generate`).
  5. Seed Database (`npm run seed`) with default roles, locations, items, and work orders.
  6. TypeScript Type Check (`npx tsc --noEmit`).
  7. Run Automated Jest Integration Test Suite (`npm test`).
  8. Build Backend Bundle (`npm run build`).

### Job 2: `frontend-ci` (Frontend Type-Check & Next.js Production Build)
* **Runner**: `ubuntu-latest`
* **Steps**:
  1. Checkout code (`actions/checkout@v4`).
  2. Setup Node.js 20 with `npm` dependency caching.
  3. Clean dependency installation (`npm ci`).
  4. TypeScript Type Check (`npx tsc --noEmit`).
  5. Compile Next.js 14 production bundle (`npm run build`) with isolated environment variables.

### Job 3: `docker-ci` (Docker Image Build Check)
* **Runner**: `ubuntu-latest`
* **Steps**:
  1. Checkout code (`actions/checkout@v4`).
  2. Execute Docker build against [`backend/Dockerfile`](file:///d:/mini-operations-erp/backend/Dockerfile) tagged as `sandeepj07/mini-operations-erp-backend:ci` to guarantee Dockerfile syntax and build reproducibility.

---

## 3. Local Workflow Testing via `act`

To run the GitHub Actions workflow locally before pushing code to GitHub:

```bash
# Install act CLI (via Winget, Brew, or Choco)
winget install nektos.act

# Execute full CI workflow locally using Docker daemon
act pull_request
```

---

## 4. Recommended GitHub Branch Protection Rules

To enforce production engineering standards, configure the following settings under GitHub Repository Settings -> Branches -> Add rule for `main`:

1. **Require a pull request before merging**: Enforce at least 1 approving review.
2. **Require status checks to pass before merging**:
   - `Backend CI (TypeCheck, Database Tests & Build)`
   - `Frontend CI (TypeCheck & Next.js Build)`
   - `Docker Containerization Check`
3. **Require branches to be up to date before merging**.
4. **Include administrators**: Prevent bypassing CI checks.
