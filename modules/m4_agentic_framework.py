"""
Module 4: Agentic Framework Logic (State, Cost, Goal Test, Decision Routing)
Implements standard agentic-search principles (Section 5) for explainable, cost-weighted risk evaluation.
"""

from typing import Dict, Any

# 1. STATE REPRESENTATION
def create_initial_state(
    ip_trust_score: float,
    device_known: bool,
    risk_score: float
) -> Dict[str, Any]:
    return {
        "ip_trust_score": float(ip_trust_score),
        "device_known": bool(device_known),
        "auth_step_completed": "None", # Options: None, WebAuthn, Push, Liveness, EmailOTP, MagicLink
        "confidence_score": 0.0,
        "risk_score": float(risk_score),
        "risk_tier": "UNKNOWN",
        "auth_method": "NONE",
        "friction_level": 0,
        "path_cost": 0.0
    }

# 2. PATH COST FUNCTION
def calculate_path_cost(friction_level: float, latency_ms: float) -> float:
    """
    Optimizing for lowest user friction while maintaining security bounds
    Formula from Section 5: (friction_level * 0.7) + (latency_ms * 0.3)
    """
    return (friction_level * 0.7) + (latency_ms * 0.3)

# 3. GOAL TEST
def is_goal_state(current_state: Dict[str, Any], required_confidence: float = 0.85) -> bool:
    """
    Goal test function specified in Section 5 image.
    Determines if current authentication state meets the required confidence threshold.
    """
    return current_state.get("confidence_score", 0.0) >= required_confidence

class AgenticDecisionEngine:
    def __init__(self, target_confidence: float = 0.85):
        self.target_confidence = target_confidence

    def evaluate_and_route(self, current_state: Dict[str, Any], latency_ms: float = 50.0) -> Dict[str, Any]:
        """
        Evaluates context risk score and routes down one of three cost-weighted paths (Section 4):
        - Low Risk (< 0.3): Cost 0 -> Silent WebAuthn -> [Goal: Authenticated]
        - Med Risk (0.3 - 0.7): Cost 5 -> WebAuthn + Push Notification -> [Goal: Authenticated]
        - High Risk (> 0.7): Cost 10 -> WebAuthn + QR Approval + Liveness -> [Goal: Authenticated]
        """
        score = current_state.get("risk_score", 0.5)

        if score < 0.3:
            current_state["risk_tier"] = "Low Risk"
            current_state["auth_method"] = "FIDO2 Assertion + Geolocation Sync"
            current_state["friction_level"] = 0
            current_state["auth_step_completed"] = "WebAuthn"
            current_state["confidence_score"] = 0.95
        elif score <= 0.7:
            current_state["risk_tier"] = "Medium Risk"
            current_state["auth_method"] = "FIDO2 Assertion + Push Notification Sync (Laptop B Approval)"
            current_state["friction_level"] = 5
            current_state["auth_step_completed"] = "Push"
            current_state["confidence_score"] = 0.90
        else:
            current_state["risk_tier"] = "High Risk"
            current_state["auth_method"] = "FIDO2 Assertion + QR Code Approval (System B) + Liveness Check Concept"
            current_state["friction_level"] = 10
            current_state["auth_step_completed"] = "Liveness"
            current_state["confidence_score"] = 0.88

        # Calculate path cost
        current_state["path_cost"] = calculate_path_cost(
            current_state["friction_level"], 
            latency_ms
        )

        # Run Goal Test
        goal_passed = is_goal_state(current_state, self.target_confidence)
        current_state["is_goal_satisfied"] = goal_passed

        return current_state

if __name__ == "__main__":
    print("=" * 70)
    print(" VaultID Module 4: Agentic Framework Logic Self-Test")
    print("=" * 70)
    agent = AgenticDecisionEngine(target_confidence=0.85)

    s_low = create_initial_state(1.0, True, 0.15)
    r_low = agent.evaluate_and_route(s_low, latency_ms=10.0)
    print(f"Low Risk Route -> Tier: {r_low['risk_tier']}, Cost: {r_low['path_cost']}, Goal Met: {r_low['is_goal_satisfied']}")

    s_high = create_initial_state(0.1, False, 0.85)
    r_high = agent.evaluate_and_route(s_high, latency_ms=25.0)
    print(f"High Risk Route -> Tier: {r_high['risk_tier']}, Cost: {r_high['path_cost']}, Goal Met: {r_high['is_goal_satisfied']}")

    print("\n[✓] Module 4 Agentic Framework test completed successfully.")
    print("=" * 70)

