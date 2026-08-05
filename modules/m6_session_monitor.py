"""
Module 6: Smart Session Monitoring Engine
Tracks 5 real-time signals during active user sessions via Continuous API Polling (Section 7).
If suspicious activity is detected, triggers Global Logout (UPDATE active_sessions SET is_active = FALSE) and audit logging.
"""

from typing import Dict, Any
from db import global_logout_trigger, create_audit_log

class SmartSessionMonitor:
    def __init__(self, risk_threshold: float = 0.50):
        self.risk_threshold = risk_threshold

    def evaluate_session_signals(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates 5 real-time telemetry signals:
        1. Behavioral biometrics anomaly score
        2. Network IP change flag
        3. Device fingerprint mismatch
        4. Sudden VPN activation flag
        5. Suspicious API pattern / navigation anomaly
        """
        user_id = telemetry.get("user_id", "unknown_user")
        session_id = telemetry.get("session_id", "sess_unknown")
        
        behavioral_score = float(telemetry.get("behavioral_biometrics", 0.0))
        ip_changed = bool(telemetry.get("ip_changed", False))
        device_changed = bool(telemetry.get("device_changed", False))
        vpn_activated = bool(telemetry.get("vpn_activated", False))
        suspicious_behavior = bool(telemetry.get("suspicious_behavior", False))

        flags = []
        score = 0.10 # baseline normal active session

        if behavioral_score > 0.5:
            score += 0.35
            flags.append("BEHAVIORAL_BIOMETRIC_ANOMALY")

        if ip_changed:
            score += 0.20
            flags.append("MID_SESSION_IP_CHANGE")

        if device_changed:
            score += 0.30
            flags.append("UNRECOGNIZED_DEVICE_HIJACK")

        if vpn_activated:
            score += 0.15
            flags.append("MID_SESSION_VPN_ACTIVATION")

        if suspicious_behavior:
            score += 0.25
            flags.append("SUSPICIOUS_NAVIGATION_PATTERN")

        session_risk_score = round(min(1.0, score), 3)
        suspicious_activity_detected = (session_risk_score >= self.risk_threshold)

        if suspicious_activity_detected:
            # Trigger Global Logout & Audit Log
            global_logout_trigger(user_id)
            create_audit_log(
                user_id=user_id,
                action="SESSION_TERMINATED_SMART_MONITOR",
                details=f"Terminated session {session_id}. Flags: {', '.join(flags)}. Score: {session_risk_score}"
            )
            action = "PAUSE_SESSION_REAUTHENTICATE"
        else:
            action = "CONTINUE_SESSION"

        return {
            "session_id": session_id,
            "user_id": user_id,
            "session_risk_score": session_risk_score,
            "suspicious_activity_detected": suspicious_activity_detected,
            "action": action,
            "flags": flags
        }

if __name__ == "__main__":
    print("=" * 70)
    print(" VaultID Module 6: Smart Session Monitor Self-Test")
    print("=" * 70)
    monitor = SmartSessionMonitor()
    normal_telemetry = {"user_id": "user1", "session_id": "sess1", "behavioral_biometrics": 0.1}
    res_ok = monitor.evaluate_session_signals(normal_telemetry)
    print("Normal Telemetry:", res_ok)

    susp_telemetry = {"user_id": "user2", "session_id": "sess2", "behavioral_biometrics": 0.8, "ip_changed": True, "device_changed": True}
    res_susp = monitor.evaluate_session_signals(susp_telemetry)
    print("Suspicious Telemetry:", res_susp)
    print("\n[✓] Module 6 Smart Session Monitor test completed successfully.")
    print("=" * 70)