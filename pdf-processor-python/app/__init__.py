"""
PDF Processor Application Package

This package contains the core application logic for processing PDF documents,
including configuration, database models, and services for embedding generation.
"""

# Import key components for easy access
from .config import config
from .database import engine, SessionLocal, get_db, init_db, test_connection
from .models import Project, File, Chunk

# Import services
from .services.minio_client import minio_client
from .services.embeddings import embedding_service
from .services.storage import storage_service

# Package metadata
__version__ = "1.0.0"
__author__ = "Your Team"
__description__ = "PDF processing service with LangChain and embeddings"

# Define what gets imported with "from app import *"
__all__ = [
    # Configuration
    "config",
    
    # Database
    "engine",
    "SessionLocal", 
    "get_db",
    "init_db",
    "test_connection",
    
    # Models
    "Project",
    "File", 
    "Chunk",
    
    # Services
    "minio_client",
    "embedding_service",
    "storage_service",
]

# Package initialization
def initialize_app():
    """Initialize the application with required setup"""
    import logging
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(__name__)
    logger.info("PDF Processor Application initialized")
    
    # Test database connection on startup
    if test_connection():
        logger.info("Database connection verified")
        init_db()
        logger.info("Database initialization complete")
    else:
        logger.error("Database connection failed during initialization")
        raise Exception("Failed to connect to database")

# Optional: Auto-initialize when package is imported
# Uncomment if you want automatic initialization
# initialize_app()
