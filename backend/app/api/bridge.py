"""DSpace Bridge API — unified academic paper discovery and import."""

import re
import urllib.parse

from fastapi import APIRouter, HTTPException

from ..config import settings
from ..core.ingestion import ingest_document
from ..models.schemas import (
    BridgePaperSchema,
    BridgeSearchRequest,
    BridgeSearchResponse,
    BridgeImportRequest,
    BridgeImportResponse,
    BridgeSourceInfo,
)
from ..services.dspace_bridge import download_paper, search_all

router = APIRouter(prefix="/bridge", tags=["Bridge"])

# All known sources with static metadata
_ALL_SOURCES = [
    BridgeSourceInfo(id="arxiv",            label="arXiv",            enabled=True,  description="Open-access preprints"),
    BridgeSourceInfo(id="openalex",         label="OpenAlex",         enabled=True,  description="Open scholarly graph"),
    BridgeSourceInfo(id="semantic_scholar", label="Semantic Scholar", enabled=True,  description="AI/CS focused index"),
    BridgeSourceInfo(id="dspace",           label="Local DSpace",     enabled=False, description="Institutional repository"),
]


@router.get("/sources", response_model=list[BridgeSourceInfo])
async def list_sources():
    """Return available search sources with enabled status."""
    sources = []
    for s in _ALL_SOURCES:
        if s.id == "dspace":
            enabled = bool(settings.dspace_url)
        else:
            enabled = True
        sources.append(BridgeSourceInfo(
            id=s.id,
            label=s.label,
            enabled=enabled,
            description=s.description,
        ))
    return sources


@router.post("/search", response_model=BridgeSearchResponse)
async def bridge_search(req: BridgeSearchRequest) -> BridgeSearchResponse:
    """Fan-out search across selected sources and return merged results."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    limit = min(max(1, req.limit), 25)

    papers, errors = await search_all(
        query=req.query,
        sources=req.sources,
        limit=limit,
        dspace_url=settings.dspace_url,
        dspace_token=settings.dspace_token,
    )

    results = [
        BridgePaperSchema(
            id=p.id,
            title=p.title,
            authors=p.authors,
            abstract=p.abstract,
            year=p.year,
            doi=p.doi,
            url=p.url,
            pdf_url=p.pdf_url,
            source=p.source,
            open_access=p.open_access,
        )
        for p in papers
    ]

    return BridgeSearchResponse(
        query=req.query,
        results=results,
        total=len(results),
        sources_searched=req.sources,
        errors=errors,
    )


@router.post("/import", response_model=BridgeImportResponse)
async def bridge_import(req: BridgeImportRequest) -> BridgeImportResponse:
    """Download a paper's PDF and ingest it into the ROSERAG knowledge base."""
    pdf_url = req.pdf_url
    if not pdf_url:
        raise HTTPException(
            status_code=422,
            detail="No PDF URL provided for this paper. Visit the paper's landing page to download manually.",
        )

    # Build a safe filename
    safe_title = re.sub(r"[^\w\s-]", "", req.title or req.paper_id)
    safe_title = re.sub(r"\s+", "_", safe_title.strip())[:80]
    filename = f"{req.source}_{safe_title}.pdf" if safe_title else f"{req.paper_id.replace(':', '_')}.pdf"

    try:
        content = await download_paper(pdf_url)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to download PDF from {pdf_url}: {exc}",
        )

    if not content:
        raise HTTPException(status_code=502, detail="Downloaded file is empty.")

    try:
        result = await ingest_document(
            filename=filename,
            content=content,
            agent_tag=f"bridge:{req.source}",
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}")

    return BridgeImportResponse(
        paper_id=req.paper_id,
        document_id=result["document_id"],
        filename=result["filename"],
        pages=result["pages"],
        chunks=result["chunks"],
        message=(
            f"Successfully imported '{req.title or filename}' — "
            f"{result['pages']} page(s), {result['chunks']} chunks added to knowledge base."
        ),
    )
