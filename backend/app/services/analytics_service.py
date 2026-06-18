"""
Research Analytics — aggregates institutional intelligence metrics.
"""

from typing import Dict, Any, List
from . import memory_service
from .graph_service import get_graph
from ..core.vector_store import get_client
from ..config import settings


def get_analytics() -> Dict[str, Any]:
    graph = get_graph()

    # Document and chunk counts from Qdrant (source of truth)
    try:
        client = get_client()
        collection_info = client.get_collection(settings.collection_name)
        total_chunks = collection_info.points_count
    except Exception:
        total_chunks = 0

    db_docs = memory_service.list_documents()
    total_docs = len(db_docs)
    total_questions = memory_service.count_questions()

    recent_questions = memory_service.list_questions(limit=100)
    avg_confidence = 0.0
    avg_trust = 0.0
    if recent_questions:
        avg_confidence = round(
            sum(q.get("confidence", 0) for q in recent_questions) / len(recent_questions), 3
        )
        avg_trust = round(
            sum(q.get("trust_score", 0) for q in recent_questions) / len(recent_questions), 3
        )

    top_topics = graph.get_topics(limit=15)
    entity_stats = graph.stats()

    return {
        "documents": total_docs,
        "chunks": total_chunks,
        "questions": total_questions,
        "avg_confidence": avg_confidence,
        "avg_trust_score": avg_trust,
        "topics": top_topics,
        "entities": entity_stats,
        "knowledge_graph": {
            "nodes": len(graph.get_nodes()),
            "edges": len(graph.get_edges()),
        },
    }
