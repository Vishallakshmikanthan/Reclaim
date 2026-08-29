# RECLAIM — Recovery Effectiveness, Measurement & Evidence Architecture

> **Server-Authoritative Metrics & Accounting Reference**  
> **Version:** 1.0.0 (Step 21 Complete)  
> **Status:** Persisted, Audited & Cryptographically Verified

---

## 1. Core Measurement Philosophy & Anti-Fabrication Rule

RECLAIM enforces rigorous, server-authoritative accounting standards for revenue recovery:

$$\text{DETECT} \longrightarrow \text{PRIORITIZE} \longrightarrow \text{AI RECOMMEND} \longrightarrow \text{POLICY CHECK} \longrightarrow \text{BOUNDED ACTION} \longrightarrow \text{EXECUTE} \longrightarrow \text{VERIFY} \longrightarrow \text{MEASURE} \longrightarrow \text{AUDIT}$$

### Strict Anti-Fabrication Principles:
1. **No Invented Baselines**: Performance is never compared against fictitious numbers. All baselines are either mathematical ground truths or evaluated on identical held-out test datasets under identical policy constraints.
2. **Authoritative Financial Crediting**: `recovered_revenue` is credited **ONLY** upon cryptographically verified or provider-confirmed settlement (`captured`, `paid`, `verified`).
3. **Pending / Timeout Uncredited**: Gateway timeouts, pending mandates, and payment links awaiting webhook confirmation do **NOT** increment recovered revenue.
4. **Transparent Sample Sizes**: Every recovery rate displays its explicit sample size ($n = \text{attempts}$) to prevent small-sample overclaims (e.g. `100% recovery rate (n=1)`).
5. **No Double-Counting**: A single recovery action, duplicate webhook, replay attack, or reconciliation job cannot credit revenue more than once.

---

## 2. Server-Authoritative Metric Dictionary

All monetary figures are stored and calculated in integer minor units (paise for INR; $\text{₹}1 = 100\text{ paise}$).

| Metric Name | Database Source / Query | Mathematical Formula | Denominator Definition | Limitations & Assumptions |
| :--- | :--- | :--- | :--- | :--- |
| **`revenue_at_risk_minor`** | `SUM(payments.amount_minor)` across all ingested decline cases | $\sum_{i \in \text{Cases}} \text{Amount}_i$ | N/A (Absolute sum) | Represents total gross failed transaction exposure across integrated payment channels. |
| **`eligible_revenue_minor`** | `SUM(c.amount)` for unrecovered cases where `PolicyEngine.validate(c).allowed == True` | $\sum_{i \in \text{Eligible}} \text{Amount}_i$ | N/A (Absolute sum) | Calculated dynamically against the current active policy configuration version. |
| **`policy_blocked_revenue_minor`** | `SUM(c.amount)` for unrecovered cases where `PolicyEngine.validate(c).allowed == False` | $\sum_{i \in \text{Blocked}} \text{Amount}_i$ | N/A (Absolute sum) | Captures cases blocked due to max retries, risk score ceiling, autonomous amount limits, or contact limits. |
| **`attempted_recovery_minor`** | `SUM(recovery_actions.amount_minor)` for actions initiated | $\sum_{i \in \text{Actions}} \text{Amount}_i$ | N/A (Absolute sum) | Reflects capital exposure actively routed through payment gateways or reminder channels. |
| **`recovered_revenue_minor`** | `SUM(cases.recovered_amount_minor)` where `cases.status == 'recovered'` | $\sum_{i \in \text{Recovered}} \text{Amount}_i$ | N/A (Authoritative ledger) | **Authoritative settlement only.** Requires provider verification (`captured`, `verified`, `paid`). |
| **`remaining_revenue_at_risk_minor`** | Authoritative difference | $\max(0, \text{AtRisk} - \text{Recovered})$ | N/A | Server-authoritative unrecovered balance remaining at risk. |
| **`case_recovery_rate`** | Cases aggregate query | $\frac{\text{Recovered Cases}}{\text{Attempted Cases}} \times 100$ | **`recovered_cases / attempted_cases`** | Explicitly scoped to attempted transactions; unattempted cases do not artificially deflate rate. |
| **`revenue_recovery_rate`** | Financial aggregate query | $\frac{\text{Recovered Revenue Minor}}{\text{Attempted Revenue Minor}} \times 100$ | **`recovered_revenue_minor / attempted_revenue_minor`** | Expresses monetary yield efficiency per rupee attempted under policy locks. |
| **`policy_block_rate`** | Governance aggregate query | $\frac{\text{Blocked Cases}}{\text{Total Cases}} \times 100$ | **`blocked_cases / total_cases`** | Measures safety engine governance coverage. |

