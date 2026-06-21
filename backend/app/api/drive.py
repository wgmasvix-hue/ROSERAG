"""Google Drive integration — OAuth2 + file browser + sync into ROSERAG."""

import json
import time
from typing import List
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from ..config import settings
from ..services import memory_service
from ..core.ingestion import ingest_document

router = APIRouter(prefix="/api/drive", tags=["drive"])

_AUTH_URI  = "https://accounts.google.com/o/oauth2/v2/auth"
_TOKEN_URI = "https://oauth2.googleapis.com/token"
_FILES_URI = "https://www.googleapis.com/drive/v3/files"
_SCOPE     = "https://www.googleapis.com/auth/drive.readonly"

_EXPORTABLE = {
    "application/vnd.google-apps.document":     ("text/plain",  ".txt"),
    "application/vnd.google-apps.spreadsheet":  ("text/csv",    ".csv"),
}
_SUPPORTED_MIME = {
    "application/pdf",
    "text/plain", "text/markdown", "text/csv",
    "application/json", "text/html",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    *_EXPORTABLE.keys(),
}


def _redirect_uri() -> str:
    return (settings.app_url or "").rstrip("/") + "/api/drive/callback"


async def _valid_token() -> str:
    tok = memory_service.get_drive_token()
    if not tok:
        raise HTTPException(401, "Not connected to Google Drive. Visit /api/drive/auth first.")
    if time.time() >= tok.get("expires_at", 0) - 60:
        async with httpx.AsyncClient() as c:
            r = await c.post(_TOKEN_URI, data={
                "client_id":     settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": tok["refresh_token"],
                "grant_type":    "refresh_token",
            })
            r.raise_for_status()
            fresh = r.json()
        fresh["refresh_token"] = tok["refresh_token"]
        fresh["expires_at"]    = time.time() + fresh.get("expires_in", 3600)
        memory_service.save_drive_token(fresh)
        tok = fresh
    return tok["access_token"]


# ── OAuth ──────────────────────────────────────────────────────────────────────

@router.get("/auth")
async def drive_auth():
    if not settings.google_client_id:
        raise HTTPException(503, "GOOGLE_CLIENT_ID is not configured. Add it in Vercel environment variables.")
    params = {
        "client_id":     settings.google_client_id,
        "redirect_uri":  _redirect_uri(),
        "response_type": "code",
        "scope":         _SCOPE,
        "access_type":   "offline",
        "prompt":        "consent",
    }
    return RedirectResponse(f"{_AUTH_URI}?{urlencode(params)}")


@router.get("/callback")
async def drive_callback(code: str = Query(...)):
    async with httpx.AsyncClient() as c:
        r = await c.post(_TOKEN_URI, data={
            "code":          code,
            "client_id":     settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri":  _redirect_uri(),
            "grant_type":    "authorization_code",
        })
        r.raise_for_status()
        tok = r.json()
    tok["expires_at"] = time.time() + tok.get("expires_in", 3600)
    memory_service.save_drive_token(tok)
    return RedirectResponse("/?drive=connected")


@router.get("/disconnect")
async def drive_disconnect():
    memory_service.delete_drive_token()
    return {"disconnected": True}


# ── Status / browse ───────────────────────────────────────────────────────────

@router.get("/status")
async def drive_status():
    return {"connected": memory_service.get_drive_token() is not None}


@router.get("/folders")
async def list_folders(folder_id: str = "root"):
    token = await _valid_token()
    q = f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
    async with httpx.AsyncClient() as c:
        r = await c.get(_FILES_URI, params={"q": q, "fields": "files(id,name)", "pageSize": 50},
                        headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
    return r.json()


@router.get("/files")
async def list_files(folder_id: str = "root"):
    token = await _valid_token()
    mime_q = " or ".join(f"mimeType='{m}'" for m in _SUPPORTED_MIME)
    q = f"'{folder_id}' in parents and ({mime_q}) and trashed=false"
    async with httpx.AsyncClient() as c:
        r = await c.get(_FILES_URI, params={
            "q": q,
            "fields": "files(id,name,mimeType,size,modifiedTime)",
            "pageSize": 100,
            "orderBy":  "modifiedTime desc",
        }, headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
    return r.json()


# ── Sync ──────────────────────────────────────────────────────────────────────

class SyncRequest(BaseModel):
    file_ids: List[str]
    agent_tag: str = "drive"


@router.post("/sync")
async def sync_files(req: SyncRequest):
    token   = await _valid_token()
    results, errors = [], []

    for fid in req.file_ids:
        try:
            async with httpx.AsyncClient(timeout=120) as c:
                meta = (await c.get(
                    f"{_FILES_URI}/{fid}",
                    params={"fields": "id,name,mimeType"},
                    headers={"Authorization": f"Bearer {token}"},
                )).json()

                name, mime = meta["name"], meta["mimeType"]

                if mime in _EXPORTABLE:
                    export_mime, ext = _EXPORTABLE[mime]
                    dl = await c.get(
                        f"{_FILES_URI}/{fid}/export",
                        params={"mimeType": export_mime},
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    name += ext
                else:
                    dl = await c.get(
                        f"{_FILES_URI}/{fid}?alt=media",
                        headers={"Authorization": f"Bearer {token}"},
                    )
                dl.raise_for_status()

            out = await ingest_document(name, dl.content, agent_tag=req.agent_tag)
            results.append({"file_id": fid, "filename": name, **out})
        except Exception as exc:
            errors.append({"file_id": fid, "error": str(exc)})

    return {"synced": results, "errors": errors, "total": len(results)}
