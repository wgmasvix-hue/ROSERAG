"""
DSpace Management API.

Endpoints for connecting, browsing, and syncing a DSpace 7.x institutional repository.
All endpoints require DSPACE_URL to be configured in the environment.
"""

import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..config import settings
from ..connectors.dspace import DSpaceConnector
from ..core.ingestion import ingest_document

log = logging.getLogger(__name__)
router = APIRouter(prefix="/dspace", tags=["DSpace"])

# ── In-memory sync state (resets on restart) ──────────────────────────────────
_sync: dict = {"running": False, "total": 0, "done": 0, "errors": 0, "last_error": ""}


def _connector() -> DSpaceConnector:
    if not settings.dspace_url:
        raise HTTPException(400, detail="DSPACE_URL is not configured. Set it in your .env file.")
    return DSpaceConnector(
        base_url=settings.dspace_url,
        email=getattr(settings, "dspace_email", ""),
        password=getattr(settings, "dspace_password", ""),
        token=settings.dspace_token,
    )


# ── Status ────────────────────────────────────────────────────────────────────

@router.get("/status")
async def dspace_status():
    """
    Test DSpace connectivity and return site information.
    Safe to call without auth — returns configured: false when DSPACE_URL is unset.
    """
    if not settings.dspace_url:
        return {"configured": False, "connected": False, "url": ""}

    c = _connector()
    try:
        ok = await c.test_connection()
        if not ok:
            return {
                "configured": True,
                "connected": False,
                "url": settings.dspace_url,
                "message": "Cannot reach DSpace REST API — check URL and credentials",
            }
        site = await c.get_site_info()
        return {
            "configured": True,
            "connected": True,
            "url": settings.dspace_url,
            "site": site,
        }
    except Exception as exc:
        log.warning("DSpace status check failed: %s", exc)
        return {
            "configured": True,
            "connected": False,
            "url": settings.dspace_url,
            "message": str(exc),
        }


# ── Collections ───────────────────────────────────────────────────────────────

@router.get("/collections")
async def list_collections():
    """List all collections in the configured DSpace instance."""
    c = _connector()
    try:
        collections = await c.list_collections()
        return {"collections": collections, "total": len(collections)}
    except Exception as exc:
        raise HTTPException(502, detail=f"Failed to list DSpace collections: {exc}")


# ── Items ─────────────────────────────────────────────────────────────────────

@router.get("/items")
async def browse_items(query: str = "", page: int = 0, size: int = 20):
    """
    Search or browse DSpace items.
    - With ?query=... calls the Discovery search API.
    - Without query, pages through all items (slow on large repositories).
    """
    size = min(size, 50)
    c = _connector()
    try:
        if query:
            docs = await c.search(query, limit=size)
        else:
            docs = []
            async for doc in c.sync():
                docs.append(doc)
                if len(docs) >= size:
                    break
        return {
            "items": [
                {
                    "uuid": d.external_id,
                    "title": d.title,
                    "authors": d.authors,
                    "abstract": d.abstract[:300] + "…" if len(d.abstract) > 300 else d.abstract,
                    "year": d.year,
                    "doi": d.doi,
                    "url": d.url,
                    "has_pdf": bool(d.pdf_url),
                }
                for d in docs
            ],
            "total": len(docs),
            "query": query,
        }
    except Exception as exc:
        raise HTTPException(502, detail=f"DSpace item browse failed: {exc}")


# ── Single item ingest ────────────────────────────────────────────────────────

@router.post("/ingest/{item_uuid}")
async def ingest_item(item_uuid: str):
    """
    Download and ingest a single DSpace item by UUID into the ROSERAG knowledge base.
    Resolves bitstreams, downloads the primary PDF, and runs chunking + embedding.
    """
    c = _connector()
    try:
        doc = await c.ingest(item_uuid)
    except Exception as exc:
        raise HTTPException(502, detail=f"DSpace fetch failed: {exc}")

    if not doc:
        raise HTTPException(404, detail=f"DSpace item {item_uuid} not found")
    if not doc.content_bytes:
        raise HTTPException(
            422,
            detail=(
                f"No downloadable PDF found for item '{doc.title}'. "
                f"pdf_url={doc.pdf_url!r}. "
                "The item may not have an attached file, or it may require authentication."
            ),
        )

    try:
        result = await ingest_document(
            filename=doc.filename or f"{item_uuid}.pdf",
            content=doc.content_bytes,
            agent_tag="dspace:connector",
        )
    except ValueError as exc:
        raise HTTPException(422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(500, detail=f"Ingestion pipeline failed: {exc}")

    return {
        "uuid": item_uuid,
        "title": doc.title,
        "document_id": result.get("document_id", ""),
        "pages": result.get("pages", 0),
        "chunks": result.get("chunks", 0),
        "message": (
            f"Ingested '{doc.title}' — "
            f"{result.get('pages', 0)} page(s), {result.get('chunks', 0)} chunks added."
        ),
    }


# ── Background sync ───────────────────────────────────────────────────────────

@router.post("/sync")
async def start_sync(background_tasks: BackgroundTasks):
    """
    Start a background full sync: page through all DSpace items,
    download available PDFs, and ingest into Qdrant.
    """
    if _sync["running"]:
        return {"message": "Sync already running", "state": _sync}
    background_tasks.add_task(_run_sync)
    _sync.update({"running": True, "total": 0, "done": 0, "errors": 0, "last_error": ""})
    return {"message": "DSpace sync started", "state": _sync}


@router.get("/sync/status")
async def get_sync_status():
    """Return the current sync progress."""
    return _sync


async def _run_sync():
    global _sync
    _sync = {"running": True, "total": 0, "done": 0, "errors": 0, "last_error": ""}
    try:
        c = _connector()
        async for doc in c.sync():
            _sync["total"] += 1
            if not doc.pdf_url:
                continue  # no content to ingest for this item
            # Download the PDF
            import httpx
            try:
                async with httpx.AsyncClient(verify=False, timeout=120) as client:
                    resp = await client.get(
                        doc.pdf_url,
                        headers={"Authorization": f"Bearer {c._token}"} if c._token else {},
                        follow_redirects=True,
                    )
                    if resp.status_code != 200:
                        _sync["errors"] += 1
                        continue
                    content = resp.content
            except Exception as exc:
                _sync["errors"] += 1
                _sync["last_error"] = f"Download: {exc}"
                continue

            try:
                safe = doc.title[:60].replace("/", "_")
                await ingest_document(
                    filename=doc.filename or f"{safe}.pdf",
                    content=content,
                    agent_tag="dspace:sync",
                )
                _sync["done"] += 1
            except Exception as exc:
                _sync["errors"] += 1
                _sync["last_error"] = f"Ingest: {exc}"
    except Exception as exc:
        _sync["last_error"] = str(exc)
        log.error("DSpace sync crashed: %s", exc)
    finally:
        _sync["running"] = False
        log.info(
            "DSpace sync complete: %d total, %d done, %d errors",
            _sync["total"], _sync["done"], _sync["errors"],
        )
