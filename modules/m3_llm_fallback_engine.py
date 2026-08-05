"""
Module 3: LLM API Fallback Engine (OpenAI & Gemini API Fallback)
Provides secondary AI reasoning & risk scoring fallback when local AI model confidence is ambiguous,
or when network/device edge fallbacks require high-assurance verification.
"""

import os
import json
import warnings
from typing import Dict, Any, Tuple
from config import OPENAI_API_KEY, GEMINI_API_KEY

warnings.filterwarnings("ignore", category=FutureWarning)

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class LLMFallbackEngine:
    def __init__(self, openai_key: str = OPENAI_API_KEY, gemini_key: str = GEMINI_API_KEY):
        self.openai_key = openai_key
        self.gemini_key = gemini_key
        self.openai_client = None
        self.gemini_available = False

        if HAS_OPENAI and self.openai_key:
            try:
                self.openai_client = openai.OpenAI(api_key=self.openai_key)
                print("[✓] LLM Fallback Engine initialized with OpenAI API key.")
            except Exception as e:
                print(f"[!] OpenAI initialization notice: {e}")

        if HAS_GENAI and self.gemini_key:
            try:
                genai.configure(api_key=self.gemini_key)
                self.gemini_model = genai.GenerativeModel('gemini-3.6-flash')
                self.gemini_available = True
                print("[✓] LLM Fallback Engine initialized with Gemini API key.")
            except Exception as e:
                print(f"[!] Gemini initialization notice: {e}")

    def evaluate_ambiguous_risk(
        self,
        local_score: float,
        feature_data: Dict[str, Any]
    ) -> Tuple[float, str, str]:
        """
        Evaluates risk via OpenAI LLM, Gemini LLM, or Heuristic fallback.
        Returns: (final_risk_score, evaluation_source, explanation_reason)
        """
        # Determine if local model score is in ambiguous boundary zones
        is_borderline_low_med = (0.25 <= local_score <= 0.35)
        is_borderline_med_high = (0.65 <= local_score <= 0.75)
        
        if not (is_borderline_low_med or is_borderline_med_high):
            return local_score, "LOCAL_ISOLATION_FOREST", "Local model confidence is high; no LLM fallback required."

        prompt_system = "You are VaultID Zero-Trust Authentication AI Risk Evaluator."
        prompt_user = f"""
        Analyze the following user authentication session context:
        - Local IsolationForest Anomaly Score: {local_score}
        - IP Address: {feature_data.get('ip_address')}
        - IP Trust Score: {feature_data.get('ip_trust_score')}
        - IP Whitelisted: {feature_data.get('ip_whitelisted')}
        - Known Device: {feature_data.get('device_known')}
        - Geolocation Distance: {feature_data.get('geo_distance_km')} km
        - VPN Active: {feature_data.get('vpn_active')}
        - Behavioral Anomaly Score: {feature_data.get('behavioral_anomaly_score')}
        - Recent Failed Logins: {feature_data.get('failed_login_count')}

        Determine if this session should be classified as Low Risk (<0.3), Medium Risk (0.3-0.7), or High Risk (>0.7).
        Return JSON only in format:
        {{"risk_score": <float 0.0-1.0>, "reason": "<short explanation>"}}
        """

        # 1. Try OpenAI API if client is available
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": prompt_system},
                        {"role": "user", "content": prompt_user}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                content = response.choices[0].message.content.strip()
                parsed = json.loads(content)
                llm_score = float(parsed.get("risk_score", local_score))
                reason = parsed.get("reason", "Evaluated via OpenAI API fallback.")
                return llm_score, "OPENAI_LLM_API_KEY_FALLBACK", f"OpenAI API Fallback: {reason}"
            except Exception as e:
                print(f"[!] OpenAI API execution error: {e}. Trying secondary fallbacks.")

        # 2. Try Gemini API if available
        if self.gemini_available:
            try:
                response = self.gemini_model.generate_content(prompt_system + "\n" + prompt_user)
                content = response.text.strip()
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                parsed = json.loads(content)
                llm_score = float(parsed.get("risk_score", local_score))
                reason = parsed.get("reason", "Evaluated via Gemini API fallback.")
                return llm_score, "GEMINI_LLM_API_KEY_FALLBACK", f"Gemini API Fallback: {reason}"
            except Exception as e:
                print(f"[!] Gemini API execution error: {e}. Defaulting to deterministic fallback.")

        # 3. Deterministic Heuristic Fallback Engine
        reason = f"Heuristic boundary resolution for borderline score {local_score}."
        adjusted_score = local_score
        if feature_data.get("geo_distance_km", 0) > 1000 or feature_data.get("failed_login_count", 0) >= 2:
            adjusted_score = min(1.0, local_score + 0.08)
            reason += " Escalated due to distance / login failures."
        else:
            adjusted_score = max(0.0, local_score - 0.05)
            reason += " Mitigated due to normal user context."

        return round(adjusted_score, 3), "DETERMINISTIC_HEURISTIC_FALLBACK", reason

if __name__ == "__main__":
    print("=" * 70)
    print(" VaultID Module 3: LLM Fallback Engine Self-Test")
    print("=" * 70)
    engine = LLMFallbackEngine()
    
    sample_features = {
        "user_id": "test_user_3",
        "ip_address": "198.51.100.45",
        "ip_trust_score": 0.5,
        "ip_whitelisted": False,
        "device_known": False,
        "geo_distance_km": 1500.0,
        "vpn_active": True,
        "behavioral_anomaly_score": 0.65,
        "failed_login_count": 3
    }
    
    print("\n--- Test 1: High Confidence Local Score (No LLM Fallback needed) ---")
    score1, src1, reason1 = engine.evaluate_ambiguous_risk(0.10, sample_features)
    print(f"Result -> Score: {score1}, Source: {src1}, Explanation: {reason1}")
    
    print("\n--- Test 2: Borderline Ambiguous Score (0.30) - Triggers LLM Fallback ---")
    score2, src2, reason2 = engine.evaluate_ambiguous_risk(0.30, sample_features)
    print(f"Result -> Score: {score2}, Source: {src2}, Explanation: {reason2}")
    
    print("\n[✓] Module 3 LLM Fallback Engine test completed successfully.")
    print("=" * 70)

