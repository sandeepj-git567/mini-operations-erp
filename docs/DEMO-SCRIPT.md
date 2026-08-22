# Mini Operations ERP - 5-8 Minute Loom Demo Script

This script outlines the exact step-by-step narration and click sequence for a pristine 5-8 minute video presentation.

---

## ⏱️ Section 1: Overview & Admin Login (0:00 - 1:00)
- **Account**: `admin@example.com` / `Password123!`
- **Action**: Open [https://mini-operations-erp-frontend.vercel.app](https://mini-operations-erp-frontend.vercel.app), log in as Admin Manager.
- **Narrate**: 
  - Welcome to the Mini Operations ERP demonstration.
  - Point out the **Live WebSocket Connection Badge** (`CONNECTED`) in the top navigation bar.
  - Show the Admin Dashboard overview: total items, low stock warnings, open work orders, and inter-warehouse stock transfers.

---

## ⏱️ Section 2: Inventory & Stock Metrics (1:00 - 2:00)
- **Screen**: **Inventory Control** (`/inventory`)
- **Narrate**:
  - Point out the strict inventory formula: `Available Quantity = Physical Quantity - Reserved Quantity`.
  - Filter inventory by Location (Bangalore `BLR-WH-01` vs. Chennai `MAA-WH-01`).
  - Demonstrate a manual stock adjustment on item `ELEC-001` (+10 physical stock) and observe instant UI update and audit log record creation.

---

## ⏱️ Section 3: Work Order & Stock Shortage Calculation (2:00 - 3:00)
- **Screen**: **Work Orders** (`/work-orders`)
- **Action**: Click **Create Work Order**.
  - Target Location: `Bangalore Warehouse`
  - Item: `ELEC-001 (Smart Phone Component)`
  - Required Quantity: `60`
- **Narrate**:
  - Show the created Work Order status: `SHORTAGE`.
  - Highlight the exact real-time calculation: `Required = 60`, `Available = 40`, `Shortage = 20`.
  - Explain that this shortage calculation is driven dynamically by backend inventory levels.

---

## ⏱️ Section 4: Internal Stock Transfer & Transaction Safety (3:00 - 4:15)
- **Screen**: **Stock Transfers** (`/transfers`)
- **Action**: Create an internal transfer to resolve the shortage.
  - Source Location: `Bangalore Warehouse`
  - Destination Location: `Chennai Warehouse`
  - Item: `ELEC-001`
  - Quantity: `20`
- **Narrate Step-by-Step**:
  1. Status is initially `REQUESTED`.
  2. Click **Dispatch Transfer** ➔ Status changes to `DISPATCHED`. Source inventory decreases immediately inside a PostgreSQL transaction, while destination inventory does not increase yet.
  3. Click **Receive Transfer** ➔ Status changes to `RECEIVED`. Destination inventory increases inside a PostgreSQL transaction.

---

## ⏱️ Section 5: Customer Sales Order & Stock Reservation (4:15 - 5:15)
- **Action**: Switch to **Sales Manager** (`sales@example.com` / `Password123!`).
- **Screen**: **Customer Orders** (`/customer-orders`)
- **Action**: Create a new customer order for `Business Flow Corp` for 5 units of `ELEC-001`.
- **Click**: **Reserve Stock**.
- **Narrate**:
  - Observe how `Reserved Quantity` increases and `Available Quantity` decreases automatically.
  - Explain the PostgreSQL row-level lock (`SELECT ... FOR UPDATE`) executing inside a Prisma transaction to prevent race conditions.

---

## ⏱️ Section 6: Negative Tests - 409 Conflict & 403 Forbidden (5:15 - 6:30)
- **Over-Reservation Rejection (409 Conflict)**:
  - Attempt to reserve 10,000 units on a customer order.
  - Observe red error toast: `409 Conflict - Insufficient available stock`.
  - Explain that over-reservation is strictly enforced by PostgreSQL database constraints, not just frontend validation.
- **Role-Based Authorization Rejection (403 Forbidden)**:
  - While logged in as `sales@example.com`, attempt to submit a Work Order API call.
  - Observe response: `403 Forbidden - Role SALES_USER is not authorized`.
  - Highlight that security is enforced on the backend middleware layer.

---

## ⏱️ Section 7: Real-Time Multi-Browser Synchronization (6:30 - 7:30)
- **Action**: Place two browser windows side-by-side (Window 1: Admin, Window 2: Sales).
- **Demonstrate**:
  - In Admin browser, adjust stock or dispatch a transfer.
  - In Sales browser, watch the inventory table and badges update **instantly without refreshing the page**.
  - Show the green `Socket.io Connected` indicator in both windows.

---

## ⏱️ Section 8: OpenAPI Swagger & Postman Execution (7:30 - 8:00)
- **Swagger Docs**: Open `/api/docs/` showing interactive endpoints and schema definitions.
- **Health Check**: Open `/api/health` returning `{"status": "UP", "database": "CONNECTED"}`.
- **Postman**: Show the 15-step `FINAL BUSINESS FLOW` and negative test suite achieving 52/52 passing assertions via Newman CLI. Live workspace: [Postman Collection Run](https://sandeep-4675570.postman.co/workspace/mini-operations-erp/run/44214802-9182537c-7f6b-401d-b24a-dc4f09c2c4e5?action=share&creator=44214802&active-environment=44214802-4e272975-6ee4-462e-8961-6ba1a1a31f37)
