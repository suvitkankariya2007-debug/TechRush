"""
FastAPI router exposing Modules 4, 5, and 7 as endpoints.

Import `router` into the SHARED main.py (the one FastAPI instance
serving both Laptop A and Laptop B, per Section 3):

    from app.routes import router as session_router
    app.include_router(session_router)
"""

from fastapi import APIRouter, Depends, Request

from app.device_recognition import generate_device_fingerprint, get_device_trust
from app.revocation import logout_all_devices
from app.session_manager import (
    create_session,
    get_active_sessions,
    get_current_user,
    refresh_session,
)

router = APIRouter(prefix="/api/v1/auth", tags=["session"])


@router.post("/session/start")
async def start_session(request: Request, user_id: str, risk_score: float = 0.0):
    """
    Called by Module 2 (OTP) / Module 3 (WebAuthn) the moment they
    confirm identity -- not meant to be hit directly by the frontend.
    """
    ip = request.client.host
    ua = request.headers.get("user-agent", "")
    fingerprint = generate_device_fingerprint(ip, ua)
    trust = await get_device_trust(user_id, fingerprint)
    session = await create_session(
        user_id=user_id, device_fingerprint=fingerprint,
        ip_address=ip, user_agent=ua, risk_score=risk_score,
    )
    return {**session, "device_trust": trust}


@router.get("/session/active")
async def active_sessions(user: dict = Depends(get_current_user)):
    """Section 10, Query 1 -- powers the Laptop A / Laptop B dashboard."""
    return await get_active_sessions(user["user_id"])


@router.post("/session/refresh")
async def refresh(token: str):
    return await refresh_session(token)


@router.post("/logout-all")
async def logout_all(request: Request, user: dict = Depends(get_current_user)):
    ip = request.client.host
    revoked = await logout_all_devices(user["user_id"], ip, user["risk_score"])
    return {"message": "Logged out from all devices", "sessions_revoked": revoked}
