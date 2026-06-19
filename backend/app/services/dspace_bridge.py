"""DSpace Bridge — unified search across arXiv, OpenAlex, Semantic Scholar, and local DSpace."""

import asyncio
import dataclasses
import urllib.parse
import xml.etree.ElementTree as ET
from typing import Optional

import httpx


@dataclasses.dataclass
class BridgePaper:
    id: str             # unique: "arxiv:2301.01234", "openalex:W123", "dspace:uuid", "s2:abc"
    title: str
    authors: list[str]
    abstract: str
    year: int | None
    doi: str | None
    url: str            # landing page URL
    pdf_url: str | None  # direct PDF link if available
    source: str         # "arxiv" | "openalex" | "semantic_scholar" | "dspace"
    open_access: bool


# ── arXiv ────────────────────────────────────────────────────────────────────

async def search_arxiv(query: str, limit: int = 10) -> list[BridgePaper]:
    """Search arXiv using the Atom feed API."""
    encoded = urllib.parse.quote(query)
    url = f"https://export.arxiv.org/api/query?search_query=all:{encoded}&max_results={limit}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers={"User-Agent": "ROSERAG/2.0 (research)"})
        resp.raise_for_status()

    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "arxiv": "http://arxiv.org/schemas/atom",
    }

    root = ET.fromstring(resp.text)
    papers: list[BridgePaper] = []

    for entry in root.findall("atom:entry", ns):
        title_el = entry.find("atom:title", ns)
        title = (title_el.text or "").strip().replace("\n", " ") if title_el is not None else ""

        summary_el = entry.find("atom:summary", ns)
        abstract = (summary_el.text or "").strip().replace("\n", " ") if summary_el is not None else ""

        authors = []
        for author_el in entry.findall("atom:author", ns):
            name_el = author_el.find("atom:name", ns)
            if name_el is not None and name_el.text:
                authors.append(name_el.text.strip())

        # Extract arXiv ID from the <id> element (URL like http://arxiv.org/abs/2301.01234v1)
        id_el = entry.find("atom:id", ns)
        raw_id = (id_el.text or "").strip() if id_el is not None else ""
        arxiv_id = raw_id.split("/abs/")[-1].split("v")[0] if "/abs/" in raw_id else raw_id

        # Published year
        published_el = entry.find("atom:published", ns)
        year: int | None = None
        if published_el is not None and published_el.text:
            try:
                year = int(published_el.text[:4])
            except ValueError:
                pass

        landing_url = f"https://arxiv.org/abs/{arxiv_id}"
        pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

        # DOI from arxiv:doi element
        doi_el = entry.find("arxiv:doi", ns)
        doi: str | None = doi_el.text.strip() if doi_el is not None and doi_el.text else None

        if title and arxiv_id:
            papers.append(BridgePaper(
                id=f"arxiv:{arxiv_id}",
                title=title,
                authors=authors,
                abstract=abstract,
                year=year,
                doi=doi,
                url=landing_url,
                pdf_url=pdf_url,
                source="arxiv",
                open_access=True,
            ))

    return papers


# ── OpenAlex ─────────────────────────────────────────────────────────────────

def _reconstruct_abstract(inverted_index: dict | None) -> str:
    """Reconstruct abstract text from OpenAlex inverted index."""
    if not inverted_index:
        return ""
    pos_word: dict[int, str] = {}
    for word, positions in inverted_index.items():
        for pos in positions:
            pos_word[pos] = word
    if not pos_word:
        return ""
    words = [pos_word[i] for i in sorted(pos_word.keys())]
    return " ".join(words)


