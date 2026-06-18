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


def upsert_chunks(chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> int:
    client = get_client()
    points = []
    for chunk, vector in zip(chunks, embeddings):
        point_id = str(uuid.uuid4())
        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "text": chunk["text"],
                    "doc_id": chunk["doc_id"],
                    "doc_name": chunk["doc_name"],
                    "page": chunk["page"],
                    "chunk_index": chunk["chunk_index"],
                },
            )
        )
    client.upsert(collection_name=settings.collection_name, points=points)
    return len(points)


def search_chunks(
    query_vector: List[float],
    top_k: int = 5,
    doc_id_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    client = get_client()

    search_filter = None
    if doc_id_filter:
        search_filter = Filter(
            must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id_filter))]
        )

    results = client.search(
        collection_name=settings.collection_name,
        query_vector=query_vector,
        limit=top_k,
        query_filter=search_filter,
        with_payload=True,
    )

    return [
        {
            "text": r.payload["text"],
            "doc_id": r.payload["doc_id"],
            "doc_name": r.payload["doc_name"],
            "page": r.payload["page"],
            "chunk_index": r.payload["chunk_index"],
            "score": r.score,
        }
        for r in results
    ]


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
