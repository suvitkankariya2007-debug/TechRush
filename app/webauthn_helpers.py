import base64
import json
import webauthn
from webauthn import (
    generate_registration_options,
    verify_registration_response as _verify_registration_response,
    generate_authentication_options,
    verify_authentication_response as _verify_authentication_response,
    options_to_json,
)
from webauthn.helpers import (
    parse_registration_credential_json,
    parse_authentication_credential_json,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    PublicKeyCredentialDescriptor,
)
from app.config import settings


def safe_b64decode(s: str) -> bytes:
    if not s:
        return b""
    if isinstance(s, bytes):
        s = s.decode("utf-8")
    s = s.strip()
    rem = len(s) % 4
    if rem > 0:
        s += "=" * (4 - rem)
    try:
        return base64.urlsafe_b64decode(s)
    except Exception:
        return base64.b64decode(s)


def _options_to_dict(options) -> dict:
    """Safely converts pywebauthn options objects to standard python dicts with base64url encoding."""
    return json.loads(options_to_json(options))


def generate_registration_options_for_user(user_id: str, username: str, display_name: str = None, rp_id: str = None):
    options = generate_registration_options(
        rp_id=rp_id or settings.RP_ID,
        rp_name=settings.RP_NAME,
        user_id=user_id.encode(),
        user_name=username,
        user_display_name=display_name or username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED
        ),
    )
    
    options_dict = _options_to_dict(options)
    return options_dict


def verify_registration_response(credential: dict, challenge: bytes, expected_rp_id: str, expected_origin: str):
    if isinstance(credential, dict):
        reg_credential = parse_registration_credential_json(json.dumps(credential))
    elif isinstance(credential, str):
        reg_credential = parse_registration_credential_json(credential)
    else:
        reg_credential = credential

    return _verify_registration_response(
        credential=reg_credential,
        expected_challenge=challenge,
        expected_rp_id=expected_rp_id,
        expected_origin=expected_origin,
    )


def generate_authentication_options_for_user(credential_ids: list, rp_id: str = None):
    descriptors = []
    for cid in credential_ids:
        raw_bytes = safe_b64decode(cid)
        if raw_bytes:
            descriptors.append(PublicKeyCredentialDescriptor(id=raw_bytes))

    options = generate_authentication_options(
        rp_id=rp_id or settings.RP_ID,
        user_verification=UserVerificationRequirement.PREFERRED,
        allow_credentials=descriptors,
    )
    
    options_dict = _options_to_dict(options)
    return options_dict


def verify_authentication_response(credential: dict, challenge: bytes, expected_rp_id: str, expected_origin: str,
                                    credential_public_key: bytes, credential_sign_count: int):
    if isinstance(credential, dict):
        auth_credential = parse_authentication_credential_json(json.dumps(credential))
    elif isinstance(credential, str):
        auth_credential = parse_authentication_credential_json(credential)
    else:
        auth_credential = credential

    return _verify_authentication_response(
        credential=auth_credential,
        expected_challenge=challenge,
        expected_rp_id=expected_rp_id,
        expected_origin=expected_origin,
        credential_public_key=credential_public_key,
        credential_current_sign_count=credential_sign_count,
        require_user_verification=False,
    )