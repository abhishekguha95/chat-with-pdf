FROM python:3.10-slim

WORKDIR /usr/src/chat-with-pdf/pdf-processor-python

# Install minimal system dependencies (no Rust needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip/setuptools/wheel so pip prefers wheels over source builds
RUN pip install --upgrade pip setuptools wheel

# Copy requirements and install dependencies (force wheels only)
COPY requirements.txt .
RUN pip install --only-binary=:all: -r requirements.txt

# Create cache directory for Hugging Face models
RUN mkdir -p /cache/hf

# Set environment variables
ENV PYTHONPATH=/usr/src/chat-with-pdf/pdf-processor-python  
ENV HF_HOME=/cache/hf

CMD ["python", "-m", "worker.pdf_processor"]
