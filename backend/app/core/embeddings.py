from typing import List
from .llm_client import get_embedding


async def embed_text(text: str) -> List[float]:
    return await get_embedding(text)


async def embed_batch(texts: List[str]) -> List[List[float]]:
    embeddings = []
    for text in texts:
        embedding = await embed_text(text)
        embeddings.append(embedding)
    return embeddings
