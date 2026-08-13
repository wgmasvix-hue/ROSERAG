# DSpace Assistant - Quick Reference Card

## 🚀 Start Here

```bash
# One command to start everything
cd /path/to/ROSERAG
docker-compose up -d

# Test it
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender":"user","message":"hello"}'
```

## 📂 What Was Created

```
dspace-assistant/                    New directory with:
├── config.yml                       Rasa NLU pipeline config
├── domain.yml                       30+ intents, 40+ responses
├── data/
│   ├── nlu.yml                     100+ training examples
│   ├── stories.yml                 20+ conversation flows
│   └── rules.yml                   Hard dialog rules
├── actions/
│   └── actions.py                  12 custom actions
├── Dockerfile                       Container image
├── requirements.txt                 Python dependencies
├── README.md                        Complete documentation
├── SETUP.md                         Setup guide
├── INTEGRATION.md                   API documentation
└── frontend-integration.js          Web widget code
```

## 🎯 Core Intents (30+)

### Search & Discovery
- `search_documents` - Find papers by topic
- `advanced_search` - Search with filters
- `browse_collections` - List collections
- `integration_with_rag` - AI-powered search

### Submission & Workflow  
- `submit_document` - How to upload
- `metadata_info` - Metadata requirements
- `workflow_status` - Check submission progress
- `collection_management` - Manage collections

### Access & Download
- `access_restrictions` - Resolve access issues
- `download_document` - Download guidance
- `export_formats` - Available export formats
- `user_profile` - Profile management

### Support
- `dspace_features` - What can DSpace do
- `technical_support` - Help with problems
- `feedback` - Send feedback
- `api_access` - API documentation

**Plus 15+ more intents** including document versioning, reporting, chitchat, etc.

## ⚙️ Custom Actions (12)

```python
action_search_dspace()           # ROSERAG semantic search
action_list_collections()        # DSpace collections
action_get_submission_requirements()  # Submission help
action_check_access()            # Access troubleshooting
action_validate_download_permission()  # Download rights
action_execute_advanced_search()  # Filtered search
action_rag_search()              # AI-powered retrieval
action_check_workflow_status()   # Submission tracking
action_generate_report()         # Analytics reports
action_log_technical_issue()     # Support tickets
action_log_feedback()            # User feedback
action_default_fallback()        # Handle unknown
```

## 🔌 Integration Points

```
ROSERAG Backend          DSpace APIs           Frontend
    ↑                        ↑                      ↑
    └────────────────────────┴──────────────────────┘
                    ↓
            Rasa Assistant
         (Dialog Management)
```

**API Calls Made:**
- `POST /api/search` - Semantic search
- `POST /api/chat` - Reasoning & QA
- `GET /server/api/discover/search/objects` - Browse

## 🎨 Frontend Integration

### Quick HTML Setup
```html
<div id="chat-widget"></div>
<script src="dspace-assistant/frontend-integration.js"></script>
<script>
  new DSpaceAssistantChat({
    rasaUrl: 'http://localhost:5005/webhooks/rest/webhook',
    container: '#chat-widget'
  });
</script>
```

### React
```jsx
import DSpaceAssistantChat from 'dspace-assistant/frontend-integration.js';

export default () => <DSpaceAssistantChat />;
```

### API Endpoint
```
POST http://localhost:5005/webhooks/rest/webhook
{
  "sender": "user_id",
  "message": "your question"
}
```

## 📊 Response Example

```json
[
  {
    "text": "I found 5 documents on renewable energy",
    "buttons": [
      {"title": "Show details", "payload": "/search_documents"}
    ]
  },
  {
    "text": "**Document 1:** Energy Storage Systems\n**Author:** Smith, J.\n**Score:** 0.95"
  }
]
```

## 💡 Example Conversations

### Search
```
User: Find papers on machine learning
Bot:  Found 5 results for 'machine learning'
      1. Deep Learning Fundamentals (0.96)
      2. Neural Networks Guide (0.92)
      ...
```

### Submission
```
User: How do I submit my research?
Bot:  **Submitting to DSpace:**
      1. Create account
      2. Click Submit
      3. Choose collection
      4. Upload document
      5. Add metadata
      6. Submit for review
```

### AI Search (ROSERAG)
```
User: What strategies improve farm resilience?
Bot:  **Answer:** Based on documents, strategies include:
      - Diversification of crops
      - Water conservation
      - ...
      
      **Confidence:** 87%
      
      **Sources:**
      1. agricultural_report.pdf (p. 14)
         Relevance: 91%
```

## ⚡ Commands

### Development
```bash
cd dspace-assistant

# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Train
rasa train

# Run
rasa run actions --port 5055  # Terminal 1
rasa run -m models --enable-api --cors "*" --port 5005  # Terminal 2

# Test
rasa interactive
```

### Docker
```bash
# Build
docker build -t dspace-assistant dspace-assistant/

# Run
docker run -p 5005:5005 -p 5055:5055 dspace-assistant

# With full stack
docker-compose up -d
```