---

## 3. End-to-End Recovery Funnel

The Recovery Funnel partitions gross payment failure exposure into mutually exclusive, exhaustive accounting stages:

```
  [ Gross Revenue At Risk (₹) ]
                │
                ├─────────────────────────────────────────────────┐
                ▼                                                 ▼
  ┌───────────────────────────────┐                 ┌───────────────────────────────┐
  │  POLICY ELIGIBLE (₹)          │                 │  POLICY BLOCKED (₹)           │
  │  Passing autonomous bounds    │                 │  Max retries, fraud, ceilings │
  └───────────────────────────────┘                 └───────────────────────────────┘
                │
                ▼
  ┌───────────────────────────────┐
  │  RECOVERY ATTEMPTED (₹)       │
  │  Row-locked gateway execution │
  └───────────────────────────────┘
                │
                ├─────────────────────────────────┬───────────────────────────────┐
                ▼                                 ▼                               ▼
  ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
  │  VERIFIED RECOVERED (₹)       │ │  PENDING SETTLEMENT (₹)       │ │  PROVIDER DECLINED (₹)        │
  │  Authoritative funds captured │ │  Gateway timeout / links      │ │  Issuer switch terminal decl. │
  │  (Credited to Dashboard)      │ │  (UNCREDITED to revenue)      │ │  (Logged as Failed)           │
  └───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘
```

### Stage Summary:
1. **Stage 1: Revenue At Risk**: Total gross declines ingested.
2. **Stage 2: Policy Eligible**: Transactions satisfying active autonomous amount limits, retry ceilings, and risk thresholds.
3. **Stage 3: Recovery Attempted**: Transactions with active provider execution or payment dispatch.
4. **Stage 4: Verified Recovered**: Authoritative settlements verified cryptographically or by webhook.
5. **Branch A: Policy Blocked**: Safely restrained to prevent chargebacks and customer spam.
6. **Branch B: Provider Declined**: Terminal failures from issuer banks.
7. **Branch C: Pending Settlement**: Timeouts awaiting webhook reconciliation (uncredited).

---

## 4. Intervention-Level Effectiveness Breakdown

Every intervention channel records performance with explicit sample sizes:

```json
{
  "intervention": "retry_payment",
  "sample_size": 24,
  "attempts": 24,
  "successes": 19,
  "failures": 4,
  "pending": 1,
  "revenue_attempted_minor": 3600000,
  "revenue_recovered_minor": 2850000,
  "recovery_rate": 79.2,
  "recovery_rate_label": "recovered / attempted (n=24)"
}
```

---

## 5. Dual Reconciliation Guarantees

RECLAIM enforces automated mathematical reconciliation tests in its continuous verification pipeline:

### 1. Dashboard Financial Reconciliation
$$\sum_{i \in \text{Cases}} \text{case.recovered\_amount\_minor} \equiv \text{DashboardMetrics.revenue\_recovered}$$
- **Verification Rule**: The dashboard revenue figure must exactly equal the sum of individually verified recovered case records in PostgreSQL.

