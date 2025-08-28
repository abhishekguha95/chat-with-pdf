#!/usr/bin/env python3
"""
PDF Processor Service Entry Point
"""
import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from worker.pdf_processor import main

if __name__ == '__main__':
    main()
    """Main entry point for the PDF processor worker"""