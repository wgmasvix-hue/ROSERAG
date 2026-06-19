from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DocumentMetadata(BaseModel):
    id: str
    filename: str
    title: Optional[str] = None
    pages: int
    chunks: int
    ingested_at: str
    agent_tag: str = ""


class ChunkResult(BaseModel):
    text: str
    document_id: str
    document_name: str
    page: int
    chunk_index: int
    score: float


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


class SearchResponse(BaseModel):
    query: str
    results: List[ChunkResult]
    elapsed_ms: float


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    top_k: int = 5


class Source(BaseModel):
    document: str
    page: int
    excerpt: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
    confidence: float
    retrieved_chunks: int


class IngestResponse(BaseModel):
    document_id: str
    filename: str
    pages: int
    chunks: int
    message: str


class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]
    total: int


class DeleteResponse(BaseModel):
    document_id: str
    message: str


# ---- Phase 1: /ask ----

class AskRequest(BaseModel):
    question: str
    top_k: int = 5


class SourceWithChunkId(BaseModel):
    document: str
    chunk_id: str
    chunk: str
    page: int
    score: float


class TrustResult(BaseModel):
    trust_score: float
    trust_level: str
    components: Dict[str, float]


class AskResponse(BaseModel):
    question: str
    answer: str
    confidence: float
    trust: TrustResult
    sources: List[SourceWithChunkId]
    retrieved_chunks: int


# ---- Phase 4: Knowledge Graph ----

class GraphNode(BaseModel):
    id: str
    name: str
    type: str
    frequency: int
    doc_ids: List[str]


class GraphEdge(BaseModel):
    source_id: str
    target_id: str
    relation: str
    weight: int


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, int]


# ---- Phase 5: History ----

class HistoryEntry(BaseModel):
    id: int
    question: str
    answer: str
    confidence: Optional[float]
    trust_score: Optional[float]
    trust_level: Optional[str]
    sources: List[Dict[str, Any]]
    retrieved_chunks: Optional[int]
    session_id: Optional[str]
    asked_at: str


class HistoryListResponse(BaseModel):
    entries: List[HistoryEntry]
    total: int
    limit: int
    offset: int


# ---- Phase 6: Analytics ----

class EntityStats(BaseModel):
    PERSON: int = 0
    ORGANIZATION: int = 0
    TOPIC: int = 0
    LOCATION: int = 0


class KnowledgeGraphStats(BaseModel):
    nodes: int
    edges: int


class AnalyticsResponse(BaseModel):
    documents: int
    chunks: int
    questions: int
    avg_confidence: float
    avg_trust_score: float
    topics: List[str]
    entities: Dict[str, int]
    knowledge_graph: Dict[str, int]


# ---- Local file / directory ingestion ----

class IngestPathRequest(BaseModel):
    path: str
    recursive: bool = True
    agent_tag: str = ""


class IngestPathResult(BaseModel):
    document_id: str
    filename: str
    path: str
    pages: int
    chunks: int


class IngestPathResponse(BaseModel):
    ingested: List[IngestPathResult]
    errors: List[Dict[str, str]]
    total: int


# ---- Phase 8: Copilot ----

class AgentTypeEnum(str, Enum):
    RESEARCH   = "research"
    LIBRARIAN  = "librarian"
    POLICY     = "policy"
    COMPLIANCE = "compliance"
    EXECUTIVE  = "executive"


class CopilotRequest(BaseModel):
    question: str
    agent: AgentTypeEnum = AgentTypeEnum.RESEARCH
    top_k: int = 5


class CopilotResponse(BaseModel):
    question: str
    agent: str
    agent_description: str
    answer: str
    reasoning_notes: str
    trust: TrustResult
    sources: List[SourceWithChunkId]


# ---- Phase 9: DSpace Bridge ----

class BridgePaperSchema(BaseModel):
    id: str
    title: str
    authors: List[str]
    abstract: str
    year: Optional[int] = None
    doi: Optional[str] = None
    url: str
    pdf_url: Optional[str] = None
    source: str
    open_access: bool = False


class BridgeSearchRequest(BaseModel):
    query: str
    sources: List[str] = ["arxiv", "openalex"]
    limit: int = 10


class BridgeSearchResponse(BaseModel):
    query: str
    results: List[BridgePaperSchema]
    total: int
    sources_searched: List[str]
    errors: Dict[str, str] = {}


class BridgeImportRequest(BaseModel):
    paper_id: str
    source: str
    pdf_url: Optional[str] = None
    title: str = ""
    fallback_url: Optional[str] = None


class BridgeImportResponse(BaseModel):
    paper_id: str
    document_id: str
    filename: str
    pages: int
    chunks: int
    message: str


class BridgeSourceInfo(BaseModel):
    id: str
    label: str
    enabled: bool
    description: str
