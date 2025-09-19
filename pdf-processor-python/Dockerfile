# ----------------------------
# pdf-processor-python Dockerfile
# CPU-only, Hugging Face caching, pip caching
# ----------------------------

FROM python:3.10-slim

# ----------------------------
# Set working directory
# ----------------------------
WORKDIR /usr/src/chat-with-pdf/pdf-processor-python

# ----------------------------
# Install minimal system dependencies
# ----------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# ----------------------------
# Upgrade pip/setuptools/wheel
# ----------------------------
RUN pip install --upgrade pip setuptools wheel

# ----------------------------
# Install CPU-only PyTorch first
# ----------------------------
RUN pip install torch==2.5.1+cpu --index-url https://download.pytorch.org/whl/cpu

# ----------------------------
# Copy requirements and install rest
# ----------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ----------------------------
# Environment variables
# ----------------------------
ENV PYTHONPATH=/usr/src/chat-with-pdf/pdf-processor-python
ENV HF_HOME=/cache/hf
ENV PIP_CACHE_DIR=/root/.cache/pip

# ----------------------------
# Expose nothing (worker-only)
# ----------------------------
# CMD to start your worker
CMD ["python", "-m", "worker.pdf_processor"]
