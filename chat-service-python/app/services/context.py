from typing import List, Dict, Any
import logging

# Set up logger for this module
logger = logging.getLogger(__name__)


class ContextService:
    """
    Service for managing conversation context and request processing.

    This class provides utility methods for:
    1. Formatting source information for the client
    2. Validating incoming requests
    3. Preparing conversation history for the LLM
    """

    @staticmethod
    def format_sources(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Format document chunks into a standardized source reference format.

        This method extracts key metadata from document chunks to create
        source citations that can be displayed to the user. It ensures
        consistent structure even if some fields are missing.

        Args:
            chunks: List of document chunks used to answer the query

        Returns:
            List of formatted source reference objects
        """
        out = []
        for ch in chunks:
            out.append(
                {
                    # File identifier for retrieving the original document
                    "file_id": ch.get("file_id", ""),
                    # Human-readable filename for display
                    "filename": ch.get("filename", "Unknown"),
                    # Page number (defaulting to 0 if not available)
                    "page_number": ch.get("page_number", 0) or 0,
                    # Position within document (for ordering/reference)
                    "chunk_index": ch.get("chunk_index", 0) or 0,
                    # Relevance score as float (0.0-1.0)
                    "similarity_score": float(ch.get("similarity_score", 0.0)),
                }
            )
        return out

    @staticmethod
    def validate_request(req) -> tuple[bool, str]:
        """
        Validate that an incoming chat request meets basic requirements.

        This method performs validation checks to ensure that:
        1. The message is not empty
        2. A project ID is specified
        3. The message length is within acceptable limits

        Args:
            req: The request object containing message and project_id

        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: Boolean indicating if the request is valid
            - error_message: String with error details if invalid, empty if valid
        """
        # Check for empty message
        if not req.message.strip():
            return False, "Message cannot be empty"

        # Check for missing project ID
        if not req.project_id.strip():
            return False, "Project ID is required"

        # Check message length (prevent very long messages)
        if len(req.message) > 10000:
            return False, "Message too long (max 10,000 chars)"

        # All checks passed
        return True, ""

    @staticmethod
    def prepare_history(grpc_history) -> List[Dict[str, Any]]:
        """
        Convert gRPC message history objects to Python dictionaries.

        This method transforms protocol buffer message objects from gRPC
        into standard Python dictionaries that can be used by the LLM service.

        Args:
            grpc_history: List of history message objects from gRPC

        Returns:
            List of message dictionaries with content, role, and timestamp
        """
        hist = []
        for m in grpc_history:
            hist.append(
                {
                    "content": m.content,  # Message text
                    "role": m.role,  # Either "user" or "assistant"
                    "timestamp": m.timestamp,  # When the message was sent
                }
            )
        return hist


# Create a singleton instance of the service for use throughout the application
context_service = ContextService()
