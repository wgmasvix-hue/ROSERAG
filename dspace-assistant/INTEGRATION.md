# ROSERAG Integration Guide

This guide explains how the DSpace Assistant (Rasa) integrates with ROSERAG's RAG backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  User Interfaces                         │
├─────────────────────────────────────────────────────────┤
│  Web Chat │ Mobile │ Slack │ Teams │ Discord │ WebSocket │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│         Rasa Dialog Management Engine                    │
├─────────────────────────────────────────────────────────┤
│  Intent Classification │ Entity Extraction │ NLU         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│        Custom Actions & Integrations                     │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │  Search & Browse  │  Submission  │  Access Control │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         ↓                              ↓
┌──────────────────────┐    ┌──────────────────────────┐
│  ROSERAG RAG Backend │    │   DSpace APIs            │
├──────────────────────┤    ├──────────────────────────┤
│ • Semantic Search    │    │ • Collections            │
│ • LLM Reasoning      │    │ • Documents              │
│ • Evidence Citation  │    │ • Submissions            │
│ • Confidence Scoring │    │ • Metadata               │
│ • Source Tracing     │    │ • Access Control         │
└──────────────────────┘    └──────────────────────────┘
         ↓                              ↓
┌──────────────────────┐    ┌──────────────────────────┐
│  Qdrant Vector Store │    │ DSpace Database          │
│  (Document Chunks)   │    │ (Repository Data)        │
└──────────────────────┘    └──────────────────────────┘
```

## Key Integration Points

### 1. Semantic Search (`action_rag_search`)

**Trigger**: User asks complex questions or requests semantic search

**Flow**:
```
User: "What strategies improve resilience among smallholder farmers?"
  ↓
Rasa NLU: Intent = integration_with_rag
  ↓
Custom Action: action_rag_search
  ↓
ROSERAG API: POST /api/chat
  {
    "message": "What strategies improve...",
    "history": [],
    "top_k": 5
  }
  ↓
ROSERAG Response:
  {
    "answer": "Based on documents...",
    "sources": [
      {
        "document": "file.pdf",
        "page": 12,
        "excerpt": "...",
        "score": 0.91
      }
    ],
    "confidence": 0.87,
    "retrieved_chunks": 5
  }
  ↓
Format & Display Answer with Citations
```

**Response Template**:
```
**Answer:** {answer}

**Confidence:** {confidence:.1%}

**Sources:**
1. {document} (p. {page})
   "{excerpt}"
   Relevance: {score:.0%}
```

### 2. Basic Search (`action_search_dspace`)

**Trigger**: User searches for documents by topic or keyword

**Flow**:
```
User: "Search for papers on renewable energy"
  ↓
Rasa NLU: Intent = search_documents, Entity topic = "renewable energy"
  ↓
Custom Action: action_search_dspace
  ↓
ROSERAG API: POST /api/search
  {
    "query": "renewable energy",
    "top_k": 5,
    "filters": {}
  }
  ↓
ROSERAG Response: List of 5 most relevant documents
  ↓
Display Results with Download Links
```

### 3. Collections Browsing (`action_list_collections`)

**Trigger**: User wants to explore available collections

**Flow**:
```
User: "Show me available collections"
  ↓
Rasa NLU: Intent = browse_collections
  ↓
Custom Action: action_list_collections
  ↓
DSpace API: GET /discover/search/objects
  ↓
Extract Collection Names & Descriptions
  ↓
Display Formatted List
```

### 4. Advanced Search (`action_execute_advanced_search`)

**Trigger**: User specifies author, date, type filters

**Flow**:
```
User: "Find papers by Smith on climate published in 2020"
  ↓
Rasa NLU: 
  Intent = advanced_search
  Entity author = "Smith"
  Entity topic = "climate"
  Entity year = "2020"
  ↓
Custom Action: action_execute_advanced_search
  ↓
