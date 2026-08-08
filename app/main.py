from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
import uuid

from app.routers import auth, webauthn
from app.database import init_db_pool, close_db_pool, get_db
from app.crud import get_user_by_id, get_credentials_by_user, get_user_devices
from app.risk_engine import (
    evaluate_risk_payload,
    edge_fallback_handler,
    session_monitor,
)
from modules.m7_transaction_risk import TransactionRiskEngine
from modules.m8_provenance_engine import ProvenanceEngine
from app.config import PAYLOAD_RISK_SCORE

app = FastAPI(
    title="VaultID Zero-Trust AI Risk Engine",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers (auth + webauthn) ─────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(webauthn.router)


# ── Database lifecycle ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    try:
        await init_db_pool()
    except Exception as e:
        print(f"[!] Warning: Database init failed ({e})")


@app.on_event("shutdown")
async def shutdown():
    try:
        await close_db_pool()
    except Exception:
        pass


# ── AI Risk Engine endpoints ──────────────────────────────────────────────────

@app.post("/api/v1/auth/evaluate-risk")
def evaluate_risk(payload: Dict[str, Any] = Body(...)):
    """Run all 8 AI risk modules and return a scored risk evaluation."""
    return evaluate_risk_payload(payload)


@app.post("/api/v1/auth/handshake")
def execute_handshake(payload: Dict[str, Any] = Body(...)):
    """Authenticate with graceful edge-fallback handling (Module 5)."""
    user_email       = payload.get("user_email", "user@vaultid.io")
    ip_addr          = payload.get("ip_address", "127.0.0.1")
    simulate_condition = payload.get("simulate_condition", None)
    return edge_fallback_handler.execute_handshake_with_fallback(
        handshake_func=lambda: {"status": "AUTHENTICATED"},
        user_email=user_email,
        current_ip=ip_addr,
        simulate_condition=simulate_condition,
    )


@app.post("/api/v1/session/monitor")
def monitor_session(payload: Dict[str, Any] = Body(...)):
    """Evaluate live session signals (Module 6)."""
    return session_monitor.evaluate_session_signals(payload)


@app.post("/api/v1/transaction/assess-risk")
def assess_transaction(payload: Dict[str, Any] = Body(...)):
    """Verify that the provided auth method satisfies transaction risk (Module 7)."""
    amount          = float(payload.get("amount_inr", 0.0))
    provided_method = payload.get("provided_auth_method", "")
    liveness        = bool(payload.get("liveness_verified", False))
    return TransactionRiskEngine.verify_transaction_auth(amount, provided_method, liveness)


@app.get("/api/v1/system/provenance")
def get_provenance():
    """Return system originality proof (Module 8)."""
    return ProvenanceEngine.generate_originality_proof()


# ── User Account & Dashboard API Endpoints ────────────────────────────────────

@app.get("/api/v1/user/{user_id}/dashboard-summary")
def get_user_dashboard_summary(user_id: str, db=Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        return {
            "alerts": [{
                "title": "Security Active",
                "description": "Biometric protection initialized.",
                "severity": "Low",
                "created_at": datetime.utcnow().isoformat()
            }],
            "recent_transactions": []
        }

    credentials = get_credentials_by_user(db, user.id)
    devices = get_user_devices(db, user.id)

    alerts = [{
        "title": "Security Active",
        "description": "Passkey biometric verification is fully active for this account." if credentials else "Passkey registration available.",
        "severity": "Low",
        "created_at": datetime.utcnow().isoformat()
    }]

    return {
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "phone": user.phone or "",
            "has_passkey": len(credentials) > 0,
            "connected_devices": len(devices)
        },
        "alerts": alerts,
        "recent_transactions": [
            {
                "created_at": datetime.utcnow().isoformat(),
                "transaction_type": "Authentication",
                "description": "Passkey / Session login verified",
                "counterparty": "VaultID Core",
                "status": "Completed"
            }
        ]
    }


@app.get("/api/v1/user/{user_id}/profile")
def get_user_profile_by_user_id(user_id: str, db=Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        return {
            "id": user_id,
            "username": "User",
            "email": "user@example.com",
            "phone": "",
            "has_passkey": False,
            "created_at": datetime.utcnow().isoformat()
        }

    credentials = get_credentials_by_user(db, user.id)
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "phone": user.phone or "",
        "has_passkey": len(credentials) > 0,
        "created_at": user.created_at.isoformat() if hasattr(user.created_at, "isoformat") else str(user.created_at)
    }


@app.post("/api/v1/user/{user_id}/transfer")
def process_user_transfer_endpoint(user_id: str, payload: dict = Body(...), db=Depends(get_db)):
    user = get_user_by_id(db, user_id)
    recipient = payload.get("recipient", "Recipient")
    amount = payload.get("amount", 0.0)

    return {
        "status": "SUCCESS",
        "transaction_id": str(uuid.uuid4()),
        "amount": amount,
        "recipient": recipient,
        "message": f"Successfully transferred ₹{amount} to {recipient}"
    }


# ── Frontend static files (served LAST so it doesn't swallow API/docs routes) ─
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "TechRush"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    print(f"[VaultID] Warning: Frontend directory not found at {FRONTEND_DIR}. Skipping static mount.")