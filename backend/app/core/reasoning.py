from typing import List, Dict, Any
import httpx
from ..config import settings
from .embeddings import embed_text
from .vector_store import search_chunks


SYSTEM_PROMPT = """You are ROSERAG — an institutional knowledge assistant for universities, research institutions, and knowledge-intensive organizations.

Your role is to provide evidence-based answers drawn exclusively from the institutional documents provided in the context below. You are NOT a general-purpose internet assistant.

Core principles:
- Answer only from the provided context. Do not fabricate or extrapolate beyond it.
- If the context is insufficient, say clearly: "The available documents do not contain enough information to answer this question."
- Be precise, academic in tone, and cite page references where possible.
- Synthesize across multiple sources when relevant.
- Distinguish between what is stated and what is inferred."""


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
) -> Dict[str, Any]:
    query_vector = await embed_text(question)
    chunks = search_chunks(query_vector, top_k=top_k)

    if not chunks:
        return {
            "answer": "No relevant documents found in the knowledge base. Please upload documents before querying.",
            "sources": [],
            "confidence": 0.0,
            "retrieved_chunks": 0,
        }

    context = build_context_block(chunks)
    history_text = build_history_block(history)

    user_message = f"""Context from institutional documents:

{context}

{"Previous conversation:" + chr(10) + history_text + chr(10) if history_text else ""}
Question: {question}

Provide a thorough, evidence-grounded answer. Reference the source documents by name and page number."""

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{settings.ollama_base_url}/api/chat",
            json={
                "model": settings.chat_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                "stream": False,
            },
        )
        response.raise_for_status()
        answer = response.json()["message"]["content"]

    sources = [
        {
            "document": c["doc_name"],
            "page": c["page"],
            "excerpt": c["text"][:300] + ("..." if len(c["text"]) > 300 else ""),
            "score": round(c["score"], 4),
        }
        for c in chunks
    ]

    return {
        "answer": answer,
        "sources": sources,
        "confidence": compute_confidence(chunks),
        "retrieved_chunks": len(chunks),
    }
