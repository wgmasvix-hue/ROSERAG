"""
Phase 8 — /api/copilot

Institutional Copilot: specialized agents apply domain-specific reasoning
personas on top of the core RAG pipeline. Each agent serves a different
institutional role (research, librarian, policy, compliance, executive).
"""

from fastapi import APIRouter, HTTPException
from ..core.embeddings import embed_text
from ..core.vector_store import search_chunks
from ..services.trust_service import compute_trust
from ..services.copilot.agents import get_agent, AGENT_REGISTRY
from ..services.copilot.base import AgentType
from ..models.schemas import CopilotRequest, CopilotResponse, SourceWithChunkId, TrustResult

router = APIRouter(prefix="/copilot", tags=["Copilot"])


@router.post("/query", response_model=CopilotResponse)
async def copilot_query(request: CopilotRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    agent_type = AgentType(request.agent.value)
    agent = get_agent(agent_type)

    try:
        query_vector = await embed_text(request.question)
        chunks = search_chunks(query_vector, top_k=request.top_k, agent_tag_filter=agent_type.value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="No relevant documents found. Upload documents before querying.",
        )

    try:
        result = await agent.run(query=request.question, chunks=chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent failed: {str(e)}")

    trust = compute_trust(chunks, top_k=request.top_k)

    sources = [
        SourceWithChunkId(
            document=c["doc_name"],
            chunk_id=c.get("chunk_id", ""),
            chunk=c["text"][:500] + ("..." if len(c["text"]) > 500 else ""),
            page=c["page"],
            score=round(c["score"], 4),
        )
        for c in chunks
    ]

    return CopilotResponse(
        question=request.question,
        agent=agent_type.value,
        agent_description=agent.description,
        answer=result["answer"],
        reasoning_notes=result.get("reasoning_notes", ""),
        trust=TrustResult(**trust),
        sources=sources,
    )


@router.get("/agents")
async def list_agents():
    return {
        "agents": [
            {
                "type": agent.agent_type.value,
                "description": agent.description,
            }
            for agent in AGENT_REGISTRY.values()
        ]
    }
