"""
Comprehensive Unit Tests for VaultID 8 Risk Engine Modules & Goal Test
Executes isolated unit testing as required by Section 13 Execution Guardrails.
"""

import pytest
import math
from db import init_db, fetch_active_devices, global_logout_trigger, create_audit_log, SessionLocal, ActiveSession

from modules.m1_feature_extractor import FeatureExtractionEngine
from modules.m2_local_risk_engine import LocalRiskEngine
from modules.m3_llm_fallback_engine import LLMFallbackEngine
from modules.m4_agentic_framework import (
    create_initial_state,
    calculate_path_cost,
    is_goal_state,
    AgenticDecisionEngine
)
from modules.m5_edge_fallbacks import GracefulDegradationHandler, DeviceNotSupportedError
from modules.m6_session_monitor import SmartSessionMonitor
from modules.m7_transaction_risk import TransactionRiskEngine
from modules.m8_provenance_engine import ProvenanceEngine

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

# --- MODULE 1 TESTS ---
def test_module_1_feature_extraction():
    engine = FeatureExtractionEngine(ip_whitelist=["127.0.0.1"])
    context = {
        "user_id": "test_user_1",
        "ip_address": "127.0.0.1",
        "device_fingerprint": "fp_laptop_a",
        "user_agent": "Mozilla/5.0 TestBrowser",
        "home_lat": 19.0760,
        "home_lon": 72.8777,
        "current_lat": 19.0760,
        "current_lon": 72.8777,
        "vpn_active": False,
        "failed_login_count": 0
    }
    extracted = engine.extract_features(context)
    assert extracted["ip_whitelisted"] is True
    assert extracted["device_known"] is True
    assert extracted["geo_distance_km"] == pytest.approx(0.0, abs=1e-2)
    assert len(extracted["feature_vector"]) == 6

# --- MODULE 2 TESTS ---
def test_module_2_local_risk_engine():
    engine = LocalRiskEngine()
    # Test low risk input
    low_risk_features = {
        "ip_whitelisted": True,
        "device_known": True,
        "geo_distance_km": 5.0,
        "vpn_active": False,
        "failed_login_count": 0,
        "feature_vector": [1.0, 1.0, 5.0, 0.0, 0.05, 0]
    }
    score_low = engine.calculate_risk_score(low_risk_features)
    assert 0.0 <= score_low <= 0.3

    # Test high risk input
    high_risk_features = {
        "ip_whitelisted": False,
        "device_known": False,
        "geo_distance_km": 5500.0,
        "vpn_active": True,
        "failed_login_count": 5,
        "feature_vector": [0.1, 0.0, 5500.0, 1.0, 0.85, 5]
    }
    score_high = engine.calculate_risk_score(high_risk_features)
    assert score_high > 0.7

# --- MODULE 3 TESTS ---
def test_module_3_llm_fallback_engine():
    llm_engine = LLMFallbackEngine(openai_key="", gemini_key="")
    features = {"geo_distance_km": 1500, "failed_login_count": 3}
    
    # Non-ambiguous score should pass through
    score, source, reason = llm_engine.evaluate_ambiguous_risk(0.1, features)
    assert score == 0.1
    assert source == "LOCAL_ISOLATION_FOREST"

    # Ambiguous borderline score should trigger fallback
    amb_score, amb_source, amb_reason = llm_engine.evaluate_ambiguous_risk(0.30, features)
    assert amb_source in ["OPENAI_LLM_API_KEY_FALLBACK", "GEMINI_LLM_API_KEY_FALLBACK", "DETERMINISTIC_HEURISTIC_FALLBACK"]

# --- MODULE 4 TESTS ---
def test_module_4_agentic_framework_and_goal_test():
    # Test Path Cost Formula
    cost = calculate_path_cost(friction_level=5.0, latency_ms=100.0)
    assert cost == pytest.approx((5.0 * 0.7) + (100.0 * 0.3)) # 3.5 + 30.0 = 33.5

    # Test Goal Test
    state_pass = {"confidence_score": 0.90}
    state_fail = {"confidence_score": 0.50}
    assert is_goal_state(state_pass, required_confidence=0.85) is True
    assert is_goal_state(state_fail, required_confidence=0.85) is False

    # Test Decision Routing
    agent = AgenticDecisionEngine(target_confidence=0.85)
    
    # Low risk routing
    s1 = create_initial_state(1.0, True, 0.15)
    res1 = agent.evaluate_and_route(s1, latency_ms=10.0)
    assert res1["risk_tier"] == "Low Risk"
    assert res1["is_goal_satisfied"] is True
    assert res1["auth_step_completed"] == "WebAuthn"

    # High risk routing
    s3 = create_initial_state(0.1, False, 0.85)
    res3 = agent.evaluate_and_route(s3, latency_ms=20.0)
    assert res3["risk_tier"] == "High Risk"
    assert res3["friction_level"] == 10
    assert res3["auth_step_completed"] == "Liveness"

