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
# Persistence architecture (Step 16)

```text
Next.js (existing mock services; no database access)
        |
     FastAPI
        |
Application services + deterministic engines
        |
Repository interfaces / PostgreSQL repositories
        |
PostgreSQL
```

`REPOSITORY_BACKEND=postgres` is the application default. In-memory repositories remain only for isolated tests and must not be used for a production-style startup. Each repository is merchant-scoped using the development-only `DEMO_MERCHANT_ID` placeholder until authentication arrives.
