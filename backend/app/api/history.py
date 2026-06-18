"""
Phase 5 — /api/history

Institutional memory: retrieve the audit trail of all questions asked,
answers generated, and sources cited.
"""

from fastapi import APIRouter, HTTPException, Query
from ..services import memory_service
from ..models.schemas import HistoryEntry, HistoryListResponse

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryListResponse)
async def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    try:
        entries = memory_service.list_questions(limit=limit, offset=offset)
        total = memory_service.count_questions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")

    return HistoryListResponse(
        entries=[HistoryEntry(**e) for e in entries],
        total=total,
        limit=limit,
        offset=offset,
    )