ROSERAG API: POST /api/search
  {
    "query": "climate",
    "top_k": 5,
    "filters": {
      "author": "Smith",
      "year": "2020"
    }
  }
  ↓
Display Filtered Results
```

## API Specifications

### ROSERAG Chat API

**Endpoint**: `POST /api/chat`

**Request**:
```json
{
  "message": "User question or statement",
  "history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ],
  "top_k": 5
}
```

**Response**:
```json
{
  "answer": "Answer text with reasoning",
  "sources": [
    {
      "document": "filename.pdf",
      "page": 12,
      "excerpt": "Relevant text snippet",
      "score": 0.91
    }
  ],
  "confidence": 0.87,
  "retrieved_chunks": 5
}
```

### ROSERAG Search API

**Endpoint**: `POST /api/search`

**Request**:
```json
{
  "query": "Search query",
  "top_k": 5,
  "filters": {
    "document_type": "article",
    "author": "Smith",
    "year": "2020"
  }
}
```

**Response**:
```json
{
  "results": [
    {
      "id": "doc-id",
      "title": "Document Title",
      "author": "Author Name",
      "url": "link-to-document",
      "score": 0.95,
      "summary": "Brief summary"
    }
  ],
  "total": 50,
  "offset": 0
}
```

### DSpace Discovery API

**Endpoint**: `GET /server/api/discover/search/objects`

**Query Parameters**:
```
scope=          // Collection UUID or empty for all
query=*         // Search query
page=0          // Page number
size=10         // Results per page
sort=score,desc // Sort order
```

**Response**:
```json
{
  "_embedded": {
    "searchObjects": [
      {
        "_embedded": {
          "indexableObject": {
            "uuid": "...",
            "name": "Collection Name"
          }
        },
        "hitHighlights": []
      }
    ]
  },
  "page": {
    "size": 10,
    "totalElements": 50,
    "totalPages": 5,
    "number": 0
  }
}
```

## Error Handling

### Scenario 1: ROSERAG Backend Unavailable

```python
try:
    response = await client.post(f"{ROSERAG_API_URL}/search", ...)
except httpx.ConnectError:
    dispatcher.utter_message(
        text="The knowledge base is temporarily unavailable. "
             "Please try basic search or come back later."
    )
    logger.error("ROSERAG connection failed")
```

### Scenario 2: DSpace API Error

```python
if response.status_code == 403:
    dispatcher.utter_message(text="Access denied. Please check your permissions.")
elif response.status_code == 404:
    dispatcher.utter_message(text="Document not found.")
elif response.status_code >= 500:
    dispatcher.utter_message(text="Server error. Please try again later.")
```

### Scenario 3: Timeout

```python
async with httpx.AsyncClient() as client:
    try:
        response = await client.post(..., timeout=30.0)
    except httpx.TimeoutException:
        dispatcher.utter_message(
            text="Request timed out. The system may be under heavy load. "
                 "Please try again in a few moments."
        )
```

## Environment Variables

Set in `.env`:

```bash
# ROSERAG Backend
ROSERAG_API_URL=http://localhost:8000/api
ROSERAG_API_KEY=optional_api_key  # If authentication is enabled

# DSpace
DSPACE_API_URL=http://localhost:8080/server/api
DSPACE_API_KEY=optional_api_key
DSPACE_USERNAME=admin
DSPACE_PASSWORD=admin_password

# Rasa Configuration
RASA_PORT=5005
RASA_ACTIONS_PORT=5055
RASA_LOG_LEVEL=INFO

# API Timeouts
API_TIMEOUT=30  # seconds
SEARCH_TOP_K=5  # Number of results

