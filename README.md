# RECLAIM: Autonomous Revenue Recovery Engine

> **Autonomous, bounded revenue recovery engine orchestrating failed payment triage, NVIDIA Nemotron advisory intelligence, deterministic policy safety guardrails, and Razorpay Test-Mode execution.**

---

## 1. Executive Summary & Overview

**RECLAIM** is an enterprise-grade revenue recovery engine engineered to recover failed and abandoned digital transactions without compromising merchant risk or customer trust. 

Modern commerce applications lose 5% to 15% of top-line transaction volume to payment failures. Traditional recovery mechanisms rely on naive, blind retries that exacerbate bank throttling, trigger fraud alerts, increase gateway processing fees, and cause duplicate customer debits.

RECLAIM replaces blind retry logic with a **bounded, multi-layer intelligence framework**:
1. **Detects & Triages**: Analyzes failed payment telemetry across UPI, Cards, Netbanking, and Subscriptions.
2. **Advises with AI**: Consults **NVIDIA Nemotron-70B** for diagnostic root cause analysis and contextual recovery strategy synthesis.
3. **Guards with Policy**: Passes all recommendations through a **Deterministic Policy Engine** that strictly enforces business guardrails, velocity caps, and contact frequency limits.
4. **Executes & Verifies**: Executes recovery through **Razorpay Test Mode** or simulated gateways, cryptographically verifies outcomes via webhooks, and reconciles state into an authoritative financial ledger.

---

## 2. Problem Statement

* **Revenue Leakage**: Up to 15% of checkout transactions fail due to transient network drops, UPI app timeouts, issuer bank outages, or temporary card balance issues.
* **Customer Churn**: Aggressive, uncoordinated reminders and retry attempts annoy legitimate customers and degrade brand loyalty.
* **Double Debit Risk**: Unsynchronized retries risk charging customers multiple times for a single cart checkout.
* **Lack of Visibility**: Merchants lack unified operational control over recovery attempts, retry lifecycle states, and monetary yield attribution.

---

## 3. Solution Overview

RECLAIM provides an end-to-end, high-reliability control plane that transforms uncaptured payment failures into recovered revenue:
* **ML Yield Scoring**: Evaluates recoverable probability ($P_{\text{rec}}$) and expected monetary yield ($E = \text{Amount} \times P_{\text{rec}}$).
* **NVIDIA Nemotron Advisory Layer**: Leverages LLM reasoning to explain failure reasons, assemble step-by-step action plans, and synthesize multi-channel communication templates.
* **Hard Policy Invariants**: Ensures zero autonomous action exceeds merchant-defined risk thresholds, retry ceilings, or 24-hour communication budgets.
* **Authoritative Financial Accounting**: Maintains exact integer minor-unit arithmetic (paise) across all ledger updates, audits, and metrics.

---

## 4. Core Architecture

```
                      +------------------------------------------+
                      |         Next.js 14 Frontend UI           |
                      |   (Realtime Dashboard, Queues, Studio)   |
                      +--------------------+---------------------+
                                           | HTTP / JSON REST
                                           v
                      +------------------------------------------+
                      |          FastAPI Backend API             |
                      |    (Application Services & Routing)      |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |          PostgreSQL 15+ Engine           |
                      |      (Authoritative Primary Ledger)      |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |      Deterministic Policy Engine         |
                      |   (Velocity, Amount Caps, Invariants)    |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |      NVIDIA Nemotron Advisory AI         |
                      |     (Diagnosis, Plan, Sanitization)      |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |      Razorpay Test Mode Execution        |
                      |   (Idempotent Calls, Signature Check)    |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       Verification & Reconciliation      |
                      |    (Webhooks, Status Checks, Traces)     |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |      Audit Ledger & Telemetry Engine     |
                      |       (Append-Only Layers 0 to 6)        |
                      +------------------------------------------+
```

---

## 5. Explicit AI Safety Architecture

RECLAIM follows a strict, non-negotiable architectural invariant:

```
  +-------------------+
  |   AI RECOMMENDS   |  --> Generates diagnosis, probability, and proposed action
  +---------+---------+
            |
            v
  +-------------------+
  |   POLICY DECIDES  |  --> Evaluates hard rules; can override, cap, or block AI
  +---------+---------+
            |
            v
  +-------------------+
  |  BACKEND EXECUTES |  --> Dispatches idempotent recovery request to gateway
  +---------+---------+
            |
            v
  +-------------------+
  | PROVIDER VERIFIES |  --> Cryptographic webhook or gateway status verification
  +---------+---------+
            |
            v
  +-------------------+
  | DATABASE RECORDS  |  --> Commits immutable state change & append-only audit
  +-------------------+
```

