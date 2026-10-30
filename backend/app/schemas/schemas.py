from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ----------------- Auth Schemas -----------------
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    role: Optional[str] = "analyst"  # 'admin' or 'analyst'


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ----------------- Transaction Schemas -----------------
class TransactionCreate(BaseModel):
    sender_upi: str = Field(..., example="rohit.sharma@okaxis")
    receiver_upi: str = Field(..., example="lucky.lottery@paytm")
    amount: float = Field(..., gt=0, example=25000.0)
    payment_method: Optional[str] = "UPI_APP"
    category: Optional[str] = "P2P"
    device_ip: Optional[str] = "192.168.1.100"
    device_fingerprint: Optional[str] = "dev_fp_alpha_921"
    is_emulator: Optional[bool] = False


class TransactionAnalyzeRequest(BaseModel):
    sender_upi: str = Field(..., example="vikram.aditya@oksbi")
    receiver_upi: str = Field(..., example="fastcash.reward@ybl")
    amount: float = Field(..., gt=0, example=48000.0)
    payment_method: Optional[str] = "PHONEPE"
    category: Optional[str] = "P2P"
    device_ip: Optional[str] = "49.36.120.15"
    device_fingerprint: Optional[str] = "fp_unknown_device_99"
    is_emulator: Optional[bool] = False
    device_location: Optional[str] = "Kolkata"


class FeatureReason(BaseModel):
    feature: str
    impact: str  # POSITIVE, NEGATIVE, HIGH_RISK
    description: str
    score_contribution: float


class TransactionAnalyzeResponse(BaseModel):
    txn_id: str
    sender_upi: str
    receiver_upi: str
    amount: float
    fraud_probability: float
    risk_score: float
    classification: str  # SAFE, SUSPICIOUS, FRAUDULENT
    decision: str  # ALLOW, REVIEW, BLOCK
    explanation: List[str]
    feature_breakdown: List[FeatureReason]
    model_version: str
    analyzed_at: datetime


class TransactionOut(BaseModel):
    id: int
    txn_id: str
    sender_upi: str
    receiver_upi: str
    amount: float
    payment_method: str
    category: str
    timestamp: datetime
    status: str
    risk_score: float
    classification: str
    is_flagged: bool

    class Config:
        from_attributes = True


# ----------------- Alert Schemas -----------------
class AlertOut(BaseModel):
    id: int
    txn_id: str
    alert_type: str
    severity: str
    reason: str
    status: str
    risk_score: float
    reviewed_by_id: Optional[int] = None
    reviewer_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    transaction: Optional[TransactionOut] = None

    class Config:
        from_attributes = True


class AlertReviewRequest(BaseModel):
    status: str = Field(..., example="CONFIRMED_FRAUD")  # UNDER_REVIEW, CONFIRMED_FRAUD, FALSE_POSITIVE, RESOLVED
    notes: Optional[str] = "Confirmed organized mule account pattern."


# ----------------- Dashboard & Analytics Schemas -----------------
class DashboardStats(BaseModel):
    total_transactions: int
    safe_transactions: int
    suspicious_transactions: int
    fraudulent_transactions: int
    total_volume_amount: float
    fraud_amount_detected: float
    fraud_percentage: float
    high_risk_alerts_count: int
    active_mule_nodes: int


class VolumeTrendPoint(BaseModel):
    time_label: str
    total_txns: int
    fraud_txns: int
    safe_txns: int
    volume_amount: float


class CategoryDistribution(BaseModel):
    category: str
    count: int
    fraud_count: int


# ----------------- Network Graph Schemas -----------------
class GraphNode(BaseModel):
    id: str  # UPI ID
    label: str
    risk_score: float
    is_mule: bool
    total_sent: float
    total_received: float
    txn_count: int
    node_type: str  # 'sender', 'receiver', 'mule_hub', 'regular'


class GraphEdge(BaseModel):
    source: str
    target: str
    amount: float
    txn_count: int
    risk_score: float
    is_suspicious: bool


class NetworkGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    mule_clusters_count: int
    high_risk_connections: int


# ----------------- Audit Log Schemas -----------------
class AuditLogOut(BaseModel):
    id: int
    user_email: Optional[str]
    action: str
    resource: str
    details: Dict[str, Any]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True
