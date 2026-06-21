"""
Collections API — group documents into named, colored collections.
Uses SQLite via memory_service for persistence.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid, json, datetime
from ..services import memory_service

router = APIRouter(prefix="/collections", tags=["Collections"])


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "rose"
    tags: Optional[List[str]] = None


class CollectionAddDoc(BaseModel):
    document_id: str


def _collections_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT DEFAULT 'rose',
            tags TEXT DEFAULT '[]',
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS collection_docs (
            collection_id TEXT NOT NULL,
            document_id TEXT NOT NULL,
            added_at TEXT NOT NULL,
            PRIMARY KEY (collection_id, document_id)
        )
    """)
    conn.commit()


@router.get("")
async def list_collections():
    conn = memory_service.get_connection()
    _collections_table(conn)
    rows = conn.execute("SELECT * FROM collections ORDER BY created_at DESC").fetchall()
    result = []
    for row in rows:
        cid = row["id"]
        doc_count = conn.execute(
            "SELECT COUNT(*) FROM collection_docs WHERE collection_id=?", (cid,)
        ).fetchone()[0]
        result.append({
            "id": cid,
            "name": row["name"],
            "description": row["description"],
            "color": row["color"],
            "tags": json.loads(row["tags"] or "[]"),
            "documentCount": doc_count,
            "createdAt": row["created_at"],
        })
    return result


@router.post("")
async def create_collection(body: CollectionCreate):
    conn = memory_service.get_connection()
    _collections_table(conn)
    cid = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO collections (id, name, description, color, tags, created_at) VALUES (?,?,?,?,?,?)",
        (cid, body.name, body.description, body.color, json.dumps(body.tags or []), now),
    )
    conn.commit()
    return {"id": cid, "name": body.name, "description": body.description, "color": body.color,
            "tags": body.tags or [], "documentCount": 0, "createdAt": now}


@router.get("/{collection_id}")
async def get_collection(collection_id: str):
    conn = memory_service.get_connection()
    _collections_table(conn)
    row = conn.execute("SELECT * FROM collections WHERE id=?", (collection_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Collection not found")
    doc_rows = conn.execute(
        "SELECT document_id, added_at FROM collection_docs WHERE collection_id=? ORDER BY added_at DESC",
        (collection_id,),
    ).fetchall()
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "color": row["color"],
        "tags": json.loads(row["tags"] or "[]"),
        "documents": [{"id": r["document_id"], "addedAt": r["added_at"]} for r in doc_rows],
        "createdAt": row["created_at"],
    }


@router.post("/{collection_id}/documents")
async def add_document(collection_id: str, body: CollectionAddDoc):
    conn = memory_service.get_connection()
    _collections_table(conn)
    if not conn.execute("SELECT 1 FROM collections WHERE id=?", (collection_id,)).fetchone():
        raise HTTPException(status_code=404, detail="Collection not found")
    now = datetime.datetime.utcnow().isoformat()
    conn.execute(
        "INSERT OR IGNORE INTO collection_docs (collection_id, document_id, added_at) VALUES (?,?,?)",
        (collection_id, body.document_id, now),
    )
    conn.commit()
    return {"status": "added"}


@router.delete("/{collection_id}/documents/{document_id}")
async def remove_document(collection_id: str, document_id: str):
    conn = memory_service.get_connection()
    _collections_table(conn)
    conn.execute(
        "DELETE FROM collection_docs WHERE collection_id=? AND document_id=?",
        (collection_id, document_id),
    )
    conn.commit()
    return {"status": "removed"}


@router.delete("/{collection_id}")
async def delete_collection(collection_id: str):
    conn = memory_service.get_connection()
    _collections_table(conn)
    conn.execute("DELETE FROM collection_docs WHERE collection_id=?", (collection_id,))
    conn.execute("DELETE FROM collections WHERE id=?", (collection_id,))
    conn.commit()
    return {"status": "deleted"}
