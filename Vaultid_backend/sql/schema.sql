-- VaultID shared schema for session + audit tables (Modules 4, 5, 6, 7)
-- Run ONCE against the shared Postgres instance before the demo.
-- Whoever owns Module 1 should already have a `users` table with a
-- UUID primary key `user_id` -- these tables reference it by value,
-- no FK constraint added so the two modules can be built independently.

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- needed for gen_random_uuid()

CREATE TABLE IF NOT EXISTS active_sessions (
    session_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL,
    device_fingerprint   TEXT NOT NULL,
    ip_address           TEXT NOT NULL,
    user_agent           TEXT,
    jwt_token            TEXT NOT NULL,
    ai_risk_score        REAL,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at           TIMESTAMPTZ NOT NULL,
    last_seen            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_fp   ON active_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(jwt_token);

CREATE TABLE IF NOT EXISTS login_history (
    log_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL,
    ip_address    TEXT NOT NULL,
    risk_score    REAL,
    auth_method   TEXT NOT NULL,
    status        TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