async def search_openalex(query: str, limit: int = 10) -> list[BridgePaper]:
    """Search OpenAlex works API."""
    encoded = urllib.parse.quote(query)
    url = (
        f"https://api.openalex.org/works"
        f"?search={encoded}"
        f"&per-page={limit}"
        f"&filter=has_abstract:true"
        f"&mailto=roserag@institution.edu"
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers={"User-Agent": "ROSERAG/2.0 (research)"})
        resp.raise_for_status()

    data = resp.json()
    results = data.get("results", [])
    papers: list[BridgePaper] = []

    for item in results:
        openalex_id = item.get("id", "")
        work_id = openalex_id.split("/")[-1] if openalex_id else ""

        title = (item.get("title") or "").strip()
        if not title:
            continue

        authors = []
        for authorship in item.get("authorships", []):
            author = authorship.get("author", {})
            name = author.get("display_name")
            if name:
                authors.append(name)

        abstract = _reconstruct_abstract(item.get("abstract_inverted_index"))

        year: int | None = item.get("publication_year")

        doi: str | None = item.get("doi")
        if doi and doi.startswith("https://doi.org/"):
            doi = doi[len("https://doi.org/"):]

        primary_loc = item.get("primary_location") or {}
        landing_url = primary_loc.get("landing_page_url") or openalex_id

        best_oa = item.get("best_oa_location") or {}
        pdf_url: str | None = best_oa.get("pdf_url")

        is_oa = (item.get("open_access") or {}).get("is_oa", False)

        papers.append(BridgePaper(
            id=f"openalex:{work_id}",
            title=title,
            authors=authors,
            abstract=abstract,
            year=year,
            doi=doi,
            url=landing_url,
            pdf_url=pdf_url,
            source="openalex",
            open_access=bool(is_oa),
        ))

    return papers


# ── Semantic Scholar ──────────────────────────────────────────────────────────

async def search_semantic_scholar(query: str, limit: int = 10) -> list[BridgePaper]:
    """Search Semantic Scholar Graph API."""
    encoded = urllib.parse.quote(query)
    fields = "title,authors,abstract,year,doi,openAccessPdf,externalIds,url"
    url = (
        f"https://api.semanticscholar.org/graph/v1/paper/search"
        f"?query={encoded}&limit={limit}&fields={fields}"
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers={"User-Agent": "ROSERAG/2.0 (research)"})
        resp.raise_for_status()

    data = resp.json()
    items = data.get("data", [])
    papers: list[BridgePaper] = []

    for item in items:
        paper_id = item.get("paperId", "")
        title = (item.get("title") or "").strip()
        if not title:
            continue

        authors = [a.get("name", "") for a in (item.get("authors") or []) if a.get("name")]
        abstract = (item.get("abstract") or "").strip()
        year: int | None = item.get("year")
        doi: str | None = item.get("doi")

        landing_url = item.get("url") or f"https://www.semanticscholar.org/paper/{paper_id}"

        oa_pdf = item.get("openAccessPdf")
        pdf_url: str | None = oa_pdf.get("url") if oa_pdf else None

        papers.append(BridgePaper(
            id=f"s2:{paper_id}",
            title=title,
            authors=authors,
            abstract=abstract,
            year=year,
            doi=doi,
            url=landing_url,
            pdf_url=pdf_url,
            source="semantic_scholar",
            open_access=oa_pdf is not None,
        ))

    return papers


# ── DSpace 7.x ───────────────────────────────────────────────────────────────

def _dspace_metadata_value(metadata: list[dict], field: str) -> str | None:
    """Extract the first value for a DSpace metadata field."""
    for entry in metadata:
        if entry.get("key") == field:
            return entry.get("value")
    return None


def _dspace_metadata_all(metadata: list[dict], field: str) -> list[str]:
    """Extract all values for a DSpace metadata field."""
    return [e.get("value", "") for e in metadata if e.get("key") == field and e.get("value")]


