import asyncio
from typing import List
from .llm_client import get_embedding

_SEM = asyncio.Semaphore(8)  # cap concurrent embed requests to avoid rate limits


async def embed_text(text: str) -> List[float]:
    return await get_embedding(text, task="retrieval.query")


async def embed_batch(texts: List[str]) -> List[List[float]]:
    async def _one(t: str) -> List[float]:
        async with _SEM:
            return await get_embedding(t, task="retrieval.passage")

    return list(await asyncio.gather(*[_one(t) for t in texts]))
