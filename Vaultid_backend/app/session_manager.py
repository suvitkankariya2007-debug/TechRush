"""
Module 4 -- Session & JWT Token Management
============================================
Owns:
  - Signing / verifying bearer JWTs (Section 9 payload contract)
  - Writing / reading rows in active_sessions (Section 10, Query 1)
  - Refresh / expiry handling
  - The get_current_user() FastAPI dependency other modules plug into

Who calls into this module:
  - Module 3 (WebAuthn login) and Module 2 (OTP fallback) call
    create_session() the instant they confirm the user's identity.
  - Module 7 (logout, also yours -- see revocation.py) calls into the
    same active_sessions table this module writes.
  - Any protected route in Modules 6/8 depends on get_current_user().
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import (
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    PAYLOAD_DEVICE_FP,
    PAYLOAD_RISK_SCORE,
    TOKEN_EXPIRATION_MINUTES,
)
from app.database import get_pool

bearer_scheme = HTTPBearer()


def create_access_token(user_id: str, device_fingerprint: str, risk_score: float = 0.0):
    """Signs a JWT per the Section 9 payload contract. Returns (token, expires_at)."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRATION_MINUTES)
    payload = {
        "sub": str(user_id),
        PAYLOAD_DEVICE_FP: device_fingerprint,
        PAYLOAD_RISK_SCORE: risk_score,
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token, expires_at


def decode_token(token: str) -> dict:
    """Raises jwt.ExpiredSignatureError / jwt.InvalidTokenError on failure."""
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])


async def create_session(
    user_id: str,
    device_fingerprint: str,
    ip_address: str,
    user_agent: str = "",
    risk_score: float = 0.0,
) -> dict:
    """
    Called by Module 2/3 right after a successful login.
    Signs a token AND writes the per-device session row in one step.
    """
    token, expires_at = create_access_token(user_id, device_fingerprint, risk_score)
    pool = await get_pool()
    async with pool.acquire() as conn:
        session_id = await conn.fetchval(
            """
            INSERT INTO active_sessions
                (user_id, device_fingerprint, ip_address, user_agent,
                 jwt_token, ai_risk_score, is_active, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
            RETURNING session_id;
            """,
            UUID(str(user_id)), device_fingerprint, ip_address, user_agent,
            token, risk_score, expires_at,
        )
    return {
        "session_id": str(session_id),
        "access_token": token,
        "token_type": "bearer",
        "expires_at": expires_at.isoformat(),
    }


async def refresh_session(old_token: str) -> dict:
    """Issues a fresh token + session row for the same device."""
    payload = decode_token(old_token)  # raises if already expired
    return await create_session(
        user_id=payload["sub"],
        device_fingerprint=payload[PAYLOAD_DEVICE_FP],
        ip_address="refresh",
        risk_score=payload.get(PAYLOAD_RISK_SCORE, 0.0),
    )


async def get_active_sessions(user_id: str) -> list:
    """Section 10, Query 1 -- feeds the dashboard (System A tracking System B)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT session_id, device_fingerprint, created_at
            FROM active_sessions
            WHERE user_id = $1 AND is_active = TRUE;
            """,
            UUID(str(user_id)),
        )
    return [dict(r) for r in rows]


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency. Every protected endpoint -- mine and
    teammates' -- does: `user = Depends(get_current_user)`.
    """
    token = creds.credentials
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    pool = await get_pool()
    async with pool.acquire() as conn:
        active: Optional[bool] = await conn.fetchval(
            "SELECT is_active FROM active_sessions WHERE jwt_token = $1;", token
        )
    if not active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked or not found")

    return {
        "user_id": payload["sub"],
        "device_fingerprint": payload[PAYLOAD_DEVICE_FP],
        "risk_score": payload.get(PAYLOAD_RISK_SCORE, 0.0),
        "token": token,
    }
