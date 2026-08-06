"""
VaultID Shared Configuration
=============================
Holds the FIXED GLOBAL VARIABLES from Section 9 of the Execution Plan.
Every teammate's module (1-8) MUST import these instead of redefining
them locally, or a JWT signed by Module 3 (WebAuthn login) won't
validate inside Module 4 (this file's session logic), and vice versa.

If a teammate already created a config.py for the shared backend,
do NOT create a second one -- copy these constants into theirs and
delete this file so there's only one source of truth.
"""

import os

# ---- GLOBAL VARIABLES (Section 9 -- do not rename) ----
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "vaultid_secure_hackathon_key")
TOKEN_EXPIRATION_MINUTES = int(os.getenv("TOKEN_EXPIRATION_MINUTES", "30"))
HEADER_BEARER = "Authorization: Bearer <token>"
PAYLOAD_DEVICE_FP = "device_fingerprint"      # string hash
PAYLOAD_RISK_SCORE = "ai_risk_score"          # float 0.0 - 1.0

JWT_ALGORITHM = "HS256"

# ---- Database (shared FastAPI instance, Section 3) ----
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://vaultid_user:vaultid_pass@localhost:5432/vaultid_db",
)
