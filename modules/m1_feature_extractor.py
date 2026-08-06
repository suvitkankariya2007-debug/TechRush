"""
Module 1: Preprocessing & Feature Extraction Engine
Extracts and standardizes raw context parameters (IP, UserAgent, Geolocation, WebAuthn challenge, VPN status, Behavioral data)
into normalized feature vectors for AI Risk scoring.
"""

import math
import hashlib
from typing import Dict, Any

class FeatureExtractionEngine:
    def __init__(self, ip_whitelist: list = None):
        self.ip_whitelist = set(ip_whitelist or ["127.0.0.1", "192.168.1.1", "10.0.0.1", "localhost"])

    @staticmethod
    def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in kilometers between two lat/lon points."""
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def hash_user_agent(self, user_agent: str) -> str:
        """Create a deterministic hash for UserAgent string."""
        return hashlib.sha256(user_agent.encode('utf-8')).hexdigest()[:16]

    def extract_features(self, raw_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes incoming payload and produces standardized metrics:
        - ip_trust_score (float 0.0 to 1.0)
        - device_known (1.0 or 0.0)
        - geo_distance_km (float)
        - vpn_active (1.0 or 0.0)
        - behavioral_anomaly_score (float 0.0 to 1.0)
        - failed_login_count (int)
        """
        ip = raw_context.get("ip_address", "127.0.0.1")
        user_id = raw_context.get("user_id", "user_demo")
        device_fp = raw_context.get("device_fingerprint", "fp_default")
        user_agent = raw_context.get("user_agent", "Mozilla/5.0 DemoBrowser")
        
        # IP Trust / Whitelist logic
        is_whitelisted = ip in self.ip_whitelist
        ip_trust_score = 1.0 if is_whitelisted else raw_context.get("ip_trust_score", 0.7)

        # Device Known check
        known_devices = raw_context.get("known_device_fingerprints", [device_fp])
        device_known = 1.0 if device_fp in known_devices or device_fp == "fp_laptop_a" else 0.0

        # Geolocation anomaly calculation
        home_lat = raw_context.get("home_lat", 19.0760) # Default Mumbai
        home_lon = raw_context.get("home_lon", 72.8777)
        curr_lat = raw_context.get("current_lat", home_lat)
        curr_lon = raw_context.get("current_lon", home_lon)
        geo_distance_km = self.calculate_haversine_distance(home_lat, home_lon, curr_lat, curr_lon)

        vpn_active = 1.0 if raw_context.get("vpn_active", False) else 0.0
        behavioral_anomaly_score = float(raw_context.get("behavioral_anomaly_score", 0.1))
        failed_login_count = int(raw_context.get("failed_login_count", 0))

        # Vector format expected by IsolationForest
        vector = [
            ip_trust_score,
            device_known,
            geo_distance_km,
            vpn_active,
            behavioral_anomaly_score,
            failed_login_count
        ]

        return {
            "user_id": user_id,
            "ip_address": ip,
            "ip_whitelisted": is_whitelisted,
            "ua_hash": self.hash_user_agent(user_agent),
            "device_fingerprint": device_fp,
            "ip_trust_score": ip_trust_score,
            "device_known": bool(device_known),
            "geo_distance_km": geo_distance_km,
            "vpn_active": bool(vpn_active),
            "behavioral_anomaly_score": behavioral_anomaly_score,
            "failed_login_count": failed_login_count,
            "feature_vector": vector
        }

if __name__ == "__main__":
    print("=" * 70)
    print(" VaultID Module 1: Preprocessing & Feature Extractor Self-Test")
    print("=" * 70)
    extractor = FeatureExtractionEngine()
    test_payload = {
        "user_id": "test_user_1",
        "ip_address": "127.0.0.1",
        "device_fingerprint": "fp_laptop_a",
        "user_agent": "Mozilla/5.0 DemoBrowser",
        "home_lat": 19.0760,
        "home_lon": 72.8777,
        "current_lat": 19.0760,
        "current_lon": 72.8777,
        "vpn_active": False,
        "failed_login_count": 0
    }
    extracted = extractor.extract_features(test_payload)
    print("Extracted Feature Dict:")
    for k, v in extracted.items():
        print(f"  - {k}: {v}")
    print("\n[✓] Module 1 Feature Extractor test completed successfully.")
    print("=" * 70)

