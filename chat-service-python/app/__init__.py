"""
Chat Service Application Package

This is the main package for the Chat-with-PDF service, which provides:
1. Document storage and retrieval using vector embeddings
2. Semantic search capabilities for finding relevant information
3. LLM-powered responses based on document context
4. Streaming responses for a better user experience

The application follows a modular design with separated concerns:
- Config: Application-wide settings
- Database: Connection and session management
- Models: SQLAlchemy ORM data models
- Services: Business logic components
"""

# Import application configuration
from .config import config

# Import database components for connection management
from .database import engine, SessionLocal, get_db, test_connection

# Import SQLAlchemy models for document storage
from .models import Project, File, Chunk

# Import service components that provide core functionality
# - retrieval_service: Handles semantic search and vector embeddings
# - llm_service: Manages interactions with the language model
# - context_service: Processes conversation context and formatting
from .services.retrieval import retrieval_service
from .services.llm import llm_service
from .services.context import context_service

# Application metadata
version = "1.0.0"  # Semantic versioning (MAJOR.MINOR.PATCH)
description = "Chat service with RAG and streaming LLM responses"

# Export public components for easy imports elsewhere in the application
# This allows other modules to use "from app import X" instead of deeper imports
all = [
    # Configuration
    "config",
    # Database components
    "engine",
    "SessionLocal",
    "get_db",
    "test_connection",
    # Data models
    "Project",
    "File",
    "Chunk",
    "ProcessingJob",
    # Service components
    "retrieval_service",
    "llm_service",
    "context_service",
]
