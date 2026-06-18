from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Ollama (local dev, used when llm_provider = "ollama") ───────
    ollama_base_url: str = "http://localhost:11434"
    ollama_chat_model: str = "llama3.2"
    ollama_embed_model: str = "nomic-embed-text"

    # ── Cloud LLM provider (used when llm_provider = "openai") ──────
    # Provider selection: "ollama" (default) or "openai" (any OpenAI-compat API)
    llm_provider: str = "ollama"

    # Chat — pre-configured for DeepSeek; override with CHAT_MODEL env var
    llm_api_key: str = ""
    llm_api_base: str = "https://api.deepseek.com"
    chat_model: str = "deepseek-chat"

    # Embeddings — pre-configured for Jina AI; override with EMBED_* env vars
    embed_api_key: str = ""
    embed_api_base: str = "https://api.jina.ai"
    embed_model: str = "jina-embeddings-v2-base-en"

    # ── Qdrant ───────────────────────────────────────────────────────
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str = ""
    qdrant_use_https: bool = False
    collection_name: str = "roserag"

    # ── RAG ──────────────────────────────────────────────────────────
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 5
    data_dir: str = "data"

    model_config = {"env_file": ".env"}


settings = Settings()
