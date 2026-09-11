# REAL-TIME ARCHITECTURE & SOCKET.IO SPECIFICATION

This document outlines the real-time synchronized architecture, Socket.io connection lifecycle, event payloads, reconnection strategies, and post-commit event broadcasting rules in the **Mini Operations ERP** platform.

---

## 1. Real-Time Event Architecture & Post-Commit Guarantee

```
[ Client Request ]
       │
       ▼
[ Domain Service ] ──► BEGIN $transaction
       │                     │
       │                     ├─ Update Inventory Quantities
       │                     ├─ Create Audit Ledger Transactions
       │                     └─ Queue Events in pendingEvents[] Array
       │
[ PostgreSQL Database ] ──► COMMIT TRANSACTION SUCCESS
       │
       ▼
[ Realtime Broadcaster ] ──► Iterate pendingEvents[] & Emit Socket.io Events
       │
       ▼
[ Connected Browser Clients ] ──► Receive Payload & Re-render Stock UI State
```

> [!IMPORTANT]
> **Post-Commit Event Broadcast Rule**: Real-time WebSocket events are **never** emitted inside a database transaction block. Events are queued in a local memory array during transaction execution and broadcast via Socket.io **only after** PostgreSQL commits the transaction successfully. If a transaction fails or rolls back, zero events are emitted, preventing stale or phantom updates on connected client UIs.

---

## 2. Real-Time Event Specifications & Payloads

| Event Name | Triggering Operation | Payload Schema | Frontend Action |
| :--- | :--- | :--- | :--- |
| `INVENTORY_UPDATED` | Stock Adjustment, Transfer Dispatch/Receive, Stock Reservation, Order Cancel | `{ id, itemId, locationId, physicalQuantity, reservedQuantity, availableQuantity, updatedAt }` | Re-renders stock table rows & availability badges |
| `TRANSFER_CREATED` | New Warehouse Transfer Request | `{ id, transferNumber, sourceLocationId, destinationLocationId, quantity, status: 'REQUESTED' }` | Updates transfer list & badges |
| `TRANSFER_DISPATCHED` | Transfer Dispatched from Source | `{ id, status: 'DISPATCHED', dispatchedAt, ... }` | Re-renders transfer status badge |
| `TRANSFER_RECEIVED` | Transfer Received at Destination | `{ id, status: 'RECEIVED', receivedAt, ... }` | Re-renders transfer status badge |
| `ORDER_RESERVED` | Customer Order Stock Reserved | `{ id, orderNumber, status: 'CONFIRMED', ... }` | Updates order list state |
| `ORDER_CANCELLED` | Customer Order Cancelled | `{ id, orderNumber, status: 'CANCELLED', ... }` | Updates order list state |

---

## 3. Connection Lifecycle & Reconnection Strategy

### Connection Setup (`frontend/src/lib/socket.ts`)
* **Transport Protocol**: WebSockets preferred with fallback HTTP polling (`transports: ['websocket', 'polling']`).
* **Connection Indicator**: A pulsing green badge in the main navigation bar reflects active Socket.io connection state (`Connected` vs. `Disconnected`).
* **Reconnection Parameters**:
  - `reconnectionAttempts: 10`
  - `reconnectionDelay: 2000` (2 seconds exponential backoff)

### Stale Data Handling on Reconnect
When a browser client reconnects after network disconnection:
1. Socket.io `connect` listener fires.
2. The client automatically triggers a background refetch (`fetchInventory()`, `fetchTransfers()`) from the REST API to reconcile any events missed during the offline window.
