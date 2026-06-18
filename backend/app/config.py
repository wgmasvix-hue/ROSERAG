from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    embed_model: str = "nomic-embed-text"
    chat_model: str = "llama3.2"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    collection_name: str = "roserag"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 5

    model_config = {"env_file": ".env"}


settings = Settings()
