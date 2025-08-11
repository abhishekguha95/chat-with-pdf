"""
Worker Package

Contains worker processes for background job processing,
specifically PDF document processing and embedding generation.
"""

from .pdf_processor import PDFProcessor

# Package metadata
__version__ = "1.0.0"
__description__ = "Background workers for PDF processing"

# Define what gets imported with "from worker import *"
__all__ = [
    "PDFProcessor",
]

# Worker-specific logging configuration
import logging

def setup_worker_logging():
    """Configure logging specifically for worker processes"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - [WORKER] - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),  # Console output
            # Uncomment for file logging:
            # logging.FileHandler('/var/log/pdf-processor.log')
        ]
    )
    
    # Set specific log levels for external libraries
    logging.getLogger('pika').setLevel(logging.WARNING)  # Reduce RabbitMQ noise
    logging.getLogger('urllib3').setLevel(logging.WARNING)  # Reduce HTTP noise
    logging.getLogger('sentence_transformers').setLevel(logging.INFO)
    
    logger = logging.getLogger(__name__)
    logger.info("Worker package logging configured")

# Optional: Auto-setup logging when worker package is imported
# setup_worker_logging()
