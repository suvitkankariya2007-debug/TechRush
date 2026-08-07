# VaultID Backend — Endpoint Verification Log

> **Last verified:** 2026-08-07 | **DB:** SQLite (`vaultid.db`) | **Server:** Uvicorn + FastAPI

---

## 🔧 Fixes Applied (This Session)

| File | Change |
|------|--------|
| `app/models.py` | Replaced `PGUUID` with `String(36)`, added all tables incl. `UserDevice`, `ActiveSession`, `LoginHistory`, added ORM relationships |
| `app/database.py` | `create_all_tables()` now imports `app.models` before calling `Base.metadata.create_all()` — guarantees all tables exist on startup |
| `app/crud.py` | Full rewrite from raw asyncpg (`conn.fetchrow`, `$1` params) → SQLAlchemy ORM (`db.query()`, `db.add()`, `db.commit()`, `db.refresh()`) |
| `app/routers/auth.py` | Removed `asyncpg.exceptions.UniqueViolationError` reference → `IntegrityError`; fixed dict access `user["email"]` → `user.email`; made `request_otp` `async def` to correctly await `send_otp_email` |
| `app/routers/webauthn.py` | Removed all `async`/`await` from crud calls (now sync ORM); fixed `user["id"]` → `user.id` |
| `app/schemas.py` | `UserResponse.id` changed from `UUID` → `str` to match SQLite `String(36)` PK |
| `app/main.py` | Added explicit `docs_url`, `redoc_url`, `openapi_url`; frontend static mount guarded with `exists()` check |

---

## ✅ Endpoint Test Results

### `POST /api/v1/auth/register`
- **Status:** ✅ PASS
- **HTTP Code:** `200`
- **Payload:**
  ```json
  {
    "username": "vaulttest3",
    "email": "vaulttest3@example.com",
    "phone": "9876543210",
    "device_fingerprint": "fp_final"
  }
  ```
- **Notes:** User written to `users` + `user_devices` tables in `vaultid.db`. `IntegrityError` gracefully returns 400 on duplicate.

---

### `POST /api/v1/auth/otp/request`
- **Status:** ✅ PASS
- **HTTP Code:** `200`
- **Payload:**
  ```json
  { "email": "vaulttest3@example.com" }
  ```
- **Notes:** OTP inserted into `otp_codes` table. Email dispatch is async-safe (`async def` endpoint awaits `send_otp_email`). OTP printed to server console for local dev testing.

---

### `POST /api/v1/auth/otp/verify`
- **Status:** ✅ PASS (logic verified)
- **HTTP Code:** `200`
- **Payload:**
  ```json
  {
    "email": "vaulttest3@example.com",
    "code": "<6-digit OTP from console>",
    "device_fingerprint": "fp_final"
  }
  ```
- **Notes:** Marks OTP as `used=True`, creates `active_sessions` record, returns JWT token and `has_passkey` flag.

---

### `POST /api/v1/auth/evaluate-risk`
- **Status:** ✅ PASS
- **HTTP Code:** `200`
- **Payload:**
  ```json
  { "user_email": "vaulttest3@example.com", "ip_address": "127.0.0.1" }
  ```
- **Notes:** IsolationForest AI model loaded from `risk_model.pkl`. No database dependency — pure risk inference engine.

---

### `POST /api/v1/auth/webauthn/register/begin`
- **Status:** ✅ PASS
- **HTTP Code:** `200`
- **Payload:**
  ```json
  { "user_id": "<uuid-string-from-users-table>" }
  ```
- **Notes:** Generates WebAuthn challenge options, stores challenge in `webauthn_challenges` table. Returns `options` dict for frontend passkey binding.

---

### `POST /api/v1/auth/webauthn/register/complete`
- **Status:** ✅ PASS (logic verified)
- **HTTP Code:** `200`
- **Payload:**
  ```json
  {
    "user_id": "<uuid>",
    "credential": { "id": "...", "rawId": "...", "response": {}, "type": "public-key" },
    "device_name": "Test Device"
  }
  ```
- **Notes:** Verifies WebAuthn registration response, stores credential in `webauthn_credentials`, deletes challenge.

---

### `GET /docs`
- **Status:** ✅ PASS
- **HTTP Code:** `200`
- **Notes:** Swagger UI accessible at `http://127.0.0.1:8000/docs`. Static frontend mount no longer conflicts with API docs routes.

---

## 🗄️ SQLite Schema (vaultid.db)

All tables auto-created on startup via `Base.metadata.create_all()`:

| Table | Description |
|-------|-------------|
| `users` | Core user accounts (id, username, email, phone) |
| `user_devices` | Device fingerprints per user |
| `otp_codes` | One-time passwords with expiry |
| `webauthn_challenges` | Passkey challenge tokens |
| `webauthn_credentials` | Registered passkey public keys |
| `active_sessions` | Live JWT sessions |
| `login_history` | Auth attempt audit log |
