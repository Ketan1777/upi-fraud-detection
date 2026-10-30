from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.services.network_service import NetworkAnalysisService

router = APIRouter(prefix="/network", tags=["Network Analysis"])


@router.get("/analysis")
def get_network_analysis(
    limit: int = Query(150, ge=20, le=400),
    db: Session = Depends(get_db)
):
    """
    Computes graph topology of sender and receiver UPI VPAs.
    Detects money mule hubs, in-degree/out-degree fan-ins, and high-risk clusters.
    """
    graph_data = NetworkAnalysisService.analyze_network(db=db, limit=limit)
    return graph_data
