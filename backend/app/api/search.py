import time
from fastapi import APIRouter, HTTPException
from ..core.embeddings import embed_text
from ..core.vector_store import search_chunks
from ..models.schemas import SearchRequest, SearchResponse, ChunkResult

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    start = time.monotonic()

    try:
        query_vector = await embed_text(request.query)
        results = search_chunks(query_vector, top_k=request.top_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    elapsed_ms = (time.monotonic() - start) * 1000

    chunk_results = [
        ChunkResult(
            text=r["text"],
            document_id=r["doc_id"],
            document_name=r["doc_name"],
            page=r["page"],
            chunk_index=r["chunk_index"],
            score=round(r["score"], 4),
        )
        for r in results
    ]

    return SearchResponse(
        query=request.query,
        results=chunk_results,
        elapsed_ms=round(elapsed_ms, 2),
    )