### 2. Batch Financial Reconciliation
$$\sum_{j \in \text{BatchItems}, \text{status}=\text{RECOVERED}} \text{item.amount\_minor} \equiv \text{RecoveryBatch.recovered\_revenue\_minor}$$
- **Verification Rule**: For any completed batch, the sum of recovered batch item amounts must exactly equal the batch's authoritative recovered revenue.

### 3. Duplicate Prevention & Replay Protection
- **Action Idempotency**: `uq_action_merchant_key` unique constraint ensures an `Idempotency-Key` cannot create duplicate recovery actions.
- **Webhook Replay Protection**: `uq_webhook_merchant_event` prevents duplicate webhook deliveries from double-crediting case balances.
- **Batch Idempotency**: `uq_batch_merchant_idempotency_key` ensures identical batch execution requests return the existing execution outcome without re-running operations.

---

## 6. Controlled Offline Evaluation Benchmark

To demonstrate AI efficacy without contaminating production operations, RECLAIM provides a controlled offline evaluation benchmark comparing the **Deterministic Policy Baseline** against **Nemotron-Assisted Intelligence**:

### Experimental Setup:
- **Dataset**: Isolated held-out benchmark ($n=50$) with synthetic payment decline events and ground-truth recoverability labels.
- **Constraints**: Both strategies receive identical cases, identical policy thresholds ($\text{max\_retries}=3$, $\text{max\_amount}=\text{₹}10,000$, $\text{max\_contacts}=2$), and identical simulated issuer environments.
- **Policy Violations**: Must strictly remain $0$ across both strategies.

### Benchmark Output Schema (`ControlledEvaluationResponse`):
```json
{
  "dataset_name": "Held-Out Synthetic Payment Decline Benchmark",
  "sample_size": 50,
  "dataset_total_revenue_minor": 12437500,
  "deterministic_baseline": {
    "strategy_name": "Deterministic Rules Baseline",
    "sample_size": 50,
    "cases_attempted": 45,
    "cases_recovered": 35,
    "cases_blocked": 5,
    "cases_failed": 10,
    "recovered_revenue_minor": 8575000,
    "attempted_revenue_minor": 11250000,
    "recovery_rate": 77.8,
    "revenue_recovery_rate": 76.2,
    "policy_violations": 0
  },
  "nemotron_assisted": {
    "strategy_name": "Nemotron-Assisted Intelligence",
    "sample_size": 50,
    "cases_attempted": 45,
    "cases_recovered": 38,
    "cases_blocked": 5,
    "cases_failed": 7,
    "recovered_revenue_minor": 9325000,
    "attempted_revenue_minor": 11250000,
    "recovery_rate": 84.4,
    "revenue_recovery_rate": 82.9,
    "policy_violations": 0
  },
  "absolute_revenue_lift_minor": 750000,
  "relative_revenue_lift_pct": 8.7,
  "absolute_case_lift": 3,
  "policy_violations": 0,
  "evaluation_mode": "OFFLINE_HELD_OUT_SYNTHETIC",
  "limitations": [
    "Evaluated on an isolated held-out synthetic test dataset with ground-truth recoverability labels (n=50).",
    "Live merchant performance will vary based on issuer authorization velocity and merchant-specific customer engagement.",
    "Both strategies were evaluated under identical policy constraints (max retries, risk score limits, autonomous amount caps)."
  ]
}
```

---

## 7. Cryptographic & Audit Traceability

Every recovered rupee is traceable through an unbroken audit chain:

$$\text{Case ID} \longrightarrow \text{Recovery Action ID} \longrightarrow \text{Provider Reference} \longrightarrow \text{Verification Event} \longrightarrow \text{Ledger Settlement}$$

Endpoints for trace inspection:
- `GET /api/v1/cases/{case_id}/trace`: Returns case timeline, provider payment ID, signature verification status, and audit log entries.
- `GET /api/v1/recovery/batches/{batch_id}/trace`: Returns batch item reconciliation ledger, provider references, and financial audit proofs.