async def search_dspace(
    query: str,
    limit: int = 10,
    base_url: str = "",
    token: str = "",
) -> list[BridgePaper]:
    """Search a local DSpace 7.x instance."""
    if not base_url:
        return []

    base_url = base_url.rstrip("/")
    encoded = urllib.parse.quote(query)
    url = (
        f"{base_url}/server/api/discover/search/objects"
        f"?query={encoded}&size={limit}&embed=mappedItems"
    )

    headers: dict[str, str] = {"User-Agent": "ROSERAG/2.0 (research)"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    data = resp.json()
    embedded = data.get("_embedded", {})
    search_result = embedded.get("searchResult", {})
    objects = search_result.get("_embedded", {}).get("objects", [])

    papers: list[BridgePaper] = []

    for obj in objects:
        indexable = obj.get("_embedded", {}).get("indexableObject", {})
        if not indexable:
            continue

        item_id = indexable.get("uuid", "")
        metadata: list[dict] = indexable.get("metadata", [])

        # DSpace sometimes returns metadata as a dict keyed by field name
        if isinstance(metadata, dict):
            flat: list[dict] = []
            for key, values in metadata.items():
                for v in (values if isinstance(values, list) else [values]):
                    flat.append({"key": key, "value": v.get("value", "") if isinstance(v, dict) else str(v)})
            metadata = flat

        title = _dspace_metadata_value(metadata, "dc.title") or ""
        if not title:
            continue

        authors = _dspace_metadata_all(metadata, "dc.contributor.author")
        abstract = _dspace_metadata_value(metadata, "dc.description.abstract") or ""
        date_str = _dspace_metadata_value(metadata, "dc.date.issued") or ""
        year: int | None = None
        if date_str:
            try:
                year = int(date_str[:4])
            except ValueError:
                pass

        doi = _dspace_metadata_value(metadata, "dc.identifier.doi")
        handle = indexable.get("handle", "")
        landing_url = f"{base_url}/handle/{handle}" if handle else f"{base_url}/items/{item_id}"

        papers.append(BridgePaper(
            id=f"dspace:{item_id}",
            title=title,
            authors=authors,
            abstract=abstract,
            year=year,
            doi=doi,
            url=landing_url,
            pdf_url=None,
            source="dspace",
            open_access=True,
        ))

    return papers


# ── Download ─────────────────────────────────────────────────────────────────

async def download_paper(pdf_url: str, timeout: int = 120) -> bytes:
    """Download a PDF (or any file) from the given URL and return raw bytes."""
    async with httpx.AsyncClient(timeout=float(timeout), follow_redirects=True) as client:
        resp = await client.get(pdf_url, headers={"User-Agent": "ROSERAG/2.0 (research)"})
        resp.raise_for_status()
    return resp.content


# ── Fan-out search ────────────────────────────────────────────────────────────

async def search_all(
    query: str,
    sources: list[str],
    limit: int = 10,
    dspace_url: str = "",
    dspace_token: str = "",
) -> tuple[list[BridgePaper], dict[str, str]]:
    """Fan-out search across all requested sources, deduplicating by DOI.

    Returns (papers, errors) where errors maps source name to error message.
    """

    async def safe_search(name: str, coro) -> tuple[str, list[BridgePaper] | Exception]:
        try:
            result = await coro
            return name, result
        except Exception as exc:
            return name, exc

    coros = []
    if "arxiv" in sources:
        coros.append(safe_search("arxiv", search_arxiv(query, limit)))
    if "openalex" in sources:
        coros.append(safe_search("openalex", search_openalex(query, limit)))
    if "semantic_scholar" in sources:
        coros.append(safe_search("semantic_scholar", search_semantic_scholar(query, limit)))
    if "dspace" in sources:
        coros.append(safe_search("dspace", search_dspace(query, limit, dspace_url, dspace_token)))

    gathered = await asyncio.gather(*coros)

    all_papers: list[BridgePaper] = []
    errors: dict[str, str] = {}
    seen_dois: set[str] = set()

    for source_name, result in gathered:
        if isinstance(result, Exception):
            errors[source_name] = str(result)
            continue
        for paper in result:
            if paper.doi and paper.doi in seen_dois:
                continue
            if paper.doi:
                seen_dois.add(paper.doi)
            all_papers.append(paper)

    return all_papers, errors
