from fastapi import APIRouter, Depends, HTTPException
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
    verify_authentication_response
)
from app.jwt import create_jwt
from app.config import settings
import base64

router = APIRouter(prefix="/api/v1/auth/webauthn", tags=["webauthn"])


@router.post("/register/begin", response_model=WebAuthnRegBeginResponse)
async def webauthn_register_begin(payload: WebAuthnRegBeginRequest, conn=Depends(get_db)):
    user = await get_user_by_id(conn, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    options_dict = generate_registration_options_for_user(
        user_id=str(user["id"]),
        username=user["email"],
        display_name=user["email"]
    )
    await store_challenge(conn, user["id"], options_dict["challenge"])
    return WebAuthnRegBeginResponse(options=options_dict)


@router.post("/register/complete", response_model=WebAuthnRegCompleteResponse)
async def webauthn_register_complete(payload: WebAuthnRegCompleteRequest, conn=Depends(get_db)):
    user = await get_user_by_id(conn, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    challenge_b64 = await get_challenge(conn, user["id"])
    if not challenge_b64:
        raise HTTPException(status_code=400, detail="No active challenge")
    challenge = base64.b64decode(challenge_b64)
    try:
        verification = verify_registration_response(
            credential=payload.credential,
            challenge=challenge,
            expected_rp_id=settings.RP_ID,
            expected_origin=settings.ORIGIN,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

    credential_id = base64.b64encode(verification.credential_id).decode()
    public_key = base64.b64encode(verification.credential_public_key).decode()
    await store_credential(
        conn, user["id"], credential_id, public_key, verification.sign_count,
        device_name=payload.device_name
    )
    await delete_challenge(conn, user["id"])
    return WebAuthnRegCompleteResponse(
        success=True,
        message="Credential registered",
        credential_id=credential_id
    )


@router.post("/login/begin", response_model=WebAuthnLoginBeginResponse)
async def webauthn_login_begin(payload: WebAuthnLoginBeginRequest, conn=Depends(get_db)):
    user = await get_user_by_email(conn, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    credentials = await get_credentials_by_user(conn, user["id"])
    if not credentials:
        return WebAuthnLoginBeginResponse(status="NO_PASSKEY", user_id=user["id"])

    credential_ids = [c["credential_id"] for c in credentials]
    options_dict = generate_authentication_options_for_user(credential_ids=credential_ids)
    await store_challenge(conn, user["id"], options_dict["challenge"])
    return WebAuthnLoginBeginResponse(
        status="PASSKEY_REQUIRED",
        webauthn_options=options_dict,
        user_id=user["id"]
    )


@router.post("/login/complete", response_model=WebAuthnLoginCompleteResponse)
async def webauthn_login_complete(payload: WebAuthnLoginCompleteRequest, conn=Depends(get_db)):
    user = await get_user_by_id(conn, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    challenge_b64 = await get_challenge(conn, user["id"])
    if not challenge_b64:
        raise HTTPException(status_code=400, detail="No active challenge")
    challenge = base64.b64decode(challenge_b64)

    cred_id = payload.credential.get("id")
    if not cred_id:
        raise HTTPException(status_code=400, detail="Missing credential id")
    credential = await get_credential_by_id(conn, cred_id)
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")

    public_key = base64.b64decode(credential["public_key"])
    try:
        verification = verify_authentication_response(
            credential=payload.credential,
            challenge=challenge,
            expected_rp_id=settings.RP_ID,
            expected_origin=settings.ORIGIN,
            credential_public_key=public_key,
            credential_sign_count=credential["sign_count"],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

    await update_sign_count(conn, cred_id, verification.new_sign_count)
    await delete_challenge(conn, user["id"])
    token = create_jwt(str(user["id"]))
    return WebAuthnLoginCompleteResponse(
        success=True,
        jwt_token=token,
        message="Login successful"
    )