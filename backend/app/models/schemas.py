from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DocumentMetadata(BaseModel):
    id: str
    filename: str
    title: Optional[str] = None
    pages: int
    chunks: int
    ingested_at: str


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
