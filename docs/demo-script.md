# RECLAIM — Five-Minute Hackathon Demo Script & Judge Guide

## 1. Five-Minute Presentation Timeline

### 0:00 – 0:30 | The Problem
- **Opening Statement**: Payment failures in Indian digital commerce (UPI timeouts, bank downtimes, card declines) cause billions in lost revenue.
- **Traditional Approach**: Naive automated retries trigger cascade failures, customer fatigue, policy breaches, and excessive payment processing fees.
- **RECLAIM Solution**: Server-authoritative revenue recovery orchestration combining NVIDIA Nemotron advisory intelligence with deterministic policy guardrails and Razorpay Test Mode execution.

---

### 0:30 – 1:00 | Command Center
- **Screen**: `/` (Command Center)
- **What to show**:
  - **Revenue at Risk**: Total volume of failed transactions detected in payment stream.
  - **Recovered Revenue**: Strictly verified, server-authoritative settled funds (0 unverified revenue).
  - **Recovery Rate**: Ratio of settled vs attempted recovery cases.
  - **Operational Status**: Live cockpit displaying simulated/test provider mode and active AI fallback readiness.
- **Action**: Click the primary CTA: `[VIEW RECOVERY QUEUE]`.

---

### 1:00 – 1:30 | Recovery Queue & Triage
- **Screen**: `/at-risk` (Recovery Queue)
- **What to show**:
  - Triage table sorted by expected recovery value ($Expected = Amount \times Probability$).
  - Priority tiers (`Critical`, `High`, `Medium`, `Low`).
  - Clear failure reasons: UPI switch timeout, card decline, bank downtime, fraud anomalies.
  - Multi-select capability for batch review.
- **Action**: Click on a case (e.g. `case_demo_policy_block` or `case_demo_high_value`) to open the Case Detail drawer.

---

### 1:30 – 2:00 | AI Recommendation vs Policy Boundary
- **Screen**: Case Detail Drawer (`/cases/[id]`)
- **Key Demo Moment**: Demonstrating the AI safety boundary:
  1. **AI Layer (Nemotron / Fallback)**: Diagnoses root cause and recommends intervention (e.g. `RETRY_PAYMENT` or `CUSTOMER_REMINDER`) with explicit confidence and grounded evidence.
  2. **Truthful AI Badge**: Truthfully shows `AI — NVIDIA Nemotron` or `Deterministic fallback` (never a false badge).
  3. **Policy Engine (Authoritative Guardrail)**: Evaluates strict financial bounds:
     - Autonomous limit check ($\le \text{₹10,000.00}$)
     - Max retry count ($\le 3$)
     - Customer contact frequency ($\le 2 \text{ in 24h}$)
     - Risk anomaly score ($\le 0.6$)
  4. **Policy Block Demonstration**: For `case_demo_policy_block`, show that despite any retry advice, the Policy Engine marks it **BLOCKED** due to max retry threshold. No provider call or financial mutation occurs.

---

### 2:00 – 2:45 | Batch Intelligence & Authorization
- **Screen**: `/at-risk` -> Select 4 Cases -> Open Batch Recovery Drawer
- **Cases Selected**:
  1. `case_demo_high_value` (Recoverable UPI timeout)
  2. `case_demo_policy_block` (Exceeds retry policy)
  3. `case_demo_failure` (Simulated provider decline)
  4. `case_demo_pending` (Deferred bank verification)
- **What to show**:
  - Batch Preview summarizing total exposure, eligible revenue, and blocked revenue.
  - Batch AI analysis summarizing dominant failure patterns.
  - Explicit Merchant Authorization requirement before any money-moving actions execute.
- **Action**: Click `[Authorize & Execute Recovery Batch]`.

---

### 2:45 – 3:30 | Mixed Execution Outcomes & Financial Integrity
- **Screen**: Batch Outcome Screen
- **What to show**:
  - Truthful mixed outcomes:
    - `case_demo_high_value`: **RECOVERED** (₹9,800 credited with verified transaction ID)
    - `case_demo_policy_block`: **BLOCKED** (0 credited, blocked rules documented)
    - `case_demo_failure`: **FAILED** (0 credited, decline reason documented)
    - `case_demo_pending`: **PENDING** (0 credited, awaiting webhook/reconciliation)
  - Final Batch Status: **PARTIALLY_COMPLETED** (truthful partial success, not manufactured 100%).
  - Revenue Math: Authoritative recovered revenue incremented **only** by ₹9,800.

---

### 3:30 – 4:15 | Audit Ledger & Evidence Trace
- **Screen**: `/audit` or Batch Evidence Trace Link
- **What to show**:
  - Cryptographically ordered, immutable audit log events:
    `CASE_CREATED` $\rightarrow$ `AI_RECOMMENDATION` $\rightarrow$ `POLICY_VALIDATED` $\rightarrow$ `RECOVERY_ATTEMPTED` $\rightarrow$ `VERIFICATION_CONFIRMED` $\rightarrow$ `REVENUE_CREDITED`.
  - Evidence trace linking case ID, provider order ID, payment ID, verification status, and audit timestamps in a single unbroken chain.

---

### 4:15 – 4:45 | Controlled Offline Evaluation
- **Screen**: `/evaluation`
- **What to show**:
  - Clearly labeled **OFFLINE EVALUATION BENCHMARK** (strictly isolated from live operational metrics).
  - Sample size: $n = 50$ held-out cases with fixed ground truth.
  - Strategy A (Deterministic Baseline) vs Strategy B (Nemotron-Assisted).
  - Exact measured revenue uplift, recovery rate comparison, and policy violation count ($0$ violations across both strategies due to deterministic enforcement).

