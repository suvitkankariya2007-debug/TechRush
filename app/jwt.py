from jose import jwt
from datetime import datetime, timedelta
from app.config import settings

def create_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=settings.TOKEN_EXPIRATION_MINUTES)
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")

def verify_jwt(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except Exception:
        return None
