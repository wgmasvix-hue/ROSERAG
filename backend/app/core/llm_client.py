"""
LLM provider abstraction.

Two modes via LLM_PROVIDER env var:
  "ollama"  (default) — local Ollama; uses OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL,
                         OLLAMA_EMBED_MODEL
  "openai"  — any OpenAI-compatible API (DeepSeek, Groq, OpenAI, Together…)
               Chat:       LLM_API_KEY + LLM_API_BASE + CHAT_MODEL
               Embeddings: EMBED_API_KEY + EMBED_API_BASE + EMBED_MODEL

Defaults are pre-configured for DeepSeek (chat) + Jina AI (embeddings).
On Vercel you only need to set LLM_PROVIDER=openai, LLM_API_KEY, EMBED_API_KEY,
and the three Qdrant vars.

DeepSeek Reasoner (R1):
  Set REASONER_MODEL=deepseek-reasoner to enable the chain-of-thought agent.
  The R1 API returns reasoning_content (thinking) separately from content (answer).
"""

from typing import List, Dict, Tuple
import httpx
from ..config import settings


def _chat_model() -> str:
    return settings.chat_model if settings.llm_provider == "openai" else settings.ollama_chat_model


def _reasoner_model() -> str:
    return settings.reasoner_model if settings.llm_provider == "openai" else settings.ollama_chat_model


def _embed_model() -> str:
    return settings.embed_model if settings.llm_provider == "openai" else settings.ollama_embed_model


def _chat_url() -> str:
    if settings.llm_provider == "openai":
        return f"{settings.llm_api_base.rstrip('/')}/v1/chat/completions"
    return f"{settings.ollama_base_url}/api/chat"


def _embed_url() -> str:
    if settings.llm_provider == "openai":
        base = (settings.embed_api_base or settings.llm_api_base).rstrip("/")
        return f"{base}/v1/embeddings"
    return f"{settings.ollama_base_url}/api/embeddings"


def _chat_headers() -> Dict[str, str]:
    key = settings.llm_api_key
    return {"Authorization": f"Bearer {key}"} if key else {}


def _embed_headers() -> Dict[str, str]:
    key = settings.embed_api_key or settings.llm_api_key
    return {"Authorization": f"Bearer {key}"} if key else {}


def _check_config(for_what: str, need_embed: bool = False) -> None:
    if settings.llm_provider != "openai":
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


async def chat_complete(messages: List[Dict[str, str]], timeout: float = 120.0) -> str:
    """Send a chat request and return the assistant content string."""
    _check_config("Chat")
    url = _chat_url()
    payload = {"model": _chat_model(), "messages": messages, "stream": False}

    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(url, json=payload, headers=_chat_headers())
        r.raise_for_status()
        data = r.json()

    if settings.llm_provider == "openai":
        return data["choices"][0]["message"]["content"]
    return data["message"]["content"]


async def chat_complete_with_reasoning(
    messages: List[Dict[str, str]], timeout: float = 180.0
) -> Tuple[str, str]:
    """Call DeepSeek Reasoner (R1) and return (answer, reasoning_chain).

    The R1 model returns reasoning_content (chain-of-thought) alongside the
    final answer. Falls back to chat_complete when using Ollama or when
    reasoner_model == chat_model (same model).
    Returns: (answer_text, reasoning_text)
    """
    _check_config("Chat")

    if settings.llm_provider != "openai":
        answer = await chat_complete(messages, timeout=timeout)
        return answer, ""

    url = _chat_url()
    payload = {"model": _reasoner_model(), "messages": messages, "stream": False}

    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(url, json=payload, headers=_chat_headers())
        r.raise_for_status()
        data = r.json()

    msg = data["choices"][0]["message"]
    answer = msg.get("content") or ""
    reasoning = msg.get("reasoning_content") or ""
    return answer, reasoning


def _is_jina_v5() -> bool:
    return "jina-embeddings-v5" in settings.embed_model


async def get_embedding(
    text: str, timeout: float = 60.0, task: str = "retrieval.query"
) -> List[float]:
    """Return the embedding vector for a single text string."""
    _check_config("Embeddings", need_embed=True)
    url = _embed_url()

    async with httpx.AsyncClient(timeout=timeout) as client:
        if settings.llm_provider == "openai":
            payload: Dict = {"model": _embed_model(), "input": text}
            if _is_jina_v5():
                payload["task"] = task
            r = await client.post(url, json=payload, headers=_embed_headers())
            r.raise_for_status()
            return r.json()["data"][0]["embedding"]
        else:
            r = await client.post(
                url,
                json={"model": _embed_model(), "prompt": text},
            )
            r.raise_for_status()
            return r.json()["embedding"]



def _chat_model() -> str:
    return settings.chat_model if settings.llm_provider == "openai" else settings.ollama_chat_model


def _embed_model() -> str:
    return settings.embed_model if settings.llm_provider == "openai" else settings.ollama_embed_model


def _chat_url() -> str:
    if settings.llm_provider == "openai":
        return f"{settings.llm_api_base.rstrip('/')}/v1/chat/completions"
    return f"{settings.ollama_base_url}/api/chat"


def _embed_url() -> str:
    if settings.llm_provider == "openai":
        base = (settings.embed_api_base or settings.llm_api_base).rstrip("/")
        return f"{base}/v1/embeddings"
    return f"{settings.ollama_base_url}/api/embeddings"


def _chat_headers() -> Dict[str, str]:
    key = settings.llm_api_key
    return {"Authorization": f"Bearer {key}"} if key else {}


def _embed_headers() -> Dict[str, str]:
    key = settings.embed_api_key or settings.llm_api_key
    return {"Authorization": f"Bearer {key}"} if key else {}


def _check_config(for_what: str, need_embed: bool = False) -> None:
    if settings.llm_provider != "openai":
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


async def chat_complete(messages: List[Dict[str, str]], timeout: float = 120.0) -> str:
    """Send a chat request and return the assistant content string."""
    _check_config("Chat")
    url = _chat_url()
    payload = {"model": _chat_model(), "messages": messages, "stream": False}

    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(url, json=payload, headers=_chat_headers())
        r.raise_for_status()
        data = r.json()

    if settings.llm_provider == "openai":
        return data["choices"][0]["message"]["content"]
    return data["message"]["content"]


def _is_jina_v5() -> bool:
    return "jina-embeddings-v5" in settings.embed_model


async def get_embedding(
    text: str, timeout: float = 60.0, task: str = "retrieval.query"
) -> List[float]:
    """Return the embedding vector for a single text string."""
    _check_config("Embeddings", need_embed=True)
    url = _embed_url()

    async with httpx.AsyncClient(timeout=timeout) as client:
        if settings.llm_provider == "openai":
            payload: Dict = {"model": _embed_model(), "input": text}
            # Jina v5 supports task hints for improved retrieval accuracy
            if _is_jina_v5():
                payload["task"] = task
            r = await client.post(url, json=payload, headers=_embed_headers())
            r.raise_for_status()
            return r.json()["data"][0]["embedding"]
        else:
            r = await client.post(
                url,
                json={"model": _embed_model(), "prompt": text},
            )
            r.raise_for_status()
            return r.json()["embedding"]
