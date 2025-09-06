"""
gRPC Server implementation for the PDF Chat Service.

This module provides the implementation of the gRPC service for chatting with PDF documents.
It handles incoming requests, processes them using retrieval and language model services,
and streams responses back to clients.
"""

import grpc
from concurrent import futures
import logging
import signal
import sys
from typing import Iterator

# Import generated Protocol Buffer code
from proto.generated import chat_pb2, chat_pb2_grpc

# Import application services and utilities
from app.database import test_connection
from app.services.retrieval import retrieval_service
from app.services.llm import llm_service
from app.services.context import context_service
from app.config import config

# Configure module logger
logger = logging.getLogger(__name__)


class ChatServiceImpl(chat_pb2_grpc.ChatServiceServicer):
    """
    Implementation of the ChatService gRPC interface.

    This class handles the streaming chat interactions between users and PDF documents,
    retrieving relevant context from documents and generating responses.
    """

    def StreamChat(self, request, context) -> Iterator[chat_pb2.ChatResponse]:
        """
        Stream a conversation with documents in a project.

        This method:
        1. Validates the incoming request
        2. Retrieves relevant document chunks based on the query
        3. Prepares conversation history and context
        4. Streams tokens from the LLM as they're generated
        5. Returns sources of information when complete

        Args:
            request: The client request containing message and project info
            context: The gRPC context for the call

        Yields:
            ChatResponse objects with tokens or completion status
        """
        # Validate the incoming request
        ok, err = context_service.validate_request(request)
        if not ok:
            yield chat_pb2.ChatResponse(error=err, complete=True)
            return

        try:
            # Prepare conversation history and retrieve relevant context
            history = context_service.prepare_history(request.chat_history)
            ctx_text, src_chunks = retrieval_service.retrieve_context(
                request.message, request.project_id
            )
        except Exception:
            logger.exception("Error retrieving context:")
            yield chat_pb2.ChatResponse(
                error="Failed to retrieve relevant documents", complete=True
            )
            return

        # Format source information for the response
        sources = context_service.format_sources(src_chunks)
        pb_sources = [
            chat_pb2.DocumentSource(
                file_id=s["file_id"],
                filename=s["filename"],
                page_number=s["page_number"],
                chunk_index=s["chunk_index"],
                similarity_score=s["similarity_score"],
            )
            for s in sources
        ]

        try:
            # Stream tokens from the language model
            sent = 0
            for tok in llm_service.stream_completion(
                ctx_text, request.message, history
            ):
                # Check if client has cancelled the request
                if context.is_cancelled():
                    logger.info("Client cancelled request")
                    break

                # Send each token as it's generated
                yield chat_pb2.ChatResponse(token=tok, complete=False)
                sent += 1

            # Send final message with sources
            yield chat_pb2.ChatResponse(complete=True, sources=pb_sources)
            logger.info(f"Completed stream with {sent} tokens")
        except Exception:
            logger.exception("Error generating response:")
            yield chat_pb2.ChatResponse(
                error="Failed to generate response", complete=True
            )


class ChatServer:
    """
    gRPC server for the chat service.

    Manages the lifecycle of the gRPC server, including startup,
    shutdown, and signal handling.
    """

    def __init__(self):
        """Initialize the server instance."""
        self.server = None

    def start(self):
        """
        Start the gRPC server and listen for requests.

        Performs health checks on dependencies before starting.
        Sets up signal handlers for graceful shutdown.
        """
        # Verify database connection
        if not test_connection():
            logger.error("Database connection failed")
            sys.exit(1)

        # Check LLM service health
        if llm_service.health_check():
            logger.info("Ollama health check passed")
        else:
            logger.warning("Ollama not reachable; proceeding anyway")

        # Initialize and configure gRPC server
        self.server = grpc.server(futures.ThreadPoolExecutor(max_workers=16))
        chat_pb2_grpc.add_ChatServiceServicer_to_server(ChatServiceImpl(), self.server)
        addr = f"[::]:{config.GRPC_PORT}"
        self.server.add_insecure_port(addr)
        self.server.start()
        logger.info(f"gRPC server listening on {addr}")

        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._sig)
        signal.signal(signal.SIGTERM, self._sig)

        # Keep server running until terminated
        self.server.wait_for_termination()

    def _sig(self, signum, frame):
        """
        Signal handler for graceful shutdown.

        Args:
            signum: Signal number
            frame: Current stack frame
        """
        logger.info(f"Signal {signum} received, shutting down...")
        if self.server:
            self.server.stop(grace=5)


def main():
    """
    Entry point for starting the chat service.

    Configures logging and starts the gRPC server.
    """
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Start the server
    ChatServer().start()


if __name__ == "__main__":
    main()