* **Zero AI Execution Authority**: The AI model has no direct execution credentials, cannot initiate payment transactions, cannot alter database records, and cannot modify policy rules.
* **PII Sanitization**: Context sanitizers strip names, phone numbers, and emails before sending prompts to external AI endpoints.
* **Amount Bounding**: All AI recommendations are verified to ensure proposed amounts do not exceed the original failed transaction value.
* **Deterministic Fallback**: If the AI provider is offline or unconfigured, the system automatically falls back to deterministic rule synthesis with zero service degradation.

---

## 6. Key Features

* **Failed-Payment Recovery**: Autonomous recovery workflows tailored for UPI, credit/debit cards, netbanking, and recurring subscription mandates.
* **Deterministic Prioritization**: High-yield, policy-compliant recovery opportunities are surfaced automatically to maximize operator efficiency.
* **Nemotron Recovery Intelligence**: Explains the technical failure root cause and synthesizes optimal multi-step recovery strategies using NVIDIA Nemotron-70B.
* **Deterministic AI Fallback**: Operates reliably without external API dependencies when no AI key is present.
* **Policy Enforcement**: Configurable merchant guardrails (max retry attempts, maximum autonomous amount cap, minimum probability floor, 24h customer contact ceiling).
* **Razorpay Test Mode**: Integration with Razorpay API in strict test mode (`rzp_test_*`), supporting payment retry, payment links, and simulated mandates.
* **Cryptographic Webhook Verification**: Validates incoming `X-Razorpay-Signature` HMAC-SHA256 headers before state transitions.
* **Gateway Reconciliation**: Authoritative synchronization between gateway state and internal recovery records.
* **Idempotency Protection**: Enforces client-supplied `Idempotency-Key` headers on all state-mutating actions to prevent duplicate processing.
* **Concurrency Protection**: Row-level locking (`FOR UPDATE`) and database unique constraints prevent double execution across concurrent workers.
* **Batch Recovery Orchestration**: Multi-case batch execution with pre-flight policy evaluation, cumulative monetary exposure caps, and partial-success isolation.
* **Complete Audit Trail**: Append-only audit ledger across Layers 0 to 6 recording actor, timestamp, payload, and policy decisions.
* **Evaluation Benchmark**: Controlled offline evaluation harness measuring recovery rate, intervention success, and policy compliance against naive baselines.
* **Authoritative Financial Accounting**: Strict minor-unit integer arithmetic (paise) eliminating floating-point rounding errors.

---

## 7. Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 14 (App Router), React 18, TypeScript | Realtime control center, operational queues, case detail studio |
| **Styling & Components** | Tailwind CSS, Lucide Icons, Recharts | Responsive dark/light theme, interactive funnel and time-series charts |
| **Backend API** | FastAPI, Python 3.11, Pydantic v2 | High-throughput asynchronous REST API and service layer |
| **Database & ORM** | PostgreSQL 15+, SQLAlchemy 2.0, Psycopg 3 | Authoritative multi-tenant persistence and transactional ledger |
| **Migrations** | Alembic | Version-controlled schema migrations (`0001` -> `0003`) |
| **Advisory AI** | NVIDIA Nemotron-70B (`nvidia/llama-3.1-nemotron-70b-instruct`) | Hosted via NVIDIA Build OpenAI-compatible API |
| **Payment Gateway** | Razorpay REST API (Test Mode only) | Simulated in-memory gateway & Razorpay Test Mode execution |
| **Quality & Linting** | pytest, ESLint, TypeScript Compiler (`tsc`) | Automated unit/integration tests and static code verification |

---

## 8. Repository Structure

