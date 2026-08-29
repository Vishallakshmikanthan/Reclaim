# RECLAIM — Architecture & Clean Boundaries Specification

## 1. System Overview

**RECLAIM** is an intelligent, deterministic revenue-recovery operating system designed for modern Indian payment gateways (Razorpay, UPI, Cards, Subscriptions, Mandates). It operates across 6 bounded layers:

```
[Layer 0: Ingestion]  Webhook & telemetry capture (Payment drop, Mandate failure)
       ↓
[Layer 1: Risk & ML]  Failure classification & recovery probability scoring
       ↓
[Layer 2: Decision]   Multi-step intervention orchestration & fallback strategies
       ↓
[Layer 3: Policy]     Deterministic guardrails & safety invariants (Merchant limits)
       ↓
[Layer 4: Executor]   Idempotent dispatch via Razorpay Test API & Channels (WhatsApp/SMS)
       ↓
[Layer 5: Verify]     Webhook telemetry reconciliation, immutable audit ledger & ledger settlement
```

---

## 2. Frontend Layering & Feature Boundaries

The frontend follows a clean, decoupled architecture where presentation components know **nothing** about low-level storage, gateway calls, or raw policy formulas:

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 14 UI Pages                   │
│   (Command Center, Cases, Strategy, Campaigns, Audit)   │
└───────────────────────────┬────────────────────────────┘
                            │ (UI Events & Hooks)
┌───────────────────────────▼────────────────────────────┐
│              Reclaim Context & State Store              │
│       (Unified State: Cases, Policies, Metrics)        │
└───────────────────────────┬────────────────────────────┘
                            │ (Domain Calls)
┌───────────────────────────▼────────────────────────────┐
│                 Domain & Service Layer                  │
│  ├── Case State Machine (Life-cycle Invariants)        │
│  ├── Policy Engine (Configurable Limits & Gates)       │
│  ├── Safety Controller (Chaos & Dependency Gates)      │
│  ├── Strategy Engine (Multi-Step Fallbacks)            │
│  └── Metrics & Minor-Unit Financial Arithmetic         │
└───────────────────────────┬────────────────────────────┘
                            │ (Abstract Interfaces)
┌───────────────────────────▼────────────────────────────┐
│               Repository & Executor Contracts           │
│  ├── ICaseRepository                                   │
│  ├── IPolicyRepository & IMerchantRepository           │
│  ├── IAuditRepository                                  │
│  ├── ICampaignRepository & ICommunicationRepository    │
│  └── RecoveryExecutor & VerificationService            │
└───────────────────────────┬────────────────────────────┘
                            │ (Dependency Injection via ServiceFactory)
               ┌────────────┴────────────┐
               ▼                         ▼
      [Mock Implementations]     [Future FastAPI Clients]
      (BrowserStorage/Demo)       (PostgreSQL & Gateway)
```

---

## 3. Core Domain Models

### Case Model (`Case`)
* `id`: Unique Case ID (e.g. `RC-2024-081`)
* `amount`: Stored strictly as **Integer Minor Units** in Paise (e.g. `849900` for ₹8,499)
* `currency`: `INR`
* `status`: `atRisk` $\mid$ `inProgress` $\mid$ `executing` $\mid$ `recovered` $\mid$ `escalated` $\mid$ `stopped` $\mid$ `failed` $\mid$ `blocked` $\mid$ `pending`
* `failureType`: Categorized gateway reason (`UPI Timeout`, `Card Decline`, `Bank Downtime`, etc.)
* `retryCount`: Count of historical attempts
* `contactCount24h`: Count of customer communications in 24h

### Merchant Policy (`MerchantPolicy`)
* `version`: Version identifier (`v1`, `v2`, `v3`)
* `recoverySettings`: Master toggle (`automaticRecoveryEnabled`), channel switches
* `retryRules`: `maxRetries`, `minRetryIntervalMins`, `minRecoveryProbability`, `maxAutonomousAmountPaise`
* `communicationRules`: `preferredLanguage` (`Hinglish`/`English`), `maxContacts24h` cap, `cooldownHours`
* `escalationRules`: Auto-escalation thresholds

---

## 4. Key Invariants & Non-Bypassable Guarantees

1. **Deterministic Safety Invariants**:
   * No financial recovery without Policy Engine validation.
   * No recovery marked verified without Layer 5 gateway confirmation.
   * No recovery marked ₹ recovered under `OUTCOME_UNKNOWN` (zero false metric reporting).
   * Zero unverified actions when Audit or Verification services are degraded.
   * Active idempotency locking prevents rapid duplicate debits.
2. **Integer Arithmetic for Money**:
   * All currency conversions and calculations occur on paise integers.
   * Display formatters (`formatINR`) are applied only at the UI boundary.
3. **Traceable Versioning**:
   * Every executed action attributes its governing `policyVersion` in the immutable audit ledger.
   * Policy rollbacks create new forward versions (e.g. `v3` restoring `v1` snapshot) without mutating historical records.
# RECLAIM — Integrated Architecture (Step 17)

```text
Next.js 14 App Router
        ↓ (HTTP REST API with JSON mapping)
     FastAPI (/api/v1/*)
        ↓
Application Services & Deterministic Engines
        ↓
PostgreSQL Persistence (SQLAlchemy + Alembic)
```

## 5. End-to-End Integration & Data Integrity (Step 17D)

### Server-Authoritative Dashboard Metrics
* **Endpoint**: `GET /api/v1/dashboard/metrics`
* **Integrity Guarantee**: Metrics (`revenue_at_risk`, `revenue_recovered`, `recovery_rate`, `total_cases`, etc.) are computed globally from PostgreSQL records for the active merchant. Pagination or case filtering in the UI does not corrupt global business metrics.
* **Minor-Unit Accounting**: All monetary values are processed and stored as integer paise. Only verified recovered actions contribute to `revenue_recovered`.

### PostgreSQL Source of Truth
* The Next.js frontend has zero direct database credentials or Prisma runtime connections.
* All state (Cases, Policies, Campaigns, Communications, Audit Events, Dashboard Metrics) is fetched from and persisted to FastAPI/PostgreSQL.

### Evaluation Dataset Isolation
* Held-out evaluation datasets (`demo_scenario="EVAL"`) are isolated and never inflate live operational dashboard metrics.
* Running live recovery operations does not pollute evaluation benchmark data.

### Runtime Modes
* **Default Mode (`NEXT_PUBLIC_USE_MOCKS=false`)**: Full-stack HTTP communication with FastAPI.
* **Mock Mode (`NEXT_PUBLIC_USE_MOCKS=true`)**: Available strictly for isolated UI testing/development without backend services.

### Recovery Safety & Idempotency
* Every recovery action is gated by backend policy validation and requires a stable `Idempotency-Key` header.
* Duplicate execution requests are safely rejected or return existing verified state without double-crediting.
* Historical audit logs are append-only and ordered chronologically by backend timestamp.

### Known Scope Boundaries
* External Razorpay gateway API, Gemini, LangGraph, authentication, and WebSocket infrastructure remain deferred to subsequent steps. All operations use deterministic, truthful backend simulations with PostgreSQL persistence.

