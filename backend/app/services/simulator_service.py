import asyncio
import random
import datetime
from sqlalchemy.orm import Session

from backend.app.database.session import SessionLocal
from backend.app.models.models import Transaction, FraudPrediction, FraudAlert, Account, Device
from backend.app.ml.fraud_detector import FraudDetectionEngine
from backend.app.websocket.connection_manager import manager

POPULAR_VPAS = [
    "rohit.sharma@okaxis", "ananya.singh@okhdfcbank", "vikram.aditya@oksbi",
    "priya.nair@okicici", "rahul.verma@ybl", "sneha.patel@paytm",
    "amit.kumar@apl", "deepak.joshi@oksbi", "pooja.sharma@okaxis",
    "varun.teja@okicici", "kavita.sen@okhdfcbank", "manish.tiwari@ybl"
]

MERCHANTS = [
    "swiggy.pay@icici", "zomato.order@hdfc", "amazon.upi@axis",
    "flipkart.pay@sbi", "zepto.groceries@icici", "blinkit.retail@hdfc"
]

MULE_ACCOUNTS = [
    "mule.cashout.01@paytm", "shadow.crypto.ramp@ybl", "agent.collector.hub@oksbi",
    "fast.exchange.node@okaxis"
]

PAYMENT_METHODS = ["GOOGLE_PAY", "PHONEPE", "PAYTM", "BHIM", "CRED"]


