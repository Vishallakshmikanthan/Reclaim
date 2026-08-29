# PostgreSQL persistence

RECLAIM uses PostgreSQL through SQLAlchemy 2.x and `psycopg`. Database values for money are integer minor units (paise); recovery probabilities retain the existing API representation of `0.0`–`1.0`.

From `backend/`, copy `.env.example` to `.env`, set a non-default local password, then run:

```powershell
docker compose up -d
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m app.db.seed
.\.venv\Scripts\uvicorn.exe app.main:app --reload
```

Use `alembic downgrade base` only against disposable development databases. The seed is deterministic and synthetic; evaluation runs are stored separately from live cases. Development uses `DEMO_MERCHANT_ID` as a temporary tenant context—this is not authentication.

Tables: `merchants`, `policies`, `payments`, `cases`, `recovery_actions`, `campaigns`, `campaign_cases`, `communications`, `audit_events`, `evaluation_runs`, and `failure_events`. Foreign keys restrict deletion of financial and audit history; recovery idempotency is unique per merchant.

Production still needs managed backups, monitored migrations, and secret management. Frontend code never receives database credentials or connects to PostgreSQL directly.
