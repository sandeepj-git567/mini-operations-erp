# ENGINEERING AUDIT — MINI OPERATIONS ERP

This document presents a comprehensive, 20-section engineering audit of the **Mini Operations ERP** codebase, conducted prior to starting the HENNGE-focused production engineering upgrade roadmap.

---

## 1. Current Architecture

The Mini Operations ERP application follows a standard decoupled 2-tier client-server architecture:

```
[ Next.js 14 Web UI ] 
        │
        ├──────────── REST API (HTTP) ────────────► [ Express.js / TypeScript Backend ]
        │                                                     │
        └──────────── Real-Time (Socket.io) ──────► [ Socket.io WebSockets ]
                                                              │
                                                        [ Prisma ORM ]
                                                              │
                                                  [ Supabase PostgreSQL ]
```

* **Frontend**: Next.js 14 App Router rendering React components, using client-side data fetching via standard `fetch` API (`src/lib/api.ts`) and WebSocket hooks (`src/lib/socket.ts`).
* **Backend**: Express 4 app written in TypeScript, providing REST endpoints, Zod schema validations, JWT authentication, role-based access control, and Socket.io event broadcasting.
* **Database**: PostgreSQL hosted on Supabase, managed via Prisma ORM schema and migrations/push.

---

## 2. Frontend Architecture

* **Framework**: Next.js 14 (App Router, Client Components using `'use client'`).
* **Styling**: Vanilla CSS (`globals.css`) + Tailwind CSS utility classes + Lucide React icons.
* **State Management**: Local React component state (`useState`, `useEffect`) and custom Socket.io hook (`useSocket`). No global state management library (e.g., Redux, Zustand) is used.
* **API Client**: Lightweight wrapper `src/lib/api.ts` handling JWT header injection and response parsing.
* **Real-time**: Custom `useSocket` hook subscribing to server events (`INVENTORY_UPDATED`, `TRANSFER_CREATED`, `TRANSFER_DISPATCHED`, `TRANSFER_RECEIVED`, `ORDER_RESERVED`, `ORDER_CANCELLED`).

---

## 3. Backend Architecture

* **Runtime & Language**: Node.js v20, Express.js 4, TypeScript 5.
* **Layering**:
  * **Routes**: Map endpoints to controllers (`src/routes/`).
  * **Middleware**: `auth.middleware.ts` (JWT verification), `role.middleware.ts` (RBAC), `error.middleware.ts` (centralized error handling).
  * **Controllers**: Extract request params/body and pass to services (`src/controllers/`).
  * **Services**: Contain business logic and database access via Prisma (`src/services/`).
  * **Config**: `src/config/prisma.ts` initializes single Prisma client instance.
* **Structure Rating**: Clean basic separation, but lacks dedicated repository/data-access layers or environment config validation.

---

## 4. Database Architecture

