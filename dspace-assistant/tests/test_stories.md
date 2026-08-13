# DSpace Assistant Test Conversations

These test cases can be used to validate the assistant's responses.

## Test Case 1: Basic Greeting and Help

```
user: hello
assistant:
  - text: matches greet intent

user: I need help
assistant:
  - text: I can help you with
  - buttons: contains "Search Documents"
```

## Test Case 2: Document Search

```
user: search for papers on machine learning
assistant:
  - text: Found
  - text: results for

user: can you tell me more about the first one?
assistant:
  - text: "Answer:" # Should use ROSERAG
  - text: "Sources:"
  - text: "Confidence:"
```

## Test Case 3: Submission Workflow

```
user: how do I submit my research
assistant:
  - text: "Submitting to DSpace"
  - text: "step-by-step"

user: what metadata do I need
assistant:
  - text: "Required Metadata"
  - text: "Title"
  - text: "Author"
```

## Test Case 4: Access Issues

```
user: I can't access this document
assistant:
  - text: "Troubleshooting Access"
  - text: "Verify Authentication"
  - text: "Check Embargo"

user: it says restricted
assistant:
  - text: "reasons for restricted access"
  - text: "Request a copy"
```

## Test Case 5: Advanced Search

```
user: find papers by Smith on climate change
assistant:
  - text: "advanced search"
  - text: "Found"

user: only 2020 onwards
assistant:
  - text: "results"
  - text: "filters"
```

## Test Case 6: Collections

```
user: show me available collections
assistant:
  - text: "Available Collections"
  - text: "collection"

user: what's in that?
assistant:
  - text: "browse"
```

## Test Case 7: Feedback

```
user: this is really helpful
assistant:
  - text: "Thank you for the feedback"

user: but the search was slow
assistant:
  - text: "logged"
  - text: "support team"
```

## Test Case 8: Fallback

```
user: tell me a joke
assistant:
  - text: "DSpace"
  - text: "try a general search"

user: what's the weather
assistant:
  - text: "I'm specifically designed"
```

## Test Case 9: Exit

```
user: goodbye
assistant:
  - text: "See you later"
  - text: "Feel free to reach out"
```

## Test Case 10: ROSERAG Integration

```
user: what strategies improve resilience among smallholder farmers
assistant:
  - text: "Answer:"
  - text: "Confidence:"
  - text: "Sources:"
  - text: "food_security_report.pdf"
```

## Running Tests

```bash
# Test a specific story
rasa test stories data/stories.yml

# Test with specific conversation
rasa interactive

# Full test suite
rasa test
```

## Expected Behaviors

✅ Assistant should:
- Understand intent correctly
- Extract entities (author, topic, date, etc.)
- Maintain conversation context
- Provide relevant responses
- Handle unknown queries gracefully
- Show confidence in AI-powered searches
- Cite sources appropriately

❌ Assistant should NOT:
- Make up information
- Provide false citations
- Claim confidence > 95% without strong basis
- Store sensitive information
- Make external API calls without error handling

## Performance Metrics

- Average response time: < 2 seconds
- Intent accuracy: > 90%
- Fallback rate: < 10%
- User satisfaction: Track via feedback action
