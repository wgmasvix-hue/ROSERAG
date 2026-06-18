import uuid
from typing import Dict, Any
import fitz  # PyMuPDF
from .chunking import chunk_document_pages
from .embeddings import embed_batch
from .vector_store import ensure_collection, upsert_chunks


def extract_pages(pdf_bytes: bytes) -> list[Dict[str, Any]]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():
            pages.append({"page_num": page_num + 1, "text": text})
    doc.close()
    return pages


async def ingest_document(
    filename: str, pdf_bytes: bytes
) -> Dict[str, Any]:
    doc_id = str(uuid.uuid4())

    pages = extract_pages(pdf_bytes)
    if not pages:
        raise ValueError("No extractable text found in the document.")

    chunks = chunk_document_pages(pages, doc_id=doc_id, doc_name=filename)
    if not chunks:
        raise ValueError("Document produced no chunks after processing.")

    texts = [c["text"] for c in chunks]
    embeddings = await embed_batch(texts)

    vector_size = len(embeddings[0])
    ensure_collection(vector_size=vector_size)

    upsert_chunks(chunks, embeddings)

    return {
        "document_id": doc_id,
        "filename": filename,
        "pages": len(pages),
        "chunks": len(chunks),
    }
