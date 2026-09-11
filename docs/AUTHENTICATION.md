# AUTHENTICATION ARCHITECTURE & SPECIFICATION

This document describes the authentication flow, JSON Web Token (JWT) lifecycle, credential handling, and security mechanisms in the **Mini Operations ERP** platform.

---

## 1. Authentication Flow Diagram

```
User (Browser Client)
   │
   │ 1. POST /api/auth/login { email, password }
   ▼
[ Express Auth Controller ]
   │
   │ 2. Query User by email via Prisma
   ▼
[ PostgreSQL Database ]
   │
   │ 3. Return User record (id, email, passwordHash, role)
   ▼
[ Auth Service ] ──► Compare bcrypt hash (bcrypt.compare)
   │
   │ 4. Issue JWT Signed with env.JWT_SECRET (expiresIn: 24h)
   ▼
User Client ◄── Return { token, user } JSON Payload
   │
   │ 5. Client stores token in localStorage & attaches header:
   │    "Authorization: Bearer <token>" on subsequent API requests
   ▼
[ Express API Route Stack ]
   │
   │ 6. auth.middleware.ts verifies token (jwt.verify)
   │ 7. Attach decoded payload ({ userId, email, role, name }) to req.user
   ▼
[ RBAC Middleware (role.middleware.ts) ] ──► Verify allowed role
   │
   │ 8. Forward request to Controller & Service
   ▼
[ Business Domain Service ] ──► Complete ERP Operation
```

---

## 2. JWT Token Payload & Security Properties

* **Algorithm**: HMAC SHA-256 (`HS256`).
* **Expiration**: 24 hours (`expiresIn: '24h'`).
* **Secret Management**: Injected securely via `env.JWT_SECRET` (validated at startup via Zod).
* **Payload Structure**:
  ```json
  {
    "userId": "usr-uuid-101",
    "email": "admin@example.com",
    "role": "ADMIN",
    "name": "System Administrator",
    "iat": 1726080000,
    "exp": 1726166400
  }
  ```

> [!IMPORTANT]
> The JWT payload stores **only** non-sensitive identity metadata (`userId`, `email`, `role`, `name`). Sensitive credentials such as `passwordHash` or internal database keys are **never** included in JWT claims.

---

## 3. Middleware Token Processing (`auth.middleware.ts`)

1. **Missing Header Check**: If `Authorization` header is missing or does not start with `Bearer `, throws `UnauthorizedError('No authentication token provided')` (`HTTP 401`).
2. **Signature Verification**: Executes `jwt.verify(token, env.JWT_SECRET)`.
3. **Error Categorization**: If token is malformed (`JsonWebTokenError`) or expired (`TokenExpiredError`), converts the error to `UnauthorizedError('Invalid or expired authentication token')` (`HTTP 401`).
4. **Context Attachment**: Attaches the decoded `JwtPayload` object to Express `req.user`.

---

## 4. Frontend Authentication Integration

* **Token Storage**: On successful login (`POST /api/auth/login`), the frontend stores the returned JWT token string in `localStorage.setItem('token', token)`.
* **API Request Injection**: The centralized API client wrapper (`frontend/src/lib/api.ts`) automatically extracts the token from `localStorage` and appends `Authorization: Bearer <token>` to outbound HTTP headers.
* **Session Verification**: The `/api/auth/me` endpoint allows the frontend on page refresh to retrieve current user details and confirm token validity.
