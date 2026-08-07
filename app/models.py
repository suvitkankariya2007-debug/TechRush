import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")
    credentials = relationship("WebAuthnCredential", back_populates="user", cascade="all, delete-orphan")
    challenges = relationship("WebAuthnChallenge", back_populates="user", cascade="all, delete-orphan")
    otp_codes = relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("ActiveSession", back_populates="user", cascade="all, delete-orphan")
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")


class UserDevice(Base):
    __tablename__ = "user_devices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_fingerprint = Column(String(512))
    ip_address = Column(String(45))
    user_agent = Column(Text)

    user = relationship("User", back_populates="devices")


class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    credential_id = Column(String(512), unique=True, nullable=False)
    public_key = Column(Text, nullable=False)
    sign_count = Column(Integer, default=0)
    device_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="credentials")


class WebAuthnChallenge(Base):
    __tablename__ = "webauthn_challenges"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=5))

    user = relationship("User", back_populates="challenges")


class OTPCode(Base):
    __tablename__ = "otp_codes"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=10))
    used = Column(Boolean, default=False)

    user = relationship("User", back_populates="otp_codes")


class ActiveSession(Base):
    __tablename__ = "active_sessions"
    session_id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_fingerprint = Column(String(512))
    ip_address = Column(String(45))
    user_agent = Column(Text)
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="sessions")


class LoginHistory(Base):
    __tablename__ = "login_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String(45))
    risk_score = Column(Float, default=0.0)
    auth_method = Column(String(50))
    status = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="login_history")
