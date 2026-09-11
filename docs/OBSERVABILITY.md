# SYSTEM OBSERVABILITY, STRUCTURED LOGGING & HEALTH DIAGNOSTICS

This document details the observability architecture, request correlation ID propagation, structured JSON log formatting, system health check diagnostic endpoints, and cloud log aggregation practices for the **Mini Operations ERP** platform.

Target Docker Hub Repository: `sandeepj07/mini-operations-erp-backend`

---

## 1. Observability Architecture Overview

Modern distributed applications require end-to-end visibility across requests to diagnose latency bottlenecks, track error rates, and monitor infrastructure health.

```
Incoming Client Request
  │ (Optional Header: X-Request-ID)
  ▼
┌────────────────────────────────────────────────────────┐
│ 1. Request Correlation Middleware                      │
│ ├─ Extracts or generates UUID v4 Correlation ID        │
│ └─ Sets X-Request-ID response header                   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Structured Application Logger                       │
│ ├─ Formats log output as JSON in production            │
│ ├─ Binds Correlation ID to all log events              │
│ └─ Tracks HTTP status, duration (ms), IP, User ID      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Cloud Log Aggregation & Health Monitoring           │
│ ├─ AWS CloudWatch / Datadog / Grafana Loki Ingestion   │
│ └─ GET /api/health Probe (DB Latency, RSS/Heap)       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Request Correlation IDs (`X-Request-ID`)

### Implementation
The correlation middleware in [`backend/src/middleware/requestLogger.middleware.ts`](file:///d:/mini-operations-erp/backend/src/middleware/requestLogger.middleware.ts) intercepts every incoming HTTP request:

1. Checks if the client or upstream proxy (e.g. AWS ALB, NGINX, Cloudflare) passed an existing `X-Request-ID` header.
2. If absent, generates a crypto-random UUID v4 (`randomUUID()`).
3. Attaches `req.requestId` to the Express request object and sets the response header `X-Request-ID`.

### Client Response Header Example
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: e2401244-5250-45ad-b2ac-863acd70771a
Date: Sat, 12 Sep 2026 00:00:00 GMT
```

---

## 3. Production Structured JSON Logging

In development (`NODE_ENV=development`), logs are formatted with human-readable timestamps and color-coded tags. In production (`NODE_ENV=production`), logs are emitted as single-line JSON strings to stdout/stderr for automated parsing by log aggregators (e.g., Datadog, AWS CloudWatch Logs, ELK Stack).

### JSON Log Payload Schema (`backend/src/utils/logger.ts`)

```json
{
  "timestamp": "2026-09-12T00:00:00.123Z",
  "level": "info",
  "message": "HTTP POST /api/orders/reserve 200 - 45ms",
  "requestId": "e2401244-5250-45ad-b2ac-863acd70771a",
  "meta": {
    "method": "POST",
    "url": "/api/orders/reserve",
    "statusCode": 200,
    "durationMs": 45,
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0 ...",
    "userId": "usr_sales_123",
    "role": "SALES_REPRESENTATIVE"
  }
}
```

### Error Log Payload Schema
```json
{
  "timestamp": "2026-09-12T00:01:10.456Z",
  "level": "error",
  "message": "Insufficient available stock for reservation",
  "requestId": "a1b2c3d4-5678-90ef-1234-567890abcdef",
  "meta": {
    "statusCode": 409,
    "code": "STOCK_RESERVATION_CONFLICT"
  },
  "stack": "AppError: Insufficient available stock...\n    at ReservationService.reserveStock (file:///.../reservation.service.ts:42:13)"
}
```

---

## 4. Enhanced System Health Diagnostics (`/api/health`)

The health endpoint in [`backend/src/controllers/health.controller.ts`](file:///d:/mini-operations-erp/backend/src/controllers/health.controller.ts) performs active dependency checks rather than static responses.

### Sample Response (`GET /api/health` - HTTP 200 OK)
```json
{
  "status": "UP",
  "timestamp": "2026-09-12T00:02:00.000Z",
  "uptimeSeconds": 1420,
  "environment": "production",
  "database": {
    "status": "CONNECTED",
    "latencyMs": 4
  },
  "memory": {
    "rssMB": "78.45",
    "heapTotalMB": "45.12",
    "heapUsedMB": "31.89"
  },
  "totalResponseTimeMs": 6
}
```

### Container / Kubernetes Health Probe Configuration

#### Kubernetes Readiness & Liveness Probes
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 10
```

#### AWS ECS Container Healthcheck
```json
"healthCheck": {
  "command": [ "CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1" ],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 10
}
```
