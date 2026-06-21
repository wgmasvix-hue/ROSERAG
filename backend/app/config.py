from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Institution branding ─────────────────────────────────────────
    institution_name: str = "Institutional Intelligence Platform"
    institution_tagline: str = "Retrieve · Reason · Respond"
    brand_prefix: str = "ROSE"
    brand_suffix: str = "RAG"
    brand_color_primary: str = "#9b2248"
    brand_color_accent: str = "#d44e72"

    # ── DeepSeek (chat) ──────────────────────────────────────────────
    llm_api_key: str = ""
    llm_api_base: str = "https://api.deepseek.com"
    chat_model: str = "deepseek-chat"
    reasoner_model: str = "deepseek-reasoner"

    # ── Jina AI (embeddings) ─────────────────────────────────────────
    embed_api_key: str = ""
    embed_api_base: str = "https://api.jina.ai"
    embed_model: str = "jina-embeddings-v5-omni-nano"

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

    # ── DSpace Bridge ────────────────────────────────────────────────
    dspace_url: str = ""
    dspace_token: str = ""

    # ── Google Drive OAuth ───────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    app_url: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
