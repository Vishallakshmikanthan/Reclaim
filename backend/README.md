# RECLAIM Backend Service

High-performance FastAPI service orchestrating deterministic revenue recovery, AI-assisted advisory intelligence with NVIDIA Nemotron, policy guardrails, and Razorpay Test-Mode execution.

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |   Next.js 14 Frontend UI    |
                      +--------------+--------------+
                                     | HTTP / REST
                                     v
                      +-----------------------------+
                      |     FastAPI Backend API     |
                      |  (/api/v1/cases, /batches)  |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+-----------------------------+             +-----------------------------+
|    PostgreSQL 15+ Engine    |             |   Advisory Intelligence     |
|   (SQLAlchemy 2.0 / Psycopg)|             |  (NVIDIA Nemotron / Mock)   |
|   - Cases & Ledger Accounts |             +--------------+--------------+
|   - Audit Ledger (L0-L6)    |                            |
|   - Policy Version History  |                            | Advisory Only
+-----------------------------+                            v
               ^                            +-----------------------------+
               |                            |    Policy Engine Guard      |
               +----------------------------+  (Deterministic Invariants) |
               | Updates Case & Ledger      +--------------+--------------+
               |                                           |
               |                                           | Allowed
               |                                           v
+-----------------------------+             +-----------------------------+
|    Reconciliation Engine    |<------------|     Recovery Executor       |
|  (Webhook Signature Check)  |             |  (Razorpay Test Mode / Sim) |
+-----------------------------+             +-----------------------------+
```

### Core Architecture Invariant
* **AI Recommends** (NVIDIA Nemotron synthesizes diagnosis, probability, and intervention)
* **Policy Decides** (Deterministic Policy Engine enforces hard financial and operational guardrails)
* **Backend Executes** (FastAPI coordinates recovery action dispatch to test gateway)
* **Provider Verifies** (Razorpay Test Mode or simulated gateway returns cryptographic/API response)
* **Database Records** (Authoritative PostgreSQL ledger and append-only audit trail persist state)

---

## 2. Prerequisites & Environment Setup

* **Python**: 3.11 or higher
* **PostgreSQL**: 15+ (via Docker Compose or local installation)
* **Virtual Environment**: `.venv` recommended

### Quick Setup

```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create environment file from standardized template
Copy-Item .env.example .env
```

---

## 3. Database Management & Migrations

RECLAIM uses SQLAlchemy 2.0 with the `psycopg` (version 3) driver and Alembic for schema migrations.

```powershell
# Start local PostgreSQL database container
docker compose up -d

# Apply all Alembic migrations to reach head (0001 -> 0002 -> 0003)
.\.venv\Scripts\alembic.exe upgrade head

# Populate deterministic demo dataset
.\.venv\Scripts\python.exe -m app.db.seed
```

### Current Migration History
1. `0001_initial_schema`: Core tables (`merchants`, `customers`, `cases`, `recovery_actions`, `audit_events`, `campaigns`, `communications`, `policy_versions`, `evaluation_runs`).
2. `0002_batch_recovery`: Batch execution tables (`recovery_batches`, `batch_cases`, `batch_audit_events`).
3. `0003_measurement_evidence`: Extended metrics, evidence tracing columns, and controlled evaluation tables.

---

## 4. Running the Backend Service

```powershell
# Start FastAPI application with hot reload
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```

* **Swagger / OpenAPI Documentation**: `http://127.0.0.1:8000/docs`
* **Health Check**: `http://127.0.0.1:8000/health`
* **Readiness Check**: `http://127.0.0.1:8000/ready`
* **System Health**: `http://127.0.0.1:8000/api/v1/system/health`

---

## 5. Providers & Configuration

### A. NVIDIA Nemotron AI Provider (`AI_PROVIDER="nemotron"`)
* Hosted OpenAI-compatible API via NVIDIA Build (`https://integrate.api.nvidia.com/v1`).
* **Safe Fallback**: If `NVIDIA_API_KEY` is not configured or fails, the backend seamlessly degrades to `DETERMINISTIC_FALLBACK`. No runtime crashes or financial inaccuracies occur.
* **Context Sanitizer**: Strictly masks PII (email, phone, names) before prompt assembly.
* **Amount Bounding**: Verifies recommended amounts against original transaction amounts to prevent hallucinated numbers.

### B. Payment Recovery Providers (`RECOVERY_PROVIDER`)
* `simulated` (default): In-memory execution simulating realistic payment settlement, timeouts, and declines.
* `razorpay_test`: Live connection to Razorpay Test Mode API (`https://api.razorpay.com/v1`).
* **Test Mode Guard**: The backend validates that all `RAZORPAY_KEY_ID` values start with `rzp_test_`. Production `rzp_live_` keys are strictly prohibited and rejected at startup.

---

## 6. API Reference (Selected Endpoints)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/cases` | GET, POST | List and filter recovery cases or ingest failed payments |
| `/api/v1/cases/{id}` | GET | Fetch case details, risk diagnosis, and recovery status |
| `/api/v1/cases/{id}/recovery/decision` | POST | Synthesize AI/deterministic recovery recommendation |
| `/api/v1/cases/{id}/recovery/actions` | POST | Execute idempotent recovery action (requires `Idempotency-Key`) |
| `/api/v1/recovery/queue` | GET | Operational triage queue with eligibility filtering |
| `/api/v1/recovery/batches` | GET, POST | Create, preview, and execute batch recovery workflows |
| `/api/v1/webhooks/razorpay` | POST | Ingest and verify webhook signatures (`X-Razorpay-Signature`) |
| `/api/v1/recovery/actions/{id}/reconcile` | POST | Gateway-authoritative reconciliation |
| `/api/v1/dashboard/metrics` | GET | Server-authoritative financial recovery metrics |
| `/api/v1/system/demo/reset` | POST | Restores deterministic baseline dataset |

---

## 7. Testing & Quality Assurance

Run the comprehensive pytest suite:

```powershell
# Run all unit and integration tests
.\.venv\Scripts\python.exe -m pytest -v

# Run specific domain suites
.\.venv\Scripts\python.exe -m pytest tests/test_ai_recovery.py -v
.\.venv\Scripts\python.exe -m pytest tests/test_razorpay_integration.py -v
.\.venv\Scripts\python.exe -m pytest tests/test_recovery_orchestration.py -v
.\.venv\Scripts\python.exe -m pytest tests/test_concurrency.py -v
.\.venv\Scripts\python.exe -m pytest tests/test_measurement_evidence.py -v
```

---

## 8. Security & Financial Accounting Rules

1. **No Live Money**: RECLAIM operates exclusively in simulated mode or Razorpay Test Mode.
2. **Integer Paise Arithmetic**: All monetary quantities (`amount`, `expected`, `recovered_amount`) are represented as non-negative integers in minor units (paise / cents). Floating-point math is strictly forbidden.
3. **Idempotency**: All execution and webhook endpoints enforce unique idempotency keys to prevent duplicate transactions.
4. **Append-Only Audit**: All system events across Layers 0-6 are recorded with ISO timestamps, case IDs, and actor attribution.

