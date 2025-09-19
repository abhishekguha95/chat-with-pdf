FROM python:3.10-slim

WORKDIR /usr/src/chat-service-python

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip/setuptools/wheel so pip prefers wheels
RUN pip install --upgrade pip setuptools wheel

# Install CPU-only PyTorch first to avoid GPU version being installed as dependency
RUN pip install torch==2.5.1+cpu --index-url https://download.pytorch.org/whl/cpu

# ----------------------------
# Copy requirements and install rest
# ----------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ----------------------------
# Environment variables
# ----------------------------
ENV PYTHONPATH=/usr/src/chat-with-pdf/chat_service-python
ENV HF_HOME=/cache/hf
ENV PIP_CACHE_DIR=/root/.cache/pip

# Create cache directory for Hugging Face models
# RUN mkdir -p /cache/hf

CMD ["python", "-m", "chat_service"]