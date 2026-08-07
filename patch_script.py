import re

# 1. Update models.py
models_code = """
import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserDevice(Base):
    __tablename__ = "user_devices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_fingerprint = Column(String)
    ip_address = Column(String)
    user_agent = Column(String)

class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    credential_id = Column(String, unique=True, nullable=False)
    public_key = Column(Text, nullable=False)
    sign_count = Column(Integer, default=0)
    device_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class WebAuthnChallenge(Base):
    __tablename__ = "webauthn_challenges"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=5))

class OTPCode(Base):
    __tablename__ = "otp_codes"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(String, nullable=False, index=True)
    code = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=10))
    used = Column(Boolean, default=False)

class ActiveSession(Base):
    __tablename__ = "active_sessions"
    session_id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_fingerprint = Column(String)
    ip_address = Column(String)
    user_agent = Column(String)
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

class LoginHistory(Base):
    __tablename__ = "login_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String)
    risk_score = Column(Float)
    auth_method = Column(String)
    status = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
"""
with open("app/models.py", "w") as f:
    f.write(models_code)


# 2. Update crud.py
crud_code = """
import uuid
import random
from typing import Union
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import User, UserDevice, OTPCode, WebAuthnChallenge, WebAuthnCredential, ActiveSession, LoginHistory

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == str(user_id)).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, username: str, email: str, phone: str, device_fp: str, ip: str, ua: str):
    user = User(id=str(uuid.uuid4()), username=username, email=email, phone=phone)
    db.add(user)
    device = UserDevice(user_id=user.id, device_fingerprint=device_fp, ip_address=ip, user_agent=ua)
    db.add(device)
    db.commit()
    db.refresh(user)
    return user

def get_user_devices(db: Session, user_id: str):
    return db.query(UserDevice).filter(UserDevice.user_id == str(user_id)).all()

def create_otp(db: Session, user_id: str, email: str):
    db.query(OTPCode).filter(OTPCode.user_id == str(user_id)).delete()
    code = f"{random.randint(100000, 999999)}"
    otp = OTPCode(user_id=str(user_id), email=email, code=code)
    db.add(otp)
    db.commit()
    db.refresh(otp)
    return otp

def verify_otp(db: Session, user_id: str, code: str) -> bool:
    otp = db.query(OTPCode).filter(
        OTPCode.user_id == str(user_id),
        OTPCode.code == code,
        OTPCode.used == False,
        OTPCode.expires_at > datetime.utcnow()
    ).first()
    if not otp:
        return False
    otp.used = True
    db.commit()
    return True

def store_challenge(db: Session, user_id: str, challenge_b64: str):
    db.query(WebAuthnChallenge).filter(WebAuthnChallenge.user_id == str(user_id)).delete()
    chal = WebAuthnChallenge(user_id=str(user_id), challenge=challenge_b64)
    db.add(chal)
    db.commit()
    db.refresh(chal)
    return chal

def get_challenge(db: Session, user_id: str):
    chal = db.query(WebAuthnChallenge).filter(
        WebAuthnChallenge.user_id == str(user_id),
        WebAuthnChallenge.expires_at > datetime.utcnow()
    ).order_by(WebAuthnChallenge.created_at.desc()).first()
    return chal.challenge if chal else None

def delete_challenge(db: Session, user_id: str):
    db.query(WebAuthnChallenge).filter(WebAuthnChallenge.user_id == str(user_id)).delete()
    db.commit()

def store_credential(db: Session, user_id: str, credential_id: str, public_key: str, sign_count: int, device_name: str = None):
    cred = WebAuthnCredential(user_id=str(user_id), credential_id=credential_id, public_key=public_key, sign_count=sign_count, device_name=device_name)
    db.add(cred)
    db.commit()

def get_credentials_by_user(db: Session, user_id: str):
    return db.query(WebAuthnCredential).filter(WebAuthnCredential.user_id == str(user_id)).all()

def get_credential_by_id(db: Session, credential_id: str):
    return db.query(WebAuthnCredential).filter(WebAuthnCredential.credential_id == credential_id).first()

def update_sign_count(db: Session, credential_id: str, new_sign_count: int):
    cred = db.query(WebAuthnCredential).filter(WebAuthnCredential.credential_id == credential_id).first()
    if cred:
        cred.sign_count = new_sign_count
        db.commit()

def create_active_session(db: Session, user_id: str, device_fp: str, ip: str, ua: str, expires_at: datetime):
    session = ActiveSession(user_id=str(user_id), device_fingerprint=device_fp, ip_address=ip, user_agent=ua, expires_at=expires_at)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session.session_id

def revoke_all_sessions(db: Session, user_id: str):
    db.query(ActiveSession).filter(ActiveSession.user_id == str(user_id)).update({"is_active": False})
    db.commit()

def log_login_attempt(db: Session, user_id: str, ip: str, risk_score: float, method: str, status: str):
    log = LoginHistory(user_id=str(user_id), ip_address=ip, risk_score=risk_score, auth_method=method, status=status)
    db.add(log)
    db.commit()
"""
with open("app/crud.py", "w") as f:
    f.write(crud_code)


# 3. Fix app/routers/auth.py
with open("app/routers/auth.py", "r") as f:
    content = f.read()

# Replace async def ... conn=Depends(get_db) with def ... db=Depends(get_db)
# Replace `conn` with `db`
content = content.replace('conn=Depends(get_db)', 'db=Depends(get_db)')
content = content.replace('conn,', 'db,')
# Remove await
content = content.replace('await ', '')
# Remove async from defs
content = content.replace('async def', 'def')
# Replace dictionary access like user["id"] with user.id
content = content.replace('user["id"]', 'user.id')
content = content.replace('user["email"]', 'user.email')
content = content.replace('user["username"]', 'user.username')
content = content.replace('user["created_at"]', 'user.created_at')
content = content.replace('otp["code"]', 'otp.code')

with open("app/routers/auth.py", "w") as f:
    f.write(content)

# 4. Fix app/routers/webauthn.py
with open("app/routers/webauthn.py", "r") as f:
    content = f.read()

content = content.replace('conn=Depends(get_db)', 'db=Depends(get_db)')
content = content.replace('conn,', 'db,')
content = content.replace('await ', '')
content = content.replace('async def', 'def')
content = content.replace('user["id"]', 'user.id')
content = content.replace('user["email"]', 'user.email')
content = content.replace('c["credential_id"]', 'c.credential_id')
content = content.replace('credential["public_key"]', 'credential.public_key')
content = content.replace('credential["sign_count"]', 'credential.sign_count')

with open("app/routers/webauthn.py", "w") as f:
    f.write(content)

