# RECLAIM — Revenue Recovery Orchestration & Batch Recovery Intelligence

> **System Architecture Reference Document**  
> **Version:** 1.0.0 (Step 20 Complete)  
> **Status:** Verified & Deterministically Enforced

---

## 1. System Overview & Core Invariants

RECLAIM is an enterprise revenue recovery platform that orchestrates recovery operations across failed high-value transactions. Rather than processing cases in isolation or allowing uncontrolled agent execution, RECLAIM implements a strict, server-authoritative pipeline:

$$\text{DETECT} \longrightarrow \text{PRIORITIZE} \longrightarrow \text{AI RECOMMEND} \longrightarrow \text{POLICY CHECK} \longrightarrow \text{BOUNDED ACTION} \longrightarrow \text{EXECUTE} \longrightarrow \text{VERIFY} \longrightarrow \text{MEASURE} \longrightarrow \text{AUDIT}$$

```
                                      RECLAIM ORCHESTRATION PIPELINE
                                      
  [ Ingested Failed Cases ]
             │
             ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  PRIORITIZATION ENGINE (Server-Authoritative)                          │
  │  Deterministic Score (0–100) = Yield + Failure Recency + Retry State   │
  └────────────────────────────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             ▼                                                 ▼
  ┌─────────────────────────────────────┐         ┌───────────────────────────────┐
  │ ADVISORY AI LAYER                   │         │ READ-ONLY BATCH PREVIEW       │
  │ NVIDIA Nemotron 70B / Fallback      │         │ Zero Mutations, Zero DB Write │
  │ Batch Patterns, Strategy, Guardrails│         │ Yield vs Exposure Estimation  │
  └─────────────────────────────────────┘         └───────────────────────────────┘
             │                                                 │
             └─────────────────────────┬───────────────────────┘
                                       ▼
                       [ EXPLICIT USER AUTHORIZATION ]
                                       │
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  EXECUTION PIPELINE (Under DB Row Locks `with_for_update`)             │
  │  1. Fresh Policy Revalidation (Stale Plan Protection)                  │
  │  2. Dual-Level Idempotency (`Idempotency-Key` Batch + Case)            │
  │  3. Provider Execution (Razorpay Test Mode / Simulated)                │
  │  4. Authoritative Settlement Verification                              │
  └────────────────────────────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────┬───────────────────────────────┐
             ▼                                 ▼                               ▼
  ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
  │  VERIFIED SETTLEMENT  │       │  TIMEOUT / PENDING    │       │  POLICY / GATE DECLINE│
  │  Credit Recovered ₹   │       │  Pending (₹ NOT cred.)│       │  Blocked / Failed     │
  └───────────────────────┘       └───────────────────────┘       └───────────────────────┘
             │                                 │                               │
             └─────────────────────────────────┼───────────────────────────────┘
                                               ▼
                                  [ IMMUTABLE AUDIT LOG ]
```

### Critical Non-Negotiable Invariants:
1. **AI is strictly advisory**: AI (NVIDIA Nemotron 70B or fallback) **NEVER** moves money, modifies balances, creates orders, executes transactions, or bypasses policy guardrails.
2. **Deterministic Policy Precedence**: The backend deterministic policy engine is the sole authority governing transaction eligibility. Any policy check failure blocks automated execution regardless of AI confidence.
3. **Stale Plan Protection**: Every case is freshly re-evaluated against the active policy under database row locks (`SELECT FOR UPDATE`) at the exact millisecond of execution.
4. **Authoritative Financial Accounting**: `revenue_recovered` is credited **ONLY** upon cryptographic or provider-verified settlement (`verified` / `captured` / `paid`). Pending states, gateway timeouts, and estimates do not increase recovered revenue.
5. **Dual-Level Idempotency**: Execution enforces batch-level idempotency via the `Idempotency-Key` header and per-case transaction locking to prevent duplicate gateway operations.

---

## 2. Server-Authoritative Prioritization Engine

