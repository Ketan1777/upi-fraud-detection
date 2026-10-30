import os
import sys
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import User, AuditLog, Transaction, Account, FraudAlert
from backend.app.schemas.schemas import UserOut, AuditLogOut
from backend.app.services.auth_service import require_admin, hash_password
from backend.app.websocket.connection_manager import manager
from backend.app.ml.fraud_detector import load_model, MODEL_PATH

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    users = db.query(User).order_by(desc(User.created_at)).all()
    return users


@router.get("/audit-logs", response_model=List[AuditLogOut])
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return logs


@router.get("/system-health")
def get_system_health(db: Session = Depends(get_db)):
    # Check DB
    try:
        db_txn_count = db.query(Transaction).count()
        db_status = "HEALTHY"
    except Exception as e:
        db_status = f"ERROR: {str(e)}"
        db_txn_count = 0

    # Check ML model
    model = load_model()
    model_status = "TRAINED_MODEL_ACTIVE" if model is not None else "CALIBRATED_FALLBACK_ACTIVE"

    return {
        "status": "OPERATIONAL",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": {
            "status": db_status,
            "total_transactions": db_txn_count,
        },
        "ai_engine": {
            "status": model_status,
            "model_path": MODEL_PATH,
            "model_exists": os.path.exists(MODEL_PATH),
            "algorithm": "Random Forest + Isolation Forest Ensemble",
        },
        "websockets": {
            "active_clients": len(manager.active_connections),
        },
        "environment": {
            "python_version": sys.version.split(" ")[0],
            "os": os.name,
        }
    }


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    """Seeds the database with default admin/analyst users and 1,000+ synthetic transactions."""
    # Seed default users
    admin = db.query(User).filter(User.email == "admin@fraudguard.ai").first()
    if not admin:
        admin = User(
            email="admin@fraudguard.ai",
            full_name="Chief Risk Officer (Admin)",
            hashed_password=hash_password("Admin@123"),
            role="admin",
            is_active=True
        )
        db.add(admin)

    analyst = db.query(User).filter(User.email == "analyst@fraudguard.ai").first()
    if not analyst:
        analyst = User(
            email="analyst@fraudguard.ai",
            full_name="Senior Fraud Analyst",
            hashed_password=hash_password("Analyst@123"),
            role="analyst",
            is_active=True
        )
        db.add(analyst)

    db.commit()

    # Seed transactions if count < 100
    current_txns = db.query(Transaction).count()
    seeded_count = 0
    if current_txns < 100:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
        dataset_file = os.path.join(base_dir, "dataset/transactions.csv")
        
        if not os.path.exists(dataset_file):
            from dataset.generate_dataset import generate_dataset
            generate_dataset(1500)

        import csv
        with open(dataset_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                txn = Transaction(
                    txn_id=row["txn_id"],
                    sender_upi=row["sender_upi"],
                    receiver_upi=row["receiver_upi"],
                    amount=float(row["amount"]),
                    payment_method=row.get("payment_method", "UPI_APP"),
                    category=row.get("category", "P2P"),
                    timestamp=datetime.datetime.strptime(row["timestamp"], "%Y-%m-%d %H:%M:%S") if row.get("timestamp") else datetime.datetime.utcnow(),
                    status=row.get("status", "COMPLETED"),
                    risk_score=float(row["risk_score"]),
                    classification=row.get("classification", "SAFE"),
                    is_flagged=row.get("is_flagged", "False").lower() in ["true", "1"],
                )
                db.add(txn)
                seeded_count += 1

                # Add sample alert for fraudulent rows
                if txn.classification == "FRAUDULENT":
                    alert = FraudAlert(
                        txn_id=txn.txn_id,
                        alert_type="MONEY_MULE_HUB" if "mule" in txn.receiver_upi else "HIGH_RISK_ANOMALY",
                        severity="CRITICAL" if txn.risk_score >= 80 else "HIGH",
                        reason=f"High risk score {txn.risk_score:.1f}: Abnormal velocity / Mule account pattern detected",
                        status="NEW",
                        risk_score=txn.risk_score,
                    )
                    db.add(alert)

                if seeded_count % 100 == 0:
                    db.commit()

            db.commit()

    return {
        "status": "success",
        "message": f"Database initialized. Seeded {seeded_count} synthetic UPI transactions.",
        "admin_credentials": {"email": "admin@fraudguard.ai", "password": "Admin@123"},
        "analyst_credentials": {"email": "analyst@fraudguard.ai", "password": "Analyst@123"},
    }