* **Engine**: PostgreSQL 15+ hosted on Supabase Cloud.
* **ORM**: Prisma ORM (`@prisma/client` & `prisma` CLI).
* **Models**:
  * `User`, `Location`, `Category`, `Item`, `Inventory` (Composite Unique `[itemId, locationId]`).
  * `InventoryTransaction` (Audit ledger tracking `IN`, `OUT`, `RESERVE`, `RELEASE`, `TRANSFER_OUT`, `TRANSFER_IN`).
  * `WorkOrder` (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`).
  * `Transfer` (`REQUESTED`, `DISPATCHED`, `RECEIVED`).
  * `Customer`, `CustomerOrder`, `CustomerOrderItem`, `Reservation`.
* **Data Integrity**: Unique constraints on emails, SKUs, location codes, work order numbers, order numbers, and transfer numbers. Foreign keys on all relational boundaries.

---

## 5. Authentication Flow

```
User (Email + Password) ──► POST /api/auth/login ──► Verify bcrypt hash
                                                            │
                                                            ▼
User ◄── Return JWT Token & User Object ◄── Issue JWT (expiresIn: 24h)
 │
 └──► Client stores token in localStorage
 │
 └──► Client sends "Authorization: Bearer <token>" header on API calls
 │
 └──► backend/src/middleware/auth.middleware.ts verifies JWT payload & attaches req.user
```

* **Weakness**: Storing JWT in `localStorage` exposes tokens to XSS attacks (httpOnly cookie authentication is preferable for web apps). Fallback JWT secret string exists in code.

---

## 6. Authorization Flow

* **Mechanism**: Role-Based Access Control (RBAC) via `src/middleware/role.middleware.ts`.
* **Roles**:
  * `ADMIN`: Full access (Users, Stock adjustments, Work orders, Transfers, Orders, Reservations).
  * `OPERATIONS_USER`: Inventory view/adjust, Transfers, Work Orders.
  * `SALES_USER`: Customer view/create, Orders, Stock reservations & Cancellations.
* **Execution**: Authorization is enforced on individual Express route stacks (e.g. `router.post('/adjust', authenticate, authorize(['ADMIN', 'OPERATIONS_USER']), adjustStock)`).

---

## 7. Real-Time Architecture

* **Technology**: Socket.io server initialized over HTTP server in `src/server.ts`.
* **Lifecycle**: Clients connect to Socket.io endpoint, subscribe to events via `useSocket()`, and re-render UI state upon payload reception.
* **Events**:
  * `INVENTORY_UPDATED`: Triggered on stock adjustments, transfer dispatches/receives, order reservations, and order cancellations.
  * `TRANSFER_CREATED`, `TRANSFER_DISPATCHED`, `TRANSFER_RECEIVED`.
  * `ORDER_RESERVED`, `ORDER_CANCELLED`.
* **Weakness**: Socket events are emitted *inside* transaction blocks before database commits finish. If the transaction fails later in the block, WebSocket clients still receive stale/invalid update events.

---

## 8. Testing Architecture

* **Framework**: Jest + Supertest for backend integration tests (`backend/tests/api.test.ts`).
* **API Testing**: Postman collection (`postman/Mini-Operations-ERP.postman_collection.json`) executed via Newman CLI.
* **Test Coverage**: 10 Jest tests and 52 Postman assertions covering auth, role restrictions, stock adjustments, transfers, over-reservations, order cancellations, and race conditions.
* **Weaknesses**:
  * Tests run directly against live database (no isolated test database setup/teardown).
  * No automated frontend unit or component tests (e.g., React Testing Library or Playwright/Cypress).

---

## 9. Deployment Architecture

* **Frontend**: Next.js App hosted on Vercel (`mini-operations-erp-frontend.vercel.app`).
* **Backend**: Node.js/Express service hosted on Render Web Service (`mini-operations-erp-backend-l7sh.onrender.com`).
* **Database**: PostgreSQL hosted on Supabase (`aws-0-ap-south-1.pooler.supabase.com`).
* **Weaknesses**: Render free tier suffers cold starts; database connection strings and backend deployment parameters lack strict environment validation tooling.

---

## 10. Security Weaknesses

1. **Exposed Credentials in Documentation**: `README.md` previously contained a live Supabase PostgreSQL connection string with password.
2. **Hardcoded Fallback JWT Secret**: `auth.middleware.ts` and `auth.service.ts` default to `'mini-erp-super-secret-jwt-key-2026'` if `JWT_SECRET` is unset.
3. **Frontend Token Storage**: JWT stored in browser `localStorage` instead of Secure HTTP-only cookies.
4. **Lack of Rate Limiting**: No `express-rate-limit` or brute-force protection on `/api/auth/login`.
5. **Security Headers**: No `helmet` middleware for basic HTTP security headers (HSTS, CSP, X-Frame-Options).
6. **Unhandled Error Message Leakage**: `error.middleware.ts` outputs `err.message` on 500 errors, potentially leaking database error traces to clients.

---

## 11. Configuration Weaknesses

1. **No Startup Validation**: Backend starts up even if `DATABASE_URL` or `JWT_SECRET` are invalid or missing.
2. **Incomplete .gitignore**: Root `.gitignore` only ignored `.env` but not `.env.local` or `.env.production`.
3. **CORS Permissiveness**: Default CORS configuration allowed wildcard origins if `FRONTEND_URL` wasn't explicitly set.

---

## 12. Performance Concerns

1. **No Database Connection Pooling Setup**: Default Prisma instance without explicit pool tuning or connection pooler URL (Supabase transaction pooler port 6543 vs direct port 5432).
2. **Unindexed Custom Foreign Keys / Filters**: Querying `WorkOrder`, `Transfer`, or `InventoryTransaction` without indexes on `assignedUserId`, `sourceLocationId`, `status`, or `createdAt`.
3. **N+1 Query Potentials**: Iterating over order items in services (`reservation.service.ts`) sequentially instead of batching or leveraging Prisma bulk operations.

---

## 13. DevOps Gaps

1. **No Docker Containerization**: Missing `Dockerfile` and `.dockerignore` for standardized environment execution.
2. **No Local Orchestration**: Missing `docker-compose.yml` for running local PostgreSQL + backend seamlessly.
3. **Manual Deployment Flow**: Deploys triggered via manual Git pushes without automated staging/production quality gates.

---

## 14. Linux/Unix Gaps

1. **Lack of Shell Scripts**: No standard POSIX shell scripts (`scripts/dev.sh`, `scripts/test.sh`) for quick execution on Linux/macOS environments.
2. **Windows Specific Path Assumptions**: Potential path handling issues in scripts when run outside Windows environment.

---

## 15. Docker Gaps

1. **No Production Build Stage**: Missing multi-stage container build strategy for lightweight backend production images.
2. **No Healthcheck Instruction**: Containers lack docker-native `HEALTHCHECK` directives.

---

## 16. CI/CD Gaps

1. **Missing GitHub Actions Workflows**: No `.github/workflows/ci.yml` to automatically execute linting, type-checking, Jest tests, and build verification on Pull Requests.

---

## 17. Observability Gaps

1. **Basic Console Logging**: Application uses simple `console.log` and `console.error` without structured JSON formatting (e.g. Pino / Winston).
2. **No Request Correlation IDs**: Log lines cannot be traced back to a specific HTTP request ID.
3. **Basic Health Endpoint**: `/api/health` returns status without checking database connectivity latency or active WebSocket connections.

---

## 18. Documentation Gaps

1. **Missing Architectural Diagrams**: Lacks formal C4/Mermaid architecture diagrams (`docs/ARCHITECTURE.md`).
2. **Missing Environment Specification**: No central documentation (`docs/ENVIRONMENT.md`) listing all environment variables and default behaviors.
3. **No Architecture Decision Records (ADRs)**: Important engineering decisions (Prisma over TypeORM, Socket.io over SSE, Row-locking strategy) are undocumented.

---

## 19. Technical Debt

1. **Prisma Transaction Event Emission**: Socket.io broadcasts are triggered inside `$transaction` callbacks before database commit succeeds.
2. **Duplicated User Stripping**: `delete passwordHash` logic duplicated in multiple auth methods.
3. **Implicit `any` Types**: `(error: any)` handles in catch blocks and route handlers.

---

## 20. Recommended Upgrade Order

Following the required HENNGE production engineering upgrade workflow:

1. **Phase 1**: Security & Secret Hygiene (Credential removal, `.env.example` placeholders, `.gitignore` hardening, secret rotation documentation).
2. **Phase 2**: Environment Configuration (Startup validation, separate env specs, `docs/ENVIRONMENT.md`).
3. **Phase 3**: Architecture Cleanup (Standardized response formatting, layer separation).
4. **Phase 4**: API Engineering & Error Hardening (Clean error middleware, Zod input validation everywhere).
5. **Phase 5**: Authentication & RBAC (Hardened JWT handling, `docs/AUTHENTICATION.md`, `docs/AUTHORIZATION.md`).
6. **Phase 6**: Database & Transactions (Index optimizations, concurrency hardening, `docs/DATABASE_TRANSACTIONS.md`).
7. **Phase 7**: Real-Time Architecture (Post-commit event broadcasting, `docs/REALTIME.md`).
8. **Phase 8**: Testing Enhancement (Isolated test DB execution, edge case testing).
9. **Phase 9**: Linux/Unix Compatibility (`docs/LINUX_SETUP.md`, POSIX helper scripts).
10. **Phase 10**: Docker Containerization (`Dockerfile`, `.dockerignore`, `docs/DOCKER.md`).
11. **Phase 11**: GitHub Actions CI (`.github/workflows/ci.yml`).
12. **Phase 12**: Observability & Structured Logging (Request correlation IDs, health checks).
13. **Phase 13**: Deployment & Cloud Architecture (AWS architecture design & documentation).
14. **Phase 14**: Documentation & ADRs (`README.md` revamp, Mermaid diagrams, ADR records).
15. **Phase 15**: Final Engineering Audit & Interview Readiness Review.
