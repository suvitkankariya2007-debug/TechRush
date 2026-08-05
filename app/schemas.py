import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

# --- Registration ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    phone: Optional[str] = None
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class UserResponse(BaseModel):
    id:  UUID
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- OTP ---
class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    code: str
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

# --- Sessions ---
class GlobalLogoutRequest(BaseModel):
    user_id: uuid.UUID

# --- WebAuthn Registration ---
class WebAuthnRegBeginRequest(BaseModel):
    user_id: uuid.UUID
    device_name: Optional[str] = None

class WebAuthnRegBeginResponse(BaseModel):
    options: dict

class WebAuthnRegCompleteRequest(BaseModel):
    user_id: uuid.UUID
    credential: dict
    device_name: Optional[str] = None

class WebAuthnRegCompleteResponse(BaseModel):
    success: bool
    message: str
    credential_id: Optional[str] = None

# --- WebAuthn Login ---
class WebAuthnLoginBeginRequest(BaseModel):
    email: EmailStr
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class WebAuthnLoginBeginResponse(BaseModel):
    status: str  # "PASSKEY_REQUIRED" or "NO_PASSKEY"
    webauthn_options: Optional[dict] = None
    user_id: Optional[uuid.UUID] = None

class WebAuthnLoginCompleteRequest(BaseModel):
    user_id: uuid.UUID
    credential: dict

class WebAuthnLoginCompleteResponse(BaseModel):
    success: bool
    jwt_token: Optional[str] = None
    message: str