```
Reclaim/
├── README.md                          # Comprehensive project documentation
├── .env.example                       # Root environment template
├── backend/
│   ├── README.md                      # Backend service technical guide
│   ├── alembic.ini                    # Alembic migration configuration
│   ├── requirements.txt               # Python package dependencies
│   ├── .env.example                   # Backend environment template
│   ├── app/
│   │   ├── main.py                    # FastAPI entrypoint & route registration
│   │   ├── core/                      # Configuration, errors, settings validators
│   │   ├── db/                        # SQLAlchemy Base, models, session, seed
│   │   ├── engines/                   # Policy engine, AI providers, recovery executors
│   │   ├── repositories/              # PostgreSQL & mock repository implementations
│   │   ├── schemas/                   # Pydantic domain, AI, and API schemas
│   │   └── services/                  # Application orchestration & business logic
│   ├── migrations/
│   │   └── versions/                  # Alembic migration history (0001, 0002, 0003)
│   └── tests/                         # Comprehensive pytest test suites
├── frontend/
│   ├── package.json                   # Node.js dependencies & scripts
│   ├── .env.example                   # Frontend environment template
│   ├── .env.local                     # Local Next.js environment configuration
│   ├── app/                           # Next.js 14 App Router pages
│   │   ├── page.tsx                   # Control Center (Dashboard)
│   │   ├── at-risk/page.tsx           # At-Risk & Operational Case Explorer
│   │   ├── cases/[id]/page.tsx        # Case Decision Studio & Action Runner
│   │   ├── policy/page.tsx            # Merchant Policy Studio & Guardrails
│   │   ├── audit/page.tsx             # Immutable Audit Log Viewer
│   │   ├── analytics/page.tsx         # Revenue Recovery Analytics & Funnel
│   │   ├── campaigns/page.tsx         # Campaign Orchestrator
│   │   ├── communications/page.tsx    # Customer Communications Ledger
│   │   ├── evaluation/page.tsx        # Benchmark Evaluation Dashboard
│   │   └── settings/page.tsx          # Merchant Profile & Gateway Settings
│   ├── components/                    # Reusable UI widgets, charts, and modals
│   └── lib/                           # Context, API client, metrics, resilience
└── docs/                              # Architecture and design specifications
```

---

## 9. Prerequisites

* **Python**: 3.11 or higher
* **Node.js**: 18.x or higher (with `npm`)
* **PostgreSQL**: 15+ (local installation or via Docker Compose)
* **Git**: Installed and configured

---

## 10. Clean-Clone Setup Instructions

### Step 1: Clone Repository
```powershell
git clone <repository-url> Reclaim
cd Reclaim
```

### Step 2: Configure Environment Files
```powershell
# Root configuration
Copy-Item .env.example .env

# Backend configuration
Copy-Item backend\.env.example backend\.env

# Frontend configuration
Copy-Item frontend\.env.example frontend\.env.local
```

### Step 3: Setup Backend Python Virtual Environment
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

### Step 4: Setup Frontend Node Modules
```powershell
cd frontend
npm install
cd ..
```

---

## 11. PostgreSQL Startup Instructions

Start the PostgreSQL database service:

```powershell
# Option A: Docker Compose
docker compose up -d

# Option B: Local PostgreSQL Service (Windows)
# Ensure PostgreSQL is running on port 5432 with credentials in backend/.env:
# postgresql+psycopg://reclaim:change-me-local@localhost:5432/reclaim
```

---

## 12. Database Migrations

Apply Alembic migrations to build the complete database schema:

```powershell
cd backend
.\.venv\Scripts\alembic.exe upgrade head
cd ..
```

---

## 13. Deterministic Seed Instructions

Seed the database with deterministic demo recovery cases, merchant profiles, audit events, and policy configurations:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.db.seed
cd ..
```

---

## 14. Backend Startup Command

Launch the FastAPI backend service:

```powershell
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```

* API Base: `http://127.0.0.1:8000`
* Interactive API Docs: `http://127.0.0.1:8000/docs`
* Health Check: `http://127.0.0.1:8000/health`

---

## 15. Frontend Startup Command

In a separate terminal window, launch the Next.js development server:

```powershell
cd frontend
npm run dev
```

* Open Browser: `http://localhost:3000`

---

## 16. Environment Variable Configuration

