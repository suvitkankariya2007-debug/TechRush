"""
VaultID Risk Engine – bridges the app/ package to the 8 AI risk modules.

Usage (FastAPI dependency / utility):
    from app.risk_engine import evaluate_risk_payload
"""

from modules.m1_feature_extractor import FeatureExtractionEngine
from modules.m2_local_risk_engine import LocalRiskEngine
from modules.m3_llm_fallback_engine import LLMFallbackEngine
from modules.m4_agentic_framework import create_initial_state, AgenticDecisionEngine
from modules.m5_edge_fallbacks import GracefulDegradationHandler
from modules.m6_session_monitor import SmartSessionMonitor
from modules.m7_transaction_risk import TransactionRiskEngine
from modules.m8_provenance_engine import ProvenanceEngine
from app.config import PAYLOAD_RISK_SCORE

# ── Module singletons (initialised once at import time) ───────────────────────
feature_extractor    = FeatureExtractionEngine()
local_risk_engine    = LocalRiskEngine()
llm_fallback_engine  = LLMFallbackEngine()
agentic_engine       = AgenticDecisionEngine(target_confidence=0.85)
edge_fallback_handler = GracefulDegradationHandler()
session_monitor      = SmartSessionMonitor()


def evaluate_risk_payload(payload: dict) -> dict:
    """
    Run the full 8-module pipeline on a raw request payload.
    Returns a risk evaluation dict matching the API contract.
    """
    user_id   = payload.get("user_id", "anonymous")
    device_fp = payload.get("device_fingerprint", "fp_default")
    ip_addr   = payload.get("ip_address", "127.0.0.1")

    # Module 1 – Feature extraction
    features = feature_extractor.extract_features(payload)

    # Module 2 – Local IsolationForest scoring
    local_score = local_risk_engine.calculate_risk_score(features)

    # Module 3 – LLM fallback for ambiguous scores
    final_score, eval_source, eval_reason = llm_fallback_engine.evaluate_ambiguous_risk(
        local_score, features
    )

    # Module 4 – Agentic goal-test routing
    initial_state = create_initial_state(
        ip_trust_score=features["ip_trust_score"],
        device_known=features["device_known"],
        risk_score=final_score,
    )
    agentic_state = agentic_engine.evaluate_and_route(initial_state)

    return {
        "user_id": user_id,
        PAYLOAD_RISK_SCORE: final_score,
        "evaluation_source": eval_source,
        "evaluation_reason": eval_reason,
        "risk_tier": agentic_state["risk_tier"],
        "recommended_auth_method": agentic_state["auth_method"],
        "agentic_state": agentic_state,
    }