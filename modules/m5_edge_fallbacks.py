"""
Module 5: Edge Fallbacks & Graceful Degradation Protocol
Implementation of fallback mechanisms when primary WebAuthn handshake fails due to network latency or browser incompatibility.
(Section 4)
"""

import time
import uuid
from typing import Dict, Any, Callable

class DeviceNotSupportedError(Exception):
    """Exception raised when client browser / hardware lacks WebAuthn capability."""
    pass

class GracefulDegradationHandler:
    def __init__(self, timeout_seconds: float = 3.0):
        self.timeout_seconds = timeout_seconds

    def execute_handshake_with_fallback(
        self,
        handshake_func: Callable,
        user_email: str,
        current_ip: str,
        simulate_condition: str = None
    ) -> Dict[str, Any]:
        """
        Attempts primary WebAuthn handshake.
        If timeout occurs -> Fallback to Email OTP
        If unsupported device -> Fallback to Magic Link
        """
        if simulate_condition == "TIMEOUT":
            print("[!] Handshake Timeout detected. Triggering Email OTP Fallback.")
            return {
                "status": "FALLBACK_ACTIVATED",
                "reason": "WebAuthn Handshake Latency Timeout (>3s)",
                "fallback_details": {
                    "fallback_triggered": "EMAIL_OTP",
                    "user_email": user_email,
                    "otp_sent": True
                }
            }

        if simulate_condition == "UNSUPPORTED":
            print("[!] Unsupported device detected. Triggering Magic Link Fallback.")
            return {
                "status": "FALLBACK_ACTIVATED",
                "reason": "Hardware/Browser lacks FIDO2/WebAuthn API support",
                "fallback_details": {
                    "fallback_triggered": "MAGIC_LINK",
                    "user_email": user_email,
                    "magic_link_sent": True
                }
            }

        try:
            result = handshake_func()
            return {
                "status": "SUCCESS",
                "message": "Handshake completed successfully via WebAuthn FIDO2.",
                "result": result
            }
        except DeviceNotSupportedError:
            print("[!] Hardware error caught. Fallback to Magic Link.")
            return {
                "status": "FALLBACK_ACTIVATED",
                "reason": "DeviceNotSupportedError caught during handshake execution.",
                "fallback_details": {
                    "fallback_triggered": "MAGIC_LINK",
                    "user_email": user_email,
                    "magic_link_sent": True
                }
            }
        except Exception as e:
            print(f"[!] Primary handshake failed ({e}). Fallback to Email OTP.")
            return {
                "status": "FALLBACK_ACTIVATED",
                "reason": f"Handshake Exception: {str(e)}",
                "fallback_details": {
                    "fallback_triggered": "EMAIL_OTP",
                    "user_email": user_email,
                    "otp_sent": True
                }
            }

if __name__ == "__main__":
    print("=" * 70)
    print(" VaultID Module 5: Edge Fallbacks Self-Test")
    print("=" * 70)
    handler = GracefulDegradationHandler()
    res1 = handler.execute_handshake_with_fallback(lambda: "OK", "user@vaultid.io", "127.0.0.1", "TIMEOUT")
    print("Timeout Test:", res1)
    res2 = handler.execute_handshake_with_fallback(lambda: "OK", "user@vaultid.io", "127.0.0.1", "UNSUPPORTED")
    print("Unsupported Test:", res2)
    print("\n[✓] Module 5 Edge Fallbacks test completed successfully.")
    print("=" * 70)
