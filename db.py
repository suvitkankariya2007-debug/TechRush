"""
VaultID Database Module & Standardized SQL Queries
Implementation of Section 10 Canonical SQL Queries
"""

import uuid
import datetime
from sqlalchemy import create_engine, Column, String, Float, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL

Base = declarative_base()

class ActiveSession(Base):
    __tablename__ = "active_sessions"

    session_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, nullable=False)
    device_fingerprint = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, nullable=False)
    action = Column(String, nullable=False)
    details = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def fetch_active_devices(user_id: str):
    """Canonical Query 1: Fetch active devices for user_id"""
    db = SessionLocal()
    try:
        sessions = db.query(ActiveSession).filter(
            ActiveSession.user_id == user_id,
            ActiveSession.is_active == True
        ).all()
        return [
            {
                "session_id": s.session_id,
                "user_id": s.user_id,
                "device_fingerprint": s.device_fingerprint,
                "ip_address": s.ip_address,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in sessions
        ]
    finally:
        db.close()

def global_logout_trigger(user_id: str):
    """Canonical Query 2: Deactivate all active sessions for user_id"""
    db = SessionLocal()
    try:
        db.query(ActiveSession).filter(
            ActiveSession.user_id == user_id,
            ActiveSession.is_active == True
        ).update({"is_active": False})
        db.commit()
    finally:
        db.close()

def create_audit_log(user_id: str, action: str, details: str):
    """Canonical Query 3: Log authentication and risk events"""
    db = SessionLocal()
    try:
        log_entry = AuditLog(user_id=user_id, action=action, details=details)
        db.add(log_entry)
        db.commit()
    finally:
        db.close()