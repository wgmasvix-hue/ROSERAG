from typing import List
import httpx
from ..config import settings


async def embed_text(text: str) -> List[float]:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.ollama_base_url}/api/embeddings",
            json={"model": settings.embed_model, "prompt": text},
        )
        response.raise_for_status()
        return response.json()["embedding"]


async def embed_batch(texts: List[str]) -> List[List[float]]:
    embeddings = []
    for text in texts:
        embedding = await embed_text(text)
        embeddings.append(embedding)
    return embeddings