# --- MODULE 5 TESTS ---
def test_module_5_edge_fallbacks():
    handler = GracefulDegradationHandler()
    
    # Timeout fallback test
    res_timeout = handler.execute_handshake_with_fallback(
        handshake_func=lambda: None,
        user_email="test@vaultid.io",
        current_ip="192.168.1.50",
        simulate_condition="TIMEOUT"
    )
    assert res_timeout["status"] == "FALLBACK_ACTIVATED"
    assert res_timeout["fallback_details"]["fallback_triggered"] == "EMAIL_OTP"

    # Unsupported device fallback test
    res_unsupported = handler.execute_handshake_with_fallback(
        handshake_func=lambda: None,
        user_email="test@vaultid.io",
        current_ip="192.168.1.50",
        simulate_condition="UNSUPPORTED"
    )
    assert res_unsupported["status"] == "FALLBACK_ACTIVATED"
    assert res_unsupported["fallback_details"]["fallback_triggered"] == "MAGIC_LINK"

# --- MODULE 6 TESTS ---
def test_module_6_smart_session_monitor():
    monitor = SmartSessionMonitor()
    
    # Normal session signals
    telemetry_ok = {
        "user_id": "user_normal",
        "session_id": "sess_100",
        "behavioral_biometrics": 0.1,
        "ip_changed": False,
        "device_changed": False,
        "vpn_activated": False,
        "suspicious_behavior": False
    }
    eval_ok = monitor.evaluate_session_signals(telemetry_ok)
    assert eval_ok["suspicious_activity_detected"] is False
    assert eval_ok["action"] == "CONTINUE_SESSION"

    # Suspicious session signals (triggers pause session)
    telemetry_susp = {
        "user_id": "user_suspicious",
        "session_id": "sess_101",
        "behavioral_biometrics": 0.8,
        "ip_changed": True,
        "device_changed": True,
        "vpn_activated": True,
        "suspicious_behavior": True
    }
    eval_susp = monitor.evaluate_session_signals(telemetry_susp)
    assert eval_susp["suspicious_activity_detected"] is True
    assert eval_susp["action"] == "PAUSE_SESSION_REAUTHENTICATE"

# --- MODULE 7 TESTS ---
def test_module_7_transaction_risk():
    # Low Value (< ₹500)
    low_val = TransactionRiskEngine.assess_transaction_risk(450.0)
    assert low_val["value_band"] == "Low Value"
    assert low_val["required_method"] == "Fingerprint"

    # Medium Value (₹50,000)
    med_val = TransactionRiskEngine.assess_transaction_risk(25000.0)
    assert med_val["value_band"] == "Medium Value"
    assert med_val["required_method"] == "Fingerprint + Push Approval"

    # High Value (₹5,00,000+)
    high_val = TransactionRiskEngine.assess_transaction_risk(550000.0)
    assert high_val["value_band"] == "High Value"
    assert high_val["required_method"] == "Face ID + QR Approval + Liveness Check"

    # Verification check
    verif = TransactionRiskEngine.verify_transaction_auth(
        amount_inr=600000.0,
        provided_auth_method="Face ID + QR Approval + Liveness Check",
        liveness_verified=True
    )
    assert verif["transaction_approved"] is True

# --- MODULE 8 TESTS ---
def test_module_8_provenance_engine():
    proof_data = ProvenanceEngine.generate_originality_proof()
    assert proof_data["architecture_novelty"] == "Agentic Risk-Scoring + FIDO2"
    assert proof_data["plagiarism_check_status"] == "PASSED_CUSTOM_BUILD"
    assert len(proof_data["cryptographic_proof"]) == 64 # SHA256 hex length
