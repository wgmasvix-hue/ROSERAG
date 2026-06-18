"""
Phase 4 — /api/graph

Knowledge graph: entities (people, organizations, topics, locations)
and their co-occurrence relationships extracted from institutional documents.

Designed for future Neo4j migration — nodes and edges follow Neo4j conventions.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..services.graph_service import get_graph
from ..models.schemas import GraphResponse, GraphNode, GraphEdge

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])


@router.get("", response_model=GraphResponse)
async def get_knowledge_graph(
    entity_type: Optional[str] = Query(default=None, description="Filter by: PERSON, ORGANIZATION, TOPIC, LOCATION"),
    min_frequency: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
):
    try:
        graph = get_graph()
        nodes = graph.get_nodes(entity_type=entity_type, min_frequency=min_frequency, limit=limit)
        edges = graph.get_edges()
        stats = graph.stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph unavailable: {str(e)}")

    return GraphResponse(
        nodes=[GraphNode(**n) for n in nodes],
        edges=[GraphEdge(**e) for e in edges],
        stats=stats,
    )


@router.get("/topics")
async def get_topics(limit: int = Query(default=20, ge=1, le=100)):
    try:
        topics = get_graph().get_topics(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topics unavailable: {str(e)}")
    return {"topics": topics}
