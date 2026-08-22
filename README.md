# Mini Operations ERP

A production-grade, real-time **Mini Operations ERP** system built with Next.js 14, Express.js (TypeScript), Prisma ORM, Supabase PostgreSQL, and Socket.io.

---

## 🌐 Live Production Deployment & Links

- **Live Frontend App (Vercel)**: [https://mini-operations-erp-frontend.vercel.app](https://mini-operations-erp-frontend.vercel.app)
- **Live Backend API (Render)**: [https://mini-operations-erp-backend-l7sh.onrender.com/api](https://mini-operations-erp-backend-l7sh.onrender.com/api)
- **Interactive Swagger API Docs**: [https://mini-operations-erp-backend-l7sh.onrender.com/api/docs/](https://mini-operations-erp-backend-l7sh.onrender.com/api/docs/)
- **Live Postman Public Workspace**: [Postman Collection Run & Environment](https://sandeep-4675570.postman.co/workspace/mini-operations-erp/run/44214802-9182537c-7f6b-401d-b24a-dc4f09c2c4e5?action=share&creator=44214802&active-environment=44214802-4e272975-6ee4-462e-8961-6ba1a1a31f37)
- **GitHub Repository**: [https://github.com/sandeepj-git567/mini-operations-erp](https://github.com/sandeepj-git567/mini-operations-erp)
- **Loom Video Demo**: [Watch the 5-minute Walkthrough](https://www.loom.com/share/7c7ed9a60d844a91bf2ee5117b44f4a9)
- **Video Walkthrough Artifact**: See [`walkthrough.md`](./walkthrough.md) with embedded animation video (`docs/mini_operations_erp_walkthrough.webp`).

---

## 🚀 Business Lifecycle Flow

```
LOGIN
  ↓
INVENTORY CONTROL
  ↓
WORK ORDER & STOCK CHECK
  ↓
INTERNAL TRANSFERS (SHORTAGE RESOLUTION)
  ↓
CUSTOMER SALES ORDER
  ↓
POSTGRESQL ATOMIC STOCK RESERVATION
```

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Socket.io Client.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, Zod Validation, JWT Authentication, bcryptjs, Socket.io Server, Swagger UI (`swagger-ui-express`).
- **Database**: PostgreSQL (Hosted on **Supabase**).
- **Testing**: Jest, Supertest, Newman CLI.
- **API Documentation**: OpenAPI 3.0 / Swagger (`/api/docs`) & Auto-generated Postman Collection (`/postman`).

---

## 🔑 Demo Accounts & Credentials

| Role | Email | Password | Allowed Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `Password123!` | Full System Control (Users, Inventory Adjustments, Work Orders, Transfers, Sales, Reservations) |
| **OPERATIONS_USER** | `operations@example.com` | `Password123!` | Inventory View/Adjust, Transfer Request/Dispatch/Receive, Work Order status management |
| **SALES_USER** | `sales@example.com` | `Password123!` | Inventory Availability view, Customer creation, Customer Orders, Stock Reservations & Order Cancellations |

---

## 🛡 Concurrency & Transaction Safety

The application guarantees inventory integrity under high-concurrency race conditions:

1. **PostgreSQL Row Locking (`FOR UPDATE`)**:
   Stock reservation requests execute inside a Prisma interactive transaction that locks the target `Inventory` row (`SELECT * FROM "Inventory" WHERE id = $1 FOR UPDATE`).
2. **Over-Reservation Prevention**:
   Available stock is computed as `physicalQuantity - reservedQuantity`. If requested quantity exceeds available stock, the transaction instantly rolls back and returns **HTTP 409 Conflict**.
3. **Atomic Transfers**:
   - `DISPATCHED`: Source location physical quantity decreases inside a transaction.
   - `RECEIVED`: Destination location physical quantity increases inside a transaction.
   - Prevents duplicate dispatches and duplicate receipts.
4. **Order Cancellation & Stock Release**:
   Cancelling an order automatically releases reserved stock back into available inventory with an audit log (`RELEASE`).

---

## 📡 Real-Time Synchronized Architecture

- **Socket.io Layer**: Connected clients receive instant WebSocket payloads whenever stock levels adjust, transfers change status, or customer orders reserve stock.
- **Multi-User Live Sync**: Open two browser windows (e.g., Admin and Sales) side-by-side to witness real-time stock deductions and badge status updates without refreshing the page!
- **Live Status Indicator**: A pulsing green badge in the navigation bar indicates active Socket.io connection (`Connected`).

---

## 🧪 Automated Testing

### 1. Backend Jest Test Suite
```bash
cd backend
npm test
```
Executes 10 comprehensive tests covering:
- Authentication & JWT token generation
- Role-based authorization enforcement (HTTP 403)
- Inventory stock adjustments
- Transfer state machine & duplicate action prevention (HTTP 409)
- Over-reservation rejection (HTTP 409)
- Order cancellation and reserved stock release
- Concurrent stock reservation race conditions

### 2. Newman Postman Test Suite
```bash
npx newman run postman/Mini-Operations-ERP.postman_collection.json -e postman/Mini-Operations-ERP.postman_environment.json
```
Executes **47 API requests and 52 test assertions** with **100% PASS** results.

---

## ⚡ Local Setup Instructions

### 1. Environment Configuration

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres.lofxxcdrydodyvbtjooy:%40Sandeepj9660@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="mini-erp-super-secret-jwt-key-2026"
FRONTEND_URL="http://localhost:3000"
```

Create `frontend/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 2. Database Migration & Seeding

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Push Prisma schema to Supabase PostgreSQL
npx prisma db push

# Seed initial locations, demo users, categories, items, and inventories
npm run seed
```

### 3. Run Backend Server

```bash
npm run dev
```
- **Swagger Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 4. Run Frontend Application

```bash
cd ../frontend
npm run dev
```
Access the UI at [http://localhost:3000](http://localhost:3000).

---

## 📮 Postman Collection & Environment

Automated generator script:
```bash
node postman/generate_postman.js
```

Included Folders:
1. **Authentication** (Login Admin, Operations, Sales - auto-saves JWT tokens)
2. **Inventory** (Get Inventory, Single Item, Adjust Stock, Transactions)
3. **Work Orders** (List, Create, Get, Update Status)
4. **Transfers** (List, Create, Dispatch, Receive)
5. **Customers** (List, Create)
6. **Customer Orders** (List, Create, Get, Reserve, Cancel)
7. **Health** (Health Check)
8. **Negative Tests** (Over-reservation 409, Over-transfer 409, Duplicate dispatch 409, Duplicate receive 409, Invalid negative quantity 400, Unauthorized role access 403)
9. **FINAL BUSINESS FLOW** (15 sequential automated requests demonstrating the entire business lifecycle)

---

## 📐 ER Diagram & Database Schema

Detailed Entity-Relationship Diagram is located in [docs/ER-DIAGRAM.md](./docs/ER-DIAGRAM.md).
