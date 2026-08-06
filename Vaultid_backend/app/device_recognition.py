"""
Module 5 -- Trusted Device Recognition (IP + UserAgent Hash)
===============================================================
Owns:
  - Building the device_fingerprint string every other module treats
    as an opaque ID (this IS the PAYLOAD_DEVICE_FP value).
  - Deciding whether a fingerprint is "known" for a user -- this is
    the device_known / ip_trust_score signal the Isolation Forest
    Risk Agent (Sections 4-5, teammates' module) consumes as an
    input feature.

Who calls into this module:
  - Module 1 (registration) calls generate_device_fingerprint() at
    signup to establish the first trusted device.
  - Module 2 (OTP) and Module 3 (WebAuthn login) call
    generate_device_fingerprint() + get_device_trust() BEFORE calling
    session_manager.create_session(), and pass the resulting
    device_known / ip_trust_score into the Risk Agent's state dict
    (the `current_state` object in Section 5).
"""

import hashlib
from uuid import UUID

from app.database import get_pool


def generate_device_fingerprint(ip_address: str, user_agent: str) -> str:
    """
    Section 2, Module 5: IP + UserAgent hash.
    Deterministic -- the same device/network combo always hashes the
    same, which is what lets get_device_trust() recognize repeat
    logins from that device.
    """
    raw = f"{ip_address}|{user_agent}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


async def get_device_trust(user_id: str, device_fingerprint: str) -> dict:
    """
    Returns the feature dict the Risk Agent's state representation
    (Section 5, current_state) expects:
        {"device_known": bool, "ip_trust_score": float, "login_count": int}
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        login_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM active_sessions
            WHERE user_id = $1 AND device_fingerprint = $2;
            """,
            UUID(str(user_id)), device_fingerprint,
        )
    device_known = login_count > 0
    # Simple monotonic trust curve: more prior logins on this exact
    # device/network combo -> higher trust, capped at 1.0.
    ip_trust_score = min(1.0, login_count / 5) if device_known else 0.0

    return {
        "device_known": device_known,
        "ip_trust_score": ip_trust_score,
        "login_count": login_count,
    }
