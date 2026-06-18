"""
Repository Connector Interface.

ROSERAG does not replace institutional repositories (DSpace, Koha, Greenstone).
It adds intelligence on top of them. This interface defines how any repository
feeds into the ROSERAG ingestion pipeline.

Implementations:
  - DSpaceConnector (placeholder)
  - KohaConnector (future)
  - OAI-PMH Connector (future, covers many repositories)
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncIterator
from dataclasses import dataclass


@dataclass
class RepositoryDocument:
    """A document returned by a repository sync."""
    external_id: str          # Repository-native identifier (e.g., DSpace handle)
    title: str
    filename: str
    content_bytes: bytes      # Raw PDF/document bytes
    metadata: Dict[str, Any]  # Author, date, subject, etc.


class RepositoryConnector(ABC):
    """
    Abstract base for all institutional repository connectors.

    Lifecycle:
      1. configure() — set connection parameters
      2. test_connection() — validate connectivity
      3. sync() — discover available documents
      4. ingest() — pull content into ROSERAG pipeline
      5. search() — search the source repository (optional)
    """

    name: str
    description: str

    @abstractmethod
    async def test_connection(self) -> bool:
        """Return True if the repository is reachable."""
        ...

    @abstractmethod
    async def sync(self) -> List[Dict[str, Any]]:
        """
        Discover documents available in the repository.
        Returns list of document descriptors (no content yet).
        """
        ...

    @abstractmethod
    async def ingest(
        self,
        external_id: str,
    ) -> RepositoryDocument:
        """
        Fetch a single document by its repository ID.
        Returns bytes and metadata ready for ROSERAG ingestion.
        """
        ...

    @abstractmethod
    async def search(
        self,
        query: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Search the source repository (keyword/metadata search).
        Complements ROSERAG's semantic search with repository-native search.
        """
        ...

    async def full_sync_ingest(self) -> AsyncIterator[RepositoryDocument]:
        """
        Convenience: discover all documents and yield each for ingestion.
        Override for more efficient bulk retrieval if the repository supports it.
        """
        docs = await self.sync()
        for doc_meta in docs:
            yield await self.ingest(doc_meta["external_id"])