# Feature Flags
ENABLE_RAG_SEARCH=true
ENABLE_DSPACE_INTEGRATION=true
```

## Deployment

### Docker Compose Setup

See root `docker-compose.yml` with all services:

```yaml
services:
  # ROSERAG Backend
  roserag-backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - qdrant
  
  # Qdrant Vector Store
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
  
  # Rasa Dialog Engine
  rasa:
    build: ./dspace-assistant
    ports:
      - "5005:5005"
  
  # Rasa Action Server
  rasa-actions:
    build: ./dspace-assistant
    command: rasa run actions --port 5055
    ports:
      - "5055:5055"
```

### Production Checklist

- [ ] ROSERAG backend running and accessible
- [ ] DSpace instance running and accessible
- [ ] Vector store (Qdrant) deployed
- [ ] Rasa model trained and optimized
- [ ] Action server running
- [ ] Environment variables configured
- [ ] Error logging configured
- [ ] API timeouts appropriate for your load
- [ ] Rate limiting configured
- [ ] CORS properly configured for frontend
- [ ] SSL/TLS enabled for production
- [ ] Monitoring and alerting set up
- [ ] Backup strategy for trained models
- [ ] Documentation updated

## Monitoring

### Key Metrics

1. **Response Time**
   - ROSERAG API latency: Should be < 3 seconds
   - DSpace API latency: Should be < 1 second
   - Rasa response time: Should be < 0.5 seconds

2. **Success Rate**
   - ROSERAG search success: > 95%
   - DSpace queries success: > 99%
   - Overall assistant success: > 90%

3. **Usage**
   - Messages per day
   - Intent distribution
   - Action execution counts
   - Fallback rate

### Logging

```python
import logging

logger = logging.getLogger(__name__)

# Log API calls
logger.info(f"ROSERAG search: query='{query}', top_k={top_k}")

# Log errors
logger.error(f"ROSERAG API error: {response.status_code} - {response.text}")

# Log performance
import time
start = time.time()
response = await client.post(...)
duration = time.time() - start
logger.info(f"ROSERAG API call took {duration:.2f}s")
```

## Testing Integration

### Unit Test Example

```python
import pytest
from unittest.mock import Mock, patch
from actions.actions import ActionRagSearch

@pytest.mark.asyncio
async def test_rag_search_success():
    action = ActionRagSearch()
    
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "answer": "Test answer",
            "sources": [],
            "confidence": 0.85
        }
        
        dispatcher = Mock()
        tracker = Mock()
        tracker.latest_message.get.return_value = "test query"
        
        result = await action.run(dispatcher, tracker, {})
        
        assert dispatcher.utter_message.called
```

### Integration Test Example

```bash
# Start all services
docker-compose up -d

# Run end-to-end test
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "test-user",
    "message": "What strategies improve farm resilience?"
  }'

# Expected: Response with ROSERAG answer and sources
```

## Troubleshooting

### Rasa Can't Connect to ROSERAG

```bash
# 1. Check ROSERAG is running
curl http://localhost:8000/api/health

# 2. Check network connectivity
docker network ls
docker network inspect roserag_default

# 3. Update API URL in .env
ROSERAG_API_URL=http://roserag-backend:8000/api  # For Docker

# 4. Restart action server
docker restart dspace-assistant-rasa-actions-1
```

### Low Search Quality

1. Check ROSERAG embeddings are properly indexed
2. Ensure documents have good metadata in DSpace
3. Verify Rasa NLU is correctly extracting entities
4. Add more training examples to `data/nlu.yml`

### Timeout Issues

1. Increase API timeout in environment:
   ```bash
   API_TIMEOUT=60  # seconds
   ```

2. Optimize ROSERAG queries:
   - Reduce `top_k` parameter
   - Simplify search filters
   - Upgrade vector store hardware

## References

- [Rasa Documentation](https://rasa.com/docs)
- [ROSERAG README](../README.md)
- [DSpace REST API](https://wiki.duraspace.org/display/DSPACE/REST+API)
- [Custom Actions Guide](https://rasa.com/docs/rasa/custom-actions)

---

**Integration Guide** - DSpace Assistant with ROSERAG
Last Updated: 2024