| Variable | Scope | Required | Default / Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server Only | Yes | `postgresql+psycopg://reclaim:change-me-local@localhost:5432/reclaim` |
| `REPOSITORY_BACKEND` | Server Only | Yes | `postgres` (or `mock` for isolated unit tests) |
| `NVIDIA_API_KEY` | Server Only | Optional | NVIDIA Build API Key for Nemotron-70B. If omitted, uses deterministic fallback. |
| `NVIDIA_NEMOTRON_MODEL` | Server Only | Optional | `nvidia/llama-3.1-nemotron-70b-instruct` |
| `AI_PROVIDER` | Server Only | Optional | `nemotron` \| `mock` \| `deterministic` |
| `RECOVERY_PROVIDER` | Server Only | Optional | `simulated` (default) \| `razorpay_test` |
| `RAZORPAY_KEY_ID` | Server Only | Optional | Razorpay Test Key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Server Only | Optional | Razorpay Test Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Server Only | Optional | Razorpay Webhook Signing Secret |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend Safe | Yes | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_USE_MOCKS` | Frontend Safe | Optional | `false` (default: connects to FastAPI backend) \| `true` (standalone browser mock mode) |

---

## 17. NVIDIA Nemotron AI Configuration

1. Obtain a free API key from [NVIDIA Build](https://build.nvidia.com/).
2. Add your key to `backend/.env`:
   ```bash
   NVIDIA_API_KEY="nvapi-..."
   NVIDIA_NEMOTRON_MODEL="nvidia/llama-3.1-nemotron-70b-instruct"
   AI_PROVIDER="nemotron"
   ```
3. If no key is supplied, RECLAIM automatically and safely operates in `DETERMINISTIC_FALLBACK` mode with zero errors.

---

## 18. Razorpay Test Mode Configuration

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/) and ensure **Test Mode** is active.
2. Generate API Keys in Settings -> API Keys.
3. Configure `backend/.env`:
   ```bash
   RECOVERY_PROVIDER="razorpay_test"
   RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="..."
   RAZORPAY_WEBHOOK_SECRET="..."
   ```

---

## 19. Security Notice

> **IMPORTANT: NO LIVE MONEY IS USED.**
> RECLAIM operates strictly in simulated or Razorpay Test Mode (`rzp_test_*`). Live production credentials (`rzp_live_*`) are blocked by startup assertion validators and will trigger immediate process termination.

---

## 20. Five-Minute Demo Flow

1. **Control Center (`/`)**: View the high-level financial recovery cockpit showing total revenue at risk (₹84,990), recovered revenue, and active operational attention queues.
2. **At-Risk Incidents (`/at-risk`)**: Explore the incident workspace. Filter by "UPI Timeout" or "High Priority". Observe expected yield calculations.
3. **Case Decision Studio (`/cases/RC-2024-081`)**:
   * Inspect the AI diagnosis from Nemotron (or deterministic fallback).
   * Review deterministic policy checks (e.g., attempt limits, amount ceilings).
   * Click **Execute Recovery Action**.
   * Watch the 7-step lifecycle timeline advance from *Detect* to *Recover*.
4. **Batch Orchestrator (`/at-risk` -> Batch Recovery)**: Select multiple cases, preview cumulative exposure and policy eligibility, and execute batch recovery.
5. **Audit Ledger (`/audit`)**: Inspect immutable Layer 0 to Layer 6 audit events with complete cryptographic telemetry.
6. **Policy Studio (`/policy`)**: Adjust the maximum retry ceiling or autonomous amount cap. Observe real-time policy impact simulation without executing risky trades.

---

## 21. Demo Scenarios

| Scenario | Trigger / Case | Behavior & Policy Outcome |
| :--- | :--- | :--- |
| **Successful Recovery** | `RC-2024-081` (UPI Timeout) | AI recommends Gateway Retry; Policy approves; Gateway returns success; ₹8,499 recovered to ledger. |
| **Policy Block** | `RC-2024-084` (Max Retries Reached) | Policy Engine blocks autonomous retry ($3 \ge 3$); Forces human escalation to protect customer. |
| **Provider Failure** | Card Decline / Invalid CVV | Gateway rejects transaction; RECLAIM falls back to 1-click WhatsApp payment link. |
| **Pending Settlement** | Gateway Timeout | Action enters `VERIFY_PENDING`; Asynchronous webhook or reconciliation endpoint confirms settlement. |
| **Partial Batch Recovery** | Batch of 5 mixed cases | 3 eligible cases recover successfully; 1 policy-blocked case is safely skipped; 1 terminal failure is escalated. |
| **AI Fallback** | Unset `NVIDIA_API_KEY` | System automatically generates deterministic recommendation; Decision source explicitly flagged as `DETERMINISTIC_FALLBACK`. |

---

## 22. Testing Commands

### Backend Tests (pytest)
```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

