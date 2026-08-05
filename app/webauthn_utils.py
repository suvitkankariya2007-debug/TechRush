import os
from dotenv import load_dotenv
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
)

load_dotenv()

RP_ID = os.getenv("RP_ID", "localhost")
RP_NAME = "VaultID"
ORIGIN = os.getenv("ORIGIN", "http://localhost:8000")

def get_registration_options(user_id: int, username: str):
    return generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=str(user_id).encode("utf-8"),
        user_name=username,
        user_display_name=username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED
        ),
    )

def verify_registration(credential, expected_challenge: bytes):
    return verify_registration_response(
        credential=credential,
        expected_challenge=expected_challenge,
        expected_rp_id=RP_ID,
        expected_origin=ORIGIN,
    )

def get_authentication_options():
    return generate_authentication_options(
        rp_id=RP_ID,
        user_verification=UserVerificationRequirement.PREFERRED,
    )

def verify_authentication(credential, expected_challenge: bytes, public_key: str, sign_count: int):
    return verify_authentication_response(
        credential=credential,
        expected_challenge=expected_challenge,
        expected_rp_id=RP_ID,
        expected_origin=ORIGIN,
        credential_public_key=public_key,
        credential_current_sign_count=sign_count,
    )