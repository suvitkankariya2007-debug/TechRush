"""
Module 7 -- Logout From All Devices (Global Revocation)
===========================================================
Owns:
  - The "Pause Session" global revocation (Section 10, Query 2)
  - The three parallel closing actions fired on logout (Section 8):
    notify user, update login_history, refresh security dashboard.

Who calls into this module:
  - Exposed as a route in routes.py; any authenticated client hits
    POST /api/v1/auth/logout-all with its bearer token.
  - Module 8 (Security Alerts) should read the "logout_all" rows this
    module writes to login_history to reflect them on the dashboard.
"""

import asyncio
from uuid import UUID

from app.database import get_pool


async def revoke_all_sessions(user_id: str) -> int:
    """Section 10, Query 2. Returns the number of sessions revoked."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE active_sessions SET is_active = FALSE WHERE user_id = $1;",
            UUID(str(user_id)),
        )
    # asyncpg returns a status string like "UPDATE 3"
    return int(result.split()[-1])


async def _notify_user(user_id: str) -> None:
    # Stub -- wire to Module 8's push/notification layer.
    print(f"[notify] Logged out all devices for user {user_id}")


async def _log_audit_event(user_id: str, ip_address: str, risk_score: float) -> None:
    """Section 10, Query 3 -- audit trail entry for the logout event."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO login_history
                (user_id, ip_address, risk_score, auth_method, status)
            VALUES ($1, $2, $3, $4, $5);
            """,
            UUID(str(user_id)), ip_address, risk_score, "logout_all", "success",
        )


async def _refresh_security_dashboard(user_id: str) -> None:
    # Stub -- wire to whatever the dashboard module reads from
    # (e.g. a materialized view or a websocket push, Module 8's job).
    print(f"[dashboard] Refreshed security health for user {user_id}")


async def logout_all_devices(user_id: str, ip_address: str, risk_score: float = 0.0) -> int:
    """
    Full Section 8 flow: revoke every session row, then fire the
    three closing actions in parallel.
    """
    revoked_count = await revoke_all_sessions(user_id)
    await asyncio.gather(
        _notify_user(user_id),
        _log_audit_event(user_id, ip_address, risk_score),
        _refresh_security_dashboard(user_id),
    )
    return revoked_count
