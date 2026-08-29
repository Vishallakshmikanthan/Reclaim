# RECLAIM — Razorpay Test-Mode Integration Guide

## 1. Overview & Architecture

RECLAIM integrates **Razorpay Test Mode** to provide a realistic, sandbox-backed revenue recovery lifecycle without moving real money or interacting with live financial infrastructure.

### Architectural Flow:
```
Next.js (Frontend)
       ? (Execute Recovery with Idempotency-Key)
FastAPI (Backend)
       ?
Policy Engine (Deterministic Approval Gate)
       ? (Approved Only)
Recovery Provider (Simulated / Razorpay Test Mode)
       ? (Creates Order / Initiates Operation in minor units)
PostgreSQL (Persists Action, Order ID, Status, Audit Trail)
       ?
Authoritative Status Convergence (Webhook / Reconciliation)
       ?
PostgreSQL Ledger Update (Case Recovered & Revenue Metrics)
       ?
Next.js (Authoritative Dashboard / Case Status Refresh)
```

---

## 2. Critical Safety & Security Rules

1. **TEST MODE ONLY**:
   - All Razorpay operations must run against Razorpay Test Mode (`rzp_test_...`).
   - The application automatically fails closed and refuses to boot if live keys (`rzp_live_...`) are detected.
2. **NO REAL MONEY**:
   - No live payments, captures, or settlements are executed.
3. **ZERO CLIENT SECRETS**:
   - All Razorpay keys and webhook secrets reside strictly on the server backend in environment variables.
   - `NEXT_PUBLIC_RAZORPAY_KEY_SECRET` or any client-side secret exposure is forbidden.
4. **BACKEND-AUTHORITATIVE AMOUNTS**:
   - The recovery amount is always determined authoritatively by the backend in integer minor units (paise).
   - Frontend cannot supply or override recovery amounts.
5. **POLICY GATE MUST PRECEDE EXECUTION**:
   - Every recovery action must be validated against the merchant's active policy before any provider order creation or API call occurs.

---

## 3. Configuration & Environment Variables

Backend environment configuration:

| Variable | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `RECOVERY_PROVIDER` | string | `simulated` or `razorpay_test` | `simulated` |
| `RAZORPAY_KEY_ID` | string | Razorpay Test Key ID (`rzp_test_...`) | `None` |
| `RAZORPAY_KEY_SECRET` | string | Razorpay Test Key Secret | `None` |
| `RAZORPAY_WEBHOOK_SECRET` | string | Razorpay Webhook Signing Secret | `None` |

### Provider Selection Invariant:
- `RECOVERY_PROVIDER=simulated`: Runs fully self-contained offline recovery simulation for demos and local evaluation.
- `RECOVERY_PROVIDER=razorpay_test`: Uses official Razorpay Python SDK against the Razorpay Test Sandbox.

---

## 4. Razorpay Test Mode Order & Webhook Flow

### 4.1 Order Creation
When an eligible case is approved by the policy engine:
1. Backend creates an order via `client.order.create(...)`.
2. Amount is passed in integer paise (`amount_minor`).
3. Notes attach metadata: `case_id`, `idempotency_key`, `strategy`.
4. Order ID is persisted in `recovery_actions.provider_order_id`.
5. **Crucial**: Order creation does NOT mark payment recovered. The case transitions to `pending` awaiting authoritative verification.

### 4.2 Webhook Ingestion (`POST /api/v1/webhooks/razorpay`)
1. **Signature Verification**: Verifies `X-Razorpay-Signature` against the raw payload bytes using HMAC-SHA256 and `RAZORPAY_WEBHOOK_SECRET`.
2. **Database Idempotency**: Inspects `webhook_events` table. If `event_id` already exists, returns `200 OK (status: duplicate)` without modifying state or duplicate accounting.
3. **Merchant Scoping**: Identifies associated case and action scoped strictly to `merchant_id`.
4. **State Transition**:
   - `payment.captured` / `order.paid`: Marks recovery action `verified`, case `recovered`, and updates recovered revenue.
   - `payment.failed`: Marks action `failed`, case `failed`, does not increment revenue.
5. **Audit Ledger**: Records `RAZORPAY_WEBHOOK_RECEIVED`, `RAZORPAY_PAYMENT_VERIFIED`, and `RECOVERY_VERIFIED`.

---

## 5. Failure Handling & Reconciliation

- **Timeout / Network Error**: Action status set to `unknown`/`pending`. System does not create duplicate orders.
- **Reconciliation Endpoint (`POST /api/v1/recovery/actions/{action_id}/reconcile`)**: Queries Razorpay order/payment status server-side to converge uncertain states safely.
- **Invalid Webhook Signature**: Rejected with HTTP 400 (`WEBHOOK_VERIFICATION_FAILED`) and logged to audit as `RAZORPAY_WEBHOOK_REJECTED`.

---

## 6. Local Development & Testing

### Running Tests:
```bash
# Backend pytest suite (includes unit, concurrency, idempotency, and Razorpay integration tests)
pytest
```

### Local Webhook Testing:
For local webhook development without paid tunneling tools:
- Deliver simulated test webhook payloads directly to `http://localhost:8000/api/v1/webhooks/razorpay` signed with HMAC-SHA256.
- In production / staging, configure the webhook URL in the Razorpay Dashboard pointing to `/api/v1/webhooks/razorpay` with event subscriptions for `payment.captured`, `payment.failed`, and `order.paid`.