The Prioritization Engine ranks at-risk transactions deterministically on a $0\text{–}100$ scale using four grounded components:

| Component | Max Points | Rationale & Scoring Logic |
| :--- | :---: | :--- |
| **1. Base Yield Component** | $40$ pts | Computed as $\text{round}(40 \times \text{Recovery Probability})$. Direct mathematical reflection of expected yield. |
| **2. Failure Velocity Component** | $25$ pts | **Transient switch/network timeout** ($+25$ pts) $\to$ immediate recovery yield.<br>**Friction / decline** ($+15$ pts) $\to$ requires reminder or alternate link.<br>**Subscription mandate** ($+15$ pts) $\to$ scheduled retry viability.<br>**Fraud / risk signal** ($+0$ pts) $\to$ blocked. |
| **3. Freshness / Payment Age** | $15$ pts | **$< 15$ minutes** ($+15$ pts) $\to$ optimal recovery window.<br>**$< 24$ hours** ($+10$ pts).<br>**Older** ($+5$ pts). |
| **4. Retry Capacity Component** | $20$ pts | **0 retries** ($+20$ pts) $\to$ clean candidate.<br>**1 retry** ($+12$ pts).<br>**2 retries** ($+5$ pts).<br>**$\ge 3$ retries** ($+0$ pts) $\to$ policy ceiling reached. |

### Priority Tiers:
- **Critical** ($\ge 80$): High monetary value, high probability, transient error, 0 previous attempts.
- **High** ($60\text{–}79$): Standard recovery candidates within policy thresholds.
- **Medium** ($35\text{–}59$): Friction declines requiring customer engagement.
- **Low** ($< 35$ or Policy Blocked): High risk, low probability, or policy blocked cases.

---

## 3. Advisory AI Batch Intelligence Layer

The AI intelligence layer evaluates sanitized aggregate batch data:

### Sanitized Context Minimization:
- **Exposed**: Case counts, aggregate amount at risk, failure mode distributions, retry counts, policy limits.
- **Redacted**: Credentials, API keys, CVV, passwords, full DB rows, raw customer identity.

### Nemotron Output Contract (`AIBatchAnalysis`):
```json
{
  "summary": "Concise executive overview of failure concentration and viable yield.",
  "dominant_failure_patterns": ["UPI Timeout (12 cases)", "Bank Downtime (5 cases)"],
  "recommended_strategy": "Prioritize bounded gateway retries for transient declines; route high-risk cases to human review.",
  "priority_reason": "High expected recoverable yield (Amount × Probability) with zero prior retry attempts.",
  "risks": ["Do not exceed 24h customer communication ceiling"],
  "do_not_do": ["Do not execute automated retries on transactions exceeding autonomous amount limit"]
}
```

### Deterministic Fallback:
If the AI provider times out ($>10\text{s}$), returns malformed JSON, or the network is degraded, the platform instantly falls back to `DecisionEngine.analyze_batch` with `decision_source="DETERMINISTIC_FALLBACK"`.

---

## 4. Batch Lifecycle & API Endpoints

### 1. Recovery Queue (`GET /api/v1/recovery/queue`)
Returns server-authoritative queue items sorted by `priority_score` descending with summary metrics.
- Query parameters: `status`, `failure_type`, `priority`, `min_amount`, `max_amount`, `eligible_only`, `page`, `page_size`.

### 2. Read-Only Batch Preview (`POST /api/v1/recovery/batches/preview`)
- **Strictly read-only**: Does NOT create actions, orders, communications, or audit mutations.
- Evaluates candidate cases against policy, applies monetary exposure limits, and computes expected yield vs policy blocks.
- Returns `BatchPreviewResponse` with aggregate metrics, item priorities, and AI batch summary.

