# TESTING STRATEGY & AUTOMATED VERIFICATION SPECIFICATION

This document outlines the testing methodology, automated test suites, test categories, edge case coverage, and execution commands for the **Mini Operations ERP** platform.

---

## 1. Testing Methodology & Principles

1. **Behavioral Verification Over Mocking**: Integration tests execute against real HTTP route stacks via Supertest to verify end-to-end request-response behavior, status codes, payload shapes, and database state transitions.
2. **Behavior Over Coverage Metrics**: Tests verify actual business rules (e.g. over-reservation rejection, duplicate transfer prevention, token validation) rather than inflating code line coverage percentages with superficial assertions.
3. **Multi-Layer Verification**:
   * **Unit / Integration Tests**: Jest + Supertest (`backend/tests/api.test.ts`).
   * **API Contract & Flow Tests**: Postman Collection (`postman/Mini-Operations-ERP.postman_collection.json`) executed via Newman CLI.

---

## 2. Test Suite Categories & Coverage Matrix

| Category | Endpoint / Subject | Key Scenarios & Edge Cases Tested | Expected Result |
| :--- | :--- | :--- | :--- |
| **Authentication** | `POST /api/auth/login` | Valid credentials | HTTP 200 OK + JWT Token |
| | | Invalid password | **HTTP 401 Unauthorized** |
| | `GET /api/auth/me` | Missing Authorization header | **HTTP 401 Unauthorized** |
| | | Malformed JWT string (`invalid.malformed.jwt`) | **HTTP 401 Unauthorized** |
| | | Valid Bearer JWT | HTTP 200 OK + User Object |
| **Authorization** | `POST /api/work-orders` | Sales user creating work order | **HTTP 403 Forbidden** |
| | `POST /api/orders` | Operations user creating customer order | **HTTP 403 Forbidden** |
| **Validation** | `POST /api/inventory/adjust` | Negative physical quantity (`-50`) | **HTTP 400 Bad Request** (`VALIDATION_ERROR`) |
| | `POST /api/transfers` | Transfer between identical source & dest locations | **HTTP 400 Bad Request** |
| **Error Handling** | `GET /api/orders/:id` | Non-existent UUID (`00000000-0000-...`) | **HTTP 404 Not Found** (`NOT_FOUND`) |
| **State Machine** | `POST /api/transfers/:id/dispatch` | First dispatch call | HTTP 200 OK (`DISPATCHED`) |
| | | Duplicate dispatch attempt | **HTTP 409 Conflict** |
| | `POST /api/transfers/:id/receive` | Receive dispatched transfer | HTTP 200 OK (`RECEIVED`) |
| | | Duplicate receive attempt | **HTTP 409 Conflict** |
| **Concurrency & Safety**| `POST /api/orders/:id/reserve` | Requested quantity > available stock | **HTTP 409 Conflict** (`Over-reservation rejected`) |
| | | Parallel reservation race conditions | Exclusive lock (`FOR UPDATE`) resolves collision cleanly |
| | `POST /api/orders/:id/cancel` | Order cancellation | Releases reserved stock & sets status `CANCELLED` |

---

## 3. Test Execution Commands

### 1. Execute Backend Jest Integration Test Suite
```bash
cd backend
npm test
```

### 2. Execute Newman Postman Test Suite (47 Requests / 52 Assertions)
```bash
npx newman run postman/Mini-Operations-ERP.postman_collection.json -e postman/Mini-Operations-ERP.postman_environment.json
```

### 3. Generate Fresh Postman Collection Script
```bash
node postman/generate_postman.js
```