### Frontend Typecheck, Lint & Build
```powershell
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

---

## 23. Current Test Status

* **TypeScript Compilation**: `npx tsc --noEmit` passing with **0 errors**.
* **ESLint Verification**: `npm run lint` passing with **0 errors**.
* **Production Build**: Next.js 14 production build succeeds with all 13 static/dynamic routes prerendered.
* **Unit & Logic Tests**: Offline unit tests (AI context sanitizer, amount bounding, prompt injection defenses, malformed JSON handling, timeout protection) passing.
* **Integration Tests**: Full database integration tests verify schema constraints, concurrency row locks, and idempotent execution when PostgreSQL is active.

---

## 24. Security Model

1. **Credential Isolation**: No private keys (`NVIDIA_API_KEY`, `RAZORPAY_KEY_SECRET`) are ever exposed to the frontend browser bundle.
2. **Cryptographic Signatures**: Webhook payloads are verified using HMAC-SHA256 signatures before processing.
3. **Context Minimization**: PII fields (email, phone, real name) are stripped prior to external LLM dispatch.
4. **Idempotency Locking**: Database-level unique constraints and Redis/PostgreSQL locks prevent concurrent double execution.
5. **Role-Based Access Control (RBAC)**: Supports `MERCHANT_ADMIN`, `OPERATOR`, and `VIEWER` roles with restricted operational capabilities.

---

## 25. Financial Accounting Rules

* **Minor-Unit Integer Storage**: All currency values are stored as 64-bit integers in paise (e.g., ₹8,499.00 = `849900`). Floating-point arithmetic is strictly disallowed.
* **Strict Non-Negativity**: Balance, amount, and recovery values must be $\ge 0$.
* **Balanced Ledger**: $\text{Total At Risk} = \text{Recovered} + \text{Unrecovered} + \text{Escalated} + \text{Stopped}$.
* **Immutable Double-Entry Audit**: Financial balance mutations are accompanied by an immutable audit event referencing the transaction ID and idempotency key.

---

## 26. Evaluation Methodology

RECLAIM includes an automated offline evaluation benchmark comparing:
1. **Baseline Model**: Naive blind retry strategy (standard e-commerce retry).
2. **RECLAIM Engine**: Contextual recovery intelligence with deterministic policy guardrails.

**Key Metrics Tracked**:
* **Recovery Rate**: $\frac{\text{Recovered Cases}}{\text{Total Terminal Cases}}$
* **Intervention Success Rate**: $\frac{\text{Successful Actions}}{\text{Total Actions Executed}}$
* **Policy Compliance**: $100\%$ invariant enforcement (zero allowable policy violations).
* **Cost Efficiency**: Avoided gateway penalty fees by eliminating hopeless retry attempts.

---

## 27. Known Limitations

1. **Single-Merchant Context**: The development demo defaults to `merchant_demo` tenant context; multi-tenant onboarding is configurable via header `X-Merchant-Id`.
2. **Simulated Communication Delivery**: SMS and WhatsApp link notifications are simulated in the audit ledger rather than calling live telecom SMS aggregators (Twilio/Gupshup).
3. **PostgreSQL Dependency for Full API**: The FastAPI backend requires an active PostgreSQL instance for persistent state; isolated offline tests run with in-memory test mocks.

---

## 28. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `503 Service Unavailable / DATABASE_UNAVAILABLE` | PostgreSQL is not running on port 5432 | Start database with `docker compose up -d` or verify PostgreSQL service status. |
| `Alembic Target database is not up to date` | Migrations have not been applied | Run `.\.venv\Scripts\alembic.exe upgrade head` inside `backend/`. |
| `Frontend shows Backend Disconnected banner` | FastAPI backend is not running | Start backend with `uvicorn app.main:app --port 8000 --reload` or set `NEXT_PUBLIC_USE_MOCKS=true` in `frontend/.env.local`. |
| `NVIDIA API 401 Unauthorized` | Invalid or expired NVIDIA key | Update `NVIDIA_API_KEY` in `backend/.env` or leave empty to use deterministic fallback. |
| `Razorpay Live Key Error` | Key starts with `rzp_live_` | Replace with test key starting with `rzp_test_`. RECLAIM does not accept live credentials. |

---

## 29. License & Project Information

RECLAIM is developed for enterprise payment reliability and revenue recovery.
* Version: `1.0.0-rc1` (Release Candidate)
* Node Engine: `>= 18.0.0`
* Python: `>= 3.11.0`
