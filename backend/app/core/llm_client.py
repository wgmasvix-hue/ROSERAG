"""
LLM provider abstraction.

Supports two modes controlled by LLM_PROVIDER env var:
  "ollama"  (default) — local Ollama server at OLLAMA_BASE_URL
  "openai"  — any OpenAI-compatible API (Groq, OpenAI, Together, etc.)
              requires LLM_API_KEY; optionally LLM_API_BASE (default: OpenAI)
              and EMBED_API_BASE / EMBED_API_KEY for a separate embeddings host
"""

from typing import List, Dict
import httpx
from ..config import settings


def _chat_url() -> str:
    if settings.llm_provider == "openai":
        base = (settings.llm_api_base or "https://api.openai.com").rstrip("/")
        return f"{base}/v1/chat/completions"
    return f"{settings.ollama_base_url}/api/chat"


def _embed_url() -> str:
    if settings.llm_provider == "openai":
        base = (settings.embed_api_base or settings.llm_api_base or "https://api.openai.com").rstrip("/")
        return f"{base}/v1/embeddings"
    return f"{settings.ollama_base_url}/api/embeddings"


def _auth_headers(use_embed_key: bool = False) -> Dict[str, str]:
    key = (settings.embed_api_key or settings.llm_api_key) if use_embed_key else settings.llm_api_key
    if key:
        return {"Authorization": f"Bearer {key}"}
    return {}


def _assert_api_key(for_what: str) -> None:
    if settings.llm_provider == "openai" and not settings.llm_api_key:
        raise RuntimeError(
            f"{for_what} requires LLM_API_KEY to be set. "
            "Add it in Vercel → Settings → Environment Variables, then redeploy."
        )


async def chat_complete(messages: List[Dict[str, str]], timeout: float = 120.0) -> str:
    """Send a chat request and return the assistant content string."""
    _assert_api_key("Chat")
    url = _chat_url()
    headers = _auth_headers()

    if settings.llm_provider == "openai":
        payload = {"model": settings.chat_model, "messages": messages, "stream": False}
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
    else:
        payload = {"model": settings.chat_model, "messages": messages, "stream": False}
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            return r.json()["message"]["content"]


async def get_embedding(text: str, timeout: float = 60.0) -> List[float]:
    """Return the embedding vector for a single text string."""
    if settings.llm_provider == "openai":
        embed_key = settings.embed_api_key or settings.llm_api_key
        if not embed_key:
            raise RuntimeError(
                "Embeddings require EMBED_API_KEY (or LLM_API_KEY) to be set. "
                "Add it in Vercel → Settings → Environment Variables, then redeploy."
            )
    url = _embed_url()
    headers = _auth_headers(use_embed_key=True)

    if settings.llm_provider == "openai":
        payload = {"model": settings.embed_model, "input": text}
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            return r.json()["data"][0]["embedding"]
    else:
        payload = {"model": settings.embed_model, "prompt": text}
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            return r.json()["embedding"]
