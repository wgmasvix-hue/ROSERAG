# DSpace Assistant Setup Guide

Complete step-by-step guide to set up and run the Rasa-powered DSpace Assistant.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker)](#quick-start-docker)
3. [Local Development Setup](#local-development-setup)
4. [Training the Model](#training-the-model)
5. [Running the Assistant](#running-the-assistant)
6. [Integration with Frontend](#integration-with-frontend)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required

- **Python 3.10+** - For local development
- **Docker & Docker Compose** - For containerized deployment
- **ROSERAG Backend** - Running instance (or mocked for testing)
- **2GB+ RAM** - For Rasa model training

### Optional

- **DSpace Instance** - For full integration testing
- **Git** - For version control
- **VS Code / IDE** - For development

## Quick Start (Docker)

### Option A: With Full Stack (Recommended)

```bash
# Clone/navigate to ROSERAG directory
cd /path/to/ROSERAG

# Start all services (backend, vectorstore, assistant)
docker-compose up -d

# Wait for services to initialize (~30 seconds)
docker-compose logs -f dspace-assistant

# Chat at http://localhost:5005/webhooks/rest/webhook
# Or see frontend integration below
```

### Option B: Standalone Rasa Only

```bash
cd dspace-assistant

# Build the image
docker build -t dspace-assistant:latest .

# Run with environment variables
docker run -d \
  --name dspace-assistant \
  -p 5005:5005 \
  -p 5055:5055 \
  -e ROSERAG_API_URL=http://host.docker.internal:8000/api \
  dspace-assistant:latest

# Check logs
docker logs dspace-assistant

# Test
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender":"test","message":"hello"}'
```

## Local Development Setup

### Step 1: Clone and Navigate

```bash
cd /path/to/ROSERAG
cd dspace-assistant
```

### Step 2: Create Virtual Environment

```bash
# Using Python venv
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Or using conda
conda create -n dspace-assistant python=3.10
conda activate dspace-assistant
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt

# Download spacy model
python -m spacy download en_core_web_sm
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp ../.env.example .env.local

# Edit with your settings
nano .env.local  # or your preferred editor
```

**Key settings:**

```bash
# ROSERAG Backend
ROSERAG_API_URL=http://localhost:8000/api
ROSERAG_API_KEY=                    # Leave empty if no auth

# DSpace (if using)
DSPACE_API_URL=http://localhost:8080/server/api
DSPACE_API_KEY=                     # Optional

# Rasa Configuration
RASA_PORT=5005
RASA_ACTIONS_PORT=5055
RASA_LOG_LEVEL=INFO
```

### Step 5: Verify Installation

```bash
# Check Python
python --version

# Check Rasa
rasa --version

# Check spacy model
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('OK')"
```

## Training the Model

### Full Model Training

```bash
# Train everything (NLU + Core + Policies)
rasa train

# This creates: models/[timestamp]_nlu.tar.gz
```

### Training Only NLU

```bash
# Train just the intent classifier
rasa train nlu

# Created: models/nlu-[timestamp]
```

### Training with Validation

```bash
# Split data: 80% train, 20% validate
rasa train --validation-split 0.2

# Get evaluation metrics
rasa test
```

### Monitor Training Progress

```bash
# Verbose output
rasa train --debug

# Watch logs
tail -f logs/rasa.log
```

## Running the Assistant

### Method 1: Terminal (Two Terminals)

**Terminal 1 - Action Server:**

```bash
rasa run actions --port 5055 --debug
```

**Terminal 2 - Rasa Server:**

```bash
rasa run -m models --enable-api --cors "*" --port 5005 --debug
```

### Method 2: Single Command (Production)

```bash
# Start both services with script
bash run.sh  # Create this script or use Docker
```

### Method 3: Interactive Mode (Development)

```bash
# Interactive training and testing
rasa interactive

# Type messages to test the bot
# Type '/restart' to reset
# Type '/quit' to exit
```

### Method 4: Shell

```bash
# Direct command-line interface
rasa shell

# Talk directly to Rasa (for testing NLU)
# Type messages and see intent/entities
```

## Integration with Frontend

### Option 1: HTML Widget (Easiest)

```html
<!DOCTYPE html>
<html>
<head>
  <title>DSpace Assistant Chat</title>
</head>
<body>
  <!-- Chat widget container -->
  <div id="chat-widget"></div>

  <!-- Include integration script -->
  <script src="path/to/frontend-integration.js"></script>

  <script>
    // Initialize chat
    const chat = new DSpaceAssistantChat({
      rasaUrl: 'http://localhost:5005/webhooks/rest/webhook',
      container: '#chat-widget',
      userId: 'current-user-id'
    });
  </script>
</body>
</html>
```

### Option 2: React Component

```jsx
import DSpaceAssistantChat from 'path/to/frontend-integration.js';

export default function App() {
  return (
    <div>
      <h1>ROSERAG Dashboard</h1>
      <DSpaceAssistantChat 
        rasaUrl="http://localhost:5005/webhooks/rest/webhook"
      />
    </div>
  );
}
```

### Option 3: Custom Integration

```javascript
// Fetch and send messages directly
async function askAssistant(message, userId) {
  const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: userId,
      message: message
    })
  });

  return await response.json();
}

// Usage
const responses = await askAssistant('Find papers on AI', 'user123');
console.log(responses);
```

### Option 4: Embed in Platform

If using the ROSERAG platform (Next.js):

```bash
# Copy integration script to platform
cp frontend-integration.js ../platform/public/

# Add to platform pages
# See ../platform/README.md for details
```

## Customization

### Adding New Intents

1. **Edit `data/nlu.yml`**:

```yaml
- intent: my_intent
  examples: |
    - example 1
    - example 2
    - example 3 with [entity](entity)
```

2. **Add response in `domain.yml`**:

```yaml
responses:
  utter_my_intent:
    - text: "Response to user"
```

3. **Add story in `data/stories.yml`**:

```yaml
- story: My story
  steps:
    - intent: my_intent
    - action: utter_my_intent
```

4. **Retrain**:

```bash
rasa train
```

### Adding Custom Actions

1. **Create action in `actions/actions.py`**:

```python
class ActionMyAction(Action):
    def name(self) -> Text:
        return "action_my_action"

    async def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(text="Custom response")
        return []
```

2. **Register in `domain.yml`**:

```yaml
actions:
  - action_my_action
```

3. **Use in stories**:

```yaml
- story: My story
  steps:
    - intent: my_intent
    - action: action_my_action
```

4. **Retrain and restart action server**

### Modifying Responses

Edit `domain.yml` and change response templates:

```yaml
responses:
  utter_help_options:
    - text: "Your custom help text here"
    - text: "Alternative response"
    - text: "Another variation"
```

Responses are randomly selected, so add multiple variations for better UX.

### Changing Language

Current language: **English**

To add another language:

1. Create `data/nlu_[language].yml` with translated examples
2. Update `config.yml` language setting
3. Translate responses in `domain.yml`
4. Retrain model

## Troubleshooting

### Issue: "Failed to connect to ROSERAG"

**Solution:**

```bash
# Check ROSERAG is running
curl http://localhost:8000/api/health

# Update .env ROSERAG_API_URL if different
# If using Docker: ROSERAG_API_URL=http://backend:8000/api

# Restart action server
docker restart roserag-dspace-assistant
```

### Issue: "Rasa model not found"

**Solution:**

```bash
# Train model
rasa train

# Check models directory exists
ls -la models/

# Start with specific model
rasa run -m models/[specific-model] --enable-api
```

### Issue: "Action server not responding"

**Solution:**

```bash
# Check action server is running
curl http://localhost:5055/health

# Check logs
docker logs roserag-rasa-actions

# Restart
docker restart roserag-rasa-actions

# Or local:
pkill -f "rasa run actions"
rasa run actions --port 5055 --debug
```

### Issue: "Intent not recognized"

**Solution:**

```bash
# Test NLU
rasa test nlu data/

# Check training data
grep "intent: your_intent" data/nlu.yml

# Add more examples if few
# Retrain
rasa train
```

### Issue: "Timeout errors"

**Solution:**

```bash
# Increase timeout in .env
API_TIMEOUT=60

# Check backend is responding
curl http://localhost:8000/api/health

# Check network connectivity
docker network inspect bridge

# Monitor logs
docker logs roserag-backend -f
```

### Issue: "Out of memory"

**Solution:**

```bash
# Reduce model size
# Edit config.yml and reduce epochs

# Or increase available memory
# Docker: Settings → Resources → Memory
```

## Testing

### Unit Tests

```bash
# Create tests directory structure
mkdir -p tests/unit

# Run tests
python -m pytest tests/ -v

# With coverage
python -m pytest tests/ --cov=actions
```

### Conversation Tests

```bash
# Test specific stories
rasa test stories data/stories.yml

# Full evaluation
rasa test

# Interactive testing
rasa interactive
```

### API Tests

```bash
# Test API endpoint
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "test_user",
    "message": "hello"
  }'

# Multiple messages
for msg in "hello" "search for AI" "goodbye"; do
  curl -X POST http://localhost:5005/webhooks/rest/webhook \
    -H "Content-Type: application/json" \
    -d "{\"sender\":\"test\",\"message\":\"$msg\"}"
done
```

## Production Deployment

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Model trained on final data
- [ ] Environment variables configured
- [ ] Logs configured
- [ ] Error handling in place
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Monitoring enabled
- [ ] Backup strategy documented

### Deploy to Production

```bash
# Using Docker Compose (recommended)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Monitor
docker-compose logs -f dspace-assistant

# Update models
docker-compose exec dspace-assistant rasa train
docker-compose restart dspace-assistant
```

### Monitoring in Production

```bash
# View logs
docker logs roserag-dspace-assistant

# Check health
curl http://production-url:5005/health

# Metrics
curl http://production-url:5005/metrics
```

## Next Steps

1. ✅ Start the assistant
2. ✅ Test with sample queries
3. ✅ Integrate with frontend
4. ✅ Customize responses
5. ✅ Add custom intents
6. ✅ Train on real data
7. ✅ Deploy to production
8. ✅ Monitor and improve

## Support

- **Documentation**: See README.md and INTEGRATION.md
- **Training**: Follow Rasa docs at https://rasa.com/docs
- **Issues**: Check GitHub issues or create new one
- **Community**: Rasa forum at https://forum.rasa.com

---

**Happy chatting!** 🎉 Your DSpace Assistant is ready to help users navigate institutional knowledge.
