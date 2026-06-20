"""
LLM provider abstraction.

Two modes via LLM_PROVIDER env var:
  "ollama"  (default) — local Ollama; uses OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL,
                         OLLAMA_EMBED_MODEL
  "openai"  — any OpenAI-compatible API (DeepSeek, Groq, OpenAI, Together…)
               Chat:       LLM_API_KEY + LLM_API_BASE + CHAT_MODEL
               Embeddings: EMBED_API_KEY + EMBED_API_BASE + EMBED_MODEL

Defaults are pre-configured for DeepSeek (chat) + Jina AI (embeddings).
On Vercel you only need to set LLM_API_KEY; effective_provider auto-promotes to openai.

DeepSeek Reasoner (R1):
  Set REASONER_MODEL=deepseek-reasoner to enable the chain-of-thought agent.
  The R1 API returns reasoning_content (thinking) separately from content (answer).
"""

import json as _json
from typing import List, Dict, Tuple, AsyncGenerator
import httpx
from ..config import settings


# ── Model / URL helpers ────────────────────────────────────────────────────────

def _chat_model() -> str:
    return settings.chat_model if settings.effective_provider == "openai" else settings.ollama_chat_model


def _reasoner_model() -> str:
    return settings.reasoner_model if settings.effective_provider == "openai" else settings.ollama_chat_model


def _embed_model() -> str:
    return settings.embed_model if settings.effective_provider == "openai" else settings.ollama_embed_model


def _chat_url() -> str:
    if settings.effective_provider == "openai":
        return f"{settings.llm_api_base.rstrip('/')}/v1/chat/completions"
    return f"{settings.ollama_base_url}/api/chat"


def _embed_url() -> str:
    if settings.effective_provider == "openai":
        base = (settings.embed_api_base or settings.llm_api_base).rstrip("/")
        return f"{base}/v1/embeddings"
    return f"{settings.ollama_base_url}/api/embeddings"


def _chat_headers() -> Dict[str, str]:
    key = settings.llm_api_key
    return {"Authorization": f"Bearer {key}"} if key else {}


def _embed_headers() -> Dict[str, str]:
    key = settings.embed_api_key or settings.llm_api_key
    return {"Authorization": f"Bearer {key}"} if key else {}


def _is_jina_v5() -> bool:
    return "jina-embeddings-v5" in settings.embed_model


def _check_config(for_what: str, need_embed: bool = False) -> None:
    if settings.effective_provider != "openai":
        return
    if not settings.llm_api_key:
        raise RuntimeError(
            f"{for_what} needs LLM_API_KEY. "
            "Set it in Vercel → Settings → Environment Variables, then redeploy."
        )
    if need_embed and not (settings.embed_api_key or settings.llm_api_key):
        raise RuntimeError(
            "Embeddings need EMBED_API_KEY (your Jina AI key). "
            "Set it in Vercel → Settings → Environment Variables, then redeploy."
        )


# ── Chat ───────────────────────────────────────────────────────────────────────

async def chat_complete(messages: List[Dict[str, str]], timeout: float = 120.0) -> str:
    """Send a chat request and return the assistant content string."""
    _check_config("Chat")
    payload = {"model": _chat_model(), "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(_chat_url(), json=payload, headers=_chat_headers())
        r.raise_for_status()
        data = r.json()
    if settings.effective_provider == "openai":
        return data["choices"][0]["message"]["content"]
    return data["message"]["content"]


async def chat_complete_stream(
    messages: List[Dict[str, str]], timeout: float = 120.0
) -> AsyncGenerator[str, None]:
    """Yield text tokens as they stream from the LLM."""
    _check_config("Chat")
    payload = {"model": _chat_model(), "messages": messages, "stream": True}
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", _chat_url(), json=payload, headers=_chat_headers()) as r:
            r.raise_for_status()
            async for raw in r.aiter_lines():
                line = raw.strip()
                if not line:
                    continue
                if settings.effective_provider == "openai":
                    if line.startswith("data: "):
                        chunk = line[6:]
                        if chunk == "[DONE]":
                            break
                        try:
                            obj = _json.loads(chunk)
                            delta = obj["choices"][0]["delta"].get("content") or ""
                            if delta:
                                yield delta
                        except Exception:
                            continue
                else:
                    try:
                        obj = _json.loads(line)
                        token = (obj.get("message") or {}).get("content") or ""
                        if token:
                            yield token
                        if obj.get("done"):
                            break
                    except Exception:
                        continue


async def chat_complete_with_reasoning(
    messages: List[Dict[str, str]], timeout: float = 180.0
) -> Tuple[str, str]:
    """Call DeepSeek R1 and return (answer, reasoning_chain)."""
    _check_config("Chat")
    if settings.effective_provider != "openai":
        answer = await chat_complete(messages, timeout=timeout)
        return answer, ""
    payload = {"model": _reasoner_model(), "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(_chat_url(), json=payload, headers=_chat_headers())
        r.raise_for_status()
        data = r.json()
    msg = data["choices"][0]["message"]
    return msg.get("content") or "", msg.get("reasoning_content") or ""


# ── Embeddings ─────────────────────────────────────────────────────────────────

async def get_embedding(
    text: str, timeout: float = 60.0, task: str = "retrieval.query"
) -> List[float]:
    """Return the embedding vector for a single text string."""
    _check_config("Embeddings", need_embed=True)
    async with httpx.AsyncClient(timeout=timeout) as client:
        if settings.effective_provider == "openai":
            payload: Dict = {"model": _embed_model(), "input": text}
            if _is_jina_v5():
                payload["task"] = task
            r = await client.post(_embed_url(), json=payload, headers=_embed_headers())
            r.raise_for_status()
            return r.json()["data"][0]["embedding"]
        else:
            r = await client.post(
                _embed_url(), json={"model": _embed_model(), "prompt": text}
            )
            r.raise_for_status()
            return r.json()["embedding"]
