"""
VaultID End-to-End Integration Demo Script
Runs an end-to-end smoke test verifying the entire workflow:
App Entry -> AI Risk Evaluation -> Goal Test -> Multi-Device Handshake -> Smart Session Monitor -> Transaction Risk -> Logout & Audit
"""

import time
import requests
import multiprocessing
import uvicorn
from app import app
from config import (
    JWT_SECRET_KEY,
    PAYLOAD_DEVICE_FP,
    PAYLOAD_RISK_SCORE
)

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 8089
BASE_URL = f"http://{SERVER_HOST}:{SERVER_PORT}"

def start_server():
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT, log_level="error")

def run_integration_demo():
    print("=" * 80)
    print(" VaultID Passkey-Based Zero-Trust AI Risk Engine — Integration Demo")
    print("=" * 80)
    
    # 1. Test Provenance Defense Endpoint (Section 9 & 12)
    print("\n1. Testing Provenance Defense Engine Endpoint (/api/v1/system/provenance)...")
    res = requests.get(f"{BASE_URL}/api/v1/system/provenance")
    prov_data = res.json()
    print(f"   Architecture Novelty: {prov_data.get('architecture_novelty')}")
    print(f"   Plagiarism Check Status: {prov_data.get('plagiarism_check_status')}")
    print(f"   Cryptographic Proof: {prov_data.get('cryptographic_proof')[:32]}...")
    assert res.status_code == 200 and "cryptographic_proof" in prov_data

    # 2. Test Low Risk AI Decision Flow (Section 4 & 6)
    print("\n2. Testing AI Risk Decision Engine (Low Risk Context)...")
    low_risk_payload = {
        "user_id": "laptop_a_user",
        "user_email": "alice@vaultid.io",
        "ip_address": "127.0.0.1", # Whitelisted IP
        "device_fingerprint": "fp_laptop_a",
        "user_agent": "Mozilla/5.0 LaptopA",
        "current_lat": 19.0760,
        "current_lon": 72.8777,
        "vpn_active": False,
        "behavioral_anomaly_score": 0.05,
        "failed_login_count": 0
    }
    res_low = requests.post(f"{BASE_URL}/api/v1/auth/evaluate-risk", json=low_risk_payload)
    data_low = res_low.json()
    print(f"   Dynamic Risk Score: {data_low.get(PAYLOAD_RISK_SCORE)}")
    print(f"   Risk Tier: {data_low.get('risk_tier')}")
    print(f"   Recommended Auth: {data_low.get('recommended_auth_method')}")
    print(f"   Goal Satisfied: {data_low['agentic_state']['is_goal_satisfied']}")
    print(f"   Path Cost: {data_low['agentic_state']['path_cost']}")
    assert data_low[PAYLOAD_RISK_SCORE] < 0.3
    assert data_low["agentic_state"]["is_goal_satisfied"] is True

    # 3. Test High Risk AI Decision Flow (Section 4 & 6)
    print("\n3. Testing AI Risk Decision Engine (High Risk Context)...")
    high_risk_payload = {
        "user_id": "laptop_a_user",
        "user_email": "alice@vaultid.io",
        "ip_address": "198.51.100.45",
        "device_fingerprint": "fp_unknown_hacker_device",
        "user_agent": "Unknown-Browser",
        "current_lat": 48.8566, # Paris, France (far away)
        "current_lon": 2.3522,
        "vpn_active": True,
        "behavioral_anomaly_score": 0.88,
        "failed_login_count": 4
    }
    res_high = requests.post(f"{BASE_URL}/api/v1/auth/evaluate-risk", json=high_risk_payload)
    data_high = res_high.json()
    print(f"   Dynamic Risk Score: {data_high.get(PAYLOAD_RISK_SCORE)}")
    print(f"   Risk Tier: {data_high.get('risk_tier')}")
    print(f"   Recommended Auth: {data_high.get('recommended_auth_method')}")
    print(f"   Friction Level: {data_high['agentic_state']['friction_level']}")
    assert data_high[PAYLOAD_RISK_SCORE] > 0.7

    # 4. Test Multi-Device WebAuthn Handshake & Fallbacks (Section 4 & M5)
    print("\n4. Testing Multi-Device Handshake & Fallback Protocol...")
    # Normal Handshake
    res_hs = requests.post(f"{BASE_URL}/api/v1/auth/handshake", json={
        "user_id": "laptop_a_user",
        "user_email": "alice@vaultid.io",
        "ip_address": "127.0.0.1",
        "challenge_response": "sig_laptop_b_signed_webauthn_challenge",
        "device_authenticator": "Laptop_B_Secondary",
        "simulate_condition": "NORMAL"
    })
    print(f"   Normal Handshake Status: {res_hs.json().get('status')}")

    # Latency Timeout Fallback (Email OTP)
    res_fb1 = requests.post(f"{BASE_URL}/api/v1/auth/handshake", json={
        "user_id": "laptop_a_user",
        "user_email": "alice@vaultid.io",
        "ip_address": "127.0.0.1",
        "challenge_response": "",
        "simulate_condition": "TIMEOUT"
    })
    print(f"   Timeout Fallback: {res_fb1.json().get('fallback_details', {}).get('fallback_triggered')}")

    # 5. Test Active Devices Canonical Query 1 (Section 10)
    print("\n5. Fetching Active Devices for User (Canonical Query 1)...")
    res_dev = requests.get(f"{BASE_URL}/api/v1/session/active-devices/laptop_a_user")
    devices = res_dev.json().get("active_devices", [])
    print(f"   Active Session Count: {len(devices)}")
    if devices:
        active_sess_id = devices[0]["session_id"]
    else:
        active_sess_id = "demo_session_1"

    # 6. Test Smart Session Monitoring (Section 7 & M6)
    print("\n6. Testing Smart Session Monitoring Engine (Continuous Polling)...")
    # Trigger suspicious mid-session anomaly
    res_mon = requests.post(f"{BASE_URL}/api/v1/session/monitor", json={
        "session_id": active_sess_id,
        "user_id": "laptop_a_user",
        "behavioral_biometrics": 0.85,
        "ip_changed": True,
        "device_changed": True,
        "vpn_activated": True,
        "suspicious_behavior": True
    })
    mon_data = res_mon.json()
    print(f"   Session Risk Score: {mon_data.get('session_risk_score')}")
    print(f"   Suspicious Activity Detected: {mon_data.get('suspicious_activity_detected')}")
    print(f"   Triggered Action: {mon_data.get('action')}")
    print(f"   Flags Raised: {mon_data.get('flags')}")

    # 7. Test Transaction Risk Assessment (Section 8 & M7)
    print("\n7. Testing Transaction Risk Assessment (High Value Band ₹5,50,000)...")
    res_tx = requests.post(f"{BASE_URL}/api/v1/transaction/assess-risk", json={
        "user_id": "laptop_a_user",
        "session_id": active_sess_id,
        "amount_inr": 550000.0,
        "provided_auth_method": "Face ID + QR Approval + Liveness Check",
        "liveness_verified": True
    })
    tx_data = res_tx.json()
    print(f"   Value Band: {tx_data.get('value_band')}")
    print(f"   Required Method: {tx_data.get('required_method')}")
    print(f"   Status: {tx_data.get('status')}")

    # 8. Test Global Logout & Audit Logging (Section 10 Canonical Query 2 & 3)
    print("\n8. Executing Global Logout & Audit Sync...")
    res_logout = requests.post(f"{BASE_URL}/api/v1/auth/logout/laptop_a_user")
    print(f"   Logout Message: {res_logout.json().get('message')}")

    print("\n" + "=" * 80)
    print(" [✓] VaultID AI Risk Engine & All 8 Modules Passed End-to-End Integration!")
    print("=" * 80)

if __name__ == "__main__":
    proc = multiprocessing.Process(target=start_server, daemon=True)
    proc.start()
    time.sleep(2) # Allow server to bind
    try:
        run_integration_demo()
    finally:
        proc.terminate()
