
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
