# RECLAIM API (demo foundation)

Requires Python 3.11+. From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

For PostgreSQL persistence, copy `.env.example` to `.env`, start the local database, then run migrations and the deterministic seed:

```powershell
docker compose up -d
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m app.db.seed
```

Open `http://127.0.0.1:8000/docs`; health endpoints are `/health` and `/ready`. Run tests with `pytest`. Configuration is centralized in `.env`, including `DATABASE_URL`, `REPOSITORY_BACKEND`, and the development-only `DEMO_MERCHANT_ID` tenant context.

Structure: routes in `app/main.py`, application services in `app/services`, deterministic engines in `app/engines`, schemas in `app/schemas`, SQLAlchemy models/sessions in `app/db`, and PostgreSQL repositories in `app/repositories`.

This remains a demo backend: authentication, Razorpay, Gemini, LangGraph, real communications, and real-time events are not implemented. PostgreSQL is persistent, but production still requires backups, monitoring, migration discipline, and managed secrets.
