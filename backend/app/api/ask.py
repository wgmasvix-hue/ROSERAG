"""
/api/ask — Institutional question answering (stateless + streaming).
"""

import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..core.reasoning import (
    generate_answer,
    build_context_block,
    build_history_block,
    compute_confidence,
    SYSTEM_PROMPT,
    FALLBACK_PROMPT,
)
from ..core.embeddings import embed_text
from ..core.vector_store import search_chunks
from ..core.llm_client import chat_complete_stream
from ..services.trust_service import compute_trust
from ..services import memory_service
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
    trust_data = result.get("trust", {"trust_score": 0.0, "trust_level": "LOW", "components": {}})
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


@router.post("/stream")
async def ask_stream(request: AskRequest):
    """SSE streaming endpoint — yields tokens as they arrive from the LLM."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    async def event_gen():
        # ── Retrieve context ──────────────────────────────────────
        chunks = []
        try:
            vec = await embed_text(request.question)
            chunks = search_chunks(vec, top_k=request.top_k)
        except Exception:
            pass

        sources = [
            {
                "document": c["doc_name"],
                "chunk_id": c.get("chunk_id", ""),
                "page": c["page"],
                "excerpt": c["text"][:300] + ("…" if len(c["text"]) > 300 else ""),
                "chunk": c["text"][:500] + ("…" if len(c["text"]) > 500 else ""),
                "score": round(c["score"], 4),
            }
            for c in chunks
        ]
        trust = compute_trust(chunks, top_k=request.top_k) if chunks else {
            "trust_score": 0.0, "trust_level": "LOW", "components": {}
        }

        # Send metadata first so UI can render sources immediately
        yield f"data: {json.dumps({'type': 'meta', 'sources': sources, 'trust': trust, 'retrieved_chunks': len(chunks)})}\n\n"

        # ── Build prompt ──────────────────────────────────────────
        if chunks:
            context = build_context_block(chunks)
            user_msg = (
                f"Context from institutional documents:\n\n{context}\n\n"
                f"Question: {request.question}\n\n"
                "Provide a thorough, evidence-grounded answer. "
                "Reference the source documents by name and page number. "
                "Use [1], [2] etc. to cite sources inline where relevant."
            )
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ]
        else:
            messages = [
                {"role": "system", "content": FALLBACK_PROMPT},
                {"role": "user", "content": request.question},
            ]

        # ── Stream tokens ─────────────────────────────────────────
        full_answer = ""
        try:
            async for token in chat_complete_stream(messages):
                full_answer += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"
            return

        # ── Persist & close ───────────────────────────────────────
        confidence = compute_confidence(chunks)
        try:
            memory_service.save_question(
                question=request.question,
                answer=full_answer,
                confidence=confidence,
                trust_score=trust["trust_score"],
                trust_level=trust["trust_level"],
                sources=sources,
                retrieved_chunks=len(chunks),
                session_id=None,
            )
        except Exception:
            pass

        yield f"data: {json.dumps({'type': 'done', 'confidence': confidence})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
