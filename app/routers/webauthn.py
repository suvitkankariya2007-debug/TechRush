from fastapi import APIRouter, Depends, HTTPException, Request
from app.database import get_db
from app.schemas import (
    WebAuthnRegBeginRequest, WebAuthnRegBeginResponse,
    WebAuthnRegCompleteRequest, WebAuthnRegCompleteResponse,
    WebAuthnLoginBeginRequest, WebAuthnLoginBeginResponse,
    WebAuthnLoginCompleteRequest, WebAuthnLoginCompleteResponse
)
from app.crud import (
    get_user_by_id, get_user_by_email, get_credentials_by_user, store_credential,
    store_challenge, get_challenge, delete_challenge,
    get_credential_by_id, update_sign_count
)
from app.webauthn_helpers import (
    generate_registration_options_for_user,
    verify_registration_response,
    generate_authentication_options_for_user,
    verify_authentication_response,
    safe_b64decode
)
from app.jwt import create_jwt
from app.config import settings
from urllib.parse import urlparse
import base64

router = APIRouter(prefix="/api/v1/auth/webauthn", tags=["webauthn"])


def _get_origin_and_rpid(request: Request):
    """Extract the real origin and rpId from the incoming request headers."""
    origin = request.headers.get("origin")
    if origin:
        hostname = urlparse(origin).hostname
        return origin, hostname or settings.RP_ID
    referer = request.headers.get("referer")
    if referer:
        parsed = urlparse(referer)
        return f"{parsed.scheme}://{parsed.netloc}", parsed.hostname or settings.RP_ID
    return settings.ORIGIN, settings.RP_ID


@router.post("/register/begin", response_model=WebAuthnRegBeginResponse)
def webauthn_register_begin(payload: WebAuthnRegBeginRequest, request: Request, db=Depends(get_db)):
    user = get_user_by_id(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    _origin, rp_id = _get_origin_and_rpid(request)
    options_dict = generate_registration_options_for_user(
        user_id=str(user.id),
        username=user.email,
        display_name=user.email,
        rp_id=rp_id
    )
    store_challenge(db, user.id, options_dict["challenge"])
    return WebAuthnRegBeginResponse(options=options_dict)


@router.post("/register/complete", response_model=WebAuthnRegCompleteResponse)
def webauthn_register_complete(payload: WebAuthnRegCompleteRequest, request: Request, db=Depends(get_db)):
    user = get_user_by_id(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    challenge_b64 = get_challenge(db, user.id)
    if not challenge_b64:
        raise HTTPException(status_code=400, detail="No active challenge")
    challenge = safe_b64decode(challenge_b64)
    expected_origin, expected_rpid = _get_origin_and_rpid(request)
    try:
        verification = verify_registration_response(
            credential=payload.credential,
            challenge=challenge,
            expected_rp_id=expected_rpid,
            expected_origin=expected_origin,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

    credential_id = base64.urlsafe_b64encode(verification.credential_id).decode().rstrip("=")
    public_key = base64.urlsafe_b64encode(verification.credential_public_key).decode().rstrip("=")
    store_credential(
        db, user.id, credential_id, public_key, verification.sign_count,
        device_name=payload.device_name
    )
    delete_challenge(db, user.id)
    return WebAuthnRegCompleteResponse(
        success=True,
        message="Credential registered",
        credential_id=credential_id
    )


@router.post("/login/begin", response_model=WebAuthnLoginBeginResponse)
def webauthn_login_begin(payload: WebAuthnLoginBeginRequest, request: Request, db=Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    credentials = get_credentials_by_user(db, user.id)
    if not credentials:
        return WebAuthnLoginBeginResponse(status="NO_PASSKEY", user_id=user.id)

    _origin, rp_id = _get_origin_and_rpid(request)
    credential_ids = [c.credential_id for c in credentials]
    options_dict = generate_authentication_options_for_user(credential_ids=credential_ids, rp_id=rp_id)
    store_challenge(db, user.id, options_dict["challenge"])
    return WebAuthnLoginBeginResponse(
        status="PASSKEY_REQUIRED",
        webauthn_options=options_dict,
        user_id=user.id
    )


@router.post("/login/complete", response_model=WebAuthnLoginCompleteResponse)
def webauthn_login_complete(payload: WebAuthnLoginCompleteRequest, request: Request, db=Depends(get_db)):
    user = get_user_by_id(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    challenge_b64 = get_challenge(db, user.id)
    if not challenge_b64:
        raise HTTPException(status_code=400, detail="No active challenge")
    challenge = safe_b64decode(challenge_b64)

    cred_id = payload.credential.get("id")
    if not cred_id:
        raise HTTPException(status_code=400, detail="Missing credential id")
    credential = get_credential_by_id(db, cred_id)
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")

    expected_origin, expected_rpid = _get_origin_and_rpid(request)
    public_key = safe_b64decode(credential.public_key)
    try:
        verification = verify_authentication_response(
            credential=payload.credential,
            challenge=challenge,
            expected_rp_id=expected_rpid,
            expected_origin=expected_origin,
            credential_public_key=public_key,
            credential_sign_count=credential.sign_count,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

    update_sign_count(db, cred_id, verification.new_sign_count)
    delete_challenge(db, user.id)
    token = create_jwt(str(user.id))
    return WebAuthnLoginCompleteResponse(
        success=True,
        jwt_token=token,
        message="Login successful"
    )