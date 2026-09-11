# ADR-001: Decoupled Layered Architecture & Request Middleware Pipeline

## Status
**ACCEPTED**

## Context
The initial Mini Operations ERP backend had basic separation between Express routes, controllers, and services. However, controller methods contained repetitive `try/catch` error routing boilerplate, and Zod input validation was invoked imperatively inside controller bodies rather than declarative middleware pipelines. 

To prepare the application for flagship production quality suitable for the HENNGE Global Internship review, a clean, maintainable architectural strategy is needed that clarifies operational boundaries without introducing over-engineered abstraction layers (e.g. forced repository interfaces for simple Prisma calls).

## Decision
We adopt a clean, 5-layer decoupled architecture:

```
[ Client Request ]
       │
       ▼
1. Routes Pipeline (`src/routes/`)
       │ ──► Express Router definition
       ▼
2. Middleware Layer (`src/middleware/`)
       │ ──► Auth (`auth.middleware.ts`)
       │ ──► RBAC (`role.middleware.ts`)
       │ ──► Input Validation (`validate.middleware.ts`)
       ▼
3. Controllers (`src/controllers/`)
       │ ──► Wrapped in `asyncHandler` (no try/catch duplication)
       │ ──► Converts HTTP request parameters to domain service calls
       ▼
4. Domain Services (`src/services/`)
       │ ──► Encapsulates all ERP business logic & transaction boundaries
       ▼
5. Data Access / Persistence (`src/config/prisma.ts`)
       │ ──► Prisma ORM Client Singleton
       ▼
[ Supabase PostgreSQL ]
```

### Key Refactorings Implemented:
1. **Async Controller Wrapper (`asyncHandler.ts`)**: Replaces repetitive `try/catch` blocks across all controller actions, automatically routing rejected promises to centralized error middleware (`error.middleware.ts`).
2. **Declarative Request Validation Middleware (`validateRequest`)**: Injects Zod schema validation directly into the route pipeline before controller execution.
3. **Service Layer Purity**: Keeps all database queries and business logic inside dedicated static service classes (`AuthService`, `InventoryService`, `OrderService`, `ReservationService`, `TransferService`, `WorkOrderService`).

## Alternatives Considered
* **Introducing Full Repository Interfaces everywhere**: Rejected because Prisma Client already acts as an abstraction over raw SQL queries. Creating duplicate repository classes (`InventoryRepository`, `OrderRepository`) that merely delegate to `prisma.inventory` would add boilerplate without architectural benefit.
* **Inline Route Handlers**: Rejected because inline callbacks mix routing, HTTP formatting, and business logic into single files.

## Consequences & Trade-offs
### Positive Consequences:
* **Maintainability**: Controller methods are concise (3-6 lines each) and focused purely on HTTP parameter extraction and status response formatting.
* **Consistency**: Error handling is guaranteed via `asyncHandler` and `error.middleware.ts`.
* **Testability**: Services can be unit tested independently of Express HTTP request/response objects.

### Negative / Trade-offs:
* Indirection: Traceability from HTTP request to database table requires navigating from Route -> Middleware -> Controller -> Service -> Prisma.
