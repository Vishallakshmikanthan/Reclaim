from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..core.config import get_settings
_engine = None
_factory = None
def init_engine():
    global _engine, _factory
    if _engine is None:
        _engine = create_engine(get_settings().database_url, pool_pre_ping=True)
        _factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine
def get_session():
    init_engine()
    return _factory()
