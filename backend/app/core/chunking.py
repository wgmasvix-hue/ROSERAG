from typing import List, Dict, Any
from ..config import settings


def chunk_text(
    text: str,
    doc_id: str,
    doc_name: str,
    page: int,
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> List[Dict[str, Any]]:
    chunk_size = chunk_size or settings.chunk_size
    chunk_overlap = chunk_overlap or settings.chunk_overlap

    text = text.strip()
    if not text:
        return []

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(text):
        end = start + chunk_size

        # Try to break at a sentence boundary
        if end < len(text):
            break_pos = text.rfind(". ", start, end)
            if break_pos == -1:
                break_pos = text.rfind("\n", start, end)
            if break_pos != -1 and break_pos > start + chunk_size // 2:
                end = break_pos + 1

        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append(
                {
                    "text": chunk_text,
                    "doc_id": doc_id,
                    "doc_name": doc_name,
                    "page": page,
                    "chunk_index": chunk_index,
                    "char_start": start,
                    "char_end": min(end, len(text)),
                }
            )
            chunk_index += 1

        start = end - chunk_overlap
        if start >= len(text):
            break

    return chunks


def chunk_document_pages(
    pages: List[Dict[str, Any]], doc_id: str, doc_name: str
) -> List[Dict[str, Any]]:
    all_chunks = []
    for page_data in pages:
        page_chunks = chunk_text(
            text=page_data["text"],
            doc_id=doc_id,
            doc_name=doc_name,
            page=page_data["page_num"],
        )
        all_chunks.extend(page_chunks)
    return all_chunks
