from typing import List, Dict, Any, Optional
from ..config import settings
from .embeddings import embed_text
from .llm_client import chat_complete
from .vector_store import search_chunks
from ..services.trust_service import compute_trust
from ..services import memory_service


SYSTEM_PROMPT = """You are ROSERAG — an institutional knowledge assistant for universities, research institutions, and knowledge-intensive organizations.

Your role is to provide evidence-based answers drawn exclusively from the institutional documents provided in the context below. You are NOT a general-purpose internet assistant.

Core principles:
- Answer only from the provided context. Do not fabricate or extrapolate beyond it.
- If the context is insufficient, say clearly: "The available documents do not contain enough information to answer this question."
- Be precise, academic in tone, and cite page references where possible.
- Synthesize across multiple sources when relevant.
- Distinguish between what is stated and what is inferred."""

FALLBACK_PROMPT = """You are ROSERAG — an institutional intelligence assistant. No documents have been uploaded to the knowledge base yet, so you are operating in general assistant mode.

Answer helpfully and accurately. When relevant, remind the user that uploading documents will enable evidence-grounded answers with source citations and trust scores."""


def build_context_block(chunks: List[Dict[str, Any]]) -> str:
    lines = []
    for i, chunk in enumerate(chunks, 1):
        lines.append(
            f"[Source {i}] {chunk['doc_name']} — Page {chunk['page']}\n{chunk['text']}"
        )
    return "\n\n---\n\n".join(lines)


def build_history_block(history: List[Dict[str, str]]) -> str:
    if not history:
        return ""
    lines = []
    for msg in history[-6:]:  # keep last 3 exchanges
        role = "User" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role}: {msg['content']}")
    return "\n".join(lines)


def compute_confidence(chunks: List[Dict[str, Any]]) -> float:
    if not chunks:
        return 0.0
    top_scores = [c["score"] for c in chunks[:3]]
    avg = sum(top_scores) / len(top_scores)
    # Cosine similarity is [-1,1] but Qdrant returns [0,1] for normalized vectors
    return round(min(max(avg, 0.0), 1.0), 3)


async def generate_answer(
    question: str,
    history: List[Dict[str, str]],
    top_k: int = 5,
    persist_history: bool = True,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    # Try RAG pipeline — degrade gracefully if Qdrant/Jina not configured
    chunks: List[Dict[str, Any]] = []
    try:
        query_vector = await embed_text(question)
        chunks = search_chunks(query_vector, top_k=top_k)
    except Exception:
        pass  # No embeddings/Qdrant → fall through to pure-LLM mode

    if not chunks:
        # Pure LLM fallback — still useful without documents
        history_text = build_history_block(history)
        msgs = [{"role": "system", "content": FALLBACK_PROMPT}]
        if history_text:
            msgs.append({"role": "user", "content": history_text})
        msgs.append({"role": "user", "content": question})
        answer = await chat_complete(msgs)
        trust = {"trust_score": 0.0, "trust_level": "LOW", "components": {}}
        if persist_history:
            try:
                memory_service.save_question(
                    question=question, answer=answer, confidence=0.0,
                    trust_score=0.0, trust_level="LOW", sources=[],
                    retrieved_chunks=0, session_id=session_id,
                )
            except Exception:
                pass
        return {"answer": answer, "sources": [], "confidence": 0.0, "trust": trust, "retrieved_chunks": 0}

    context = build_context_block(chunks)
    history_text = build_history_block(history)

    user_message = f"""Context from institutional documents:

{context}

{"Previous conversation:" + chr(10) + history_text + chr(10) if history_text else ""}
Question: {question}

Provide a thorough, evidence-grounded answer. Reference the source documents by name and page number."""

    answer = await chat_complete(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
    )

    trust = compute_trust(chunks, top_k=top_k)
    confidence = compute_confidence(chunks)

    sources = [
        {
            "document": c["doc_name"],
            "chunk_id": c.get("chunk_id", ""),
            "page": c["page"],
            "excerpt": c["text"][:300] + ("..." if len(c["text"]) > 300 else ""),
            "chunk": c["text"][:500] + ("..." if len(c["text"]) > 500 else ""),
            "score": round(c["score"], 4),
        }
        for c in chunks
    ]

    if persist_history:
        try:
            memory_service.save_question(
                question=question,
                answer=answer,
                confidence=confidence,
                trust_score=trust["trust_score"],
                trust_level=trust["trust_level"],
                sources=sources,
                retrieved_chunks=len(chunks),
                session_id=session_id,
            )
        except Exception:
            pass  # History persistence must not break the answer flow

    return {
        "answer": answer,
        "sources": sources,
        "confidence": confidence,
        "trust": trust,
        "retrieved_chunks": len(chunks),
    }
