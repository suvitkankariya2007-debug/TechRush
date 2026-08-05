# Placeholder for Isolation Forest model.
# Replace with actual model loading/scoring.
def calculate_risk_score(request, known_ips, known_devices):
    risk = 0.0
    if request.ip_address not in known_ips:
        risk += 0.2
    if request.device_fingerprint not in known_devices:
        risk += 0.3
    return min(risk, 1.0)