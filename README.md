<p align="center">
  <img src="assets/roserag-logo.png" width="300">
</p>

<h1 align="center">ROSERAG</h1>

<p align="center">Retrieve · Reason · Respond</p>

<p align="center">Academic-Grade Open Source Retrieval-Augmented Generation</p>

<p align="center">Your Knowledge. Your AI.</p>

---

## Vision

ROSERAG is an **Institutional Knowledge Operating System (IKOS)** — not a chatbot, but infrastructure. It transforms unstructured academic content into a verifiable, searchable, and governable intelligence layer for universities, research institutions, governments, and knowledge-intensive organizations.

> DSpace stores documents. ROSERAG operationalizes knowledge.

---

## Architecture

```
Institutional Content
        │
        ▼
Knowledge Extraction (PyMuPDF)
        │
        ▼
Semantic Representation (Ollama · nomic-embed-text)
        │
        ▼
Retrieval Engine (Qdrant)
        │
        ▼
Reasoning Layer (Ollama · LLaMA)
        │
        ▼
Governance Layer (Source traceability · Confidence scoring)
        │
        ▼
Institutional Intelligence (Academic Assistant UI)
```

---

## Core Principles

- **Local-first** — runs entirely on your infrastructure, no data leaves your institution
- **Open-source** — fully auditable, extensible, and governable
- **Academic-grade retrieval** — semantic search over institutional corpora
- **Ollama-powered** — local LLM inference, no external API calls required
- **User-curated knowledge** — ingest only the documents you trust
- **Multi-interface architecture** — REST API + web UI
- **Evidence-grounded answers** — every response cites sources with page numbers and confidence scores
- **Audit trail** — traceable reasoning from question to document chunk

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI |
| PDF Extraction | PyMuPDF |
| Chunking | Sliding window with sentence-boundary detection |
| Embeddings | Ollama (`nomic-embed-text`) |
| Vector Store | Qdrant |
| LLM | Ollama (`llama3.2` or any model) |
| Frontend | Vanilla JS + CSS |
| Containerization | Docker Compose |

---

## Quick Start

### Prerequisites

- [Ollama](https://ollama.ai) with `nomic-embed-text` and `llama3.2` pulled
- [Docker](https://docker.com) and Docker Compose
- Python 3.11+

### 1. Pull Ollama models

```bash
ollama pull nomic-embed-text
ollama pull llama3.2
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env as needed
```

### 3. Start with Docker Compose

```bash
docker compose up
```

Or run locally:

```bash
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Qdrant must be running separately:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 4. Open the UI

Navigate to `http://localhost:8000`

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload and ingest a PDF |
| `GET`  | `/api/documents` | List all ingested documents |
| `DELETE` | `/api/documents/{id}` | Remove a document and its chunks |
| `POST` | `/api/search` | Semantic search over the knowledge base |
| `POST` | `/api/chat` | Evidence-grounded RAG chat |
| `GET`  | `/api/health` | Health check |

### Chat request

```json
{
  "message": "What strategies improve resilience among smallholder farmers?",
  "history": [],
  "top_k": 5
}
```

### Chat response

```json
{
  "answer": "Based on the institutional documents...",
  "sources": [
    {
      "document": "food_security_report.pdf",
      "page": 12,
      "excerpt": "Smallholder resilience is improved by...",
      "score": 0.91
    }
  ],
  "confidence": 0.87,
  "retrieved_chunks": 5
}
```

---

## Roadmap

- [x] FastAPI backend
- [x] Document API (upload / list / delete)
- [x] PDF ingestion (PyMuPDF)
- [x] Chunking engine (sliding window + sentence boundaries)
- [x] Ollama embeddings (`nomic-embed-text`)
- [x] Qdrant vector store
- [x] Semantic search
- [x] Academic Assistant UI
- [x] Source citations with page numbers
- [x] Confidence scoring
- [ ] DSpace integration
- [ ] Knowledge graph layer
- [ ] Multi-user authentication
- [ ] Audit trail persistence
- [ ] Research analytics dashboard
- [ ] National knowledge fabric federation

---

## The Problem ROSERAG Solves

Universities already have repositories — DSpace, Koha, Greenstone. These excel at **storage, cataloguing, and preservation**. They do not excel at **understanding, reasoning, synthesis, or decision support**.

ROSERAG is Generation 3 institutional infrastructure:

| Generation | Capability | Example |
|---|---|---|
| 1 | Repository | DSpace, Greenstone |
| 2 | Discovery | Library discovery layers |
| 3 | Knowledge Intelligence | **ROSERAG** |
| 4 | Institutional OS | Future ROSERAG |

---

## License

MIT
