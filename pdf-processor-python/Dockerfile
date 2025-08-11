FROM python:3.11-slim

WORKDIR /usr/src/chat-with-pdf/pdf-processor-python

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Remove this line - not needed due to volume mount
# COPY . .

# Create cache directory for Hugging Face models
RUN mkdir -p /cache/hf

# Set environment variables
ENV PYTHONPATH=/usr/src/chat-with-pdf/pdf-processor-python
ENV HF_HOME=/cache/hf

# Default command
CMD ["python", "-m", "worker.pdf_processor"]
