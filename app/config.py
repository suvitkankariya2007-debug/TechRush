import os
from pydantic_settings import BaseSettings
from pydantic import Field
from urllib.parse import quote_plus


class Settings(BaseSettings):
    # Database (Defaults to local SQLite to avoid connection-refused errors)
    DATABASE_URL: str = Field("sqlite:///./vaultid.db", env="DATABASE_URL")
    
    # JWT
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    TOKEN_EXPIRATION_MINUTES: int = Field(30, env="TOKEN_EXPIRATION_MINUTES")

    # WebAuthn
    RP_ID: str = Field("localhost", env="RP_ID")
    RP_NAME: str = "VaultID"
    ORIGIN: str = Field("http://localhost:8000", env="ORIGIN")

    # Email (optional)
    SMTP_HOST: str = Field("", env="SMTP_HOST")
    SMTP_PORT: int = Field(587, env="SMTP_PORT")
    SMTP_USER: str = Field("", env="SMTP_USER")
    SMTP_PASSWORD: str = Field("", env="SMTP_PASSWORD")
    EMAIL_FROM: str = Field("noreply@vaultid.com", env="EMAIL_FROM")

    # AI Risk Engine — LLM fallback API keys (optional)
    OPENAI_API_KEY: str = Field("", env="OPENAI_API_KEY")
    GEMINI_API_KEY: str = Field("", env="GEMINI_API_KEY")

    @property
    def DATABASE_DSN(self) -> str:
        """Returns connection string safely for SQLAlchemy."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# ── Fixed global constants used by risk modules ──────────────────────────────
# API contract field names (must not change between versions)
PAYLOAD_RISK_SCORE = "ai_risk_score"        # Float 0.0–1.0 in response body
PAYLOAD_DEVICE_FP  = "device_fingerprint"   # String device hash in request body

# Convenience re-exports so modules can do: from app.config import MODEL_PATH
OPENAI_API_KEY = settings.OPENAI_API_KEY
GEMINI_API_KEY = settings.GEMINI_API_KEY

# Path to the trained IsolationForest artifact (risk_model.pkl lives at repo root)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "risk_model.pkl")