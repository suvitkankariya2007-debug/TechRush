"""
VaultID AI Risk Engine Model Trainer
Trains Scikit-Learn IsolationForest Anomaly Detection Model and saves as risk_model.pkl
"""

import os
import joblib
import numpy as np

try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
except ImportError:
    raise ImportError("scikit-learn is required to train the risk model.")

def generate_training_data(n_normal=2000, n_anomalous=200):
    """
    Generate synthetic authentication context data for model training.
    Features:
    0: ip_trust_score (0.0 to 1.0) - High for normal
    1: device_known (0.0 or 1.0) - 1.0 for normal
    2: geo_distance_km (0.0 to 5000.0) - Small distance for normal
    3: vpn_active (0.0 or 1.0) - Usually 0.0 for normal
    4: behavioral_anomaly_score (0.0 to 1.0) - Low for normal
    5: failed_login_count (0 to 10) - 0 or low for normal
    """
    np.random.seed(42)

    # Normal user log-in context
    normal_ip_trust = np.random.beta(a=8, b=2, size=n_normal) # skewed towards ~0.8-1.0
    normal_device_known = np.random.choice([1.0, 0.0], p=[0.9, 0.1], size=n_normal)
    normal_geo_dist = np.random.exponential(scale=20.0, size=n_normal) # usually close by
    normal_vpn = np.random.choice([0.0, 1.0], p=[0.92, 0.08], size=n_normal)
    normal_behavior = np.random.beta(a=1, b=9, size=n_normal) # low anomaly
    normal_failed_logins = np.random.poisson(lam=0.2, size=n_normal)

    X_normal = np.column_stack([
        normal_ip_trust,
        normal_device_known,
        normal_geo_dist,
        normal_vpn,
        normal_behavior,
        normal_failed_logins
    ])

    # Anomalous login context (suspicious / attacks)
    anom_ip_trust = np.random.beta(a=2, b=8, size=n_anomalous) # low trust ~0.1-0.3
    anom_device_known = np.random.choice([0.0, 1.0], p=[0.85, 0.15], size=n_anomalous)
    anom_geo_dist = np.random.uniform(500.0, 8000.0, size=n_anomalous) # far away
    anom_vpn = np.random.choice([1.0, 0.0], p=[0.8, 0.2], size=n_anomalous)
    anom_behavior = np.random.beta(a=7, b=3, size=n_anomalous) # high anomaly
    anom_failed_logins = np.random.poisson(lam=4.0, size=n_anomalous)

    X_anomalous = np.column_stack([
        anom_ip_trust,
        anom_device_known,
        anom_geo_dist,
        anom_vpn,
        anom_behavior,
        anom_failed_logins
    ])

    return X_normal, X_anomalous

def train_and_save_model(model_filename="risk_model.pkl"):
    print("[+] Generating synthetic authentication datasets...")
    X_normal, X_anomalous = generate_training_data()

    print("[+] Fitting StandardScaler and IsolationForest model...")
    scaler = StandardScaler()
    X_normal_scaled = scaler.fit_transform(X_normal)

    # Train IsolationForest primarily on normal traffic
    model = IsolationForest(
        n_estimators=150,
        contamination=0.08,
        random_state=42,
        max_samples='auto'
    )
    model.fit(X_normal_scaled)

    # Calculate baseline scores to calibrate risk outputs (0.0 to 1.0)
    normal_scores = model.decision_function(X_normal_scaled)
    anom_scores = model.decision_function(scaler.transform(X_anomalous))

    min_score = min(normal_scores.min(), anom_scores.min())
    max_score = max(normal_scores.max(), anom_scores.max())

    model_artifact = {
        "model": model,
        "scaler": scaler,
        "min_score": float(min_score),
        "max_score": float(max_score),
        "feature_names": [
            "ip_trust_score",
            "device_known",
            "geo_distance_km",
            "vpn_active",
            "behavioral_anomaly_score",
            "failed_login_count"
        ]
    }

    target_path = os.path.join(os.path.dirname(__file__), model_filename)
    joblib.dump(model_artifact, target_path)
    print(f"[✓] IsolationForest Model successfully serialized to: {target_path}")
    return target_path

if __name__ == "__main__":
    train_and_save_model()
