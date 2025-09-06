"""
Server package for the chat-with-pdf service.

This package contains the gRPC server implementation that provides
the chat functionality with PDF documents.
"""

# Export key server components for easier imports
from .grpc_server import ChatServer, ChatServiceImpl

# Define what gets imported with "from server import *"
__all__ = ["ChatServer", "ChatServiceImpl"]