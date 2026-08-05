"""
Module 7: Transaction Risk Assessment Engine
Keyed to monetary transaction value (Section 8) to determine required step-up authentication methods.
"""

from typing import Dict, Any

class TransactionRiskEngine:
    @classmethod
    def assess_transaction_risk(cls, amount_inr: float) -> Dict[str, Any]:
        """
        Categorizes transaction into value bands:
        - Low Value (< ₹500): Simple WebAuthn Fingerprint / Biometric
        - Medium Value (₹500 - ₹100,000): Fingerprint + Push Approval
        - High Value (> ₹100,000): Face ID + QR Code Approval + Liveness Check
        """
        if amount_inr < 500.0:
            return {
                "amount_inr": amount_inr,
                "value_band": "Low Value",
                "required_method": "Fingerprint",
                "step_up_required": False
            }
        elif amount_inr <= 100000.0:
            return {
                "amount_inr": amount_inr,
                "value_band": "Medium Value",
                "required_method": "Fingerprint + Push Approval",
                "step_up_required": True
            }
        else:
            return {
                "amount_inr": amount_inr,
                "value_band": "High Value",
                "required_method": "Face ID + QR Approval + Liveness Check",
                "step_up_required": True
            }

    @classmethod
    def verify_transaction_auth(
        cls,
        amount_inr: float,
        provided_auth_method: str,
        liveness_verified: bool = False
    ) -> Dict[str, Any]:
        """
        Verifies if provided authentication satisfies the risk policy for the given transaction amount.
        """
        assessment = cls.assess_transaction_risk(amount_inr)
        req_method = assessment["required_method"]

        approved = False
        if assessment["value_band"] == "High Value":
            approved = (provided_auth_method == req_method and liveness_verified)
        else:
            approved = (provided_auth_method == req_method or req_method in provided_auth_method)

        return {
            "amount_inr": amount_inr,
            "value_band": assessment["value_band"],
            "required_method": req_method,
            "provided_method": provided_auth_method,
            "liveness_verified": liveness_verified,
            "transaction_approved": approved,
            "status": "APPROVED" if approved else "DENIED"
        }

if __name__ == "__main__":
    print("=" * 70)
    print(" VaultID Module 7: Transaction Risk Engine Self-Test")
    print("=" * 70)
    res_low = TransactionRiskEngine.assess_transaction_risk(350.0)
    print("Low Value Tx:", res_low)
    res_high = TransactionRiskEngine.assess_transaction_risk(500000.0)
    print("High Value Tx:", res_high)
    verif = TransactionRiskEngine.verify_transaction_auth(500000.0, "Face ID + QR Approval + Liveness Check", True)
    print("High Value Verification:", verif)
    print("\n[✓] Module 7 Transaction Risk Engine test completed successfully.")
    print("=" * 70)