### 3. Authorized Batch Execution (`POST /api/v1/recovery/batches`)
- Requires `Idempotency-Key` header.
- Transitions batch through status machine: `PREVIEW` $\to$ `AUTHORIZED` $\to$ `RUNNING` $\to$ `COMPLETED` / `PARTIALLY_COMPLETED` / `FAILED` / `CANCELLED`.
- Acquires row locks (`SELECT FOR UPDATE`) on each case.
- Freshly validates active policy rules.
- Executes bounded provider actions and records cryptographic verification.

### 4. Batch Lookup & Cancellation
- `GET /api/v1/recovery/batches/{batch_id}`: Returns batch outcome and case item breakdown.
- `POST /api/v1/recovery/batches/{batch_id}/cancel`: Halts further processing of a running batch.

---

## 5. Authoritative Financial Accounting

RECLAIM enforces rigorous double-entry accounting guarantees:

$$\text{Actual Recovered Revenue} = \sum_{\text{cases}} \text{Amount}_{\text{case}} \quad \forall \text{ case with } \text{status} = \text{RECOVERED} \land \text{verification} = \text{verified}$$

1. **Expected Recoverable Yield** is a pre-execution planning estimate ($\text{Amount} \times \text{Probability}$).
2. **Actual Recovered Revenue** is credited **ONLY** upon confirmed settlement.
3. **Pending / Timeout Cases** do **NOT** increment recovered revenue.
4. **Duplicate prevention**: Case-level unique constraints (`uq_action_merchant_case` and `uq_action_merchant_key`) ensure cases cannot be double-debited.

---

## 6. Complete Verification Matrix

| Scenario | Expected Behavior | Verification Status |
| :--- | :--- | :---: |
| **Empty Queue** | Returns 200 with empty list and zeroed summary | **VERIFIED** |
| **Single Eligible Case** | Previews and executes recovery to verified settlement | **VERIFIED** |
| **Multiple Eligible Cases** | Executes batch, aggregates recovered ₹ authoritatively | **VERIFIED** |
| **Policy Blocked Cases** | Amount exceeding limit or fraud flag blocked with reason | **VERIFIED** |
| **Already Recovered Case** | Recorded as `SKIPPED` without double-debit | **VERIFIED** |
| **Duplicate Batch Execution** | Same `Idempotency-Key` returns existing batch idempotently | **VERIFIED** |
| **Overlapping Batches** | Concurrency locks prevent duplicate recovery of shared cases | **VERIFIED** |
| **Partial Success Representation** | Mixed outcomes accurately yield `PARTIALLY_COMPLETED` status | **VERIFIED** |
| **Provider Failure** | Declines transition to `FAILED` without crediting revenue | **VERIFIED** |
| **Gateway Timeout / Pending** | Transitions to `PENDING`; revenue remains uncredited | **VERIFIED** |
| **Monetary Exposure Cap** | Batch caps case selection to `max_monetary_exposure_minor` | **VERIFIED** |
| **Stale Plan / Policy Change** | Execution revalidates policy at runtime under row lock | **VERIFIED** |
| **AI Fallback** | Deterministic fallback invoked on AI timeout or invalid JSON | **VERIFIED** |
| **Preview Read-Only Invariant** | Preview generates zero DB actions, orders, or audit events | **VERIFIED** |
| **Financial Accounting Integrity** | Only verified recoveries increase dashboard metrics | **VERIFIED** |
| **Evaluation Isolation** | Evaluation runs remain isolated from production batches | **VERIFIED** |

---

## 7. Operational Runbook

### 5-Minute Batch Recovery Demo Flow:
1. Open **Revenue at Risk Explorer** (`/at-risk`).
2. Click **"Select Eligible"** to select high-yield policy-eligible transactions.
3. Click **"Batch Intelligence & Authorize"** in the floating action bar.
4. Inspect the **Nemotron Batch Summary**, dominant failure patterns, and estimated recoverable yield.
5. Click **"Authorize Batch Recovery Execution"**.
6. Observe real-time item execution, authoritative revenue settlement, and links to the immutable Audit Trail (`/audit`).