### Testing
```bash
# API test
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender":"test","message":"hello"}'

# Story test
rasa test stories

# NLU test
rasa test nlu
```

## 🔧 Configuration

**Environment Variables (.env)**
```bash
ROSERAG_API_URL=http://localhost:8000/api
DSPACE_API_URL=http://localhost:8080/server/api
RASA_PORT=5005
RASA_ACTIONS_PORT=5055
API_TIMEOUT=30
SEARCH_TOP_K=5
```

**Rasa Settings (config.yml)**
```yaml
pipeline:
  - SpacyNLP (en_core_web_sm)
  - RegexFeaturizer
  - LexicalSyntacticFeaturizer
  - CountVectorsFeaturizer
  - DIETClassifier (100 epochs)
  - ResponseSelector (100 epochs)

policies:
  - MemoizationPolicy
  - RulePolicy
  - UnexpectedIntentPolicy
  - TEDPolicy (100 epochs)
```

## 🎓 Key Files Reference

| File | Purpose |
|------|---------|
| `config.yml` | NLU pipeline & dialog policies |
| `domain.yml` | Intents, entities, responses (source of truth) |
| `data/nlu.yml` | Training examples for intent classification |
| `data/stories.yml` | Conversation flow examples |
| `data/rules.yml` | Hard rules for specific responses |
| `actions/actions.py` | Custom Python actions (API calls) |
| `Dockerfile` | Container image definition |
| `endpoints.yml` | Action server configuration |

## 🐛 Common Issues

| Problem | Fix |
|---------|-----|
| Model not found | `rasa train` |
| Action server error | Check port 5055 is available |
| Intent not recognized | Add examples to `data/nlu.yml`, retrain |
| ROSERAG connection failed | Check backend running on 8000 |
| Timeout errors | Increase `API_TIMEOUT=60` in .env |

## 📚 Documentation

| Document | Contains |
|----------|----------|
| `README.md` | Features, usage, architecture |
| `SETUP.md` | Installation & deployment |
| `INTEGRATION.md` | API specs, integration guide |
| `frontend-integration.js` | Web widget source code |
| `DSPACE_ASSISTANT_SUMMARY.md` | Overview & next steps |

## 🎯 Typical Workflow

```
1. START
   docker-compose up -d
   
2. TEST
   curl http://localhost:5005/webhooks/rest/webhook
   
3. CUSTOMIZE
   Edit data/nlu.yml, domain.yml
   
4. RETRAIN
   rasa train
   
5. INTEGRATE
   Add frontend-integration.js to web UI
   
6. DEPLOY
   docker push dspace-assistant:latest
   
7. MONITOR
   docker logs -f roserag-dspace-assistant
```

## 🔐 Ports & URLs

| Service | Port | URL |
|---------|------|-----|
| Rasa Server | 5005 | http://localhost:5005/webhooks/rest/webhook |
| Action Server | 5055 | http://localhost:5055/webhooks/actions/run |
| ROSERAG Backend | 8000 | http://localhost:8000/api |
| DSpace | 8080 | http://localhost:8080 |

## 📈 Metrics to Monitor

```
✅ Response time: < 2 seconds
✅ Intent accuracy: > 90%
✅ Fallback rate: < 10%
✅ ROSERAG success: > 95%
✅ API errors: < 1%
```

## 🚀 Next Steps

1. ✅ Start with `docker-compose up -d`
2. ✅ Test with example queries
3. ✅ Customize responses in `domain.yml`
4. ✅ Add your intents to `data/nlu.yml`
5. ✅ Train: `rasa train`
6. ✅ Integrate frontend widget
7. ✅ Deploy to production
8. ✅ Monitor and improve

## 💬 Try These Queries

```
"Hello"
"Search for papers on AI"
"How do I submit a document?"
"I can't access this file"
"What is DSpace?"
"Find papers by Smith"
"Help"
"Goodbye"
```

## 📞 Resources

- **Rasa Docs**: https://rasa.com/docs
- **DSpace**: Your instance URL + /server/api/docs
- **ROSERAG**: Parent repository README
- **Issues**: GitHub issues tracker

---

## 📋 Checklist

- [ ] `docker-compose up -d` runs without errors
- [ ] Can POST to `http://localhost:5005/webhooks/rest/webhook`
- [ ] Gets response: `[{"text": "..."}]`
- [ ] `data/nlu.yml` contains your custom intents
- [ ] `domain.yml` has matching responses
- [ ] `rasa train` completes successfully
- [ ] Action server connects to ROSERAG backend
- [ ] Frontend widget displays chat

## 🎉 Done!

You have a production-ready conversational AI for DSpace. Now customize it, train it with your data, integrate it into your frontend, and watch users discover institutional knowledge like never before!

**Happy chatting!** 🚀

---

*Last Updated: 2024-08-13*
*DSpace Assistant v1.0 - Powered by Rasa & ROSERAG*
