import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    credentials = relationship("WebAuthnCredential", back_populates="user", cascade="all, delete-orphan")
    challenges = relationship("WebAuthnChallenge", back_populates="user")

class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    credential_id = Column(String, unique=True, nullable=False)   # base64
    public_key = Column(Text, nullable=False)                     # base64
    sign_count = Column(Integer, default=0)
    device_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="credentials")

class WebAuthnChallenge(Base):
    __tablename__ = "webauthn_challenges"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge = Column(Text, nullable=False)   # stored as Base64 string
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=5))

    user = relationship("User", back_populates="challenges")

class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False, index=True)
    code = Column(String(6), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=5))
    used = Column(Boolean, default=False)