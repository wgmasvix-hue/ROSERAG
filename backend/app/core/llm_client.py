"""
LLM client — DeepSeek via OpenAI-compatible API.

Chat:       LLM_API_KEY + LLM_API_BASE + CHAT_MODEL
            Defaults: https://api.deepseek.com / deepseek-chat
Reasoner:   REASONER_MODEL=deepseek-reasoner (R1 chain-of-thought)
            Returns reasoning_content (thinking) + content (answer) separately.
Embeddings: EMBED_API_KEY + EMBED_API_BASE + EMBED_MODEL
            Defaults: https://api.jina.ai / jina-embeddings-v5-omni-nano
"""

import json as _json
from typing import List, Dict, Tuple, AsyncGenerator
import httpx
from ..config import settings


# ── URL / header helpers ───────────────────────────────────────────────────────

def _chat_url() -> str:
    return f"{settings.llm_api_base.rstrip('/')}/v1/chat/completions"


def _embed_url() -> str:
    base = (settings.embed_api_base or settings.llm_api_base).rstrip("/")
    return f"{base}/v1/embeddings"


def _chat_headers() -> Dict[str, str]:
    return {"Authorization": f"Bearer {settings.llm_api_key}"}


def _embed_headers() -> Dict[str, str]:
    key = settings.embed_api_key or settings.llm_api_key
    return {"Authorization": f"Bearer {key}"}


def _is_jina_v5() -> bool:
    return "jina-embeddings-v5" in settings.embed_model


def _check_api_key(for_what: str, embed: bool = False) -> None:
    if not settings.llm_api_key:
        raise RuntimeError(
            f"{for_what} requires LLM_API_KEY (your DeepSeek key). "
            "Add it to .env or Vercel → Settings → Environment Variables."
        )
    if embed and not (settings.embed_api_key or settings.llm_api_key):
        raise RuntimeError(
            "Embeddings require EMBED_API_KEY (your Jina AI key). "
            "Add it to .env or Vercel → Settings → Environment Variables."
        )


# ── Chat ───────────────────────────────────────────────────────────────────────

async def chat_complete(messages: List[Dict[str, str]], timeout: float = 120.0) -> str:
    """Send a chat request to DeepSeek and return the assistant reply."""
    _check_api_key("Chat")
    payload = {"model": settings.chat_model, "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(_chat_url(), json=payload, headers=_chat_headers())
        r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


async def chat_complete_stream(
    messages: List[Dict[str, str]], timeout: float = 120.0
) -> AsyncGenerator[str, None]:
    """Yield text tokens as they stream from DeepSeek."""
    _check_api_key("Chat")
    payload = {"model": settings.chat_model, "messages": messages, "stream": True}
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", _chat_url(), json=payload, headers=_chat_headers()) as r:
            r.raise_for_status()
            async for raw in r.aiter_lines():
                line = raw.strip()
                if not line or not line.startswith("data: "):
                    continue
                chunk = line[6:]
                if chunk == "[DONE]":
                    break
                try:
                    delta = _json.loads(chunk)["choices"][0]["delta"].get("content") or ""
                    if delta:
                        yield delta
                except Exception:
                    continue


async def chat_complete_with_reasoning(
    messages: List[Dict[str, str]], timeout: float = 180.0
) -> Tuple[str, str]:
    """Call DeepSeek R1 and return (answer, reasoning_chain)."""
    _check_api_key("Chat")
    payload = {"model": settings.reasoner_model, "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(_chat_url(), json=payload, headers=_chat_headers())
        r.raise_for_status()
    msg = r.json()["choices"][0]["message"]
    return msg.get("content") or "", msg.get("reasoning_content") or ""


# ── Embeddings ─────────────────────────────────────────────────────────────────

async def get_embedding(
    text: str, timeout: float = 60.0, task: str = "retrieval.query"
) -> List[float]:
    """Return the embedding vector for a single text string via Jina AI."""
    _check_api_key("Embeddings", embed=True)
    payload: Dict = {"model": settings.embed_model, "input": text}
    if _is_jina_v5():
        payload["task"] = task
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(_embed_url(), json=payload, headers=_embed_headers())
        r.raise_for_status()
    return r.json()["data"][0]["embedding"]
