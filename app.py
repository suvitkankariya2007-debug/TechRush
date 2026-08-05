"""
VaultID Shared Python Backend (FastAPI)
Wires together all 8 Risk Engine Modules in accordance with System Architecture & Workflow.
Includes API Contracts, Fixed Global Variables, Goal Test, Edge Fallbacks, and Canonical SQL execution.
"""

import uuid
from fastapi import FastAPI, HTTPException, Body
from typing import Dict, Any

from db import init_db, fetch_active_devices, global_logout_trigger, create_audit_log, SessionLocal, ActiveSession
from config import PAYLOAD_RISK_SCORE
from modules.m1_feature_extractor import FeatureExtractionEngine
from modules.m2_local_risk_engine import LocalRiskEngine
from modules.m3_llm_fallback_engine import LLMFallbackEngine
from modules.m4_agentic_framework import (
    create_initial_state,
    AgenticDecisionEngine
)
from modules.m5_edge_fallbacks import GracefulDegradationHandler
from modules.m6_session_monitor import SmartSessionMonitor
from modules.m7_transaction_risk import TransactionRiskEngine
from modules.m8_provenance_engine import ProvenanceEngine

app = FastAPI(title="VaultID Zero-Trust AI Risk Engine", version="1.0.0")

# Initialize Database & Module Engines
init_db()
feature_extractor = FeatureExtractionEngine()
local_risk_engine = LocalRiskEngine()
llm_fallback_engine = LLMFallbackEngine()
agentic_engine = AgenticDecisionEngine(target_confidence=0.85)
edge_fallback_handler = GracefulDegradationHandler()
session_monitor = SmartSessionMonitor()

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/v1/system/provenance")
def get_provenance():
    return ProvenanceEngine.generate_originality_proof()

@app.post("/api/v1/auth/evaluate-risk")
def evaluate_risk(payload: Dict[str, Any] = Body(...)):
    user_id = payload.get("user_id", "demo_user")
    device_fp = payload.get("device_fingerprint", "fp_default")
    ip_addr = payload.get("ip_address", "127.0.0.1")

    # 1. Feature Extraction (Module 1)
    features = feature_extractor.extract_features(payload)

    # 2. Local AI IsolationForest Scoring (Module 2)
    local_score = local_risk_engine.calculate_risk_score(features)

    # 3. LLM API Fallback Engine (Module 3)
    final_score, eval_source, eval_reason = llm_fallback_engine.evaluate_ambiguous_risk(local_score, features)

    # 4. Agentic State & Goal Test Routing (Module 4)
    initial_state = create_initial_state(
        ip_trust_score=features["ip_trust_score"],
        device_known=features["device_known"],
        risk_score=final_score
    )
    agentic_state = agentic_engine.evaluate_and_route(initial_state)

    # Record active session in DB
    db = SessionLocal()
    try:
        sess = ActiveSession(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            device_fingerprint=device_fp,
            ip_address=ip_addr,
            is_active=True
        )
        db.add(sess)
        db.commit()
    finally:
        db.close()

    create_audit_log(user_id, "EVALUATE_RISK", f"Score: {final_score}, Source: {eval_source}")

    return {
        "user_id": user_id,
        PAYLOAD_RISK_SCORE: final_score,
        "evaluation_source": eval_source,
        "evaluation_reason": eval_reason,
        "risk_tier": agentic_state["risk_tier"],
        "recommended_auth_method": agentic_state["auth_method"],
        "agentic_state": agentic_state
    }

@app.post("/api/v1/auth/handshake")
def execute_handshake(payload: Dict[str, Any] = Body(...)):
    user_email = payload.get("user_email", "user@vaultid.io")
    ip_addr = payload.get("ip_address", "127.0.0.1")
    simulate_condition = payload.get("simulate_condition", None)

    res = edge_fallback_handler.execute_handshake_with_fallback(
        handshake_func=lambda: {"status": "AUTHENTICATED"},
        user_email=user_email,
        current_ip=ip_addr,
        simulate_condition=simulate_condition
    )
    return res

@app.get("/api/v1/session/active-devices/{user_id}")
def get_active_devices(user_id: str):
    devices = fetch_active_devices(user_id)
    return {"user_id": user_id, "active_devices": devices}

@app.post("/api/v1/session/monitor")
def monitor_session(payload: Dict[str, Any] = Body(...)):
    res = session_monitor.evaluate_session_signals(payload)
    return res

@app.post("/api/v1/transaction/assess-risk")
def assess_transaction(payload: Dict[str, Any] = Body(...)):
    amount = float(payload.get("amount_inr", 0.0))
    provided_method = payload.get("provided_auth_method", "")
    liveness = bool(payload.get("liveness_verified", False))

    res = TransactionRiskEngine.verify_transaction_auth(amount, provided_method, liveness)
    return res

@app.post("/api/v1/auth/logout/{user_id}")
def logout_user(user_id: str):
    global_logout_trigger(user_id)
    create_audit_log(user_id, "GLOBAL_LOGOUT", "User triggered global logout across all active sessions.")
    return {"message": f"Successfully logged out user {user_id} across all active sessions."}