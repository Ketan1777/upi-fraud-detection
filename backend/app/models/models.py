import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst", nullable=False)  # 'admin' or 'analyst'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")
    reviewed_alerts = relationship("FraudAlert", back_populates="reviewer")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    upi_id = Column(String(100), unique=True, index=True, nullable=False)
    account_number = Column(String(50), unique=True, index=True, nullable=False)
    holder_name = Column(String(255), nullable=False)
    bank_name = Column(String(100), nullable=False)
    risk_tier = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH, BLOCKED
    is_mule_suspect = Column(Boolean, default=False)
    total_received_amount = Column(Float, default=0.0)
    total_sent_amount = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_fingerprint = Column(String(128), unique=True, index=True, nullable=False)
    ip_address = Column(String(64), nullable=True)
    location_city = Column(String(100), default="Mumbai")
    location_country = Column(String(100), default="India")
    risk_score = Column(Float, default=0.0)
    is_emulator = Column(Boolean, default=False)
    is_rooted = Column(Boolean, default=False)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)

    transactions = relationship("Transaction", back_populates="device")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    txn_id = Column(String(64), unique=True, index=True, nullable=False)
    sender_upi = Column(String(100), index=True, nullable=False)
    receiver_upi = Column(String(100), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="UPI_APP")  # GOOGLE_PAY, PHONEPE, PAYTM, BHIM, CRED
    category = Column(String(50), default="P2P")  # P2P, P2M, BILL_PAYMENT, INVESTMENT, CRYPTO_RAMP
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    status = Column(String(50), default="COMPLETED")  # COMPLETED, BLOCKED, FLAG_REVIEW, PENDING
    risk_score = Column(Float, default=0.0)  # 0 to 100
    classification = Column(String(50), default="SAFE")  # SAFE, SUSPICIOUS, FRAUDULENT
    is_flagged = Column(Boolean, default=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)

    # Relationships
    device = relationship("Device", back_populates="transactions")
    prediction = relationship("FraudPrediction", back_populates="transaction", uselist=False)
    alerts = relationship("FraudAlert", back_populates="transaction")


class FraudPrediction(Base):
    __tablename__ = "fraud_predictions"

    id = Column(Integer, primary_key=True, index=True)
    txn_id = Column(String(64), ForeignKey("transactions.txn_id"), index=True, nullable=False)
    fraud_probability = Column(Float, nullable=False)  # 0.0 to 1.0
    risk_score = Column(Float, nullable=False)  # 0 to 100
    classification = Column(String(50), nullable=False)
    decision = Column(String(50), default="ALLOW")  # ALLOW, REVIEW, BLOCK
    model_version = Column(String(50), default="v1.0-ensemble")
    prediction_breakdown = Column(JSON, default=dict)
    top_features = Column(JSON, default=list)  # explainability reasons
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transaction = relationship("Transaction", back_populates="prediction")


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(Integer, primary_key=True, index=True)
    txn_id = Column(String(64), ForeignKey("transactions.txn_id"), index=True, nullable=False)
    alert_type = Column(String(100), nullable=False)  # VELOCITY_SPIKE, MONEY_MULE_HUB, HIGH_VALUE_ANOMALY, UNUSUAL_HOURS, ACCOUNT_TAKEOVER
    severity = Column(String(50), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="NEW")  # NEW, UNDER_REVIEW, CONFIRMED_FRAUD, FALSE_POSITIVE, RESOLVED
    risk_score = Column(Float, default=0.0)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    transaction = relationship("Transaction", back_populates="alerts")
    reviewer = relationship("User", back_populates="reviewed_alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., 'ALERT_REVIEWED', 'MANUAL_TXN_ANALYZE', 'USER_LOGIN', 'SIMULATOR_TOGGLED'
    resource = Column(String(100), nullable=False)
    details = Column(JSON, default=dict)
    ip_address = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


# Compound indexes for fast lookups
Index("idx_txns_sender_time", Transaction.sender_upi, Transaction.timestamp)
Index("idx_txns_receiver_time", Transaction.receiver_upi, Transaction.timestamp)
Index("idx_txns_risk_class", Transaction.classification, Transaction.risk_score)
