from contextlib import contextmanager
from ..core.config import get_settings
from ..db.session import get_session
from .postgres import PostgresRepositories

@contextmanager
def repository_context(merchant_id: str | None = None):
    settings = get_settings()
    if settings.repository_backend != "postgres":
        raise RuntimeError("In-memory repositories are for isolated tests only; set REPOSITORY_BACKEND=postgres for application startup.")
    session = get_session()
    m_id = merchant_id or settings.demo_merchant_id
    try:
        yield PostgresRepositories(session, m_id)
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
