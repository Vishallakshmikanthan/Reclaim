from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..core.config import get_settings
from .base import Base
import os

_engine = None
_factory = None
def init_engine():
    global _engine, _factory
    if _engine is None:
        db_url = get_settings().database_url
        if db_url.startswith("sqlite"):
            _engine = create_engine(db_url, connect_args={"check_same_thread": False})
            Base.metadata.create_all(_engine)
        else:
            _engine = create_engine(db_url, pool_pre_ping=True)
        _factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine
def get_session():
    init_engine()
    return _factory()
