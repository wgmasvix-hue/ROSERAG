import asyncio
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from ..core.ingestion import ingest_document, SUPPORTED_EXTENSIONS
from ..core.vector_store import list_unique_documents, delete_document_chunks
from ..services import memory_service
from ..services.graph_service import get_graph
from ..models.schemas import (
    IngestResponse, DocumentListResponse, DocumentMetadata, DeleteResponse,
    IngestPathRequest, IngestPathResponse, IngestPathResult,
)

router = APIRouter(prefix="/documents", tags=["Documents"])

_MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB


# ── Upload (browser) ──────────────────────────────────────────────────────────

@router.post("/upload", response_model=IngestResponse)
async def upload_document(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ),
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit.")

    try:
        result = await ingest_document(filename=file.filename, content=content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}")

    return IngestResponse(
        document_id=result["document_id"],
        filename=result["filename"],
        pages=result["pages"],
        chunks=result["chunks"],
        message=(
            f"Successfully ingested {result['pages']} pages "
            f"into {result['chunks']} chunks."
        ),
    )


# ── Ingest from local path (CLI / server-side) ────────────────────────────────

@router.post("/ingest-path", response_model=IngestPathResponse)
async def ingest_local_path(req: IngestPathRequest):
    """Ingest a local file or directory from the server's filesystem."""
    target = Path(req.path).expanduser().resolve()

    if not target.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {target}")

    if target.is_file():
        candidates = [target]
    elif target.is_dir():
        glob = "**/*" if req.recursive else "*"
        candidates = [
            p for p in target.glob(glob)
            if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
        ]
        if not candidates:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"No supported files found under {target}. "
                    f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
                ),
            )
    else:
        raise HTTPException(status_code=400, detail="Path must be a file or directory.")

    ingested: list[IngestPathResult] = []
    errors: list[dict] = []

    # Process sequentially so embeddings don't race; still async-friendly
    for file_path in sorted(candidates):
        try:
            content = file_path.read_bytes()
            result = await ingest_document(filename=file_path.name, content=content)
            ingested.append(
                IngestPathResult(
                    document_id=result["document_id"],
                    filename=result["filename"],
                    path=str(file_path),
                    pages=result["pages"],
                    chunks=result["chunks"],
                )
            )
        except Exception as exc:
            errors.append({"file": str(file_path), "error": str(exc)})

    return IngestPathResponse(ingested=ingested, errors=errors, total=len(ingested))


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=DocumentListResponse)
async def list_documents():
    try:
        db_docs = memory_service.list_documents()
        if db_docs:
            metadata = [
                DocumentMetadata(
                    id=d["doc_id"],
                    filename=d["filename"],
                    pages=d["pages"],
                    chunks=d["chunks"],
                    ingested_at=d["ingested_at"],
                )
                for d in db_docs
            ]
            return DocumentListResponse(documents=metadata, total=len(metadata))
    except Exception:
        pass

    try:
        docs = list_unique_documents()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {exc}")

    metadata = [
        DocumentMetadata(
            id=d["doc_id"],
            filename=d["doc_name"],
            pages=d["max_page"],
            chunks=d["chunk_count"],
            ingested_at=datetime.now(timezone.utc).isoformat(),
        )
        for d in docs
    ]
    return DocumentListResponse(documents=metadata, total=len(metadata))


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{document_id}", response_model=DeleteResponse)
async def delete_document(document_id: str):
    try:
        delete_document_chunks(doc_id=document_id)
        memory_service.delete_document(doc_id=document_id)
        get_graph().clear_document(doc_id=document_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {exc}")

    return DeleteResponse(
        document_id=document_id,
        message="Document and all associated chunks removed from the knowledge base.",
    )
