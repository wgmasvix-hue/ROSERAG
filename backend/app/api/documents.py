from fastapi import APIRouter, UploadFile, File, HTTPException
from ..core.ingestion import ingest_document
from ..core.vector_store import list_unique_documents, delete_document_chunks
from ..services import memory_service
from ..services.graph_service import get_graph
from ..models.schemas import IngestResponse, DocumentListResponse, DocumentMetadata, DeleteResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=IngestResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(pdf_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 50MB limit.")

    try:
        result = await ingest_document(filename=file.filename, pdf_bytes=pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    return IngestResponse(
        document_id=result["document_id"],
        filename=result["filename"],
        pages=result["pages"],
        chunks=result["chunks"],
        message=f"Successfully ingested {result['pages']} pages into {result['chunks']} chunks.",
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents():
    # Prefer persistent metadata (accurate ingested_at); fall back to Qdrant scroll
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

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


@router.delete("/{document_id}", response_model=DeleteResponse)
async def delete_document(document_id: str):
    try:
        delete_document_chunks(doc_id=document_id)
        memory_service.delete_document(doc_id=document_id)
        get_graph().clear_document(doc_id=document_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

    return DeleteResponse(
        document_id=document_id,
        message="Document and all associated chunks removed from the knowledge base.",
    )
