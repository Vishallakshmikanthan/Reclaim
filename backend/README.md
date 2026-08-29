# RECLAIM API (demo foundation)

Requires Python 3.11+. From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`; health endpoints are `/health` and `/ready`.
Run tests with `pytest`. Configuration is centralized in `.env` (`FRONTEND_ORIGIN`, `ENVIRONMENT`, and logging/application metadata).

Structure: routes in `app/main.py`, application services in `app/services`, deterministic engines in `app/engines`, schemas in `app/schemas`, and replaceable in-memory repository boundaries in `app/repositories`.

This is deliberately a demo backend: persistence is in memory; authentication, PostgreSQL, Razorpay, Gemini, LangGraph, and real communications are not implemented.
