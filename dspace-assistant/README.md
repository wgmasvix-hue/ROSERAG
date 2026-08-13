# DSpace Assistant - RASA Chatbot for ROSERAG

A conversational AI assistant for DSpace institutional repositories, powered by Rasa and integrated with ROSERAG's semantic search and reasoning capabilities.

## Overview

The **DSpace Assistant** is an intelligent chatbot that helps users:

- 🔍 **Search** documents across institutional collections
- 📚 **Browse** DSpace collections and find relevant materials
- 📤 **Submit** documents and understand submission workflows
- 🔐 **Resolve** access issues and permissions
- 💡 **Ask questions** using AI-powered semantic search (ROSERAG)
- 📊 **Discover** metadata and usage analytics
- ❓ **Get help** with technical issues and features

## Architecture

```
User Interface (Web/Chat)
        ↓
    Rasa NLU
    (Intent Classification)
        ↓
    Rasa Core
    (Dialog Management)
        ↓
    Custom Actions
        ↓
    ┌─────────────────────────────┐
    │   ROSERAG Backend API       │
    │   - Semantic Search         │
    │   - Document Retrieval      │
    │   - Reasoning Layer         │
    └─────────────────────────────┘
        ↓
    ┌─────────────────────────────┐
    │   DSpace APIs               │
    │   - Collections             │
    │   - Documents               │
    │   - Submissions             │
    └─────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.10+
- Docker and Docker Compose (optional)
- ROSERAG backend running
- DSpace instance (or mock for testing)

### Installation

#### Option 1: Local Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Download spacy model
python -m spacy download en_core_web_sm

# Train the model
rasa train

# Start action server (in one terminal)
rasa run actions --port 5055

# Start Rasa server (in another terminal)
rasa run -m models --enable-api --cors "*" --port 5005
```

#### Option 2: Docker

```bash
# Build the image
docker build -t dspace-assistant .

# Run the container
docker run -p 5005:5005 -p 5055:5055 \
  -e ROSERAG_API_URL=http://host.docker.internal:8000/api \
  -e DSPACE_API_URL=http://host.docker.internal:8080/server/api \
  dspace-assistant
```

#### Option 3: Docker Compose (with ROSERAG)

See the updated `docker-compose.yml` in the root directory.

## Training Data

### NLU Training Data (`data/nlu.yml`)

Contains 30+ intents with example user utterances:

**Core Intents:**
- `greet` - Greeting the assistant
- `goodbye` - Ending conversation
- `help` - Requesting help
- `affirm/deny` - Confirmation/negation

**DSpace Intents:**
- `search_documents` - Search for research materials
- `browse_collections` - Explore collections
- `submit_document` - Learn submission process
- `access_restrictions` - Resolve access issues
- `download_document` - Download guidance
- `metadata_info` - Metadata questions
- `workflow_status` - Check submission status
- `advanced_search` - Filtered search
- `integration_with_rag` - AI-powered search
- ... and 20+ more

### Stories (`data/stories.yml`)

Defines conversation flows for common scenarios:

1. Search workflow
2. Submission workflow
3. Access resolution
4. Metadata guidance
5. Advanced search
6. RAG integration
7. Feedback collection

### Rules (`data/rules.yml`)

Hard rules for deterministic responses:

- Greetings
- Farewells
- Help requests
- Fallback handling

### Domain (`domain.yml`)

Complete assistant specification:

- All intents and entities
- Response templates
- Custom actions
- Session configuration

## Custom Actions

Located in `actions/actions.py`:

| Action | Purpose |
|--------|---------|
| `action_search_dspace` | Search via ROSERAG semantic search |
| `action_list_collections` | Fetch available collections |
| `action_get_submission_requirements` | Display submission guidelines |
| `action_check_access` | Troubleshoot access issues |
| `action_validate_download_permission` | Check download eligibility |
| `action_execute_advanced_search` | Filter-based search |
| `action_rag_search` | Semantic/reasoning search |
| `action_check_workflow_status` | Submission status tracking |
| `action_generate_report` | Analytics and reporting |
| `action_log_technical_issue` | Support ticket creation |
| `action_log_feedback` | Feedback collection |

