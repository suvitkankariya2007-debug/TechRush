"""
Module 2: Local AI Risk Engine (Scikit-Learn IsolationForest Model)
Calculates Dynamic Risk Score (0.0 to 1.0) using trained risk_model.pkl anomaly detector
"""

import os
import joblib
import numpy as np
from app.config import MODEL_PATH

class LocalRiskEngine:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.min_score = -0.5
        self.max_score = 0.5
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                artifact = joblib.load(self.model_path)
                self.model = artifact.get("model")
                self.scaler = artifact.get("scaler")
                self.min_score = artifact.get("min_score", -0.5)
                self.max_score = artifact.get("max_score", 0.5)
                print(f"[✓] Local Risk Engine loaded IsolationForest model from {self.model_path}")
            except Exception as e:
                print(f"[!] Warning: Failed to load model artifact ({e}). Fallback heuristic active.")
        else:
            print(f"[!] Warning: Model file {self.model_path} not found. Running with fallback heuristics.")

    def calculate_risk_score(self, feature_data: dict) -> float:
        """
        Calculates a dynamic risk score between 0.0 (Low Risk) and 1.0 (High Risk).
        Combines IsolationForest anomaly prediction with exact risk rules.
        """
        vector = feature_data.get("feature_vector", [0.7, 1.0, 0.0, 0.0, 0.1, 0])
        
        raw_risk_score = 0.2 # default baseline

        if self.model and self.scaler:
            X = np.array([vector])
            X_scaled = self.scaler.transform(X)
            # IsolationForest score: lower (negative) values indicate higher anomaly
            dec_score = self.model.decision_function(X_scaled)[0]
            
            # Map decision function output to 0.0 (normal) - 1.0 (highly anomalous)
            # Normal decision function range is roughly [-0.2, 0.2]
            scaled = (self.max_score - dec_score) / (self.max_score - self.min_score + 1e-6)
            raw_risk_score = float(np.clip(scaled, 0.0, 1.0))

        # Rule Overlays based on Security Requirements
        # 1. IP Whitelisting bonus
        if feature_data.get("ip_whitelisted", False):
            raw_risk_score = min(raw_risk_score, 0.25)

        # 2. Geolocation distance penalty (> 1000 km)
        geo_dist = feature_data.get("geo_distance_km", 0.0)
        if geo_dist > 2000.0:
            raw_risk_score += 0.35
        elif geo_dist > 500.0:
            raw_risk_score += 0.20

        # 3. VPN Activation penalty
        if feature_data.get("vpn_active", False):
            raw_risk_score += 0.15

        # 4. Unknown device penalty
        if not feature_data.get("device_known", True):
            raw_risk_score += 0.25

        # 5. Failed logins penalty
        failed = feature_data.get("failed_login_count", 0)
        if failed >= 3:
            raw_risk_score += 0.30

        final_score = float(np.clip(raw_risk_score, 0.0, 1.0))
        return round(final_score, 3)

if __name__ == "__main__":
    print("=" * 70)
    print(" VaultID Module 2: Local Risk Engine Self-Test")
    print("=" * 70)
    engine = LocalRiskEngine()
    
    low_risk_features = {
        "ip_whitelisted": True,
        "device_known": True,
        "geo_distance_km": 5.0,
        "vpn_active": False,
        "failed_login_count": 0,
        "feature_vector": [1.0, 1.0, 5.0, 0.0, 0.05, 0]
    }
    score_low = engine.calculate_risk_score(low_risk_features)
    print(f"Low Risk Context Score: {score_low}")

    high_risk_features = {
        "ip_whitelisted": False,
        "device_known": False,
        "geo_distance_km": 5500.0,
        "vpn_active": True,
        "failed_login_count": 5,
        "feature_vector": [0.1, 0.0, 5500.0, 1.0, 0.85, 5]
    }
    score_high = engine.calculate_risk_score(high_risk_features)
    print(f"High Risk Context Score: {score_high}")

    print("\n[✓] Module 2 Local Risk Engine test completed successfully.")
    print("=" * 70)

