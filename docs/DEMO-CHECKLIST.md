# Mini Operations ERP - Final Recording Checklist

Use this checklist to ensure 100% readiness before recording your 5-8 minute Loom demo video.

---

## 📋 Pre-Recording Verification Items

- [x] **Admin Login**: Log in with `admin@example.com` / `Password123!`. Verify dashboard stats, inventory, work orders, transfers, customer orders.
- [x] **Inventory Metrics**: Verify `Available = Physical - Reserved` metric formula. Confirm live locations (Bangalore `BLR-WH-01` & Chennai `MAA-WH-01`).
- [x] **Work Order Shortage**: Create a work order requiring 60 units (when available = 40). Verify dynamic `Shortage = 20` display.
- [x] **Internal Stock Transfer**: Create transfer from Bangalore to Chennai for 20 units. Verify state machine: `REQUESTED` ➔ `DISPATCHED` (source stock drops) ➔ `RECEIVED` (destination stock rises).
- [x] **Customer Order & Reservation**: Log in as `sales@example.com`. Create customer order, click **Reserve Stock**, verify physical/reserved/available balances update.
- [x] **Over-Reservation Rejection (HTTP 409)**: Attempt reserving 10,000 units. Verify backend returns `409 Conflict - Insufficient available stock`.
- [x] **Authorization Enforcement (HTTP 403)**: Attempt restricted action with `SALES_USER`. Verify backend returns `403 Forbidden`.
- [x] **Real-time Multi-Browser Sync**: Open 2 browser windows side-by-side. Perform stock adjustment in Window 1, verify Window 2 updates live via Socket.io without page refresh.
- [x] **Postman Collection**: Verify `/postman/Mini-Operations-ERP.postman_collection.json` with 52 passing assertions (or via [Live Postman Workspace](https://sandeep-4675570.postman.co/workspace/mini-operations-erp/run/44214802-9182537c-7f6b-401d-b24a-dc4f09c2c4e5?action=share&creator=44214802&active-environment=44214802-4e272975-6ee4-462e-8961-6ba1a1a31f37)).
- [x] **Swagger UI**: Verify OpenAPI 3.0 docs accessible at `/api/docs/`.
- [x] **Health Check**: Verify `/api/health` returns `{"status": "UP", "database": "CONNECTED"}`.
- [x] **Production Deployment**: Verify live deployment on Vercel frontend (`mini-operations-erp-frontend.vercel.app`) and Render backend (`mini-operations-erp-backend-l7sh.onrender.com`).