### Integration Points

Actions integrate with:

1. **ROSERAG API** (`/api/search`, `/api/chat`)
   - Semantic document search
   - Evidence-grounded answers
   - Confidence scoring

2. **DSpace API** (`/server/api`)
   - Collection discovery
   - Document retrieval
   - Metadata access

## Configuration

### Environment Variables

Create `.env` file:

```bash
# API URLs
ROSERAG_API_URL=http://localhost:8000/api
DSPACE_API_URL=http://localhost:8080/server/api

# Rasa Configuration
RASA_PORT=5005
RASA_ACTIONS_PORT=5055

# Optional: Authentication
DSPACE_API_KEY=your_api_key
DSPACE_USERNAME=your_username
DSPACE_PASSWORD=your_password
```

### Rasa Configuration (`config.yml`)

- **Pipeline**: SpaCy NLP + DIETClassifier + ResponseSelector
- **Policies**: MemoizationPolicy + RulePolicy + TEDPolicy + UnexpectedIntentPolicy
- **Language**: English
- **Training**: 100 epochs

## Usage

### Via REST API

```bash
# Send message
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "user123",
    "message": "Search for papers on machine learning"
  }'
```

### Response Example

```json
{
  "recipient_id": "user123",
  "text": "Found 5 results for 'machine learning'",
  "buttons": [
    {
      "title": "Show Details",
      "payload": "/search_documents"
    }
  ]
}
```

### Via Chat Interface

Integrate with your frontend:

```javascript
async function sendMessage(userMessage) {
  const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: userId,
      message: userMessage
    })
  });
  
  const messages = await response.json();
  displayMessages(messages);
}
```

## Conversation Examples

### Example 1: Document Search

```
User: Find papers on sustainable agriculture
Assistant: I found 5 results for 'sustainable agriculture'
[Shows search results with links]

User: Can you tell me more about the first one?
Assistant: [Uses ROSERAG to answer questions about the document]
```

### Example 2: Submission

```
User: How do I submit my research?
Assistant: [Shows submission workflow with 7 steps]

User: What metadata do I need?
Assistant: [Explains required and optional metadata fields]

User: I want to submit now
Assistant: [Provides link and guidance]
```

### Example 3: Access Resolution

```
User: I can't download this document
Assistant: Let me help troubleshoot...
[Lists possible reasons and solutions]

User: It says "Restricted"
Assistant: [Explains restrictions and shows "Request Access" option]
```

### Example 4: Semantic Search (ROSERAG)

```
User: What strategies improve resilience among smallholder farmers?
Assistant: [Uses ROSERAG to reason over documents]
Answer: Based on institutional documents...
[Shows specific excerpts with page numbers and citations]
Confidence: 87%
```

## Training & Improvement

### Retrain the Model

```bash
# Train with all data
rasa train

# Train only NLU
rasa train nlu

# With validation split
rasa train --validation-split 0.2
```

### Test the Model

```bash
# Interactive learning
rasa interactive

# Test NLU
rasa test nlu data/ --errors

# Full evaluation
rasa test --stories data/stories.yml
```

### Add New Training Data

1. Edit `data/nlu.yml` to add new intents/entities
2. Update `data/stories.yml` with new conversation paths
3. Add responses to `domain.yml`
4. Add custom actions if needed in `actions/actions.py`
5. Run `rasa train`

### Common Patterns to Add

```yaml
- intent: my_new_intent
  examples: |
    - example 1
    - example 2
    - example 3
    - example with [entity](entity) extraction
```

## Advanced Features

### 1. Multi-turn Conversations

Rasa maintains conversation context across multiple turns:

```
User: Search for climate research
Assistant: Found 12 results. Which topic?
User: Focus on adaptation strategies  # Context-aware refinement
Assistant: Filtered to 4 results on adaptation
```

### 2. Entity Extraction

Automatically extracts relevant information:

```
"Find papers by Smith on climate" 
→ author: "Smith", topic: "climate"
```

### 3. Confidence Scoring

Actions can include confidence scores:

```
Answer: [Text]
Confidence: 82%
```

### 4. Fallback Handling

