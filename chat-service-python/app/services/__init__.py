# Import service singletons from each service module
# These provide the core functionality of the chat-with-pdf application
from .retrieval import retrieval_service  # Handles vector search and document retrieval
from .llm import llm_service  # Interfaces with the LLM for generating responses
from .context import context_service  # Manages conversation context and formatting

# Export service instances for easy import elsewhere in the application
# This allows other modules to use "from app.services import llm_service" etc.
all = ["retrieval_service", "llm_service", "context_service"]
