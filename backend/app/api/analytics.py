"""
Phase 6 — /api/analytics

Research intelligence metrics: document counts, question volume,
topic landscape, entity statistics, and knowledge graph size.
"""

from fastapi import APIRouter, HTTPException
from ..services.analytics_service import get_analytics
from ..models.schemas import AnalyticsResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
async def analytics():
    try:
        data = get_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics unavailable: {str(e)}")
    return AnalyticsResponse(**data)
