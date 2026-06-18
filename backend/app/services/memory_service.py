"""
Institutional Memory — persists documents and Q&A history in SQLite.
Uses stdlib sqlite3 only (zero added dependencies).
"""

import sqlite3
import json
import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from ..config import settings

_DB_PATH: Optional[str] = None


def _db_path() -> str:
    global _DB_PATH
    if _DB_PATH is None:
        os.makedirs(settings.data_dir, exist_ok=True)
        _DB_PATH = os.path.join(settings.data_dir, "roserag.db")
    return _DB_PATH


def init_db() -> None:
    conn = sqlite3.connect(_db_path())
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            doc_id      TEXT PRIMARY KEY,
            filename    TEXT NOT NULL,
            pages       INTEGER NOT NULL DEFAULT 0,
            chunks      INTEGER NOT NULL DEFAULT 0,
            ingested_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            question        TEXT NOT NULL,
            answer          TEXT NOT NULL,
            confidence      REAL,
            trust_score     REAL,
            trust_level     TEXT,
            sources_json    TEXT,
            retrieved_chunks INTEGER,
            session_id      TEXT,
            asked_at        TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


# ---- Document metadata ----

def save_document(doc_id: str, filename: str, pages: int, chunks: int) -> None:
    ingested_at = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(_db_path())
    conn.execute(
        """
        INSERT OR REPLACE INTO documents (doc_id, filename, pages, chunks, ingested_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (doc_id, filename, pages, chunks, ingested_at),
    )
    conn.commit()
    conn.close()


def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(_db_path())
    row = conn.execute(
        "SELECT doc_id, filename, pages, chunks, ingested_at FROM documents WHERE doc_id = ?",
        (doc_id,),
    ).fetchone()
    conn.close()
    if not row:
        return None
    return dict(zip(["doc_id", "filename", "pages", "chunks", "ingested_at"], row))


def list_documents() -> List[Dict[str, Any]]:
    conn = sqlite3.connect(_db_path())
    rows = conn.execute(
        "SELECT doc_id, filename, pages, chunks, ingested_at FROM documents ORDER BY ingested_at DESC"
    ).fetchall()
    conn.close()
    return [dict(zip(["doc_id", "filename", "pages", "chunks", "ingested_at"], r)) for r in rows]


def delete_document(doc_id: str) -> None:
    conn = sqlite3.connect(_db_path())
    conn.execute("DELETE FROM documents WHERE doc_id = ?", (doc_id,))
    conn.commit()
    conn.close()


# ---- Question history ----

def save_question(
    question: str,
    answer: str,
    confidence: float,
    trust_score: float,
    trust_level: str,
    sources: List[Dict[str, Any]],
    retrieved_chunks: int,
    session_id: Optional[str] = None,
) -> int:
    asked_at = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(_db_path())
    cur = conn.execute(
        """
        INSERT INTO questions
            (question, answer, confidence, trust_score, trust_level,
             sources_json, retrieved_chunks, session_id, asked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            question,
            answer,
            confidence,
            trust_score,
            trust_level,
            json.dumps(sources),
            retrieved_chunks,
            session_id,
            asked_at,
        ),
    )
    conn.commit()
    row_id = cur.lastrowid
    conn.close()
    return row_id


def list_questions(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(_db_path())
    rows = conn.execute(
        """
        SELECT id, question, answer, confidence, trust_score, trust_level,
               sources_json, retrieved_chunks, session_id, asked_at
        FROM questions
        ORDER BY asked_at DESC
        LIMIT ? OFFSET ?
        """,
        (limit, offset),
    ).fetchall()
    conn.close()
    cols = [
        "id", "question", "answer", "confidence", "trust_score", "trust_level",
        "sources_json", "retrieved_chunks", "session_id", "asked_at",
    ]
    results = []
    for row in rows:
        entry = dict(zip(cols, row))
        entry["sources"] = json.loads(entry.pop("sources_json") or "[]")
        results.append(entry)
    return results


def count_questions() -> int:
    conn = sqlite3.connect(_db_path())
    count = conn.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
    conn.close()
    return count
