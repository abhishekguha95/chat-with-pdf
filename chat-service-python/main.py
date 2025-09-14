#!/usr/bin/env python3
"""
Entry point script for the chat-with-pdf service.

This script initializes and starts the gRPC server that handles
PDF chat functionality. It ensures that the script's directory
is in the Python path, allowing for proper module imports.
"""
import sys, os

# Add the directory containing this file to Python's path
# This allows Python to find and import modules in this directory and subdirectories
# regardless of the current working directory from which the script is executed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the main function from the gRPC server module
# This function is responsible for setting up and starting the server
from server.grpc_server import main

# Standard Python idiom to ensure code runs only when executed directly
# (not when imported as a module in another script)
if __name__ == "__main__":
    # Start the gRPC server
    # The server will listen for client requests and process PDF chat operations
    main()
