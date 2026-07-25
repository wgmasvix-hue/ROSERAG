"""
Repository Connector Interface.

ROSERAG adds intelligence on top of institutional repositories (DSpace, Koha, etc.).
This module defines the contract every connector must satisfy.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Optional


@dataclass
class RepositoryDocument:
    """A document discovered and optionally downloaded from a repository."""

    external_id: str
    title: str
    authors: list[str] = field(default_factory=list)
    abstract: str = ""
    year: str = ""
    doi: Optional[str] = None
    url: str = ""
    pdf_url: Optional[str] = None
    source: str = ""
    filename: str = ""
    content_bytes: bytes = b""
    metadata: dict[str, Any] = field(default_factory=dict)


class RepositoryConnector(ABC):
    """
    Abstract base for all institutional repository connectors.

    Lifecycle:
      1. test_connection() — validate connectivity
      2. search()         — search the repository by keyword
      3. ingest()         — fetch a single item (metadata + PDF bytes)
      4. sync()           — page through all items (async generator)
    """

    name: str
    description: str

    @abstractmethod
    async def test_connection(self) -> bool:
        """Return True if the repository is reachable and authenticated."""
        ...

    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> list[RepositoryDocument]:
        """Search the repository by keyword. Returns lightweight document descriptors."""
        ...

    @abstractmethod
    async def ingest(self, external_id: str) -> Optional[RepositoryDocument]:
        """
        Fetch a single document by its repository ID.
        Resolves bitstreams/attachments and populates content_bytes where possible.
        Returns None if the item does not exist.
        """
        ...

    @abstractmethod
    def sync(self) -> AsyncIterator[RepositoryDocument]:
        """
        Async generator that pages through all repository items.
        Each yielded document has metadata populated; content_bytes may be empty
        if the connector defers downloading.
        """
        ...
