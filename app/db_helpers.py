"""
Synchronous DB helpers for risk modules (Module 6 session monitor).
Uses SQLAlchemy + SQLite (vaultid.db) — separate from the async asyncpg pool.
"""
import uuid
import datetime
import os
from sqlalchemy import create_engine, Column, String, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

_DB_URL = os.getenv("DATABASE_URL", "sqlite:///vaultid.db")
_engine = create_engine(_DB_URL, connect_args={"check_same_thread": False} if "sqlite" in _DB_URL else {})
_Session = sessionmaker(bind=_engine)
Base = declarative_base()


class _ActiveSession(Base):
    __tablename__ = "active_sessions"
    session_id = Column(String, primary_key=True)
    user_id = Column(String, index=True)
    is_active = Column(Boolean, default=True)


class _AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    action = Column(String)
    details = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


Base.metadata.create_all(bind=_engine)


def global_logout_trigger(user_id: str) -> None:
    db = _Session()
    try:
        db.query(_ActiveSession).filter(
            _ActiveSession.user_id == user_id,
            _ActiveSession.is_active == True
        ).update({"is_active": False})
        db.commit()
    finally:
        db.close()


def create_audit_log(user_id: str, action: str, details: str) -> None:
    db = _Session()
    try:
        db.add(_AuditLog(user_id=user_id, action=action, details=details))
        db.commit()
    finally:
        db.close()
