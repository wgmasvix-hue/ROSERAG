import csv
import io
import json
import uuid
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, Any

from .chunking import chunk_document_pages
from .embeddings import embed_batch
from .vector_store import ensure_collection, upsert_chunks
from ..services import memory_service
from ..services.graph_service import get_graph, extract_entities

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx", ".csv", ".json", ".html", ".htm"}

# Text files are split into virtual "pages" of this many characters
_TEXT_PAGE_SIZE = 3000


# ── Per-format extractors ─────────────────────────────────────────────────────

def _pages_pdf(content: bytes) -> list[Dict[str, Any]]:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ValueError("PyMuPDF is required for PDF files. Install with: pip install pymupdf")
    doc = fitz.open(stream=content, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        if text.strip():
            pages.append({"page_num": i + 1, "text": text})
    doc.close()
    return pages


def _pages_text(content: bytes) -> list[Dict[str, Any]]:
    text = content.decode("utf-8", errors="replace")
    parts = [
        text[i : i + _TEXT_PAGE_SIZE]
        for i in range(0, len(text), _TEXT_PAGE_SIZE)
    ]
    return [{"page_num": i + 1, "text": p} for i, p in enumerate(parts) if p.strip()]


def _pages_docx(content: bytes) -> list[Dict[str, Any]]:
    try:
        from docx import Document  # python-docx
    except ImportError:
        raise ValueError(
            "python-docx is required for .docx files. "
            "Install it with: pip install python-docx"
        )
    doc = Document(io.BytesIO(content))
    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return _pages_text(text.encode())


def _pages_csv(content: bytes) -> list[Dict[str, Any]]:
    text = content.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text))
    rows = [", ".join(row) for row in reader if any(cell.strip() for cell in row)]
    return _pages_text("\n".join(rows).encode())


def _pages_json(content: bytes) -> list[Dict[str, Any]]:
    try:
        data = json.loads(content.decode("utf-8", errors="replace"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON: {exc}")
    text = json.dumps(data, indent=2, ensure_ascii=False)
    return _pages_text(text.encode())


def _pages_html(content: bytes) -> list[Dict[str, Any]]:
    class _Extractor(HTMLParser):
        def __init__(self):
            super().__init__()
            self._skip = False
            self.parts: list[str] = []

        def handle_starttag(self, tag, attrs):
            if tag in ("script", "style", "head"):
                self._skip = True

        def handle_endtag(self, tag):
            if tag in ("script", "style", "head"):
                self._skip = False

        def handle_data(self, data):
            if not self._skip and data.strip():
                self.parts.append(data.strip())

    parser = _Extractor()
    parser.feed(content.decode("utf-8", errors="replace"))
    text = "\n".join(parser.parts)
    return _pages_text(text.encode())


_EXTRACTORS = {
    ".pdf":  _pages_pdf,
    ".txt":  _pages_text,
    ".md":   _pages_text,
    ".docx": _pages_docx,
    ".csv":  _pages_csv,
    ".json": _pages_json,
    ".html": _pages_html,
    ".htm":  _pages_html,
}


def extract_pages(filename: str, content: bytes) -> list[Dict[str, Any]]:
    ext = Path(filename).suffix.lower()
    extractor = _EXTRACTORS.get(ext)
    if not extractor:
        raise ValueError(
            f"Unsupported file type '{ext}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )
    return extractor(content)


# ── Main ingestion pipeline ───────────────────────────────────────────────────

async def ingest_document(
    filename: str, content: bytes, agent_tag: str = ""
) -> Dict[str, Any]:
    doc_id = str(uuid.uuid4())

    pages = extract_pages(filename, content)
    if not pages:
        raise ValueError("No extractable text found in the document.")

    chunks = chunk_document_pages(pages, doc_id=doc_id, doc_name=filename)
    if not chunks:
        raise ValueError("Document produced no chunks after processing.")

    texts = [c["text"] for c in chunks]
    embeddings = await embed_batch(texts)

    ensure_collection(vector_size=len(embeddings[0]))
    upsert_chunks(chunks, embeddings, agent_tag=agent_tag)

    memory_service.save_document(
        doc_id=doc_id,
        filename=filename,
        pages=len(pages),
        chunks=len(chunks),
        agent_tag=agent_tag,
    )

    graph = get_graph()
    for chunk in chunks:
        entities = extract_entities(text=chunk["text"], doc_id=doc_id, doc_name=filename)
        if entities:
            graph.add_entities(entities)

    return {
        "document_id": doc_id,
        "filename": filename,
        "pages": len(pages),
        "chunks": len(chunks),
        "agent_tag": agent_tag,
    }
