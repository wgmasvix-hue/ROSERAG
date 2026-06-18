from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    embed_model: str = "nomic-embed-text"
    chat_model: str = "llama3.2"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str = ""
    qdrant_use_https: bool = False
    collection_name: str = "roserag"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 5
    data_dir: str = "data"
    # LLM provider: "ollama" (default) or "openai" (any OpenAI-compatible API)
    llm_provider: str = "ollama"
    llm_api_key: str = ""       # API key for cloud provider
    llm_api_base: str = ""      # e.g. https://api.groq.com/openai  (blank = OpenAI)
    embed_api_base: str = ""    # separate base URL for embeddings (blank = llm_api_base)
    embed_api_key: str = ""     # separate key for embeddings (blank = llm_api_key)

    model_config = {"env_file": ".env"}


settings = Settings()
