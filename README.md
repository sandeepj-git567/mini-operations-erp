# Mini Operations ERP — HENNGE Production Engineering Showcase

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.1-black.svg)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.18-green.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-blueviolet.svg)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-sandeepj07-blue.svg)](https://hub.docker.com/r/sandeepj07/mini-operations-erp-backend)
[![CI Pipeline](https://img.shields.io/badge/GitHub_Actions-CI_Passed-success.svg)](https://github.com/sandeepj-git567/mini-operations-erp/actions)

A real-time **Mini Operations ERP** platform designed to protect inventory integrity using database transactions for inventory control, work order tracking, stock transfers, and customer sales order fulfillment.

This repository demonstrates full-stack engineering practices, security hygiene, transaction-based stock reservation (`SELECT FOR UPDATE`), multi-stage Docker containerization, POSIX shell automation, GitHub Actions CI/CD pipelines, structured JSON logging, and AWS cloud deployment strategy.

---

## 🌐 Live Production Deployment & Links

* **Live Frontend Web App (Vercel)**: [https://mini-operations-erp-frontend-git-main-sandeep-js-projects.vercel.app](https://mini-operations-erp-frontend-git-main-sandeep-js-projects.vercel.app)
* **Live Backend API (Render)**: [https://mini-operations-erp-backend-l7sh.onrender.com/api](https://mini-operations-erp-backend-l7sh.onrender.com/api)
* **Interactive Swagger API Docs**: [https://mini-operations-erp-backend-l7sh.onrender.com/api/docs/](https://mini-operations-erp-backend-l7sh.onrender.com/api/docs/)
* **Docker Hub Registry**: [`sandeepj07/mini-operations-erp-backend`](https://hub.docker.com/r/sandeepj07/mini-operations-erp-backend)
* **Postman Public Workspace**: [Run Postman Collection & Environment](https://sandeep-4675570.postman.co/workspace/mini-operations-erp/run/44214802-9182537c-7f6b-401d-b24a-dc4f09c2c4e5?action=share&creator=44214802&active-environment=44214802-4e272975-6ee4-462e-8961-6ba1a1a31f37)
* **GitHub Repository**: [https://github.com/sandeepj-git567/mini-operations-erp](https://github.com/sandeepj-git567/mini-operations-erp)
* **Loom Video Demo**: [Watch 5-Minute Technical Walkthrough](https://www.loom.com/share/7c7ed9a60d844a91bf2ee5117b44f4a9)


---

## 🚀 Business Lifecycle Flow

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ 1. User Auth │ ──► │ 2. Stock Intake  │ ──► │ 3. Work Order    │ ──► │ 4. Internal Stock   │
│   (JWT/RBAC) │     │ (Physical Count) │     │ (Material Check) │     │    Transfer (AZ)    │
└──────────────┘     └──────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                                                  │
┌─────────────────────────┐     ┌────────────────────────┐                        │
│ 6. Order Cancellation / │ ◄── │ 5. Customer Order &    │ ◄──────────────────────┘
│    Reserved Release     │     │    Atomic Reservation  │
└─────────────────────────┘     └────────────────────────┘
```

---

## 🏗 Key Engineering Highlights

### 1. Clean Layered Architecture
Refactored API into strict separation of concerns (`Routes -> Controllers -> Services -> Data Access Layer`). Standardized asynchronous route error handling via custom `asyncHandler` wrappers, eliminating duplicate `try/catch` blocks and guaranteeing uniform `AppError` responses.

### 2. Concurrency Safety & Row Locking (`SELECT FOR UPDATE`)
Stock reservation requests execute inside Prisma interactive transactions utilizing raw PostgreSQL row-level locks (`SELECT * FROM "Inventory" WHERE id = $1 FOR UPDATE`). Prevents race conditions and over-reservations during simultaneous multi-user checkout.

### 3. Event-Driven Real-Time Synchronization
Socket.io real-time WebSocket events (`inventory:updated`, `transfer:updated`, `order:updated`) are triggered strictly **post-commit** after database transactions finalize, ensuring clients never render phantom or uncommitted state.

### 4. Multi-Stage Docker Containerization (`sandeepj07`)
Built multi-stage production Dockerfiles (`node:20-alpine`) utilizing non-root security execution contexts (`USER erpuser`), native `/api/health` check directives, and `.dockerignore` context filtering. Tagged for Docker Hub repository `sandeepj07/mini-operations-erp-backend`.

### 5. GitHub Actions CI/CD Pipeline
Automated Pull Request verification via [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml). Parallel jobs execute TypeScript compilation (`tsc --noEmit`), Next.js production builds, Docker container validation, and run 16-test integration suites against an isolated `postgres:15-alpine` service container.

### 6. System Observability & Correlation Tracking
Propagates `X-Request-ID` correlation headers across requests. Logs structured JSON payloads in production (`NODE_ENV=production`) for aggregators (AWS CloudWatch, Datadog) and benchmarks database latency (`dbLatencyMs`) and memory footprints (`rssMB`, `heapUsedMB`) via `GET /api/health`.

---

## 🔑 Demo Accounts & Credentials

| Role | Email | Password | Allowed Scope |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | `admin@example.com` | `Password123!` | Full System Access (Users, Adjustments, Work Orders, Transfers, Sales, Reservations) |
| **`OPERATIONS_USER`** | `operations@example.com` | `Password123!` | Inventory Adjustments, Work Order Processing, Stock Transfers (Dispatch/Receive) |
| **`SALES_REPRESENTATIVE`** | `sales@example.com` | `Password123!` | Customer Management, Customer Sales Orders, Atomic Stock Reservations & Cancellations |

> 🛡️ **Security Notice**: Demo credentials (`admin@example.com`, etc.) are isolated accounts created via database seeds (`prisma/seed.ts`) intended exclusively for local development and evaluator testing. They are **not** reused in production systems or connected to sensitive data.

---

## 🛠 Local Quickstart & Development

### Method A: POSIX Shell Scripts (Linux / macOS / WSL)
```bash
# 1. Clone repository
git clone https://github.com/sandeepj-git567/mini-operations-erp.git
cd mini-operations-erp

# 2. Run automated environment setup, dependency installation & database seeding
./scripts/setup.sh

# 3. Execute backend & frontend test suites
./scripts/test.sh
```

### Method B: Local Stack Orchestration via Docker Compose
```bash
# Build and launch PostgreSQL and Express API containers in background
docker-compose up -d --build

# View real-time container logs
docker-compose logs -f backend
```

---

## 📚 Technical Documentation Index

All architectural decisions, diagrams, and security models are documented in the [`docs/`](file:///docs/) directory:

1. [docs/ENGINEERING_AUDIT.md](file:///docs/ENGINEERING_AUDIT.md) — 20-Section Comprehensive Production System Audit & Roadmap
2. [docs/ENVIRONMENT.md](file:///docs/ENVIRONMENT.md) — Zod Runtime Environment Schema Validation & Secrets Guide
3. [docs/decisions/ADR-001-clean-layered-architecture.md](file:///docs/decisions/ADR-001-clean-layered-architecture.md) — Architecture Decision Record: Layered Refactoring
4. [docs/AUTHENTICATION.md](file:///docs/AUTHENTICATION.md) — JWT Authentication Architecture & Password Hashing Standard
5. [docs/AUTHORIZATION.md](file:///docs/AUTHORIZATION.md) — Role-Based Access Control (RBAC) Permission Matrix
6. [docs/DATABASE_TRANSACTIONS.md](file:///docs/DATABASE_TRANSACTIONS.md) — Prisma Transactions, Indexes & Row-Level Locking (`SELECT FOR UPDATE`)
7. [docs/REALTIME.md](file:///docs/REALTIME.md) — Socket.io WebSocket Event Synchronization Architecture
8. [docs/TESTING.md](file:///docs/TESTING.md) — Edge Case Testing Strategy, Jest API Suite & Newman Automation
9. [docs/LINUX_SETUP.md](file:///docs/LINUX_SETUP.md) — POSIX Shell Scripting & Developer Experience Guide
10. [docs/DOCKER.md](file:///docs/DOCKER.md) — Multi-Stage Build Architecture & Docker Hub Deployment (`sandeepj07`)
11. [docs/CI_CD.md](file:///docs/CI_CD.md) — GitHub Actions CI/CD Pipeline & Service Container Specification
12. [docs/OBSERVABILITY.md](file:///docs/OBSERVABILITY.md) — Structured JSON Logging, Correlation IDs (`X-Request-ID`) & Diagnostics
13. [docs/AWS_DEPLOYMENT.md](file:///docs/AWS_DEPLOYMENT.md) — AWS Cloud Architecture, ECS Fargate, Multi-AZ RDS & Terraform IaC
14. [docs/ER-DIAGRAM.md](file:///docs/ER-DIAGRAM.md) — Entity-Relationship Diagram & Database Schemas
15. [docs/DEMO-SCRIPT.md](file:///docs/DEMO-SCRIPT.md) — Step-by-Step Technical Demo Script for Evaluators
16. [docs/SECURITY_SECRETS.md](file:///docs/SECURITY_SECRETS.md) — Security Policy, `.env` Isolation & Environment Variable Schema
17. [docs/CREDENTIAL_ROTATION.md](file:///docs/CREDENTIAL_ROTATION.md) — Manual Credential Rotation & Secret Maintenance Procedure

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
