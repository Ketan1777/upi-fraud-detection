import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import Transaction

router = APIRouter(prefix="/reports", tags=["Reports & Export"])


@router.get("/export")
def export_transactions_csv(
    classification: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_risk: Optional[float] = Query(None),
    limit: int = Query(1000, ge=1, le=5000),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if classification:
        query = query.filter(Transaction.classification == classification.upper())
    if status:
        query = query.filter(Transaction.status == status.upper())
    if min_risk is not None:
        query = query.filter(Transaction.risk_score >= min_risk)

    txns = query.order_by(desc(Transaction.timestamp)).limit(limit).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Transaction ID",
        "Sender UPI",
        "Receiver UPI",
        "Amount (INR)",
        "Payment Method",
        "Category",
        "Timestamp (UTC)",
        "Status",
        "Risk Score",
        "Classification",
        "Flagged"
    ])

    for t in txns:
        writer.writerow([
            t.txn_id,
            t.sender_upi,
            t.receiver_upi,
            f"{t.amount:.2f}",
            t.payment_method,
            t.category,
            t.timestamp.strftime("%Y-%m-%d %H:%M:%S") if t.timestamp else "",
            t.status,
            f"{t.risk_score:.1f}",
            t.classification,
            "YES" if t.is_flagged else "NO"
        ])

    csv_data = output.getvalue()
    filename = f"upi_fraud_report_{classification or 'all'}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
