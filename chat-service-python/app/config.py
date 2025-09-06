import os


class Config:
    """
    Application configuration class that loads settings from environment variables
    with sensible defaults. This centralized configuration approach makes the app
    easier to deploy in different environments (development, testing, production).
    """

    # Database connection string
    # Format: postgresql+psycopg://[username]:[password]@[host]:[port]/[database_name]
    # psycopg is the PostgreSQL adapter for Python
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/chatpdf",
    )

    # Embedding model for vectorizing text
    # MiniLM-L6-v2 is a lightweight sentence transformer that produces 384-dimensional embeddings
    # and offers a good balance between performance and resource usage
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )

    # Retrieval configuration
    # MAX_CONTEXT_LENGTH: Maximum number of tokens/characters to include in context window for the LLM
    MAX_CONTEXT_LENGTH: int = int(os.getenv("MAX_CONTEXT_LENGTH", "4000"))

    # TOP_K_RESULTS: Number of document chunks to retrieve during semantic search
    TOP_K_RESULTS: int = int(os.getenv("TOP_K_RESULTS", "5"))

    # MIN_SIMILARITY_SCORE: Threshold for semantic similarity (0-1 scale)
    # Documents with scores below this threshold won't be included in context
    MIN_SIMILARITY_SCORE: float = float(os.getenv("MIN_SIMILARITY_SCORE", "0.3"))

    # LLM configuration using Ollama
    # OLLAMA_HOST: URL where Ollama server is running
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")

    # OLLAMA_MODEL: The language model to use for generating responses
    # llama3.1 is Meta's open LLM that offers strong performance for various tasks
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1")

    # gRPC server configuration
    # Port on which the gRPC server will listen for client connections
    GRPC_PORT: int = int(os.getenv("GRPC_PORT", "50051"))

    # Hugging Face cache directory
    # Used to store downloaded models to avoid re-downloading them on restart
    # Important for containerized environments to maintain persistence
    HF_HOME: str = os.getenv("HF_HOME", "/cache/hf")


# Create a singleton config instance for import throughout the application
config = Config()
