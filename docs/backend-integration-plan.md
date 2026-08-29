# RECLAIM — Backend & Full-Stack Integration Plan

This roadmap outlines the systematic transition from the standalone frontend prototype to the complete full-stack RECLAIM platform.

---

## 10-Phase Full-Stack Integration Roadmap

```
Phase 1: FastAPI Foundation
   ↓
Phase 2: PostgreSQL & Prisma/SQLAlchemy Schema
   ↓
Phase 3: Typed OpenAPI Contracts
   ↓
Phase 4: Frontend API Repository Adapters (Swap Mock Repositories)
   ↓
Phase 5: Razorpay Test Mode Gateway Integration
   ↓
Phase 6: Gemini Decision Intelligence (Layer 2)
   ↓
Phase 7: LangGraph Multi-Step Orchestration
   ↓
Phase 8: Real-Time Webhooks & Server-Sent Events (SSE)
   ↓
Phase 9: Merchant RBAC & Session Security
   ↓
Phase 10: Production Containerization & Cloud Deployment
```

---

### Phase 1: FastAPI Foundation
* Initialize Python 3.11+ FastAPI service under `backend/`.
* Configure CORS, structured error middleware, Pydantic v2 schemas, and health check endpoints (`/health`, `/metrics`).

### Phase 2: PostgreSQL Persistence
* Establish relational schemas mirroring domain types:
  * `merchants` (MID, business profile, role assignments)
  * `policies` & `policy_versions` (immutable snapshots)
  * `cases` (amounts in integer paise, life-cycle states, customer refs)
  * `audit_events` (append-only ledger)
  * `campaigns` & `communications` (delivery logs)

### Phase 3: OpenAPI API Contracts
* Expose standard REST endpoints:
  * `GET /api/v1/cases`, `GET /api/v1/cases/{id}`
  * `POST /api/v1/recovery/execute`
  * `GET /api/v1/policies/active`, `POST /api/v1/policies`, `POST /api/v1/policies/rollback`
  * `GET /api/v1/audit/events`
  * `GET /api/v1/campaigns`, `POST /api/v1/campaigns/{id}/run`

### Phase 4: Frontend API Repository Adapters
* Implement `ApiCaseRepository`, `ApiPolicyRepository`, `ApiAuditRepository` using `fetch` or `axios` against `APP_CONFIG.API_BASE_URL`.
* Update `ServiceFactory` to swap `MockCaseRepository` with `ApiCaseRepository` — **requiring ZERO UI component changes**.

### Phase 5: Razorpay Test Mode Gateway
* Connect Razorpay Python SDK (`razorpay-python`) with Test Mode keys.
* Implement server-side idempotency keys (`X-Idempotency-Key`) and signature verification (`X-Razorpay-Signature`).

### Phase 6: Gemini Decision Intelligence (Layer 2)
* Connect Google Gemini API to analyze complex multi-factor failure signals and generate natural-language merchant explainability.
* Bound LLM output with deterministic Layer 3 policy checks.

### Phase 7: LangGraph Strategy Orchestrator
* Deploy LangGraph state machine for multi-step recovery strategies, automatic retries, fallback routing, and stopping rules.

### Phase 8: Real-Time Webhooks & Telemetry
* Set up webhook receiver endpoint `/api/v1/webhooks/razorpay` to process `payment.captured`, `payment.failed`, and `subscription.charged` events.
* Stream live audit events and case transitions to frontend via Server-Sent Events (SSE) or WebSockets.

### Phase 9: Merchant RBAC & Auth
* Implement JWT/Session authentication with strict enforcement for `MERCHANT_ADMIN`, `OPERATOR`, and `VIEWER` roles.

### Phase 10: Production Deployment
* Docker multi-stage builds for Next.js frontend and FastAPI backend.
* Deployment to Google Cloud Run / GCP Kubernetes with managed Cloud SQL PostgreSQL.
