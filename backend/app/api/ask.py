"""
Phase 1 — /api/ask

Single-shot institutional question answering with full trust and traceability output.
Distinct from /api/chat (which carries conversation history) — /ask is stateless,
optimized for programmatic access and the primary institutional intelligence endpoint.
"""

from fastapi import APIRouter, HTTPException
from ..core.reasoning import generate_answer
from ..models.schemas import AskRequest, AskResponse, SourceWithChunkId, TrustResult

router = APIRouter(prefix="/ask", tags=["Ask"])


@router.post("", response_model=AskResponse)
async def ask(request: AskRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = await generate_answer(
            question=request.question,
            history=[],
            top_k=request.top_k,
            persist_history=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    sources = [
        SourceWithChunkId(
            document=s["document"],
            chunk_id=s.get("chunk_id", ""),
            chunk=s.get("chunk", s.get("excerpt", "")),
            page=s["page"],
            score=s["score"],
        )
        for s in result["sources"]
    ]

    trust_data = result.get("trust", {"trust_score": result.get("confidence", 0.0), "trust_level": "LOW", "components": {}})
    trust = TrustResult(
        trust_score=trust_data["trust_score"],
        trust_level=trust_data["trust_level"],
        components=trust_data.get("components", {}),
    )

    return AskResponse(
        question=request.question,
        answer=result["answer"],
        confidence=result["confidence"],
        trust=trust,
        sources=sources,
        retrieved_chunks=result["retrieved_chunks"],
    )
