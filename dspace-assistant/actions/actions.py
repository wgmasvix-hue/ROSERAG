from typing import Any, Dict, List, Text
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import logging
import httpx
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Configuration
ROSERAG_API_URL = "http://localhost:8000/api"
DSPACE_API_URL = "http://localhost:8080/server/api"


class ActionFactory:
    """Factory for creating custom actions"""
    pass


class ActionSearchDspace(Action):
    """Search for documents in DSpace using keyword search"""

    def name(self) -> Text:
        return "action_search_dspace"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Extract search query from intent
        topic = next(tracker.get_latest_entity_values("topic"), "")
        document_type = next(tracker.get_latest_entity_values("document_type"), "")

        search_query = topic or " ".join(tracker.latest_message.get("text", "").split())

        try:
            # Call ROSERAG semantic search API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ROSERAG_API_URL}/search",
                    json={
                        "query": search_query,
                        "top_k": 5,
                        "filters": {
                            "document_type": document_type
                        } if document_type else {}
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    results = response.json()
                    dispatcher.utter_message(
                        text=f"Found {len(results.get('results', []))} results for '{search_query}'"
                    )

                    # Store results in slot for follow-up queries
                    return [
                        SlotSet("user_search_query", search_query),
                        SlotSet("search_results", results.get("results", []))
                    ]
                else:
                    dispatcher.utter_message(
                        text="Sorry, I couldn't search right now. Please try again later."
                    )
                    logger.error(f"Search API error: {response.status_code}")

        except Exception as e:
            logger.error(f"Search action error: {str(e)}")
            dispatcher.utter_message(
                text="An error occurred during search. Please try again."
            )

        return []


class ActionListCollections(Action):
    """List available DSpace collections"""

    def name(self) -> Text:
        return "action_list_collections"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{DSPACE_API_URL}/discover/search/objects",
                    params={
                        "scope": "",
                        "configuration": "default",
                        "query": "*",
                        "page": 0,
                        "size": 10,
                        "sort": "score,desc"
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    collections = data.get("_embedded", {}).get("searchObjects", [])

                    if collections:
                        msg = "**Available Collections:**\n\n"
                        for item in collections[:10]:
                            name = item.get("_embedded", {}).get("indexableObject", {}).get("name", "Unknown")
                            msg += f"• {name}\n"

                        dispatcher.utter_message(text=msg)
                    else:
                        dispatcher.utter_message(text="No collections found.")
                else:
                    dispatcher.utter_message(text="Could not retrieve collections at this time.")

        except Exception as e:
            logger.error(f"Collections action error: {str(e)}")
            dispatcher.utter_message(
                text="An error occurred while fetching collections. Please try again."
            )

        return []


class ActionGetSubmissionRequirements(Action):
    """Get document submission requirements"""

    def name(self) -> Text:
        return "action_get_submission_requirements"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        msg = """
**Document Submission Requirements:**

📄 **File Formats:**
- PDF (preferred)
- Microsoft Word (.docx, .doc)
- OpenDocument (.odt)
- Text files (.txt)

📊 **File Size Limits:**
- Maximum 100 MB per file
- Recommended: under 50 MB for better performance

📝 **Required Metadata:**
- Title (required)
- Author(s) (required)
- Publication Date (required)
- Description/Abstract
- Subject Keywords
- Document Type

🔐 **Access Settings:**
- Choose access level (public, restricted, embargoed)
- Set embargo end date if needed
- Specify usage rights/license

✅ **Before You Submit:**
- Ensure you have copyright/permission to share
- Proofread title and abstract
- Add at least 3-5 relevant keywords
- Check that metadata is accurate

Questions? Contact your collection administrator!
        """
        dispatcher.utter_message(text=msg)
        return []


class ActionCheckAccess(Action):
    """Check and help resolve access issues"""

    def name(self) -> Text:
        return "action_check_access"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        msg = """
**Troubleshooting Access Issues:**

🔑 **Step 1: Verify Authentication**
- Are you logged in? Check top-right corner
- If not, use your institutional credentials
- First-time login? You may need to register

📅 **Step 2: Check Embargo Status**
- Some documents have temporary access restrictions
- Look for "Embargo until [date]" on the document page
- Access is automatic after the embargo date

👥 **Step 3: Request Access**
- If document shows "Restricted," you can request access
- Click "Request a copy" button
- Provide reason for your request
- Author/admin will review your request

⚙️ **Step 4: Browser Issues**
- Try a different browser
- Clear your browser cache
- Disable browser extensions temporarily
- Try incognito/private browsing mode

❓ **Still Can't Access?**
- Document may be admin-only
- Contact the collection administrator
- Check document's usage rights/license

What specific document are you having trouble accessing?
        """
        dispatcher.utter_message(text=msg)
        return []


class ActionValidateDownloadPermission(Action):
    """Validate download permissions"""

    def name(self) -> Text:
        return "action_validate_download_permission"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        msg = """
**Download Information:**

✅ **You Can Download:**
- Open access documents
- Documents you have permission for
- Your own submitted documents
- Publicly available research

ℹ️ **Download Tips:**
1. Right-click the download link → "Save as"
2. Choose save location on your computer
3. Check your downloads folder
4. For multiple files, use "Export Collection"

📋 **Supported Export Formats:**
- PDF - Best for reading and printing
- BibTeX - For citation managers
- Dublin Core - For metadata
- JSON - For data processing
- MODS - For metadata exchange

⚠️ **Usage Rights:**
- Always check the document's license
- Respect copyright and usage restrictions
- Cite properly in your work
- Some items may have specific license terms

🎓 **Academic Use:**
Most research in DSpace is freely available for:
- Personal research
- Education and teaching
- Non-commercial scholarly purposes

Need help with citations?
        """
        dispatcher.utter_message(text=msg)
        return []


class ActionExecuteAdvancedSearch(Action):
    """Execute advanced search with filters"""

    def name(self) -> Text:
        return "action_execute_advanced_search"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        author = next(tracker.get_latest_entity_values("author"), "")
        title = next(tracker.get_latest_entity_values("title"), "")
        filter_type = next(tracker.get_latest_entity_values("filter_type"), "")

        try:
            filters = {}
            if author:
                filters["author"] = author
            if title:
                filters["title"] = title
            if filter_type:
                filters["type"] = filter_type

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ROSERAG_API_URL}/search",
                    json={
                        "query": " ".join(tracker.latest_message.get("text", "").split()),
                        "top_k": 5,
                        "filters": filters
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    results = response.json()
                    if results.get("results"):
                        dispatcher.utter_message(
                            text=f"Advanced search found {len(results['results'])} matching documents with your filters."
                        )
                    else:
                        dispatcher.utter_message(
                            text="No documents match your advanced search criteria. Try adjusting your filters."
                        )
                    return [SlotSet("search_results", results.get("results", []))]
                else:
                    dispatcher.utter_message(text="Advanced search unavailable. Please try again.")

        except Exception as e:
            logger.error(f"Advanced search error: {str(e)}")
            dispatcher.utter_message(text="Error executing advanced search.")

        return []


class ActionRagSearch(Action):
    """Use ROSERAG for semantic/reasoning search"""

    def name(self) -> Text:
        return "action_rag_search"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        query = tracker.latest_message.get("text", "")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ROSERAG_API_URL}/chat",
                    json={
                        "message": query,
                        "history": [],
                        "top_k": 5
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    result = response.json()

                    answer = result.get("answer", "No answer found.")
                    sources = result.get("sources", [])
                    confidence = result.get("confidence", 0)

                    msg = f"**Answer:** {answer}\n\n"
                    msg += f"**Confidence:** {confidence:.1%}\n\n"

                    if sources:
                        msg += "**Sources:**\n"
                        for i, source in enumerate(sources[:3], 1):
                            msg += f"{i}. {source.get('document', 'Unknown')} (p. {source.get('page', '?')})\n"

                    dispatcher.utter_message(text=msg)
                else:
                    dispatcher.utter_message(text="Semantic search is temporarily unavailable.")

        except Exception as e:
            logger.error(f"RAG search error: {str(e)}")
            dispatcher.utter_message(text="Error performing semantic search.")

        return []


class ActionCheckWorkflowStatus(Action):
    """Check submission workflow status"""

    def name(self) -> Text:
        return "action_check_workflow_status"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        msg = """
**Checking Your Submission Status:**

To check your submission status:
1. Log in to your DSpace account
2. Go to "My Account" → "My Submissions"
3. Click on your document to see workflow status

**Possible Statuses:**
- 📤 **In Submission** - Workflow in progress
- 👁️ **In Review** - Editor is reviewing
- ✅ **Approved** - Accepted and being processed
- ❌ **Rejected** - Submission not accepted (see feedback)
- 📚 **Archived** - Published and live in repository

**Email Notifications:**
You'll receive email updates at each stage. Check your inbox and spam folder.

**Still waiting?** If your submission has been in review for more than 2 weeks, contact the collection administrator.
        """
        dispatcher.utter_message(text=msg)
        return []


class ActionGenerateReport(Action):
    """Generate usage or collection reports"""

    def name(self) -> Text:
        return "action_generate_report"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        msg = """
**Report Generation:**

Available reports:
📊 **Usage Statistics** - Downloads, views, access patterns
📈 **Collection Metrics** - Growth, submission rates, coverage
🎓 **Author Analytics** - Top contributors, publication trends
📅 **Time-based Reports** - Trends over time periods
🔝 **Top Documents** - Most downloaded, most viewed

To generate a report:
1. Go to Admin Panel (if you have access)
2. Navigate to Statistics
3. Choose report type and date range
4. Click "Generate"
5. Export as CSV, PDF, or JSON

Need help with specific metrics? What would you like to analyze?
        """
        dispatcher.utter_message(text=msg)
        return []


class ActionLogTechnicalIssue(Action):
    """Log a technical issue for support"""

    def name(self) -> Text:
        return "action_log_technical_issue"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        timestamp = datetime.now().isoformat()
        user_message = tracker.latest_message.get("text", "")

        logger.info(f"Technical issue reported at {timestamp}: {user_message}")

        msg = """
✅ **Issue Logged**

Thank you for reporting this issue. We've logged it with:
- Timestamp: Now
- Description: Your report

📧 **Next Steps:**
A support team member will review your issue and contact you via email within 24 hours.

**To speed up resolution, include:**
- Browser type and version
- Device (desktop/mobile)
- Exact error message
- Steps to reproduce the issue

Is there anything else I can help with in the meantime?
        """
        dispatcher.utter_message(text=msg)
        return []


class ActionLogFeedback(Action):
    """Log user feedback"""

    def name(self) -> Text:
        return "action_log_feedback"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        timestamp = datetime.now().isoformat()
        feedback_text = tracker.latest_message.get("text", "")

        logger.info(f"Feedback at {timestamp}: {feedback_text}")

        dispatcher.utter_message(
            text="Thank you for your feedback! It helps us continuously improve DSpace and ROSERAG."
        )
        return []


class ActionDefaultFallback(Action):
    """Default fallback action"""

    def name(self) -> Text:
        return "action_default_fallback"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        dispatcher.utter_message(
            text="I didn't quite understand that. Could you rephrase your question? "
                 "I'm here to help with DSpace, document search, submissions, and institutional knowledge."
        )
        return []
