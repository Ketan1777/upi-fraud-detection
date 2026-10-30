import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import FraudAlert, Transaction, User, AuditLog
from backend.app.schemas.schemas import (
    TransactionAnalyzeRequest,
    TransactionAnalyzeResponse,
    AlertOut,
    AlertReviewRequest,
)
from backend.app.ml.fraud_detector import FraudDetectionEngine
from backend.app.services.simulator_service import SimulatorService
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/fraud", tags=["Fraud Detection Engine"])


@router.post("/analyze", response_model=TransactionAnalyzeResponse)
def analyze_transaction(req: TransactionAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Evaluates an arbitrary manual transaction in real time without forcing permanent commit.
    Returns fraud probability, risk score (0-100), decision, and feature explanations.
    """
    now = datetime.datetime.utcnow()
    mock_txn_id = f"ANALYSIS_{now.strftime('%Y%m%d%H%M%S')}"

    # Calculate sender velocity in last 5 minutes from DB
    five_min_ago = now - datetime.timedelta(minutes=5)
    recent_count = (
        db.query(Transaction)
        .filter(
            Transaction.sender_upi == req.sender_upi,
            Transaction.timestamp >= five_min_ago
        )
        .count()
    )

    # Calculate sender average amount
    sender_txns = (
        db.query(Transaction.amount)
        .filter(Transaction.sender_upi == req.sender_upi)
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
            Transaction.sender_upi == req.sender_upi,
            Transaction.receiver_upi == req.receiver_upi
        )
        .first()
    )
    is_new_receiver = (prior_transfer is None)

    # Receiver fan-in in last 1 hour
    one_hour_ago = now - datetime.timedelta(hours=1)
    receiver_fan_in = (
        db.query(Transaction.sender_upi)
        .filter(
            Transaction.receiver_upi == req.receiver_upi,
            Transaction.timestamp >= one_hour_ago
        )
        .distinct()
        .count()
    )

    evaluation = FraudDetectionEngine.evaluate(
        amount=req.amount,
        sender_upi=req.sender_upi,
        receiver_upi=req.receiver_upi,
        timestamp=now,
        sender_txns_last_5m=recent_count + 1,
        sender_avg_amt=sender_avg,
        is_new_receiver=is_new_receiver,
        receiver_fan_in_1h=receiver_fan_in + 1,
        is_emulator=req.is_emulator or False,
        seconds_since_last_txn=120.0,
    )

    return {
        "txn_id": mock_txn_id,
        "sender_upi": req.sender_upi,
        "receiver_upi": req.receiver_upi,
        "amount": req.amount,
        "fraud_probability": evaluation["fraud_probability"],
        "risk_score": evaluation["risk_score"],
        "classification": evaluation["classification"],
        "decision": evaluation["decision"],
        "explanation": evaluation["explanation"],
        "feature_breakdown": evaluation["feature_breakdown"],
        "model_version": evaluation["model_version"],
        "analyzed_at": now,
    }


@router.get("/alerts", response_model=List[AlertOut])
def get_fraud_alerts(
    status: Optional[str] = Query(None, description="NEW, UNDER_REVIEW, CONFIRMED_FRAUD, FALSE_POSITIVE, RESOLVED"),
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(FraudAlert)
    if status:
        query = query.filter(FraudAlert.status == status.upper())
    if severity:
        query = query.filter(FraudAlert.severity == severity.upper())

    alerts = query.order_by(desc(FraudAlert.created_at)).offset(offset).limit(limit).all()
    return alerts


@router.put("/alerts/{alert_id}/review", response_model=AlertOut)
def review_alert(
    alert_id: int,
    payload: AlertReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    alert.status = payload.status.upper()
    alert.reviewer_notes = payload.notes
    alert.reviewed_by_id = current_user.id
    alert.updated_at = datetime.datetime.utcnow()

    # Log action
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="ALERT_REVIEWED",
        resource=f"fraud_alerts/{alert_id}",
        details={"status": alert.status, "notes": payload.notes, "txn_id": alert.txn_id}
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/simulator/toggle")
def toggle_simulator(active: bool, interval: float = 3.0):
    status_now = SimulatorService.set_running(active, interval)
    return {
        "simulator_active": status_now,
        "interval_seconds": SimulatorService.interval_seconds,
        "message": "Live simulator active" if status_now else "Live simulator paused"
    }


@router.post("/simulator/generate")
async def trigger_simulated_transaction(scenario: str = "random", db: Session = Depends(get_db)):
    txn_data = await SimulatorService.generate_transaction(scenario=scenario, db=db)
    return {
        "status": "success",
        "scenario": scenario,
        "transaction": txn_data
    }
