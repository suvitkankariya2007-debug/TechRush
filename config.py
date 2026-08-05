"""
VaultID Fixed Global Variables & Configuration
As specified in Section 9 of System Architecture
"""

import os

# --- GLOBAL VARIABLES (FIXED API CONTRACTS) ---
JWT_SECRET_KEY = "vaultid_secure_hackathon_key"
TOKEN_EXPIRATION_MINUTES = 30
HEADER_BEARER = "Authorization: Bearer <token>"
PAYLOAD_DEVICE_FP = "device_fingerprint" # String hash
PAYLOAD_RISK_SCORE = "ai_risk_score"   # Float 0.0 to 1.0

# LLM Fallback API Keys (Environment Variables)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# SQLite / Database path
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///vaultid.db")

# Model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")
