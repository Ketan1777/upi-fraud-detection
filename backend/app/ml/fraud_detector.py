import os
import math
import datetime
from typing import Dict, Any, List, Tuple, Optional

# Path to trained model
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(__file__), "../../../ml_models/fraud_model.pkl"))

_trained_model = None
_model_load_attempted = False


def load_model():
    global _trained_model, _model_load_attempted
    if _model_load_attempted:
        return _trained_model
    _model_load_attempted = True
    if os.path.exists(MODEL_PATH):
        try:
            import joblib
            _trained_model = joblib.load(MODEL_PATH)
            print(f"[ML Engine] Successfully loaded trained ensemble model from {MODEL_PATH}")
        except Exception as e:
            print(f"[ML Engine] Note: Could not load pickled model ({e}). Using calibrated demo engine.")
            _trained_model = None
    return _trained_model


class FraudDetectionEngine:
    """
    Real-Time UPI Fraud Detection Engine.
    Combines:
    1. Random Forest / Supervised scoring
    2. Isolation Forest anomaly signals
    3. Graph topology & money-mule fan-in detection
    4. Heuristic explainability breakdown
    """

    @classmethod
    def extract_features(
        cls,
        amount: float,
        timestamp: datetime.datetime,
        sender_txns_last_5m: int = 1,
        sender_avg_amt: float = 2500.0,
        is_new_receiver: bool = False,
        receiver_fan_in_1h: int = 1,
        is_emulator: bool = False,
        seconds_since_last_txn: float = 300.0,
        device_risk_flag: bool = False,
    ) -> Dict[str, float]:
        hour = timestamp.hour
        amt_ratio = amount / max(sender_avg_amt, 100.0)

        return {
            "amount": float(amount),
            "hour_of_day": float(hour),
            "txns_last_5m": float(sender_txns_last_5m),
            "amt_to_avg_ratio": float(round(amt_ratio, 2)),
            "is_new_receiver": 1.0 if is_new_receiver else 0.0,
            "receiver_fan_in_1h": float(receiver_fan_in_1h),
            "is_emulator": 1.0 if is_emulator else 0.0,
            "seconds_since_last": float(seconds_since_last_txn),
            "device_risk_flag": 1.0 if device_risk_flag else 0.0,
        }

    @classmethod
    def evaluate(
        cls,
        amount: float,
        sender_upi: str,
        receiver_upi: str,
        timestamp: Optional[datetime.datetime] = None,
        sender_txns_last_5m: int = 1,
        sender_avg_amt: float = 2500.0,
        is_new_receiver: bool = False,
        receiver_fan_in_1h: int = 1,
        is_emulator: bool = False,
        seconds_since_last_txn: float = 300.0,
        device_risk_flag: bool = False,
    ) -> Dict[str, Any]:
        if timestamp is None:
            timestamp = datetime.datetime.utcnow()

        features = cls.extract_features(
            amount=amount,
            timestamp=timestamp,
            sender_txns_last_5m=sender_txns_last_5m,
            sender_avg_amt=sender_avg_amt,
            is_new_receiver=is_new_receiver,
            receiver_fan_in_1h=receiver_fan_in_1h,
            is_emulator=is_emulator,
            seconds_since_last_txn=seconds_since_last_txn,
            device_risk_flag=device_risk_flag,
        )

        model = load_model()
        model_version = "v1.2-ensemble-rf-iforest" if model else "v1.0-calibrated-demo-engine"

        # Calculate explainable feature contributions
        score_components = []
        raw_risk = 0.0

        # 1. Velocity Analysis (Rapid transactions in 5 minutes)
        if features["txns_last_5m"] >= 5:
            contribution = 35.0
            raw_risk += contribution
            score_components.append({
                "feature": "High Velocity Burst",
                "impact": "HIGH_RISK",
                "description": f"{int(features['txns_last_5m'])} transactions triggered within 5 minutes (Potential bot or account compromise)",
                "score_contribution": contribution,
            })
        elif features["txns_last_5m"] >= 3:
            contribution = 20.0
            raw_risk += contribution
            score_components.append({
                "feature": "Elevated Velocity",
                "impact": "SUSPICIOUS",
                "description": f"{int(features['txns_last_5m'])} transactions in 5 minutes (Rapid transfer frequency)",
                "score_contribution": contribution,
            })

        # 2. Money Mule Fan-In (Multiple victims sending to 1 receiver within 1 hour)
        if features["receiver_fan_in_1h"] >= 6:
            contribution = 40.0
            raw_risk += contribution
            score_components.append({
                "feature": "Money Mule Account Hub",
                "impact": "HIGH_RISK",
                "description": f"Receiver received funds from {int(features['receiver_fan_in_1h'])} distinct UPI IDs in last 60 minutes",
                "score_contribution": contribution,
            })
        elif features["receiver_fan_in_1h"] >= 3:
            contribution = 18.0
            raw_risk += contribution
            score_components.append({
                "feature": "Receiver Aggregation",
                "impact": "SUSPICIOUS",
                "description": f"Receiver accepted funds from {int(features['receiver_fan_in_1h'])} different senders within 1 hour",
                "score_contribution": contribution,
            })

        # 3. Amount Deviation from Sender Baseline
        amt_ratio = features["amt_to_avg_ratio"]
        if amt_ratio >= 10.0 and amount >= 25000:
            contribution = 30.0
            raw_risk += contribution
            score_components.append({
                "feature": "Sudden High-Value Spike",
                "impact": "HIGH_RISK",
                "description": f"Amount (₹{amount:,.0f}) is {amt_ratio:.1f}x higher than sender's historical average of ₹{sender_avg_amt:,.0f}",
                "score_contribution": contribution,
            })
        elif amt_ratio >= 4.0 and amount >= 10000:
            contribution = 15.0
            raw_risk += contribution
            score_components.append({
                "feature": "Above-Average Transfer",
                "impact": "SUSPICIOUS",
                "description": f"Amount (₹{amount:,.0f}) is {amt_ratio:.1f}x higher than typical profile average",
                "score_contribution": contribution,
            })

        # 4. Off-Hours / Nocturnal Anomaly (1:00 AM to 5:00 AM)
        hour = int(features["hour_of_day"])
        if 1 <= hour <= 4:
            contribution = 12.0
            raw_risk += contribution
            score_components.append({
                "feature": "Nocturnal Anomaly",
                "impact": "SUSPICIOUS",
                "description": f"Transaction initiated at {hour:02d}:00 HRS (Unusual hour for digital payments)",
                "score_contribution": contribution,
            })

        # 5. New Receiver combined with high amount
        if features["is_new_receiver"] == 1.0:
            if amount >= 20000:
                contribution = 15.0
                raw_risk += contribution
                score_components.append({
                    "feature": "First-Time High-Value Receiver",
                    "impact": "SUSPICIOUS",
                    "description": f"First transfer to VPA '{receiver_upi}' with substantial amount (₹{amount:,.0f})",
                    "score_contribution": contribution,
                })
            else:
                contribution = 5.0
                raw_risk += contribution
                score_components.append({
                    "feature": "New Beneficiary",
                    "impact": "SAFE",
                    "description": "First time transfer to this beneficiary",
                    "score_contribution": contribution,
                })

        # 6. Device Security Flag & Emulator Check
        if features["is_emulator"] == 1.0 or features["device_risk_flag"] == 1.0:
            contribution = 30.0
            raw_risk += contribution
            score_components.append({
                "feature": "Device Fingerprint Anomaly",
                "impact": "HIGH_RISK",
                "description": "Virtual device / Emulator runtime or unauthorized OS environment detected",
                "score_contribution": contribution,
            })

        # 7. Sub-minute rapid succession
        if 0 < features["seconds_since_last"] < 30:
            contribution = 20.0
            raw_risk += contribution
            score_components.append({
                "feature": "Sub-Minute Repetitive Transfer",
                "impact": "HIGH_RISK",
                "description": f"Transfer executed just {int(features['seconds_since_last'])} seconds after previous payment",
                "score_contribution": contribution,
            })

        # Normal transaction baseline credit
        if raw_risk == 0:
            score_components.append({
                "feature": "Consistent Spending Profile",
                "impact": "SAFE",
                "description": "Amount, velocity, device, and timing align with regular legitimate UPI behavior",
                "score_contribution": 0.0,
            })

        # Cap score between 0 and 100
        risk_score = min(max(raw_risk, 4.0), 99.0)
        
        # If ML model is loaded, ensemble its prediction
        if model is not None:
            try:
                # Prepare feature vector for model
                vec = [[
                    features["amount"],
                    features["hour_of_day"],
                    features["txns_last_5m"],
                    features["amt_to_avg_ratio"],
                    features["is_new_receiver"],
                    features["receiver_fan_in_1h"],
                    features["is_emulator"],
                    features["seconds_since_last"],
                ]]
                ml_prob = float(model.predict_proba(vec)[0][1])
                ml_score = ml_prob * 100.0
                # Blend model prediction with deterministic domain rules (60% ML, 40% Rules)
                risk_score = round(0.6 * ml_score + 0.4 * risk_score, 1)
            except Exception as e:
                print(f"[ML Engine] Prediction error: {e}")

        # Classification ranges as requested in Prompt:
        # 0–29: Safe
        # 30–69: Suspicious
        # 70–100: High Risk / Fraudulent
        if risk_score >= 70.0:
            classification = "FRAUDULENT"
            decision = "BLOCK"
        elif risk_score >= 30.0:
            classification = "SUSPICIOUS"
            decision = "REVIEW"
        else:
            classification = "SAFE"
            decision = "ALLOW"

        fraud_prob = round(risk_score / 100.0, 4)

        explanations = [item["description"] for item in score_components if item["impact"] in ["HIGH_RISK", "SUSPICIOUS"]]
        if not explanations:
            explanations = ["Transaction matches standard legitimate user spending patterns and device profile."]

        return {
            "fraud_probability": fraud_prob,
            "risk_score": round(risk_score, 1),
            "classification": classification,
            "decision": decision,
            "features": features,
            "feature_breakdown": score_components,
            "explanation": explanations,
            "model_version": model_version,
            "is_demo_fallback": (model is None),
        }
