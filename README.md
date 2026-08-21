# Mini Operations ERP

A production-grade, real-time **Mini Operations ERP** system built with Next.js, Express.js (TypeScript), Prisma ORM, Supabase PostgreSQL, and Socket.io.

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

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Socket.io Client.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, Zod Validation, JWT Authentication, bcryptjs, Socket.io Server, Swagger UI (`swagger-ui-express`).
- **Database**: PostgreSQL (Hosted on **Supabase**).
- **Testing**: Jest, Supertest.
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
- **No Page Refresh Needed**: Connected browser windows update inventory tables and status badges in real-time.
- **Live Status Indicator**: A pulsing green badge in the navigation bar indicates active Socket.io connection.

---

## ⚡ Local Setup Instructions

### 1. Prerequisites
- Node.js v18+ & npm
- PostgreSQL Database or Supabase URL

### 2. Environment Configuration

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

### 3. Database Migration & Seeding

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

### 4. Run Backend Server

```bash
# Start backend dev server on http://localhost:5000
npm run dev
```
- **Swagger Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 5. Run Frontend Application

```bash
# Navigate to frontend in a new terminal
cd ../frontend

# Install dependencies
npm install

# Start Next.js dev server on http://localhost:3000
npm run dev
```
Access the UI at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Automated Tests

```bash
cd backend
npm test
```
The Jest test suite executes 10 comprehensive tests covering:
- Authentication & JWT token generation
- Role-based authorization enforcement (HTTP 403)
- Inventory stock adjustments
- Transfer state machine & duplicate action prevention (HTTP 409)
- Over-reservation rejection (HTTP 409)
- Order cancellation and reserved stock release
- Concurrent stock reservation race conditions

---

## 📮 Postman Collection & Environment

The project includes an automated generator script that builds the complete Postman collection and environment based on actual implemented API routes:

```bash
# Generate Postman files
node postman/generate_postman.js
```

Generated files:
- `postman/Mini-Operations-ERP.postman_collection.json`
- `postman/Mini-Operations-ERP.postman_environment.json`

### Included Folders:
1. **Authentication** (Login Admin, Operations, Sales - automatically saves `adminToken`, `operationsToken`, `salesToken`)
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

Detailed Entity-Relationship Diagram is located in [docs/ER-DIAGRAM.md](file:///d:/mini-operations-erp/docs/ER-DIAGRAM.md).

---

## ☁ Deployment Instructions

- **Frontend**: Deploy to **Vercel** (`NEXT_PUBLIC_API_URL` pointing to Render backend).
- **Backend**: Deploy to **Render** (`PORT=5000`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`).
- **Database**: Hosted on **Supabase PostgreSQL**.
