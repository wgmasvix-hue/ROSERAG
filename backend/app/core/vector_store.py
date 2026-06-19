import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    FilterSelector,
)
from ..config import settings

_client: Optional[QdrantClient] = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        if settings.qdrant_use_https or settings.qdrant_api_key:
            # Qdrant Cloud: connect via HTTPS with API key
            _client = QdrantClient(
                url=f"https://{settings.qdrant_host}:{settings.qdrant_port}",
                api_key=settings.qdrant_api_key or None,
            )
        else:
            # Local Qdrant: plain HTTP
            _client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
    return _client


def ensure_collection(vector_size: int = 768) -> None:
    client = get_client()
    existing = [c.name for c in client.get_collections().collections]
    if settings.collection_name not in existing:
        client.create_collection(
            collection_name=settings.collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )


def upsert_chunks(
    chunks: List[Dict[str, Any]],
    embeddings: List[List[float]],
    agent_tag: str = "",
) -> int:
    client = get_client()
    points = []
    for chunk, vector in zip(chunks, embeddings):
        point_id = str(uuid.uuid4())
        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "chunk_id": point_id,
                    "text": chunk["text"],
                    "doc_id": chunk["doc_id"],
                    "doc_name": chunk["doc_name"],
                    "page": chunk["page"],
                    "chunk_index": chunk["chunk_index"],
                    "agent_tag": agent_tag,
                },
            )
        )
    client.upsert(collection_name=settings.collection_name, points=points)
    return len(points)


def search_chunks(
    query_vector: List[float],
    top_k: int = 5,
    doc_id_filter: Optional[str] = None,
    agent_tag_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    client = get_client()

    must_conditions = []
    if doc_id_filter:
        must_conditions.append(FieldCondition(key="doc_id", match=MatchValue(value=doc_id_filter)))

    search_filter = None
    if agent_tag_filter:
        # Return chunks belonging to this agent OR global (empty agent_tag)
        search_filter = Filter(
            should=[
                FieldCondition(key="agent_tag", match=MatchValue(value=agent_tag_filter)),
                FieldCondition(key="agent_tag", match=MatchValue(value="")),
            ],
            must=must_conditions if must_conditions else None,
        )
    elif must_conditions:
        search_filter = Filter(must=must_conditions)

    results = client.search(
        collection_name=settings.collection_name,
        query_vector=query_vector,
        limit=top_k,
        query_filter=search_filter,
        with_payload=True,
    )

    return [
        {
            "chunk_id": r.payload.get("chunk_id", str(r.id)),
            "text": r.payload["text"],
            "doc_id": r.payload["doc_id"],
            "doc_name": r.payload["doc_name"],
            "page": r.payload["page"],
            "chunk_index": r.payload["chunk_index"],
            "agent_tag": r.payload.get("agent_tag", ""),
            "score": r.score,
        }
        for r in results
    ]


def get_chunk_by_id(chunk_id: str) -> Optional[Dict[str, Any]]:
    client = get_client()
    results = client.retrieve(
        collection_name=settings.collection_name,
        ids=[chunk_id],
        with_payload=True,
    )
    if not results:
        return None
    r = results[0]
    return {
        "chunk_id": r.payload.get("chunk_id", str(r.id)),
        "text": r.payload["text"],
        "doc_id": r.payload["doc_id"],
        "doc_name": r.payload["doc_name"],
        "page": r.payload["page"],
        "chunk_index": r.payload["chunk_index"],
    }


def delete_document_chunks(doc_id: str) -> int:
    client = get_client()
    result = client.delete(
        collection_name=settings.collection_name,
        points_selector=FilterSelector(
            filter=Filter(
                must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
            )
        ),
    )
    return result.status


def list_unique_documents() -> List[Dict[str, Any]]:
    client = get_client()
    seen_docs = {}
    offset = None

    while True:
        records, next_offset = client.scroll(
            collection_name=settings.collection_name,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        for record in records:
            doc_id = record.payload.get("doc_id")
            if doc_id and doc_id not in seen_docs:
                seen_docs[doc_id] = {
                    "doc_id": doc_id,
                    "doc_name": record.payload.get("doc_name", "Unknown"),
                    "chunk_count": 0,
                    "max_page": 0,
                }
            if doc_id:
                seen_docs[doc_id]["chunk_count"] += 1
                seen_docs[doc_id]["max_page"] = max(
                    seen_docs[doc_id]["max_page"], record.payload.get("page", 0)
                )

        if next_offset is None:
            break
        offset = next_offset

    return list(seen_docs.values())
