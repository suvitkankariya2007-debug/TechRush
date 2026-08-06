from fastapi import APIRouter, Depends, HTTPException, Request
from app.database import get_db
from app.schemas import UserCreate, UserResponse, OTPRequest, OTPVerify, GlobalLogoutRequest
from app.crud import (
    get_user_by_email, create_user, create_otp, verify_otp,
    revoke_all_sessions, log_login_attempt, create_active_session,
    get_credentials_by_user
)
from app.email import send_otp_email
from app.jwt import create_jwt
from app.config import settings
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register_user(payload: UserCreate, request: Request, conn=Depends(get_db)):
    existing_email = await get_user_by_email(conn, payload.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered.")

    try:
        user = await create_user(
            conn,
            payload.username,
            payload.email,
            payload.phone or "",
            payload.device_fingerprint,
            payload.ip_address or request.client.host,
            payload.user_agent or request.headers.get("user-agent", "")
        )
        return UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            created_at=user["created_at"]
        )
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Username or Email already exists.")


@router.post("/otp/request")
async def request_otp(payload: OTPRequest, conn=Depends(get_db)):
    user = await get_user_by_email(conn, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    otp = await create_otp(conn, user["id"], user["email"])
    await send_otp_email(user["email"], otp["code"])
    return {"message": f"OTP sent to {user['email']}"}


@router.post("/otp/verify")
async def verify_otp_code(payload: OTPVerify, request: Request, conn=Depends(get_db)):
    user = await get_user_by_email(conn, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    valid = await verify_otp(conn, user["id"], payload.code)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    client_ip = payload.ip_address or request.client.host
    await log_login_attempt(conn, user["id"], client_ip, 0.0, "OTP", "SUCCESS")

    token = create_jwt(str(user["id"]))
    expires_at = datetime.utcnow() + timedelta(minutes=settings.TOKEN_EXPIRATION_MINUTES)
    await create_active_session(
        conn, user["id"],
        payload.device_fingerprint,
        client_ip,
        payload.user_agent or request.headers.get("user-agent", ""),
        expires_at
    )
    credentials = await get_credentials_by_user(conn, user["id"])
    return {
        "status": "SUCCESS",
        "jwt_token": token,
        "user_id": str(user["id"]),
        "has_passkey": len(credentials) > 0,
        "message": "Authentication successful via OTP"
    }


@router.post("/logout/all")
async def logout_all_devices(payload: GlobalLogoutRequest, conn=Depends(get_db)):
    await revoke_all_sessions(conn, payload.user_id)
    return {"message": "All sessions revoked"}