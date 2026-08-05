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
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    RegistrationCredential,
    AuthenticationCredential,
)
from app.config import settings


def _options_to_dict(options) -> dict:
    """Safely converts pywebauthn options objects to standard python dicts."""
    if hasattr(options, "model_dump"):
        return options.model_dump()
    if hasattr(webauthn, "options_to_json"):
        return json.loads(options_to_json(options))
    if hasattr(options, "dict"):
        return options.dict()
    raise AttributeError("Could not serialize pywebauthn options object.")


def generate_registration_options_for_user(user_id: str, username: str, display_name: str = None):
    options = generate_registration_options(
        rp_id=settings.RP_ID,
        rp_name=settings.RP_NAME,
        user_id=user_id.encode(),
        user_name=username,
        user_display_name=display_name or username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED
        ),
    )
    
    options_dict = _options_to_dict(options)
    
    # Ensure raw bytes/buffers are JSON safe if pywebauthn hasn't already converted them
    if isinstance(options_dict.get("challenge"), bytes):
        options_dict["challenge"] = base64.b64encode(options.challenge).decode()
    if isinstance(options_dict.get("user", {}).get("id"), bytes):
        options_dict["user"]["id"] = base64.b64encode(options.user.id).decode()
        
    return options_dict


def verify_registration_response(credential: dict, challenge: bytes, expected_rp_id: str, expected_origin: str):
    reg_credential = RegistrationCredential(
        id=credential["id"],
        raw_id=credential["rawId"],
        response=credential["response"],
        type=credential["type"],
    )
    return _verify_registration_response(
        credential=reg_credential,
        expected_challenge=challenge,
        expected_rp_id=expected_rp_id,
        expected_origin=expected_origin,
    )


def generate_authentication_options_for_user(credential_ids: list):
    options = generate_authentication_options(
        rp_id=settings.RP_ID,
        user_verification=UserVerificationRequirement.PREFERRED,
        allow_credentials=[
            {"id": base64.urlsafe_b64decode(cid + "==" if not cid.endswith("==") else cid), "type": "public-key"}
            for cid in credential_ids
        ],
    )
    
    options_dict = _options_to_dict(options)
    
    if isinstance(options_dict.get("challenge"), bytes):
        options_dict["challenge"] = base64.b64encode(options.challenge).decode()
        
    return options_dict


def verify_authentication_response(credential: dict, challenge: bytes, expected_rp_id: str, expected_origin: str,
                                    credential_public_key: bytes, credential_sign_count: int):
    auth_credential = AuthenticationCredential(
        id=credential["id"],
        raw_id=credential["rawId"],
        response=credential["response"],
        type=credential["type"],
    )
    return _verify_authentication_response(
        credential=auth_credential,
        expected_challenge=challenge,
        expected_rp_id=expected_rp_id,
        expected_origin=expected_origin,
        credential_public_key=credential_public_key,
        credential_current_sign_count=credential_sign_count,
        require_user_verification=False,
    )