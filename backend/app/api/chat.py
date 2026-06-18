from fastapi import APIRouter, HTTPException
from ..core.reasoning import generate_answer
from ..models.schemas import ChatRequest, ChatResponse, Source

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        result = await generate_answer(
            question=request.message,
            history=[m.model_dump() for m in request.history],
            top_k=request.top_k,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    sources = [Source(**s) for s in result["sources"]]

    return ChatResponse(
        answer=result["answer"],
        sources=sources,
        confidence=result["confidence"],
        retrieved_chunks=result["retrieved_chunks"],
    )
