FROM python:3.11-slim
WORKDIR /usr/src/chat-with-pdf/chat-service-python

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

RUN mkdir -p /cache/hf
ENV PYTHONPATH=/usr/src/chat-with-pdf/chat-service-python
ENV HF_HOME=/cache/hf

EXPOSE 50051

CMD ["python", "main.py"]