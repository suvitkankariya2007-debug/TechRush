import uuid
import random
from typing import Union
from datetime import datetime

# ---- Users ----
async def get_user_by_email(conn, email: str):
    return await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)

async def get_user_by_id(conn, user_id: Union[uuid.UUID, str, int]):
    return await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)

async def get_user_by_username(conn, username: str):
    return await conn.fetchrow("SELECT * FROM users WHERE username = $1", username)

async def create_user(conn, username: str, email: str, phone: str, device_fp: str, ip: str, ua: str):
    user_id = uuid.uuid4()
    await conn.execute(
        "INSERT INTO users (id, username, email, phone) VALUES ($1, $2, $3, $4)",
        user_id, username, email, phone
    )
    await conn.execute(
        "INSERT INTO user_devices (user_id, device_fingerprint, ip_address, user_agent) VALUES ($1, $2, $3, $4)",
        user_id, device_fp, ip, ua
    )
    return await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)

# ---- Devices ----
async def get_user_devices(conn, user_id: Union[uuid.UUID, str, int]):
    return await conn.fetch("SELECT * FROM user_devices WHERE user_id = $1", user_id)

# ---- OTP ----
async def create_otp(conn, user_id: Union[uuid.UUID, str, int], email: str):
    await conn.execute("DELETE FROM otp_codes WHERE user_id = $1", user_id)
    code = f"{random.randint(100000, 999999)}"
    await conn.execute(
        "INSERT INTO otp_codes (user_id, email, code) VALUES ($1, $2, $3)",
        user_id, email, code
    )
    return await conn.fetchrow(
        "SELECT * FROM otp_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        user_id
    )

async def verify_otp(conn, user_id: Union[uuid.UUID, str, int], code: str) -> bool:
    row = await conn.fetchrow(
        "SELECT * FROM otp_codes WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()",
        user_id, code
    )
    if not row:
        return False
    await conn.execute("UPDATE otp_codes SET used = TRUE WHERE id = $1", row["id"])
    return True

# ---- WebAuthn Challenges ----
async def store_challenge(conn, user_id: Union[uuid.UUID, str, int], challenge_b64: str):
    await conn.execute("DELETE FROM webauthn_challenges WHERE user_id = $1", user_id)
    return await conn.fetchrow(
        "INSERT INTO webauthn_challenges (user_id, challenge) VALUES ($1, $2) RETURNING *",
        user_id, challenge_b64
    )

async def get_challenge(conn, user_id: Union[uuid.UUID, str, int]):
    row = await conn.fetchrow(
        """SELECT challenge FROM webauthn_challenges
           WHERE user_id = $1 AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1""",
        user_id
    )
    return row["challenge"] if row else None

async def delete_challenge(conn, user_id: Union[uuid.UUID, str, int]):
    await conn.execute("DELETE FROM webauthn_challenges WHERE user_id = $1", user_id)

# ---- WebAuthn Credentials ----
async def store_credential(conn, user_id: Union[uuid.UUID, str, int], credential_id: str, public_key: str,
                           sign_count: int, device_name: str = None):
    await conn.execute(
        """INSERT INTO webauthn_credentials (user_id, credential_id, public_key, sign_count, device_name)
           VALUES ($1, $2, $3, $4, $5)""",
        user_id, credential_id, public_key, sign_count, device_name
    )

async def get_credentials_by_user(conn, user_id: Union[uuid.UUID, str, int]):
    return await conn.fetch("SELECT * FROM webauthn_credentials WHERE user_id = $1", user_id)

async def get_credential_by_id(conn, credential_id: str):
    return await conn.fetchrow("SELECT * FROM webauthn_credentials WHERE credential_id = $1", credential_id)

async def update_sign_count(conn, credential_id: str, new_sign_count: int):
    await conn.execute(
        "UPDATE webauthn_credentials SET sign_count = $1 WHERE credential_id = $2",
        new_sign_count, credential_id
    )

# ---- Active Sessions ----
async def create_active_session(conn, user_id: Union[uuid.UUID, str, int], device_fp: str, ip: str, ua: str, expires_at: datetime):
    return await conn.fetchval(
        """INSERT INTO active_sessions (user_id, device_fingerprint, ip_address, user_agent, expires_at)
           VALUES ($1, $2, $3, $4, $5) RETURNING session_id""",
        user_id, device_fp, ip, ua, expires_at
    )

async def revoke_all_sessions(conn, user_id: Union[uuid.UUID, str, int]):
    await conn.execute("UPDATE active_sessions SET is_active = FALSE WHERE user_id = $1", user_id)

# ---- Audit Log ----
async def log_login_attempt(conn, user_id: Union[uuid.UUID, str, int], ip: str, risk_score: float, method: str, status: str):
    await conn.execute(
        """INSERT INTO login_history (user_id, ip_address, risk_score, auth_method, status)
           VALUES ($1, $2, $3, $4, $5)""",
        user_id, ip, risk_score, method, status
    )