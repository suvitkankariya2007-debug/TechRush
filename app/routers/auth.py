import uuid
import socket
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.schemas import UserCreate, UserResponse, OTPRequest, OTPVerify, GlobalLogoutRequest
from app.crud import (
    get_user_by_email, get_user_by_username, get_user_by_id, get_user_devices,
    create_user, create_otp, verify_otp, revoke_all_sessions, log_login_attempt,
    create_active_session, get_credentials_by_user
)
from app.email import send_otp_email
from app.jwt import create_jwt
from app.config import settings
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register_user(payload: UserCreate, request: Request, db=Depends(get_db)):
    db_user = get_user_by_email(db, payload.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    db_username = get_user_by_username(db, payload.username)
    if db_username:
        raise HTTPException(status_code=400, detail="Username already registered.")
        
    try:
        client_ip = request.client.host if request.client else "127.0.0.1"
        user_agent = request.headers.get("user-agent", "")
        user = create_user(
            db,
            username=payload.username,
            email=payload.email,
            phone=payload.phone or "",
            device_fp=getattr(payload, 'device_fingerprint', '') or '',
            ip=getattr(payload, 'ip_address', '') or client_ip,
            ua=getattr(payload, 'user_agent', '') or user_agent
        )
        log_login_attempt(db, user.id, client_ip, 0.0, "REGISTER", "SUCCESS")
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or Email already exists.")


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

# In-memory store for lightweight QR polling
qr_sessions = {}

@router.post("/qr/generate")
@router.get("/qr/generate")
def qr_generate(request: Request):
    session_id = str(uuid.uuid4())
    qr_sessions[session_id] = {"status": "PENDING"}
    
    host = request.headers.get("host") or "localhost:8000"
    # Convert localhost/127.0.0.1 to actual local IP so external mobile scanners on Wi-Fi can reach the page
    if "localhost" in host or "127.0.0.1" in host:
        port = host.split(":")[-1] if ":" in host else "8000"
        lan_ip = get_local_ip()
        if lan_ip and lan_ip != "127.0.0.1":
            host = f"{lan_ip}:{port}"

    scheme = request.url.scheme or "http"
    approve_url = f"{scheme}://{host}/qr-login.html?session_id={session_id}"
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={approve_url}"
    
    return {
        "status": "SUCCESS",
        "session_id": session_id,
        "qr_data": approve_url,
        "qr_code_url": qr_code_url,
        "message": "QR session initialized"
    }

@router.get("/qr/status")
def qr_status(session_id: str):
    session = qr_sessions.get(session_id, {"status": "PENDING"})
    if session.get("status") == "APPROVED":
        return {
            "status": "APPROVED",
            "user": session.get("user"),
            "jwt_token": session.get("jwt_token"),
            "message": "Session validated"
        }
    return {"status": "PENDING", "message": "Waiting for device approval"}

@router.post("/qr/approve")
def qr_approve(payload: dict, request: Request, db=Depends(get_db)):
    session_id = payload.get("session_id")
    email = payload.get("email")
    if not session_id or not email:
        raise HTTPException(status_code=400, detail="session_id and email required")
    
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail=f"No account found for email: '{email}'. Please check spelling or register first.")
        
    client_ip = request.client.host if request.client else "127.0.0.1"
    log_login_attempt(db, user.id, client_ip, 0.0, "QR_CROSS_DEVICE", "SUCCESS")
    token = create_jwt(str(user.id))
    expires_at = datetime.utcnow() + timedelta(minutes=settings.TOKEN_EXPIRATION_MINUTES)
    create_active_session(
        db, user.id,
        "fp_qr_device",
        client_ip,
        request.headers.get("user-agent", ""),
        expires_at
    )
    
    qr_sessions[session_id] = {
        "status": "APPROVED",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "username": user.username
        },
        "jwt_token": token
    }
    return {"status": "SUCCESS", "message": f"Session approved for {user.email}"}

@router.post("/otp/request")
@router.post("/otp/send")
async def request_otp(payload: OTPRequest, db=Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    otp = create_otp(db, user.id, user.email)
    await send_otp_email(user.email, otp.code)
    return {"message": f"OTP sent to {user.email}"}


@router.post("/otp/verify")
def verify_otp_code(payload: OTPVerify, request: Request, db=Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    valid = verify_otp(db, user.id, payload.code)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    client_ip = payload.ip_address or request.client.host
    log_login_attempt(db, user.id, client_ip, 0.0, "OTP", "SUCCESS")

    token = create_jwt(str(user.id))
    expires_at = datetime.utcnow() + timedelta(minutes=settings.TOKEN_EXPIRATION_MINUTES)
    create_active_session(
        db, user.id,
        payload.device_fingerprint or "",
        client_ip,
        payload.user_agent or request.headers.get("user-agent", ""),
        expires_at
    )
    credentials = get_credentials_by_user(db, user.id)
    return {
        "status": "SUCCESS",
        "jwt_token": token,
        "user_id": str(user.id),
        "has_passkey": len(credentials) > 0,
        "message": "Authentication successful via OTP"
    }


@router.post("/logout/all")
def logout_all_devices(payload: GlobalLogoutRequest, db=Depends(get_db)):
    revoke_all_sessions(db, str(payload.user_id))
    return {"message": "All sessions revoked"}


# ── PROFILE & USER MANAGEMENT ENDPOINTS ──────────────────────────────────────

@router.get("/profile")
def get_user_profile(user_id: str = None, email: str = None, db=Depends(get_db)):
    user = None
    if user_id:
        user = get_user_by_id(db, user_id)
    elif email:
        user = get_user_by_email(db, email)

    if not user:
        return {
            "id": user_id or "anonymous",
            "username": "User",
            "email": email or "user@example.com",
            "phone": "",
            "has_passkey": False,
            "created_at": datetime.utcnow().isoformat()
        }

    credentials = get_credentials_by_user(db, user.id)
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "phone": user.phone or "",
        "has_passkey": len(credentials) > 0,
        "created_at": user.created_at.isoformat() if hasattr(user.created_at, "isoformat") else str(user.created_at)
    }


@router.put("/profile")
def update_user_profile(payload: dict, db=Depends(get_db)):
    user_id = payload.get("user_id") or payload.get("id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "username" in payload and payload["username"]:
        user.username = payload["username"]
    if "phone" in payload:
        user.phone = payload["phone"]

    db.commit()
    db.refresh(user)

    credentials = get_credentials_by_user(db, user.id)
    return {
        "status": "SUCCESS",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "phone": user.phone or "",
            "has_passkey": len(credentials) > 0
        },
        "message": "Profile updated successfully"
    }