"""
DSpace 7.x Repository Connector — Full Implementation.

REST API reference: https://wiki.lyrasis.org/display/DSDOC7x/REST+API

Key endpoints used:
  POST /server/api/authn/login            — obtain JWT
  GET  /server/api/core/sites             — site info / connectivity test
  GET  /server/api/core/collections       — list all collections
  GET  /server/api/core/items             — paginated item list (sync)
  GET  /server/api/core/items/{uuid}      — single item metadata
  GET  /server/api/core/items/{uuid}/bitstreams — resolve PDF bitstream
  GET  /server/api/core/bitstreams/{uuid}/content — download file bytes
  GET  /server/api/discover/search/objects — keyword search
"""

import logging
from typing import AsyncIterator, Optional

import httpx

from .base import RepositoryConnector, RepositoryDocument

log = logging.getLogger(__name__)

_TIMEOUT = 30
_DOWNLOAD_TIMEOUT = 120


class DSpaceConnector(RepositoryConnector):
    """Connects to a DSpace 7.x instance via its REST API."""

    name = "DSpace"
    description = "DSpace 7.x institutional repository REST API connector."

    def __init__(
        self,
        base_url: str,
        email: str = "",
        password: str = "",
        token: str = "",
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.password = password
        self._token: str = token

    # ── Authentication ────────────────────────────────────────────────────────

    async def _login(self) -> None:
        """Acquire a JWT from DSpace /server/api/authn/login."""
        async with httpx.AsyncClient(verify=False, timeout=_TIMEOUT) as client:
            resp = await client.post(
                f"{self.base_url}/server/api/authn/login",
                data={"user": self.email, "password": self.password},
            )
            resp.raise_for_status()
            # DSpace returns the JWT in the Authorization response header
            auth = resp.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                auth = auth[7:]
            if not auth:
                body = resp.json() if resp.content else {}
                auth = body.get("token", body.get("_token", ""))
            if not auth:
                raise ValueError("DSpace login succeeded but returned no bearer token")
            self._token = auth
            log.info("DSpace: authenticated as %s", self.email)

    def _headers(self) -> dict[str, str]:
        h: dict[str, str] = {"User-Agent": "ROSERAG/2.0"}
        if self._token:
            h["Authorization"] = f"Bearer {self._token}"
        return h

    async def _ensure_auth(self) -> None:
        if not self._token and self.email and self.password:
            await self._login()

    # ── RepositoryConnector interface ─────────────────────────────────────────

    async def test_connection(self) -> bool:
        try:
            await self._ensure_auth()
            async with httpx.AsyncClient(verify=False, timeout=_TIMEOUT) as client:
                resp = await client.get(
                    f"{self.base_url}/server/api/core/sites",
                    headers=self._headers(),
                )
                return resp.status_code == 200
        except Exception as exc:
            log.warning("DSpace connection test failed: %s", exc)
            return False

    async def search(self, query: str, limit: int = 10) -> list[RepositoryDocument]:
        """Search DSpace via the Discovery API."""
        await self._ensure_auth()
        async with httpx.AsyncClient(verify=False, timeout=_TIMEOUT) as client:
            resp = await client.get(
                f"{self.base_url}/server/api/discover/search/objects",
                params={"query": query, "dsoType": "ITEM", "size": str(limit)},
                headers=self._headers(),
            )
            resp.raise_for_status()
        data = resp.json()
        objects = (
            data.get("_embedded", {})
            .get("searchResult", data.get("_embedded", {}))
            .get("_embedded", {})
            .get("objects", [])
        )
        results: list[RepositoryDocument] = []
        for obj in objects:
            item = obj.get("_embedded", {}).get("indexableObject", obj)
            doc = self._parse_item(item)
            if doc:
                results.append(doc)
        return results

    async def ingest(self, external_id: str) -> Optional[RepositoryDocument]:
        """
        Fetch a single DSpace item by UUID: metadata + primary PDF download.
        Returns None if the item does not exist.
        """
        await self._ensure_auth()
        async with httpx.AsyncClient(
            verify=False,
            timeout=_TIMEOUT,
            follow_redirects=True,
        ) as client:
            resp = await client.get(
                f"{self.base_url}/server/api/core/items/{external_id}",
                headers=self._headers(),
            )
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            doc = self._parse_item(resp.json())
            if not doc:
                return None

            # Resolve and download the primary PDF bitstream
            pdf_url = await self._resolve_pdf(client, external_id)
            doc.pdf_url = pdf_url
            if pdf_url:
                try:
                    dl = await client.get(
                        pdf_url,
                        headers=self._headers(),
                        timeout=_DOWNLOAD_TIMEOUT,
                    )
                    if dl.status_code == 200:
                        doc.content_bytes = dl.content
                        safe = doc.title[:60].replace("/", "_").replace("\\", "_")
                        doc.filename = f"{safe}.pdf"
                except Exception as exc:
                    log.warning("DSpace: PDF download failed for %s: %s", external_id, exc)

        return doc

    async def sync(self) -> AsyncIterator[RepositoryDocument]:  # type: ignore[override]
        """
        Async generator — pages through all ITEM objects.
        Resolves bitstream URLs (but does NOT download content) so callers
        can selectively download only what they need.
        """
        await self._ensure_auth()
        page = 0
        size = 20
        async with httpx.AsyncClient(verify=False, timeout=_TIMEOUT) as client:
            while True:
                resp = await client.get(
                    f"{self.base_url}/server/api/core/items",
                    params={"page": str(page), "size": str(size)},
                    headers=self._headers(),
                )
                resp.raise_for_status()
                data = resp.json()
                items = data.get("_embedded", {}).get("items", [])
                if not items:
                    break
                for item_data in items:
                    doc = self._parse_item(item_data)
                    if not doc:
                        continue
                    doc.pdf_url = await self._resolve_pdf(client, doc.external_id)
                    yield doc

                page_info = data.get("page", {})
                if page + 1 >= page_info.get("totalPages", 1):
                    break
                page += 1

    # ── Extended methods ──────────────────────────────────────────────────────

    async def list_collections(self) -> list[dict]:
        """Return all DSpace collections with uuid, name, description, handle."""
        await self._ensure_auth()
        collections: list[dict] = []
        page = 0
        async with httpx.AsyncClient(verify=False, timeout=_TIMEOUT) as client:
            while True:
                resp = await client.get(
                    f"{self.base_url}/server/api/core/collections",
                    params={"page": str(page), "size": "50"},
                    headers=self._headers(),
                )
                resp.raise_for_status()
                data = resp.json()
                for c in data.get("_embedded", {}).get("collections", []):
                    meta = c.get("metadata", {})
                    collections.append({
                        "uuid": c.get("uuid", ""),
                        "name": self._meta_value(meta, "dc.title"),
                        "description": self._meta_value(meta, "dc.description"),
                        "handle": c.get("handle", ""),
                    })
                page_info = data.get("page", {})
                if page + 1 >= page_info.get("totalPages", 1):
                    break
                page += 1
        return collections

    async def get_site_info(self) -> dict:
        """Return DSpace site name and UUID."""
        await self._ensure_auth()
        async with httpx.AsyncClient(verify=False, timeout=_TIMEOUT) as client:
            resp = await client.get(
                f"{self.base_url}/server/api/core/sites",
                headers=self._headers(),
            )
            resp.raise_for_status()
        data = resp.json()
        sites = data.get("_embedded", {}).get("sites", [{}])
        site = sites[0] if sites else {}
        meta = site.get("metadata", {})
        return {
            "name": self._meta_value(meta, "dspace.name") or self._meta_value(meta, "dc.title"),
            "url": self.base_url,
            "uuid": site.get("uuid", ""),
        }

    # ── Private helpers ───────────────────────────────────────────────────────

    def _meta_value(self, metadata: dict | list, key: str) -> str:
        """Extract the first value for a DSpace metadata field (handles both formats)."""
        if isinstance(metadata, list):
            for m in metadata:
                if m.get("key") == key:
                    return m.get("value", "")
        elif isinstance(metadata, dict):
            entries = metadata.get(key, [])
            if entries:
                v = entries[0]
                return v.get("value", "") if isinstance(v, dict) else str(v)
        return ""

    def _meta_list(self, metadata: dict | list, key: str) -> list[str]:
        """Extract all values for a DSpace metadata field."""
        if isinstance(metadata, list):
            return [m["value"] for m in metadata if m.get("key") == key and m.get("value")]
        elif isinstance(metadata, dict):
            return [
                v.get("value", "") if isinstance(v, dict) else str(v)
                for v in metadata.get(key, [])
            ]
        return []

    def _parse_item(self, item: dict) -> Optional[RepositoryDocument]:
        uuid = item.get("uuid") or item.get("id", "")
        if not uuid:
            return None
        meta = item.get("metadata", {})
        # DSpace can return metadata as a flat list or as a dict keyed by field name
        if isinstance(meta, list):
            pass  # already flat list format
        elif isinstance(meta, dict):
            # Convert dict format to list format for uniform processing
            flat: list[dict] = []
            for field_key, values in meta.items():
                for v in (values if isinstance(values, list) else [values]):
                    flat.append({
                        "key": field_key,
                        "value": v.get("value", "") if isinstance(v, dict) else str(v),
                    })
            meta = flat

        title = self._meta_value(meta, "dc.title")
        if not title:
            return None
        authors = (
            self._meta_list(meta, "dc.contributor.author")
            or self._meta_list(meta, "dc.creator")
        )
        abstract = self._meta_value(meta, "dc.description.abstract")
        date_str = self._meta_value(meta, "dc.date.issued")
        year = date_str[:4] if date_str else ""
        doi = self._meta_value(meta, "dc.identifier.doi") or None
        handle = item.get("handle", "")
        handle_uri = self._meta_value(meta, "dc.identifier.uri")
        url = handle_uri or (
            f"{self.base_url}/handle/{handle}" if handle else f"{self.base_url}/items/{uuid}"
        )
        return RepositoryDocument(
            external_id=uuid,
            title=title,
            authors=authors,
            abstract=abstract,
            year=year,
            doi=doi,
            url=url,
            source="dspace",
        )

    async def _resolve_pdf(
        self, client: httpx.AsyncClient, item_uuid: str
    ) -> Optional[str]:
        """
        Find the primary PDF bitstream for a DSpace item.
        DSpace 7.x: items/{uuid}/bitstreams returns bitstreams from the ORIGINAL bundle.
        """
        try:
            resp = await client.get(
                f"{self.base_url}/server/api/core/items/{item_uuid}/bitstreams",
                headers=self._headers(),
                timeout=15,
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            bitstreams = data.get("_embedded", {}).get("bitstreams", [])

            # Prefer: ORIGINAL bundle + PDF mimetype
            for bs in bitstreams:
                bundle = bs.get("bundleName", "")
                meta = bs.get("metadata", {})
                mimetype = self._meta_value(
                    meta if isinstance(meta, list) else
                    [{"key": k, "value": vv.get("value", "") if isinstance(vv, dict) else str(vv)}
                     for k, vs in meta.items() for vv in (vs if isinstance(vs, list) else [vs])],
                    "dc.format.mimetype",
                )
                if bundle == "ORIGINAL" and "pdf" in mimetype.lower():
                    bs_uuid = bs.get("uuid", "")
                    if bs_uuid:
                        return f"{self.base_url}/server/api/core/bitstreams/{bs_uuid}/content"

            # Fallback: first bitstream in ORIGINAL bundle regardless of type
            for bs in bitstreams:
                if bs.get("bundleName", "") == "ORIGINAL" and bs.get("uuid"):
                    return f"{self.base_url}/server/api/core/bitstreams/{bs['uuid']}/content"
        except Exception as exc:
            log.debug("Bitstream resolution failed for %s: %s", item_uuid, exc)
        return None