---

### 4:45 – 5:00 | Closing Summary
- **Summary**:
  - AI recommends.
  - Policy decides.
  - Backend executes.
  - Authoritative accounting verifies.
- RECLAIM is safe, deterministic, auditable, and production-ready for Indian digital payments.

---

## 2. Judge Talking Points & FAQ

### Q1: Why this problem?
**A**: In high-velocity payment systems like UPI, transient drop-offs (switch timeouts, bank downtimes) account for up to 60% of lost revenue. Unchecked retries cause customer churn and bank throttling; RECLAIM recovers lost revenue autonomously within strict policy bounds.

### Q2: Why AI and why NVIDIA Nemotron?
**A**: Payment failure context includes non-linear signals: error codes, customer velocity, mandate schedules, and past channel success rates. Nemotron (Llama-3.1-Nemotron-70B) excels at nuanced diagnosis and multi-factor triage, outputting structured JSON recommendations with explicit grounding evidence.

### Q3: Why not let the AI execute transactions directly?
**A**: Financial systems require absolute invariants. Language models are probabilistic and hallucination-prone. In RECLAIM:
- AI is strictly advisory.
- Policy Engine is deterministic and server-authoritative.
- The AI has no API access to payment gateways, cannot move funds, cannot bypass policy rules, and cannot modify financial ledgers.

### Q4: How is merchant money protected?
**A**: Through 4 distinct safety layers:
1. **Deterministic Policy Engine**: Enforces hard caps on autonomous amounts ($\le \text{₹10,000}$ default), retry counts ($\le 3$), and contact frequency ($\le 2/\text{day}$).
2. **Idempotency Keys**: Every batch and recovery request requires a unique idempotency key; rapid double clicks cannot double-charge or double-credit.
3. **Database-Level Locks**: Postgres `with_for_update` prevents race conditions across concurrent webhook and user actions.
4. **Authoritative Revenue Accounting**: Revenue is credited **only** upon cryptographic webhook verification or provider status confirmation.

### Q5: How is recovery verified?
**A**: An action is only credited as `recovered` when:
1. Razorpay webhook returns `payment.captured` with a verified HMAC SHA-256 signature, OR
2. Direct provider status query returns `captured` / `paid`.
Pending or timed-out transactions remain uncredited until reconciled.

### Q6: What happens when the AI service fails or is offline?
**A**: RECLAIM contains an automatic deterministic fallback engine. If the NVIDIA API times out, returns invalid schema, or is unreachable without internet, the system falls back to rule-based triage without dropping a single payment event or degrading core recovery execution.

### Q7: What happens when the payment provider fails?
**A**: The recovery action is marked as `failed` with the gateway decline code recorded in the audit log. The case remains `at_risk` or is routed to human review. Zero revenue is credited.

### Q8: How did you evaluate the system?
**A**: We ran a controlled, held-out evaluation on 50 synthetic failure cases with ground-truth recoverability. We tested Deterministic Baseline vs Nemotron-Assisted under identical policy bounds. All evaluation datasets and calculations are server-side and isolated from operational dashboard numbers.

### Q9: What did you choose NOT to automate?
**A**:
1. High-risk fraud signals ($> 0.6$ risk score) are automatically routed to human escalation.
2. High-value transactions exceeding policy caps require explicit merchant admin review.
3. Policy configuration updates require merchant admin authorization.

---

## 3. Failure Recovery Scenarios

| Failure Scenario | System Response | Financial & Data Invariant |
| :--- | :--- | :--- |
| **NVIDIA API Outage** | Decision engine automatically catches timeout and engages deterministic fallback. | Zero downtime; recommendations generated with fallback source badge. |
| **Gateway Timeout / Deferred Settlement** | Action status set to `pending`; verification marked `pending`. | **₹0.00** credited to recovered revenue until webhook or manual reconciliation confirms capture. |
| **Policy Violation Attempt** | Policy engine returns `allowed: false` with specific violation rules (`MAX_RETRIES_EXCEEDED`). | Direct API returns `422 POLICY_VALIDATION_FAILED`; execution halted immediately. |
| **Rapid Double Click** | Secondary request matches idempotency key unique constraint. | Transaction intercepted; returns existing action reference; zero duplicate charging. |
| **Network Disruption During Batch** | Batch logs individual item errors and marks batch `PARTIALLY_COMPLETED`. | Verified recoveries are saved; failed cases remain in at-risk queue. |

---

## 4. Demo Commands & Setup

```bash
# 1. Start PostgreSQL (Docker)
docker run -d --name reclaim-postgres -e POSTGRES_USER=reclaim -e POSTGRES_PASSWORD=change-me-local -e POSTGRES_DB=reclaim -p 5432:5432 postgres:16-alpine

# 2. Run Database Migrations
cd backend
uv run alembic upgrade head

# 3. Seed Deterministic Demo Cases
uv run python -m app.db.seed

# 4. Run System Preflight Check
uv run python -m app.utils.preflight

# 5. Start Backend API (FastAPI)
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 6. Start Frontend (Next.js)
cd ../frontend
npm run dev

# 7. Run Full Test Suite
cd ../backend
uv run python -m pytest

# 8. Reset Demo State (CLI)
uv run python -m app.utils.reset_demo
```
