"""
RoseRAG — RASA Custom Actions
Connects RASA dialogue management to the RoseRAG RAG backend and DSpace API.

Each action is called by the RASA action server when the policy selects it.
They call the RoseRAG FastAPI backend (http://localhost:8002 by default)
and format responses back to the user.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional, Text

import requests
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, SessionStarted, ActionExecuted, EventType

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────
ROSERAG_API = os.getenv("ROSERAG_API_URL", "http://localhost:8002")
DSPACE_URL  = os.getenv("DSPACE_URL", "https://bulawayopolytecnicrepository.dare.co.zw")
API_TIMEOUT = int(os.getenv("ROSERAG_API_TIMEOUT", "30"))


# ── Helpers ────────────────────────────────────────────────────────────────

def _api_get(path: str, params: Optional[Dict] = None) -> Optional[Dict]:
    """GET the RoseRAG API; returns parsed JSON or None on error."""
    try:
        r = requests.get(f"{ROSERAG_API}{path}", params=params, timeout=API_TIMEOUT)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as exc:
        logger.error("RoseRAG API error [GET %s]: %s", path, exc)
        return None


def _api_post(path: str, body: Dict) -> Optional[Dict]:
    """POST to the RoseRAG API; returns parsed JSON or None on error."""
    try:
        r = requests.post(
            f"{ROSERAG_API}{path}",
            json=body,
            timeout=API_TIMEOUT,
        )
        r.raise_for_status()
        return r.json()
    except requests.RequestException as exc:
        logger.error("RoseRAG API error [POST %s]: %s", path, exc)
        return None


def _rag_ask_sync(query: str) -> Optional[Dict]:
    """
    Call the non-streaming /api/ask endpoint (fallback to streaming via
    /api/ask/stream and collecting all tokens if a sync endpoint exists).
    """
    result = _api_post("/api/ask", {"query": query, "stream": False})
    if result:
        return result
    # Fallback: call the search endpoint and synthesise an answer
    return _api_get("/api/search", {"q": query, "top_k": 5})


def _format_sources(sources: List[Dict], limit: int = 5) -> str:
    """Format a list of source dicts into a markdown list."""
    if not sources:
        return ""
    lines = ["\n\n📚 **Sources:**"]
    for i, s in enumerate(sources[:limit], 1):
        title  = s.get("title", "Untitled")
        author = s.get("author", "")
        year   = s.get("year", "")
        url    = s.get("url", "")
        meta   = " · ".join(filter(None, [author, str(year) if year else ""]))
        if url:
            lines.append(f"  {i}. [{title}]({url})" + (f" — {meta}" if meta else ""))
        else:
            lines.append(f"  {i}. **{title}**" + (f" — {meta}" if meta else ""))
    return "\n".join(lines)


def _build_search_query(tracker: Tracker) -> str:
    """Assemble a search query from slots + latest intent text."""
    topic   = tracker.get_slot("topic")
    author  = tracker.get_slot("author")
    year    = tracker.get_slot("year")
    # Prefer topic slot; fall back to raw message text
    parts = []
    if topic:
        parts.append(topic)
    if author:
        parts.append(f"author:{author}")
    if year:
        parts.append(f"year:{year}")
    if not parts:
        parts.append(tracker.latest_message.get("text", ""))
    return " ".join(parts)


# ── action_session_start ───────────────────────────────────────────────────

class ActionSessionStart(Action):
    """Custom session-start action: clears stale slots from previous sessions."""

    def name(self) -> Text:
        return "action_session_start"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[EventType]:
        return [
            SessionStarted(),
            SlotSet("topic", None),
            SlotSet("author", None),
            SlotSet("year", None),
            SlotSet("collection", None),
            SlotSet("last_query", None),
            SlotSet("last_answer", None),
            SlotSet("last_sources", None),
            ActionExecuted("action_listen"),
        ]


# ── action_rag_answer ──────────────────────────────────────────────────────

class ActionRagAnswer(Action):
    """
    RAG-powered Q&A action.
    Calls POST /api/ask, streams the answer, and stores sources in the slot.
    """

    def name(self) -> Text:
        return "action_rag_answer"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[EventType]:

        query = tracker.latest_message.get("text", "").strip()
        if not query:
            dispatcher.utter_message(response="utter_ask_question_clarify")
            return []

        # Try the RAG ask endpoint
        data = _api_post("/api/ask", {"query": query})

        if not data:
            # Fallback: try streaming endpoint (collect full response)
            try:
                import sseclient  # type: ignore
                url = f"{ROSERAG_API}/api/ask/stream?q={requests.utils.quote(query)}"
                resp = requests.get(url, stream=True, timeout=60)
                client = sseclient.SSEClient(resp)
                tokens, sources = [], []
                for event in client.events():
                    if event.event == "token":
                        tokens.append(event.data)
                    elif event.event == "sources":
                        try:
                            sources = json.loads(event.data)
                        except json.JSONDecodeError:
                            pass
                    elif event.event in ("done", "error"):
                        break
                answer = "".join(tokens)
                data = {"answer": answer, "sources": sources}
            except Exception as exc:
                logger.error("SSE fallback failed: %s", exc)
                data = None

        if not data or not data.get("answer"):
            dispatcher.utter_message(
                text="⚠️ I couldn't reach the knowledge base right now. Please try again in a moment."
            )
            return []

        answer  = data.get("answer", "")
        sources = data.get("sources", [])

        msg = answer + _format_sources(sources)
        dispatcher.utter_message(text=msg)

        return [
            SlotSet("last_query", query),
            SlotSet("last_answer", answer),
            SlotSet("last_sources", sources),
        ]


# ── action_search_papers ───────────────────────────────────────────────────

class ActionSearchPapers(Action):
    """
    Document search action.
    Calls GET /api/search with topic/author/year filters.
    """

    def name(self) -> Text:
        return "action_search_papers"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[EventType]:

        query  = _build_search_query(tracker)
        topic  = tracker.get_slot("topic")
        author = tracker.get_slot("author")
        year   = tracker.get_slot("year")

        params: Dict[str, Any] = {"q": query, "top_k": 8}
        if author:
            params["author"] = author
        if year:
            params["year"] = year

        data = _api_get("/api/search", params)

        if not data:
            dispatcher.utter_message(response="utter_no_results")
            return []

        results: List[Dict] = data.get("results", data.get("hits", []))
        total: int = data.get("total", len(results))

        if not results:
            dispatcher.utter_message(response="utter_no_results")
            return []

        # Build response
        header = f"📄 Found **{total}** result{'s' if total != 1 else ''}"
        if topic:
            header += f" for *{topic}*"
        if author:
            header += f" by *{author}*"
        if year:
            header += f" ({year})"
        header += ":"

        lines = [header, ""]
        for i, r in enumerate(results[:6], 1):
            title  = r.get("title", "Untitled")
            author_ = r.get("author", "")
            year_  = r.get("year", "")
            url    = r.get("url", "")
            snippet = r.get("snippet", r.get("abstract", ""))[:120]
            meta   = " · ".join(filter(None, [author_, str(year_) if year_ else ""]))

            if url:
                lines.append(f"**{i}.** [{title}]({url})")
            else:
                lines.append(f"**{i}.** {title}")
            if meta:
                lines.append(f"   *{meta}*")
            if snippet:
                lines.append(f"   {snippet}…")
            lines.append("")

        if total > 6:
            lines.append(
                f"*… and {total - 6} more. "
                f"[View all results]({ROSERAG_API}/app/search?q={requests.utils.quote(query)})*"
            )

        dispatcher.utter_message(text="\n".join(lines))

        return [
            SlotSet("last_query", query),
            SlotSet("search_results_count", float(total)),
            SlotSet("last_sources", results[:8]),
        ]


# ── action_get_recommendations ────────────────────────────────────────────

class ActionGetRecommendations(Action):
    """
    Related paper recommendations.
    Calls GET /api/recommendations using the last query or current topic.
    """

    def name(self) -> Text:
        return "action_get_recommendations"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[EventType]:

        # Use last query, or fall back to topic slot, or raw message
        seed = (
            tracker.get_slot("last_query")
            or tracker.get_slot("topic")
            or tracker.latest_message.get("text", "")
        )

        if not seed:
            dispatcher.utter_message(
                text="What topic would you like recommendations for?"
            )
            return []

        data = _api_get("/api/recommendations", {"q": seed, "limit": 6})

        if not data:
            # Fallback: run a search and present it as recommendations
            data = _api_get("/api/search", {"q": seed, "top_k": 6})

        if not data:
            dispatcher.utter_message(response="utter_no_results")
            return []

        recs: List[Dict] = data.get("recommendations", data.get("results", []))

        if not recs:
            dispatcher.utter_message(response="utter_no_results")
            return []

        lines = [f"💡 **Recommended reading** on *{seed}*:", ""]
        for i, r in enumerate(recs[:6], 1):
            title   = r.get("title", "Untitled")
            author_ = r.get("author", "")
            year_   = r.get("year", "")
            url     = r.get("url", "")
            score   = r.get("score", r.get("relevance", 0))
            meta    = " · ".join(filter(None, [author_, str(year_) if year_ else ""]))

            if url:
                lines.append(f"**{i}.** [{title}]({url})")
            else:
                lines.append(f"**{i}.** {title}")
            if meta:
                lines.append(f"   *{meta}*")
            if score:
                pct = min(100, int(float(score) * 100))
                lines.append(f"   Relevance: {pct}%")
            lines.append("")

        dispatcher.utter_message(text="\n".join(lines))
        return [SlotSet("last_sources", recs[:6])]


# ── action_browse_collection ──────────────────────────────────────────────

class ActionBrowseCollection(Action):
    """
    Browse a DSpace collection via the RoseRAG bridge API.
    Calls GET /api/dspace/collections or /api/dspace/browse.
    """

    def name(self) -> Text:
        return "action_browse_collection"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[EventType]:

        collection = tracker.get_slot("collection")

        if not collection:
            # List all collections
            data = _api_get("/api/dspace/collections")
            if not data:
                dispatcher.utter_message(
                    text=f"Browse the full repository at: {DSPACE_URL}"
                )
                return []

            cols: List[Dict] = data.get("collections", data if isinstance(data, list) else [])
            if not cols:
                dispatcher.utter_message(
                    text=f"Browse the full repository: [{DSPACE_URL}]({DSPACE_URL})"
                )
                return []

            lines = ["📚 **Available Collections:**", ""]
            for c in cols[:12]:
                name  = c.get("name", c.get("title", ""))
                count = c.get("numberItems", c.get("count", ""))
                url   = c.get("handle", "")
                entry = f"• {name}"
                if count:
                    entry += f" ({count} items)"
                if url:
                    full_url = f"{DSPACE_URL}/handle/{url}" if not url.startswith("http") else url
                    entry = f"• [{name}]({full_url})"
                    if count:
                        entry += f" ({count} items)"
                lines.append(entry)
            dispatcher.utter_message(text="\n".join(lines))
            return []

        # Browse specific collection
        data = _api_get("/api/dspace/browse", {"collection": collection, "limit": 8})

        if not data:
            dspace_search = f"{DSPACE_URL}/discover?query={requests.utils.quote(collection)}"
            dispatcher.utter_message(
                text=f"🔗 Browse the **{collection}** collection directly:\n{dspace_search}"
            )
            return []

        items: List[Dict] = data.get("items", data.get("results", []))
        total: int = data.get("total", len(items))

        lines = [f"📂 **{collection}** — {total} item{'s' if total != 1 else ''}:", ""]
        for item in items[:8]:
            title  = item.get("title", "Untitled")
            author_ = item.get("author", "")
            year_  = item.get("year", item.get("date", ""))
            url    = item.get("url", item.get("handle", ""))
            meta   = " · ".join(filter(None, [author_, str(year_) if year_ else ""]))
            if url:
                full_url = f"{DSPACE_URL}/handle/{url}" if not url.startswith("http") else url
                lines.append(f"• [{title}]({full_url})" + (f" — *{meta}*" if meta else ""))
            else:
                lines.append(f"• **{title}**" + (f" — *{meta}*" if meta else ""))

        if total > 8:
            browse_url = f"{DSPACE_URL}/discover?query={requests.utils.quote(collection)}"
            lines.append(f"\n*[View all {total} items →]({browse_url})*")

        dispatcher.utter_message(text="\n".join(lines))
        return [SlotSet("last_query", collection)]


# ── action_show_sources ───────────────────────────────────────────────────

class ActionShowSources(Action):
    """Display the sources (citations) from the last RAG answer or search."""

    def name(self) -> Text:
        return "action_show_sources"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[EventType]:

        sources = tracker.get_slot("last_sources")
        last_q  = tracker.get_slot("last_query")

        if not sources:
            if last_q:
                dispatcher.utter_message(
                    text=f"I don't have stored sources for that query. "
                         f"Try searching again: *{last_q}*"
                )
            else:
                dispatcher.utter_message(
                    text="No sources stored yet. Ask a research question first!"
                )
            return []

        lines = ["📚 **Sources for your last query:**", ""]
        for i, s in enumerate(sources[:8], 1):
            title  = s.get("title", "Untitled")
            author_ = s.get("author", "")
            year_  = s.get("year", "")
            url    = s.get("url", "")
            score  = s.get("score", None)
            meta   = " · ".join(filter(None, [author_, str(year_) if year_ else ""]))

            if url:
                lines.append(f"**{i}.** [{title}]({url})")
            else:
                lines.append(f"**{i}.** {title}")
            if meta:
                lines.append(f"   *{meta}*")
            if score is not None:
                pct = min(100, int(float(score) * 100))
                lines.append(f"   Relevance: {pct}%")
            lines.append("")

        dispatcher.utter_message(text="\n".join(lines))
        return []


# ── action_clear_filters ──────────────────────────────────────────────────

class ActionClearFilters(Action):
    """Reset all search filter slots."""

    def name(self) -> Text:
        return "action_clear_filters"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[EventType]:

        dispatcher.utter_message(response="utter_filters_cleared")
        return [
            SlotSet("topic", None),
            SlotSet("author", None),
            SlotSet("year", None),
            SlotSet("collection", None),
            SlotSet("last_query", None),
            SlotSet("search_results_count", None),
        ]