Gracefully handles unknown queries:

```
User: Why is the sky blue?
Assistant: I'm designed for DSpace assistance. 
For other questions, try a general search engine.
```

### 5. Session Management

Maintains conversation state:

```
user_search_query: "renewable energy"
search_results: [...]
access_level: "authenticated"
```

## Monitoring & Logging

### View Logs

```bash
# Check Rasa logs
tail -f logs/rasa.log

# Check action server logs
tail -f logs/actions.log

# Check HTTP logs
tail -f logs/http.log
```

### Metrics to Track

- User engagement (messages/day)
- Intent distribution
- Fallback rates
- Response times
- ROSERAG API calls
- Error rates

## Troubleshooting

### Issue: Actions Not Running

```bash
# Check action server is running
curl http://localhost:5055/health

# Restart action server
rasa run actions --port 5055 --debug
```

### Issue: No Response to Queries

```bash
# Check if model is trained
ls -la models/

# Retrain
rasa train

# Verify NLU
rasa test nlu data/
```

### Issue: API Connection Error

```bash
# Check ROSERAG backend
curl http://localhost:8000/api/health

# Check DSpace
curl http://localhost:8080/server/api/discover/search/objects

# Update .env if URLs are wrong
```

### Issue: Low Confidence Responses

1. Add more training examples to `nlu.yml`
2. Improve story coverage in `stories.yml`
3. Retrain model with validation
4. Review intent overlap and consolidate if needed

## Integration with ROSERAG

The DSpace Assistant seamlessly integrates with ROSERAG:

### Semantic Search Flow

```
User Query
    ↓
Rasa NLU (Intent: integration_with_rag)
    ↓
Custom Action: action_rag_search
    ↓
ROSERAG Backend API (/api/chat)
    ↓
LLM Reasoning + Vector Retrieval
    ↓
Answer + Citations + Confidence
```

### Example Integration Response

```json
{
  "answer": "Smallholder resilience is improved by...",
  "sources": [
    {
      "document": "food_security_report.pdf",
      "page": 12,
      "excerpt": "Specific strategy text...",
      "score": 0.91
    }
  ],
  "confidence": 0.87,
  "retrieved_chunks": 5
}
```

## Best Practices

### For Administrators

1. **Regular Training**: Add real user queries to training data monthly
2. **Monitor Fallbacks**: Review queries where assistant can't respond
3. **Update Policies**: Adjust access/submission policies in responses
4. **Collect Feedback**: Use `action_log_feedback` data to improve

### For Users

1. **Clear Questions**: Specific questions get better answers
2. **Use Keywords**: Include relevant terms (author, date, topic)
3. **Follow Guidance**: Follow submission/download instructions step-by-step
4. **Provide Feedback**: Help improve the assistant with your feedback

### For Developers

1. **Async/Await**: All API calls are async (non-blocking)
2. **Error Handling**: Always catch exceptions in custom actions
3. **Logging**: Log all API calls and errors for debugging
4. **Testing**: Write tests for new actions in `tests/` directory
5. **Version Control**: Keep training data in git, models in .gitignore

## Roadmap

- [ ] Multi-language support (Spanish, French, etc.)
- [ ] Voice interface integration
- [ ] Personalized recommendations
- [ ] Graph-based knowledge linking
- [ ] Advanced entity linking
- [ ] Context-aware follow-ups
- [ ] Integration with institutional authentication
- [ ] Mobile app support
- [ ] Analytics dashboard
- [ ] A/B testing for responses

## Contributing

To improve the DSpace Assistant:

1. Add examples to training data
2. Propose new actions or intents
3. Report and fix bugs
4. Improve documentation
5. Share conversation logs for improvement

## License

MIT - Same as ROSERAG

## Support

- **Documentation**: See this README
- **Issues**: Report in GitHub issues
- **Questions**: Check ROSERAG documentation
- **API Docs**: 
  - Rasa: https://rasa.com/docs
  - DSpace: Your DSpace instance `/server/api/docs`
  - ROSERAG: See root repository README

---

**DSpace Assistant** - Conversational Intelligence for Institutional Knowledge
Powered by Rasa & ROSERAG
