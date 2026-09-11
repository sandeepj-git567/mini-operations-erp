# DATABASE TRANSACTIONS, CONCURRENCY & INDEXING STRATEGY

This document specifies the database transactions, concurrency safeguards, locking mechanisms, and index design in the **Mini Operations ERP** platform.

---

## 1. Concurrency Challenges in Inventory Management

Inventory data is highly vulnerable to concurrency race conditions when multiple users or systems interact simultaneously:

1. **Over-Reservation Race Condition**: Two sales users submit stock reservation requests for the same item at the same location concurrently. If stock checking is not atomic, both requests see sufficient inventory and succeed, causing physical inventory to drop below zero.
2. **Lost Update / Double Dispatch**: Two warehouse operators attempt to dispatch the same transfer request simultaneously. Without pessimistic row-level locking or atomic status transitions, both calls decrease source stock twice.
3. **Stale Inventory Views**: Real-time stock levels shown on client dashboards must reflect fully committed database transactions rather than uncommitted transient states.

---

## 2. Database Concurrency Control & Row Locking Strategy

To resolve race conditions without adding complex external locking services (such as Redis locks), the application uses **PostgreSQL Row-Level Locking (`FOR UPDATE`)** inside Prisma Interactive Transactions (`$transaction`).

```
Request A (Reserve Stock)               Request B (Reserve Stock)
       │                                       │
       ▼                                       ▼
BEGIN TRANSACTION A                     BEGIN TRANSACTION B
       │                                       │
SELECT * FROM "Inventory"               SELECT * FROM "Inventory"
WHERE id = 'inv-1' FOR UPDATE           WHERE id = 'inv-1' FOR UPDATE
   (Acquires Exclusive Lock)               (BLOCKED ── Waiting for Lock)
       │                                       │
Validate availableQty >= requested             │
Update reservedQuantity += qty                 │
Create Reservation & Audit Log                 │
COMMIT TRANSACTION A                           │
   (Releases Exclusive Lock) ─────────────────► Lock acquired by B
                                               Validate availableQty >= requested
                                               (Fails: availableQty insufficient)
                                               ROLLBACK TRANSACTION B
                                               Return HTTP 409 Conflict
```

### PostgreSQL Row Locking Code Pattern (`reservation.service.ts`)

```typescript
return prisma.$transaction(async (tx) => {
  // 1. Explicit Row Lock on target Inventory row
  await tx.$queryRaw`
    SELECT * FROM "Inventory" WHERE "id" = ${inv.id} FOR UPDATE
  `;

  // 2. Fetch locked record and compute available stock
  const lockedInv = await tx.inventory.findUnique({ where: { id: inv.id } });
  const available = lockedInv.physicalQuantity - lockedInv.reservedQuantity;

  // 3. Atomically enforce non-negative availability constraint
  if (requestedQuantity > available) {
    throw new ConflictError(`Over-reservation rejected: Requested ${requestedQuantity}, available ${available}`);
  }

  // 4. Update reservation and audit ledger...
});
```

---

## 3. Transaction Boundaries per Operation

### A. Stock Reservation (`reserveStockForOrder`)
* **Boundary**: Single Prisma interactive transaction across order verification, inventory row locking, reservation record creation, audit ledger logging (`RESERVE`), and order status update (`CONFIRMED`).
* **Failure Handling**: Any exception (e.g. over-reservation, missing inventory row) triggers an instant PostgreSQL `ROLLBACK`.

### B. Internal Transfer Dispatch (`dispatchTransfer`)
* **Boundary**: Atomic transaction verifying transfer status (`REQUESTED`), checking source location inventory availability, decreasing source physical stock, creating `TRANSFER_OUT` audit transaction, and setting transfer status to `DISPATCHED`.
* **Conflict Guard**: State machine checks prevent duplicate dispatches (`HTTP 409 Conflict`).

### C. Internal Transfer Receive (`receiveTransfer`)
* **Boundary**: Atomic transaction verifying transfer status (`DISPATCHED`), upserting destination inventory record, increasing destination physical stock, creating `TRANSFER_IN` audit transaction, and setting status to `RECEIVED`.
* **Conflict Guard**: State machine checks prevent duplicate receipts or receiving undispatched transfers (`HTTP 409 Conflict`).

### D. Order Cancellation (`cancelOrder`)
* **Boundary**: Atomic transaction releasing active reservations (`reservedQuantity -= quantity`), updating reservation status to `RELEASED`, logging `RELEASE` audit transactions, and updating order status to `CANCELLED`.

---

## 4. Index Optimization Strategy

To prevent full table sequential scans (`Seq Scan`) on large datasets, the following indexes are specified in `backend/prisma/schema.prisma`:

| Target Table | Index Signature | Rationale & Query Pattern |
| :--- | :--- | :--- |
| `Item` | `@@index([categoryId])` | Filters items by category (`GET /api/inventory?categoryId=...`). |
| `Inventory` | `@@unique([itemId, locationId])` | Enforces single inventory record per item-location pair; provides composite lookup. |
| `Inventory` | `@@index([locationId])` | Fast filtering of inventory levels by location (`GET /api/inventory?locationId=...`). |
| `InventoryTransaction` | `@@index([inventoryId, createdAt])` | Composite index for retrieving audit history of a specific item ordered by timestamp (`GET /api/inventory/:id/transactions`). |
| `WorkOrder` | `@@index([locationId, status])` | High-frequency query filtering work orders by warehouse location and status. |
| `WorkOrder` | `@@index([assignedUserId])` | Fast lookup of work orders assigned to a specific operations user. |
| `Transfer` | `@@index([status])` | Filter transfers by state (`REQUESTED`, `DISPATCHED`, `RECEIVED`). |
| `Transfer` | `@@index([sourceLocationId])`, `@@index([destinationLocationId])` | Fast lookup of warehouse transfer origins and destinations. |
| `CustomerOrder` | `@@index([customerId])`, `@@index([status])` | Lookups for customer order history and active orders. |
| `CustomerOrderItem` | `@@index([orderId])`, `@@index([itemId])` | Efficient join operations between orders and item detail rows. |
| `Reservation` | `@@index([inventoryId, status])` | Lookups for active stock reservations linked to specific inventory locations. |

---

## 5. ACID Compliance Summary

* **Atomicity**: Multi-step inventory modifications execute as all-or-nothing transactions. Failure on item #3 of a 5-item order rolls back changes to items #1 and #2 completely.
* **Consistency**: Quantities (`physicalQuantity`, `reservedQuantity`) satisfy invariant `availableQuantity = physicalQuantity - reservedQuantity >= 0`.
* **Isolation**: PostgreSQL `READ COMMITTED` + explicit `FOR UPDATE` row locks prevent dirty reads, non-repeatable reads, and race condition lost updates.
* **Durability**: Committed inventory transactions are written to PostgreSQL write-ahead logs (WAL).
