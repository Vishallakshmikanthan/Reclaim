from contextlib import contextmanager
from ..core.config import get_settings
from ..db.session import get_session
from .postgres import PostgresRepositories
@contextmanager
def repository_context():
    settings=get_settings()
    if settings.repository_backend != "postgres": raise RuntimeError("In-memory repositories are for isolated tests only; set REPOSITORY_BACKEND=postgres for application startup.")
    session=get_session()
    try: yield PostgresRepositories(session,settings.demo_merchant_id); session.commit()
    except Exception: session.rollback(); raise
    finally: session.close()
