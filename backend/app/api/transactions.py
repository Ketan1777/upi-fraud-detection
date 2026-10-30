import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.app.database.session import get_db
from backend.app.models.models import Transaction, FraudPrediction, FraudAlert, Device
from backend.app.schemas.schemas import TransactionCreate, TransactionOut
from backend.app.ml.fraud_detector import FraudDetectionEngine
from backend.app.websocket.connection_manager import manager

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(txn_in: TransactionCreate, db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    txn_id = f"UPI{now.strftime('%Y%m%d%H%M%S')}{int(now.microsecond / 1000):03d}"

    # Calculate sender velocity in last 5 minutes
    five_min_ago = now - datetime.timedelta(minutes=5)
    recent_count = (
        db.query(Transaction)
        .filter(
            Transaction.sender_upi == txn_in.sender_upi,
            Transaction.timestamp >= five_min_ago
        )
        .count()
    )

    # Calculate sender average amount
    sender_txns = (
        db.query(Transaction.amount)
        .filter(Transaction.sender_upi == txn_in.sender_upi)
        .limit(30)
        .all()
    )
    sender_avg = (
        sum(t[0] for t in sender_txns) / len(sender_txns)
        if sender_txns else 2500.0
    )

    # Check if new receiver
    prior_transfer = (
        db.query(Transaction)
        .filter(
            Transaction.sender_upi == txn_in.sender_upi,
            Transaction.receiver_upi == txn_in.receiver_upi
        )
        .first()
    )
    is_new_receiver = (prior_transfer is None)

    # Calculate receiver fan-in in last 1 hour
    one_hour_ago = now - datetime.timedelta(hours=1)
    receiver_fan_in = (
        db.query(Transaction.sender_upi)
        .filter(
            Transaction.receiver_upi == txn_in.receiver_upi,
            Transaction.timestamp >= one_hour_ago
        )
        .distinct()
        .count()
    )

    # ML Evaluation
    evaluation = FraudDetectionEngine.evaluate(
        amount=txn_in.amount,
        sender_upi=txn_in.sender_upi,
        receiver_upi=txn_in.receiver_upi,
        timestamp=now,
        sender_txns_last_5m=recent_count + 1,
        sender_avg_amt=sender_avg,
        is_new_receiver=is_new_receiver,
        receiver_fan_in_1h=receiver_fan_in + 1,
        is_emulator=txn_in.is_emulator or False,
        seconds_since_last_txn=120.0,
    )

    status_str = "COMPLETED"
    if evaluation["decision"] == "BLOCK":
        status_str = "BLOCKED"
    elif evaluation["decision"] == "REVIEW":
        status_str = "FLAG_REVIEW"

    is_flagged = evaluation["risk_score"] >= 30.0

    # Device tracking
    device = None
    if txn_in.device_fingerprint:
        device = db.query(Device).filter(Device.device_fingerprint == txn_in.device_fingerprint).first()
        if not device:
            device = Device(
                device_fingerprint=txn_in.device_fingerprint,
                ip_address=txn_in.device_ip,
                is_emulator=txn_in.is_emulator or False,
                risk_score=evaluation["risk_score"],
            )
            db.add(device)
            db.commit()
            db.refresh(device)

    # Create Transaction record
    txn = Transaction(
        txn_id=txn_id,
        sender_upi=txn_in.sender_upi,
        receiver_upi=txn_in.receiver_upi,
        amount=txn_in.amount,
        payment_method=txn_in.payment_method or "UPI_APP",
        category=txn_in.category or "P2P",
        timestamp=now,
        status=status_str,
        risk_score=evaluation["risk_score"],
        classification=evaluation["classification"],
        is_flagged=is_flagged,
        device_id=device.id if device else None,
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

    # Save Fraud Alert if flagged
    alert_payload = None
    if is_flagged:
        alert_type = "VELOCITY_SPIKE" if recent_count >= 3 else (
            "MONEY_MULE_HUB" if receiver_fan_in >= 4 else (
                "HIGH_VALUE_ANOMALY" if txn_in.amount >= 30000 else "SUSPICIOUS_PATTERN"
            )
        )
        severity = "CRITICAL" if evaluation["risk_score"] >= 80 else (
            "HIGH" if evaluation["risk_score"] >= 60 else "MEDIUM"
        )
        alert = FraudAlert(
            txn_id=txn_id,
            alert_type=alert_type,
            severity=severity,
            reason=" | ".join(evaluation["explanation"]),
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

    # Real-time WebSocket Broadcast
    txn_data = {
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
        "is_flagged": txn.is_flagged,
        "decision": evaluation["decision"],
        "explanations": evaluation["explanation"],
    }
    await manager.broadcast_transaction(txn_data)
    if alert_payload:
        await manager.broadcast_alert(alert_payload)

    return txn


@router.get("", response_model=List[TransactionOut])
def get_transactions(
    search: Optional[str] = Query(None, description="Search txn_id, sender_upi, receiver_upi"),
    classification: Optional[str] = Query(None, description="SAFE, SUSPICIOUS, FRAUDULENT"),
    status: Optional[str] = Query(None, description="COMPLETED, BLOCKED, FLAG_REVIEW"),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    min_risk: Optional[float] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.txn_id.ilike(search_filter),
                Transaction.sender_upi.ilike(search_filter),
                Transaction.receiver_upi.ilike(search_filter),
            )
        )

    if classification:
        query = query.filter(Transaction.classification == classification.upper())

    if status:
        query = query.filter(Transaction.status == status.upper())

    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)

    if min_risk is not None:
        query = query.filter(Transaction.risk_score >= min_risk)

    txns = query.order_by(desc(Transaction.timestamp)).offset(offset).limit(limit).all()
    return txns


@router.get("/{id_or_txnid}")
def get_transaction_details(id_or_txnid: str, db: Session = Depends(get_db)):
    if id_or_txnid.isdigit():
        txn = db.query(Transaction).filter(Transaction.id == int(id_or_txnid)).first()
    else:
        txn = db.query(Transaction).filter(Transaction.txn_id == id_or_txnid).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    prediction = db.query(FraudPrediction).filter(FraudPrediction.txn_id == txn.txn_id).first()
    alerts = db.query(FraudAlert).filter(FraudAlert.txn_id == txn.txn_id).all()

    return {
        "transaction": txn,
        "prediction": prediction,
        "alerts": alerts,
    }
