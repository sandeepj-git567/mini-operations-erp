# AUTHORIZATION & ROLE-BASED ACCESS CONTROL (RBAC) SPECIFICATION

This document outlines the Authorization model, Role-Based Access Control (RBAC) enforcement mechanisms, and Role/Permission Matrix for the **Mini Operations ERP** platform.

---

## 1. Role Definitions

The system defines 3 distinct user roles enforced at both database enum level (`Role`) and backend route middleware level:

1. **`ADMIN`**: System Administrators with unrestricted read/write access across all system modules (Users, Inventory Adjustments, Work Orders, Stock Transfers, Customers, Customer Orders, and Stock Reservations).
2. **`OPERATIONS_USER`**: Warehouse & Operations Personnel responsible for inventory stock management, internal warehouse transfers (Request, Dispatch, Receive), and Work Order execution.
3. **`SALES_USER`**: Sales Representatives responsible for managing Customer profiles, creating Sales Orders, reserving inventory stock for orders, and processing order cancellations.

---

## 2. Role / Permission Matrix

| Module / Endpoint | Action | `ADMIN` | `OPERATIONS_USER` | `SALES_USER` | HTTP Error on Denial |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Authentication** |
| `POST /api/auth/login` | Login & Obtain JWT | ✅ | ✅ | ✅ | N/A (Public) |
| `GET /api/auth/me` | Fetch Current User Profile | ✅ | ✅ | ✅ | 401 Unauthorized |
| **Inventory Control** |
| `GET /api/inventory` | View Stock Levels & Availability | ✅ | ✅ | ✅ | 401 Unauthorized |
| `GET /api/inventory/:id` | View Single Item Stock Detail | ✅ | ✅ | ✅ | 401 Unauthorized |
| `POST /api/inventory/adjust` | Physical Stock Intake / Manual Adjustment | ✅ | ✅ | ❌ | **403 Forbidden** |
| `GET /api/inventory/:id/transactions` | View Inventory Audit Ledger | ✅ | ✅ | ✅ | 401 Unauthorized |
| **Work Orders** |
| `GET /api/work-orders` | List Work Orders & Computed Shortage | ✅ | ✅ | ✅ | 401 Unauthorized |
| `POST /api/work-orders` | Create New Work Order | ✅ | ✅ | ❌ | **403 Forbidden** |
| `PATCH /api/work-orders/:id/status` | Update Work Order Status | ✅ | ✅ | ❌ | **403 Forbidden** |
| **Stock Transfers** |
| `GET /api/transfers` | List Internal Warehouse Transfers | ✅ | ✅ | ✅ | 401 Unauthorized |
| `POST /api/transfers` | Create Transfer Request | ✅ | ✅ | ❌ | **403 Forbidden** |
| `POST /api/transfers/:id/dispatch` | Dispatch Transfer (Deduct Source Stock) | ✅ | ✅ | ❌ | **403 Forbidden** |
| `POST /api/transfers/:id/receive` | Receive Transfer (Add Dest Stock) | ✅ | ✅ | ❌ | **403 Forbidden** |
| **Customers** |
| `GET /api/customers` | List Customers | ✅ | ✅ | ✅ | 401 Unauthorized |
| `POST /api/customers` | Register New Customer | ✅ | ❌ | ✅ | **403 Forbidden** |
| **Customer Orders & Stock Reservations** |
| `GET /api/orders` | List Customer Orders | ✅ | ✅ | ✅ | 401 Unauthorized |
| `POST /api/orders` | Create Customer Order | ✅ | ❌ | ✅ | **403 Forbidden** |
| `POST /api/orders/:id/reserve` | Reserve Inventory Stock for Order | ✅ | ❌ | ✅ | **403 Forbidden** |
| `POST /api/orders/:id/cancel` | Cancel Order & Release Stock | ✅ | ❌ | ✅ | **403 Forbidden** |

---

## 3. Backend Enforcement Architecture

> [!IMPORTANT]
> **Frontend Route Protection is NOT Security**. Client-side UI route guards or hidden buttons only improve user experience. All actual authorization decisions **MUST** take place on the Express backend via `role.middleware.ts`.

### Express Middleware Enforcement Example

```typescript
// backend/src/routes/inventory.routes.ts
router.post(
  '/adjust',
  authenticate,
  authorize([Role.ADMIN, Role.OPERATIONS_USER]),
  validateRequest(adjustInventorySchema),
  InventoryController.adjustInventory
);
```

### Access Denial Response (HTTP 403 Forbidden)

If a `SALES_USER` attempts to dispatch a warehouse stock transfer:

```json
{
  "error": {
    "message": "Role 'SALES_USER' is not authorized to perform this operation",
    "statusCode": 403,
    "code": "FORBIDDEN"
  }
}
```