class SimulatorService:
    is_running = False
    interval_seconds = 3.0

    @classmethod
    def set_running(cls, active: bool, interval: float = 3.0):
        cls.is_running = active
        cls.interval_seconds = max(1.0, interval)
        return cls.is_running

    @classmethod
    async def generate_transaction(cls, scenario: str = "random", db: Session = None):
        own_db = False
        if db is None:
            db = SessionLocal()
            own_db = True

        try:
            now = datetime.datetime.utcnow()
            txn_id = f"UPI{now.strftime('%Y%m%d%H%M%S')}{random.randint(100, 999)}"

            if scenario == "random":
                roll = random.random()
                if roll < 0.70:
                    scenario = "normal"
                elif roll < 0.82:
                    scenario = "velocity_spike"
                elif roll < 0.92:
                    scenario = "money_mule"
                else:
                    scenario = "high_value"

            # Construct scenario parameters
            if scenario == "normal":
                sender = random.choice(POPULAR_VPAS)
                receiver = random.choice(MERCHANTS if random.random() < 0.5 else POPULAR_VPAS)
                while receiver == sender:
                    receiver = random.choice(POPULAR_VPAS)
                amount = round(random.uniform(50.0, 3500.0), 2)
                method = random.choice(PAYMENT_METHODS)
                category = "P2M" if "@" in receiver and ("swiggy" in receiver or "amazon" in receiver) else "P2P"
                txns_5m = 1
                sender_avg = 2000.0
                is_new_rcv = False
                fan_in = 1
                is_emulator = False
                sec_last = random.randint(300, 4000)

            elif scenario == "velocity_spike":
                sender = random.choice(POPULAR_VPAS)
                receiver = random.choice(POPULAR_VPAS)
                while receiver == sender:
                    receiver = random.choice(POPULAR_VPAS)
                amount = round(random.uniform(8000.0, 20000.0), 2)
                method = "PHONEPE"
                category = "P2P"
                txns_5m = random.randint(5, 8)
                sender_avg = 1500.0
                is_new_rcv = True
                fan_in = 2
                is_emulator = random.random() < 0.4
                sec_last = random.randint(8, 25)

            elif scenario == "money_mule":
                sender = random.choice(POPULAR_VPAS)
                receiver = random.choice(MULE_ACCOUNTS)
                amount = round(random.uniform(25000.0, 50000.0), 2)
                method = "GOOGLE_PAY"
                category = "INVESTMENT"
                txns_5m = 2
                sender_avg = 2200.0
                is_new_rcv = True
                fan_in = random.randint(6, 12)
                is_emulator = False
                sec_last = random.randint(40, 150)

            elif scenario == "high_value":
                sender = random.choice(POPULAR_VPAS)
                receiver = random.choice(POPULAR_VPAS)
                while receiver == sender:
                    receiver = random.choice(POPULAR_VPAS)
                amount = round(random.uniform(60000.0, 98000.0), 2)
                method = "CRED"
                category = "P2P"
                txns_5m = 3
                sender_avg = 1800.0
                is_new_rcv = True
                fan_in = 1
                is_emulator = True
                sec_last = random.randint(30, 80)
            else:
                sender = random.choice(POPULAR_VPAS)
                receiver = random.choice(POPULAR_VPAS)
                amount = 2500.0
                method = "UPI_APP"
                category = "P2P"
                txns_5m = 1
                sender_avg = 2500.0
                is_new_rcv = False
                fan_in = 1
                is_emulator = False
                sec_last = 500

            # Evaluate with ML Engine
            evaluation = FraudDetectionEngine.evaluate(
                amount=amount,
                sender_upi=sender,
                receiver_upi=receiver,
                timestamp=now,
                sender_txns_last_5m=txns_5m,
                sender_avg_amt=sender_avg,
                is_new_receiver=is_new_rcv,
                receiver_fan_in_1h=fan_in,
                is_emulator=is_emulator,
                seconds_since_last_txn=sec_last,
            )

            status = "COMPLETED"
            if evaluation["decision"] == "BLOCK":
                status = "BLOCKED"
            elif evaluation["decision"] == "REVIEW":
                status = "FLAG_REVIEW"

            is_flagged = evaluation["risk_score"] >= 30.0

            # Save Transaction
            txn = Transaction(
                txn_id=txn_id,
                sender_upi=sender,
                receiver_upi=receiver,
                amount=amount,
                payment_method=method,
                category=category,
                timestamp=now,
                status=status,
                risk_score=evaluation["risk_score"],
                classification=evaluation["classification"],
                is_flagged=is_flagged,
            )
            db.add(txn)
            db.commit()
            db.refresh(txn)

            # Save Prediction
            prediction = FraudPrediction(
                txn_id=txn_id,
                fraud_probability=evaluation["fraud_probability"],
                risk_score=evaluation["risk_score"],
                classification=evaluation["classification"],
                decision=evaluation["decision"],
                model_version=evaluation["model_version"],
                prediction_breakdown=evaluation["features"],
                top_features=evaluation["feature_breakdown"],
            )
            db.add(prediction)

            # Generate Fraud Alert if Suspicious or Fraudulent
            alert_payload = None
            if is_flagged:
                alert_type = "VELOCITY_SPIKE" if txns_5m >= 4 else (
                    "MONEY_MULE_HUB" if fan_in >= 4 else (
                        "HIGH_VALUE_ANOMALY" if amount >= 30000 else "SUSPICIOUS_PATTERN"
                    )
                )
                severity = "CRITICAL" if evaluation["risk_score"] >= 80 else (
                    "HIGH" if evaluation["risk_score"] >= 60 else "MEDIUM"
                )
                reason_text = " | ".join(evaluation["explanation"])

                alert = FraudAlert(
                    txn_id=txn_id,
                    alert_type=alert_type,
                    severity=severity,
                    reason=reason_text,
                    status="NEW",
                    risk_score=evaluation["risk_score"],
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)

                alert_payload = {
                    "id": alert.id,
                    "txn_id": alert.txn_id,
                    "alert_type": alert.alert_type,
                    "severity": alert.severity,
                    "reason": alert.reason,
                    "status": alert.status,
                    "risk_score": alert.risk_score,
                    "created_at": alert.created_at.isoformat(),
                }

            db.commit()

            # Broadcast live transaction event via WebSocket
            txn_payload = {
                "id": txn.id,
                "txn_id": txn.txn_id,
                "sender_upi": txn.sender_upi,
                "receiver_upi": txn.receiver_upi,
                "amount": txn.amount,
                "payment_method": txn.payment_method,
                "category": txn.category,
                "timestamp": txn.timestamp.isoformat(),
                "status": txn.status,
                "risk_score": txn.risk_score,
                "classification": txn.classification,
                "decision": evaluation["decision"],
                "is_flagged": txn.is_flagged,
                "explanations": evaluation["explanation"],
            }

            await manager.broadcast_transaction(txn_payload)
            if alert_payload:
                await manager.broadcast_alert(alert_payload)

            return txn_payload

        finally:
            if own_db:
                db.close()

    @classmethod
    async def start_loop(cls):
        """Asynchronous simulator background task that runs while active."""
        print("[Simulator] Background simulation loop started.")
        while True:
            if cls.is_running:
                try:
                    await cls.generate_transaction(scenario="random")
                except Exception as e:
                    print(f"[Simulator] Error in simulation step: {e}")
            await asyncio.sleep(cls.interval_seconds)
